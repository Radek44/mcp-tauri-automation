import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import type {
  AppState,
  ElementConditions,
  InspectUiParams,
  LaunchAppParams,
  TauriAutomationConfig,
} from "./types.js";
import { INSPECT_UI_SCRIPT } from "./ui-snapshot.js";
import { ELEMENT_CONDITIONS_SCRIPT, FOCUS_ELEMENT_SCRIPT } from "./ui-interaction.js";

const ELEMENT_KEY = "element-6066-11e4-a52e-4f735466cecf";
const MAX_RESPONSE_BYTES = 1024 * 1024;
const MAX_IMAGE_BYTES = 16 * 1024 * 1024;
const W3C_ERRORS = new Set([
  "detached shadow root",
  "element click intercepted",
  "element not interactable",
  "insecure certificate",
  "invalid argument",
  "invalid cookie domain",
  "invalid element state",
  "invalid selector",
  "invalid session id",
  "javascript error",
  "move target out of bounds",
  "no such alert",
  "no such cookie",
  "no such element",
  "no such frame",
  "no such shadow root",
  "no such window",
  "script timeout",
  "session not created",
  "stale element reference",
  "timeout",
  "unable to capture screen",
  "unable to set cookie",
  "unexpected alert open",
  "unknown command",
  "unknown error",
  "unknown method",
  "unsupported operation",
]);

class WebDriverError extends Error {
  constructor(readonly code: string) {
    super("WebDriver: " + code);
  }
}

export function integerInRange(
  value: number,
  name: string,
  min: number,
  max: number,
): number {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(name + " must be an integer from " + min + " to " + max);
  }
  return value;
}

export class TauriDriver {
  private readonly config: Required<TauriAutomationConfig>;
  private session?: {
    sessionId: string;
    mode: "tauri-driver" | "embedded";
    port: number;
    appPath?: string;
  };
  private connectionUncertain = false;

  constructor(config: TauriAutomationConfig = {}) {
    this.config = {
      appPath: config.appPath ?? "",
      screenshotDir: path.resolve(
        config.screenshotDir ?? path.join(process.cwd(), "screenshots"),
      ),
      webdriverPort: integerInRange(
        config.webdriverPort ?? 4444,
        "WebDriver port",
        1,
        65535,
      ),
      defaultTimeout: integerInRange(
        config.defaultTimeout ?? 5000,
        "Default timeout",
        1,
        60000,
      ),
      tauriDriverPath: config.tauriDriverPath ?? "tauri-driver",
    };
  }

  async launchApp(params: LaunchAppParams = {}): Promise<void> {
    const appPath = params.appPath || this.config.appPath;
    if (!appPath)
      throw new Error(
        "Application path is required; pass appPath or set TAURI_APP_PATH.",
      );
    await this.openSession(
      "tauri-driver",
      this.config.webdriverPort,
      {
        "tauri:options": {
          application: appPath,
          args: params.args ?? [],
          env: params.env ?? {},
        },
      },
      appPath,
    );
  }

  async connectApp(port = this.config.webdriverPort): Promise<void> {
    await this.openSession(
      "embedded",
      integerInRange(port, "WebDriver port", 1, 65535),
      {
        browserName: "tauri",
      },
    );
  }

  private async openSession(
    mode: "tauri-driver" | "embedded",
    port: number,
    capabilities: Record<string, unknown>,
    appPath?: string,
  ): Promise<void> {
    if (this.session)
      throw new Error("A session is already active. Use close_app first.");
    if (this.connectionUncertain)
      throw new Error(
        "Previous session creation outcome is unknown. Restart the isolated test app/driver and this MCP server before reconnecting.",
      );
    let value: unknown;
    try {
      value = await this.request(
        "POST",
        "/session",
        { capabilities: { alwaysMatch: capabilities } },
        port,
      );
    } catch (error) {
      if (!(error instanceof WebDriverError)) this.connectionUncertain = true;
      throw error;
    }
    if (
      !isRecord(value) ||
      typeof value.sessionId !== "string" ||
      !value.sessionId ||
      value.sessionId.length > 4096
    ) {
      this.connectionUncertain = true;
      throw new Error(
        "Invalid WebDriver session response. Creation outcome is unknown; inspect the test app before retrying.",
      );
    }
    this.session = { sessionId: value.sessionId, mode, port, appPath };
    try {
      await this.request("POST", this.sessionPath("/timeouts"), {
        implicit: 0,
        script: this.config.defaultTimeout,
        pageLoad: this.config.defaultTimeout,
      });
    } catch (error) {
      try {
        await this.closeApp();
      } catch {
        throw new Error(
          "Session initialization and cleanup failed. The owned session is retained; use close_app before retrying.",
        );
      }
      throw error;
    }
  }

