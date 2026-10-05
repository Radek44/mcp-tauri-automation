import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type {
  AppState,
  ElementConditions,
  InspectUiParams,
  LaunchAppParams,
  WaitForElementParams,
} from "./types.js";

export interface AutomationDriver {
  launchApp(params: LaunchAppParams): Promise<void>;
  connectApp(port?: number): Promise<void>;
  closeApp(): Promise<void>;
  captureScreenshot(filename?: string, returnBase64?: boolean, timeout?: number): Promise<string>;
  clickElement(selector: string): Promise<void>;
  focusElement(selector: string): Promise<void>;
  typeText(selector: string, text: string, clear?: boolean): Promise<void>;
  waitForElement(
    selector: string,
    timeout?: number,
    state?: WaitForElementParams["state"],
    conditions?: ElementConditions,
  ): Promise<void>;
  getElementText(selector: string): Promise<string>;
  inspectUi(params: InspectUiParams): Promise<unknown>;
  executeTauriCommand(
    command: string,
    args?: Record<string, unknown>,
  ): Promise<unknown>;
  getAppState(): Readonly<AppState>;
  getPageTitle(): Promise<string>;
  getPageUrl(): Promise<string>;
}

type Envelope = { success: boolean; data?: unknown; error?: string };
type ServerLifecycle = {
  shutdown: () => Promise<void>;
  pending?: Promise<void>;
};
const lifecycles = new WeakMap<McpServer, ServerLifecycle>();
const selector = z.string().trim().min(1).max(2_000);
const timeout = z.number().int().min(1).max(60_000);
const empty = z.object({}).default({});

const schemas = {
  launch_app: z
    .object({
      appPath: z.string().min(1).optional(),
      args: z.array(z.string()).optional(),
      env: z.record(z.string()).optional(),
    })
    .default({}),
  connect_app: z
    .object({ port: z.number().int().min(1).max(65_535).optional() })
    .default({}),
  close_app: empty,
  capture_screenshot: z
    .object({
      filename: z
        .string()
        .regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/)
        .optional(),
      returnBase64: z.boolean().default(true),
      timeout: timeout.optional(),
    })
    .default({}),
  click_element: z.object({ selector }).strict(),
  focus_element: z.object({ selector }),
  type_text: z.object({
    selector,
    text: z.string().max(100_000),
    clear: z.boolean().default(false),
  }),
  wait_for_element: z.object({
    selector,
    timeout: timeout.optional(),
    state: z.enum(["attached", "visible", "hidden"]).default("attached"),
    conditions: z.object({
      textEquals: z.string().max(12_000).optional(),
      enabled: z.boolean().optional(),
      ariaBusy: z.boolean().optional(),
    }).strict().refine(value => Object.keys(value).length > 0, "At least one condition is required.").optional(),
  }),
  get_element_text: z.object({ selector }),
  inspect_ui: z
    .object({
      selector: selector.optional(),
      limit: z.number().int().min(1).max(100).default(20),
      maxTextLength: z.number().int().min(0).max(1_000).default(160),
    })
    .default({}),
  execute_tauri_command: z.object({
    command: z
      .string()
      .min(1)
      .max(512)
      .refine((value) => value.trim().length > 0),
    args: z.record(z.unknown()).optional(),
  }),
  get_app_state: empty,
} as const;

class InvocationQueue {
  private tail: Promise<void> = Promise.resolve();
  private pending = 0;
  private closing = false;
  run<T>(work: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    if (this.closing || this.pending >= 32)
      return Promise.reject(new Error("busy"));
    this.pending += 1;
    const start = () => {
      if (signal?.aborted) throw new Error("Automation request was cancelled before execution.");
      return work();
    };
    const result = this.tail.then(start, start);
    this.tail = result
      .then(
        () => undefined,
        () => undefined,
      )
      .finally(() => {
        this.pending -= 1;
      });
    return result;
  }
  async closeAndDrain(timeoutMs = 5_000): Promise<void> {
    this.closing = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        this.tail,
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new Error(
                  "Timed out waiting for active automation work; session cleanup was not attempted.",
                ),
              ),
            timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  }
}