  async closeApp(): Promise<void> {
    if (!this.session) throw new Error("No active session.");
    try {
      await this.request("DELETE", this.sessionPath(""));
    } catch (error) {
      // Already gone is a confirmed cleanup, not a reason to retain a phantom session.
      if (!(
        error instanceof WebDriverError && error.code === "invalid session id"
      ))
        throw error;
    }
    this.session = undefined;
  }

  getAppState(): Readonly<AppState> {
    return {
      isRunning: Boolean(this.session),
      connectionUncertain: this.connectionUncertain,
      ...this.session,
    };
  }

  getConfig(): Readonly<Required<TauriAutomationConfig>> {
    return { ...this.config };
  }

  private sessionPath(suffix: string): string {
    if (!this.session)
      throw new Error(
        "No active session. Use launch_app or connect_app first.",
      );
    return "/session/" + encodeURIComponent(this.session.sessionId) + suffix;
  }

  /** No automatic retries: a timed-out mutation may already have happened. */
  private async request(
    method: string,
    suffix: string,
    body?: unknown,
    port?: number,
    timeout?: number,
  ): Promise<unknown> {
    const endpoint =
      "http://127.0.0.1:" +
      (port ?? this.session?.port ?? this.config.webdriverPort);
    const cap = suffix.endsWith("/screenshot")
      ? MAX_IMAGE_BYTES
      : MAX_RESPONSE_BYTES;
    try {
      const response = await fetch(endpoint + suffix, {
        method,
        headers:
          body === undefined
            ? undefined
            : { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: "error",
        signal: AbortSignal.timeout(timeout ?? this.config.defaultTimeout),
      });
      if (!response.body) throw new Error("Empty response");
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      try {
        for (;;) {
          const part = await reader.read();
          if (part.done) break;
          length += part.value.byteLength;
          if (length > cap) throw new Error("Response too large");
          chunks.push(part.value);
        }
      } finally {
        await reader.cancel().catch(() => undefined);
      }
      const json: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (!isRecord(json) || !("value" in json))
        throw new Error("Malformed response");
      const value = json.value;
      if (!response.ok && isRecord(value) && typeof value.error === "string") {
        const code = W3C_ERRORS.has(value.error)
          ? value.error
          : "unknown error";
        // Driver messages can echo typed text, environment values, or IPC arguments.
        throw new WebDriverError(code);
      }
      if (!response.ok) throw new Error("HTTP failure");
      return value;
    } catch (error) {
      if (error instanceof WebDriverError) throw error;
      const advice =
        method === "GET"
          ? "Check the embedded app or tauri-driver and configured port."
          : "Outcome may be unknown; inspect the test app before retrying. The command was not retried.";
      throw new Error(
        "WebDriver request failed, timed out, or exceeded its response limit. " +
          advice,
      );
    }
  }

  private async findElement(
    selector: string,
    timeout?: number,
  ): Promise<string> {
    const value = await this.request(
      "POST",
      this.sessionPath("/element"),
      {
        using: "css selector",
        value: selector,
      },
      undefined,
      timeout,
    );
    if (!isRecord(value) || typeof value[ELEMENT_KEY] !== "string") {
      throw new Error("Invalid WebDriver element response.");
    }
    return encodeURIComponent(value[ELEMENT_KEY]);
  }

  async clickElement(selector: string): Promise<void> {
    const element = await this.findElement(selector);
    await this.request("POST", this.sessionPath("/element/" + element + "/click"), {});
  }

  async focusElement(selector: string): Promise<void> {
    const value = await this.request("POST", this.sessionPath("/execute/sync"), {
      script: FOCUS_ELEMENT_SCRIPT, args: [selector],
    });
    if (isRecord(value) && value.reason === "focused") return;
    const messages: Record<string, string> = {
      not_found: "Focus target was not found.",
      ambiguous: "Focus selector matched multiple elements; use a unique selector.",
      disabled: "Focus target is disabled or inert.",
      hidden: "Focus target is hidden.",
      not_focusable: "Target did not receive focus; choose a focusable public control.",
    };
    const reason = isRecord(value) && typeof value.reason === "string" ? value.reason : "";
    throw new Error(Object.hasOwn(messages, reason) ? messages[reason] : "Invalid focus response.");
  }

  async typeText(selector: string, text: string, clear = false): Promise<void> {
    const element = await this.findElement(selector);
    if (clear)
      await this.request(
        "POST",
        this.sessionPath("/element/" + element + "/clear"),
        {},
      );
    await this.request(
      "POST",
      this.sessionPath("/element/" + element + "/value"),
      { text, value: Array.from(text) },
    );
  }

  async waitForElement(
    selector: string,
    timeout = this.config.defaultTimeout,
    state: "attached" | "visible" | "hidden" = "attached",
    conditions?: ElementConditions,
  ): Promise<void> {
    integerInRange(timeout, "Timeout", 1, 60000);
    if (conditions !== undefined) {
      if (state === "hidden") throw new Error("Element conditions cannot accompany hidden state.");
      if (!isRecord(conditions) || !Object.keys(conditions).length ||
          Object.keys(conditions).some(key => !["textEquals", "enabled", "ariaBusy"].includes(key)) ||
          (conditions.textEquals !== undefined && (typeof conditions.textEquals !== "string" || conditions.textEquals.length > 12000)) ||
          (conditions.enabled !== undefined && typeof conditions.enabled !== "boolean") ||
          (conditions.ariaBusy !== undefined && typeof conditions.ariaBusy !== "boolean"))
        throw new Error("Invalid element conditions.");
    }
    const deadline = Date.now() + timeout;
    const remaining = () => {
      const value = deadline - Date.now();
      if (value <= 0) throw new Error("Element conditions were not reached within " + timeout + "ms. Use inspect_ui for diagnostics.");
      return value;
    };
    for (;;) {
      let found = false;
      let visible = false;
      let conditionsMatch = conditions === undefined;
      try {
        const element = await this.findElement(
          selector,
          remaining(),
        );
        found = true;
        if (state !== "attached") {
          visible =
            (await this.request(
              "GET",
              this.sessionPath("/element/" + element + "/displayed"),
              undefined,
              undefined,
              remaining(),
            )) === true;
        }
        if (conditions !== undefined && (state !== "visible" || visible)) {
          const observation = await this.request("POST", this.sessionPath("/execute/sync"), {
            script: ELEMENT_CONDITIONS_SCRIPT,
            args: [{ [ELEMENT_KEY]: decodeURIComponent(element) }, conditions],
          }, undefined, remaining());
          if (!isRecord(observation) || typeof observation.matches !== "boolean")
            throw new Error("Invalid element-condition response.");
          conditionsMatch = observation.matches;
        }
      } catch (error) {
        if (!(
          error instanceof WebDriverError &&
          ["no such element", "stale element reference"].includes(error.code)
        ))
          throw error;
        found = false;
      }
      if (
        (state === "attached" && found && conditionsMatch) ||
        (state === "visible" && visible && conditionsMatch) ||
        (state === "hidden" && (!found || !visible))
      )
        return;
      if (Date.now() >= deadline)
        throw new Error(
          "Element did not become " +
            state +
            " within " +
            timeout +
            "ms. Use inspect_ui for diagnostics.",
        );
      await delay(Math.min(100, Math.max(1, deadline - Date.now())));
    }
  }

  async getElementText(selector: string): Promise<string> {
    const element = await this.findElement(selector);
    const value = await this.request(
      "GET",
      this.sessionPath("/element/" + element + "/text"),
    );
    if (typeof value !== "string")
      throw new Error("Invalid WebDriver text response.");
    if (value.length > 12000)
      throw new Error(
        "Text exceeds 12000 characters. Use a narrower selector or bounded inspect_ui.",
      );
    return value;
  }

  async getPageTitle(): Promise<string> {
    return this.pageString("/title");
  }

  async getPageUrl(): Promise<string> {
    const url = await this.pageString("/url");
    try {
      const parsed = new URL(url);
      parsed.username = "";
      parsed.password = "";
      parsed.search = "";
      parsed.hash = "";
      return parsed.toString();
    } catch {
      return "[non-URL page location]";
    }
  }

  private async pageString(suffix: string): Promise<string> {
    const value = await this.request("GET", this.sessionPath(suffix));
    if (typeof value !== "string" || value.length > 4000)
      throw new Error("Invalid or oversized page metadata.");
    return value;
  }

  async captureScreenshot(
    filename?: string,
    returnBase64 = false,
    timeout?: number,
  ): Promise<string> {
    if (timeout !== undefined) integerInRange(timeout, "Screenshot timeout", 1, 60000);
    if (
      filename !== undefined &&
      !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(filename)
    ) {
      throw new Error(
        "Screenshot filename must be a basename of 1–120 letters, numbers, dots, underscores, or hyphens.",
      );
    }
    const screenshot = await this.request(
      "GET",
      this.sessionPath("/screenshot"),
      undefined,
      undefined,
      timeout,
    );
    if (
      typeof screenshot !== "string" ||
      !screenshot ||
      !/^[a-zA-Z0-9+/]*={0,2}$/.test(screenshot)
    ) {
      throw new Error("Invalid WebDriver screenshot response.");
    }
    if (returnBase64) return screenshot;
    await mkdir(this.config.screenshotDir, { recursive: true });
    const destination = path.join(
      this.config.screenshotDir,
      (filename ?? "screenshot-" + randomUUID()) + ".png",
    );
    await writeFile(destination, Buffer.from(screenshot, "base64"), {
      flag: "wx",
      mode: 0o600,
    });
    return destination;
  }

  async inspectUi(params: InspectUiParams = {}): Promise<unknown> {
    const limit = integerInRange(params.limit ?? 20, "Element limit", 1, 100);
    const maxTextLength = integerInRange(
      params.maxTextLength ?? 160,
      "Text limit",
      0,
      1000,
    );
    return this.request("POST", this.sessionPath("/execute/sync"), {
      script: INSPECT_UI_SCRIPT,
      args: [
        params.selector ??
          'button, a[href], input, textarea, select, [role="button"], [role="dialog"], [role="alert"], h1, h2, h3',
        limit,
        maxTextLength,
      ],
    });
  }

  async executeTauriCommand(
    command: string,
    args: Record<string, unknown> = {},
  ): Promise<unknown> {
    const value = await this.request(
      "POST",
      this.sessionPath("/execute/async"),
      {
        script: [
          "const [command, args, done] = arguments;",
          "const api = window.__TAURI__;",
          "const invoke = api?.core?.invoke ?? api?.invoke;",
          'if (typeof invoke !== "function") { done({ok:false, error:"Tauri global invoke bridge unavailable. Enable withGlobalTauri in this test app."}); return; }',
          'Promise.resolve().then(() => invoke(command, args)).then(value => done({ok:true, value:value ?? null}), () => done({ok:false, error:"Tauri command rejected. Inspect local app diagnostics."}));',
        ].join("\n"),
        args: [command, args],
      },
    );
    if (!isRecord(value) || value.ok !== true) {
      throw new Error(
        "Tauri invocation failed or the global invoke bridge is unavailable. Enable withGlobalTauri in the test app and check local diagnostics.",
      );
    }
    if (JSON.stringify(value.value ?? null).length > 16000) {
      throw new Error(
        "IPC result exceeds 16000 characters. The command completed; do not repeat it to fetch the result.",
      );
    }
    return value.value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