function result(envelope: Envelope, image?: string) {
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image"; data: string; mimeType: "image/png" }
  > = [{ type: "text", text: JSON.stringify(envelope) }];
  if (image)
    content.push({ type: "image", data: image, mimeType: "image/png" });
  return envelope.success
    ? { content, structuredContent: envelope }
    : { content, structuredContent: envelope, isError: true };
}
function failed(error: string, data?: unknown): Envelope {
  return data === undefined
    ? { success: false, error }
    : { success: false, data, error };
}
function actionable(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
function queueError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message === "busy"
    ? "Automation server is busy or shutting down; retry later."
    : actionable(error, fallback);
}
function trackedState(state: Readonly<AppState>) {
  return {
    isRunning: state.isRunning,
    connectionUncertain: state.connectionUncertain,
    appPath: state.appPath,
    sessionId: state.sessionId,
    mode: state.mode,
    port: state.port,
  };
}

/** Create an MCP server around an injected driver; call shutdownServer for orderly cleanup. */
export function createServer(driver: AutomationDriver): McpServer {
  const server = new McpServer(
    { name: "mcp-tauri-automation", version: "2.0.0-rc.2" },
    {
      instructions:
        "Use explicitly chosen local test apps. connect_app creates a session on an already running embedded server; the launcher owns that process. Start with bounded inspect_ui, narrow selectors when truncated, and use images for visual questions. Confirm mutations with a targeted read or wait. Never replay a timed-out action blindly. Use the app own validated domain tools for canonical data operations. close_app releases only this server session.",
    },
  );
  const queue = new InvocationQueue();
  // SDK tool validation is asynchronous: schemas of different complexity can
  // finish out of order. Admit tools/call before validation, using the public
  // request-handler registration hook, so a later read cannot overtake input.
  const admission = new InvocationQueue();
  const installHandler = server.server.setRequestHandler.bind(server.server);
  server.server.setRequestHandler = (schema, handler) => {
    installHandler(schema, (request, extra) => {
      if ((schema as unknown) !== CallToolRequestSchema) return handler(request, extra);
      return admission.run(async () => handler(request, extra), extra.signal).catch(error =>
        result(failed(queueError(error, "Unable to dispatch the tool request."))));
    });
  };
  const queued = <T>(action: () => Promise<T>, fallback: string, signal: AbortSignal) =>
    queue.run(action, signal).then(
      (data) => result({ success: true, data }),
      (error) =>
        result(
          failed(
            queueError(error, fallback),
          ),
        ),
    );
  server.registerTool(
    "launch_app",
    {
      description: "Launch a Tauri application through tauri-driver.",
      inputSchema: schemas.launch_app,
      annotations: { destructiveHint: true, idempotentHint: false },
    },
    (p, extra) =>
      queued(async () => {
        await driver.launchApp(p);
        return {
          message: "Application launched successfully",
          sessionId: driver.getAppState().sessionId,
        };
      }, "Unable to launch the application.", extra.signal),
  );
  server.registerTool(
    "connect_app",
    {
      description:
        "Create an embedded WebDriver session against a running Tauri test endpoint. The caller owns the external application process.",
      inputSchema: schemas.connect_app,
      annotations: { destructiveHint: false, idempotentHint: false },
    },
    (p, extra) =>
      queued(async () => {
        await driver.connectApp(p.port);
        return { mode: "embedded", sessionId: driver.getAppState().sessionId };
      }, "Unable to connect to the application.", extra.signal),
  );
  server.registerTool(
    "close_app",
    {
      description:
        "Delete the tracked WebDriver session. This does not promise that an externally owned app process was killed.",
      inputSchema: schemas.close_app,
      annotations: { destructiveHint: true, idempotentHint: false },
    },
    (_p, extra) =>
      queued(async () => {
        const mode = driver.getAppState().mode;
        await driver.closeApp();
        return {
          message:
            mode === "embedded"
              ? "Session closed; the caller-owned application remains running."
              : "Application session closed successfully",
        };
      }, "Unable to close the application session.", extra.signal),
  );
  server.registerTool(
    "capture_screenshot",
    {
      description:
        "Capture the application window. It returns a native MCP image by default.",
      inputSchema: schemas.capture_screenshot,
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    (p, extra) =>
      queue
        .run(async () => {
          try {
            const output = await driver.captureScreenshot(
              p.filename,
              p.returnBase64,
              p.timeout,
            );
            const data = p.returnBase64
              ? { message: "Screenshot captured successfully" }
              : { path: output, message: `Screenshot saved to: ${output}` };
            return result(
              { success: true, data },
              p.returnBase64 ? output : undefined,
            );
          } catch (error) {
            return result(
              failed(actionable(error, "Unable to capture a screenshot.")),
            );
          }
        }, extra.signal)
        .catch(error => result(failed(queueError(error, "Unable to execute the tool request.")))),
  );
  server.registerTool(
    "click_element",
    {
      description: "Click a UI element identified by a CSS selector.",
      inputSchema: schemas.click_element,
      annotations: { destructiveHint: true, idempotentHint: false },
    },
    (p, extra) =>
      queued(async () => {
        await driver.clickElement(p.selector);
        return { message: `Clicked element: ${p.selector}` };
      }, "Unable to click the requested element.", extra.signal),
  );
  server.registerTool(
    "focus_element",
    {
      description: "Scroll to and focus one public CSS target, then verify focus without typing or activating it.",
      inputSchema: schemas.focus_element,
      annotations: { destructiveHint: true, idempotentHint: false },
    },
    (p, extra) => queued(async () => {
      await driver.focusElement(p.selector);
      return { message: "Element received focus." };
    }, "Unable to focus the requested element.", extra.signal),
  );
  server.registerTool(
    "type_text",
    {
      description: "Type text into an input field or editable element.",
      inputSchema: schemas.type_text,
      annotations: { destructiveHint: true, idempotentHint: false },
    },
    (p, extra) =>
      queued(async () => {
        await driver.typeText(p.selector, p.text, p.clear);
        return { message: `Typed text into element: ${p.selector}` };
      }, "Unable to type text into the requested element.", extra.signal),
  );
  server.registerTool(
    "wait_for_element",
    {
      description:
        "Wait for an element state, optionally requiring exact normalized public text, enabled state, or explicit aria-busy state.",
      inputSchema: schemas.wait_for_element,
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    (p, extra) => {
      if (p.state === "hidden" && p.conditions !== undefined)
        return result(failed("Element conditions cannot accompany hidden state."));
      return queued(async () => {
        await driver.waitForElement(p.selector, p.timeout, p.state, p.conditions);
        return { message: `Element reached ${p.state} state: ${p.selector}` };
      }, "The requested element did not reach the requested state.", extra.signal);
    },
  );
  server.registerTool(
    "get_element_text",
    {
      description: "Get the text content of an element.",
      inputSchema: schemas.get_element_text,
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    (p, extra) =>
      queued(
        async () => ({ text: await driver.getElementText(p.selector) }),
        "Unable to read element text.",
        extra.signal,
      ),
  );
  server.registerTool(
    "inspect_ui",
    {
      description:
        "Inspect a bounded UI snapshot, optionally narrowed to a CSS selector.",
      inputSchema: schemas.inspect_ui,
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    (p, extra) =>
      queued(
        () => driver.inspectUi(p),
        "Unable to inspect the application UI.",
        extra.signal,
      ),
  );
  server.registerTool(
    "execute_tauri_command",
    {
      description: "Execute an exposed Tauri IPC command.",
      inputSchema: schemas.execute_tauri_command,
      annotations: { destructiveHint: true, idempotentHint: false },
    },
    (p, extra) =>
      queued(
        async () => ({
          result: await driver.executeTauriCommand(p.command, p.args),
        }),
        "Tauri command failed; its outcome may be unknown and it should not be retried automatically.",
        extra.signal,
      ),
  );
  server.registerTool(
    "get_app_state",
    {
      description:
        "Probe the tracked application session and page details. A tracked session alone is not proof that the process is alive.",
      inputSchema: schemas.get_app_state,
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    (_p, extra) =>
      queue
        .run(async () => {
          const state = driver.getAppState();
          const tracked = trackedState(state);
          if (state.connectionUncertain)
            return result(
              failed(
                "The previous session creation outcome is unknown; restart the isolated app, driver, and MCP server before reconnecting.",
                { state: tracked },
              ),
            );
          if (!state.isRunning) return result({ success: true, data: tracked });
          try {
            const pageTitle = await driver.getPageTitle();
            const pageUrl = await driver.getPageUrl();
            return result({
              success: true,
              data: { ...tracked, pageTitle, pageUrl },
            });
          } catch {
            return result(
              failed("Unable to probe the tracked application session.", {
                state: tracked,
              }),
            );
          }
        }, extra.signal)
        .catch(error => result(failed(queueError(error, "Unable to execute the tool request.")))),
  );
  lifecycles.set(server, {
    shutdown: async () => {
      await admission.closeAndDrain();
      await queue.closeAndDrain();
      if (driver.getAppState().isRunning) await driver.closeApp();
    },
  });
  // The SDK installed its tool dispatcher during registration; do not alter
  // unrelated handlers that a caller might register later.
  server.server.setRequestHandler = installHandler;
  return server;
}
export async function shutdownServer(server: McpServer): Promise<void> {
  const lifecycle = lifecycles.get(server);
  if (lifecycle) await (lifecycle.pending ??= lifecycle.shutdown());
}
