import assert from "node:assert/strict";
import { createServer } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";
import vm from "node:vm";
import { TauriDriver } from "../dist/tauri-driver.js";
import { INSPECT_UI_SCRIPT } from "../dist/ui-snapshot.js";

const element = { "element-6066-11e4-a52e-4f735466cecf": "element/1" };

async function fixture(t, handler = () => undefined, config = {}) {
  const calls = [];
  const server = createServer(async (req, res) => {
    let text = "";
    for await (const chunk of req) text += chunk;
    const call = {
      method: req.method,
      url: req.url,
      body: text ? JSON.parse(text) : undefined,
    };
    calls.push(call);
    const custom = await handler(call, calls);
    if (res.destroyed) return;
    const defaults =
      req.url === "/session"
        ? { sessionId: "owned-session" }
        : req.url.endsWith("/element")
          ? element
          : req.url.endsWith("/title")
            ? "Synthetic Tauri app"
            : req.url.endsWith("/url")
              ? "tauri://localhost/?token=hidden#secret"
              : null;
    res.writeHead(custom?.status ?? 200, {
      "content-type": "application/json",
      ...custom?.headers,
    });
    res.end(
      custom?.raw ??
        JSON.stringify({
          value: custom?.value === undefined ? defaults : custom.value,
        }),
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  return {
    driver: new TauriDriver({
      webdriverPort: server.address().port,
      defaultTimeout: 1000,
      ...config,
    }),
    calls,
    server,
  };
}

test("embedded lifecycle creates one owned session, rejects double/cross-mode open, and never closes a window", async (t) => {
  const { driver, calls, server } = await fixture(t);
  await driver.connectApp();
  assert.deepEqual(calls[0].body.capabilities.alwaysMatch, {
    browserName: "tauri",
  });
  assert.equal(driver.getAppState().mode, "embedded");
  await assert.rejects(
    driver.launchApp({ appPath: "/synthetic" }),
    /already active/,
  );
  await assert.rejects(driver.connectApp(), /already active/);
  assert.equal(await driver.getPageTitle(), "Synthetic Tauri app");
  assert.equal(await driver.getPageUrl(), "tauri://localhost/");
  await driver.closeApp();
  assert.equal(driver.getAppState().isRunning, false);
  await assert.rejects(driver.closeApp(), /No active/);
  assert.equal(calls.filter((c) => c.url === "/session").length, 1);
  assert.equal(calls.filter((c) => c.method === "DELETE").length, 1);
  assert.equal(calls.at(-1).url, "/session/owned-session");
  assert.equal(server.listening, true, "caller-owned server remains alive");
});

test("legacy launch honors default path and explicit override, with identical tauri capabilities", async (t) => {
  const { driver, calls } = await fixture(t, undefined, {
    appPath: "/test/default",
  });
  await driver.launchApp({});
  assert.equal(
    calls[0].body.capabilities.alwaysMatch["tauri:options"].application,
    "/test/default",
  );
  await driver.closeApp();
  await driver.launchApp({
    appPath: "/test/override",
    args: ["--test"],
    env: { TEST_ONLY: "yes" },
  });
  assert.deepEqual(
    calls.at(-2).body.capabilities.alwaysMatch["tauri:options"],
    {
      application: "/test/override",
      args: ["--test"],
      env: { TEST_ONLY: "yes" },
    },
  );
});

test("failed initialization deletes the created session", async (t) => {
  const { driver, calls } = await fixture(t, (c) =>
    c.url.endsWith("/timeouts")
      ? {
          status: 500,
          value: {
            error: "unknown error",
            message: "must not echo environment",
          },
        }
      : undefined,
  );
  await assert.rejects(
    driver.connectApp(),
    /^Error: WebDriver: unknown error$/,
  );
  assert.equal(driver.getAppState().isRunning, false);
  assert.equal(calls.at(-1).method, "DELETE");
});

test("failed cleanup retains ownership; a subsequent confirmed missing session clears it", async (t) => {
  let closing = 0;
  const { driver } = await fixture(t, (c) =>
    c.method === "DELETE"
      ? {
          status: 500,
          value: {
            error: ++closing === 1 ? "unknown error" : "invalid session id",
          },
        }
      : undefined,
  );
  await driver.connectApp();
  await assert.rejects(driver.closeApp(), /unknown error/);
  assert.equal(driver.getAppState().isRunning, true);
  await driver.closeApp();
  assert.equal(driver.getAppState().isRunning, false);
});

test("append versus clear uses W3C key input without replaying mutations", async (t) => {
  const { driver, calls } = await fixture(t);
  await driver.connectApp();
  await driver.typeText("#field", "hé🙂", false);
  assert.equal(calls.filter((c) => c.url.endsWith("/clear")).length, 0);
  assert.deepEqual(calls.at(-1).body, {
    text: "hé🙂",
    value: ["h", "é", "🙂"],
  });
  await driver.typeText("#field", "replace", true);
  assert.equal(
    calls.at(-2).url,
    "/session/owned-session/element/element%2F1/clear",
  );
  await driver.clickElement("#button");
  assert.equal(calls.filter((c) => c.url.endsWith("/click")).length, 1);
});

test("a timed-out action is attempted once and reports an unknown outcome", async (t) => {
  // The default timeout also bounds session start and element lookup: keep the fixture's 1000 ms and
  // make only the click slower than it.
  const { driver, calls } = await fixture(t, async (c) => {
    if (c.url.endsWith("/click")) await delay(1200);
  });
  await driver.connectApp();
  await assert.rejects(
    driver.clickElement("#button"),
    /Outcome may be unknown.*not retried/,
  );
  assert.equal(calls.filter((c) => c.url.endsWith("/click")).length, 1);
});

test("timed-out session creation fails closed until operator restarts isolated endpoints", async (t) => {
  const { driver, calls } = await fixture(
    t,
    async (c) => {
      if (c.url === "/session") await delay(120);
    },
    { defaultTimeout: 50 },
  );
  await assert.rejects(driver.connectApp(), /Outcome may be unknown/);
  assert.equal(driver.getAppState().connectionUncertain, true);
  await assert.rejects(driver.connectApp(), /Restart the isolated/);
  assert.equal(calls.filter((c) => c.url === "/session").length, 1);
});

test("port validation happens before any network request", async (t) => {
  const { driver, calls } = await fixture(t);
  for (const port of [0, -1, 65536, 4.5, NaN]) {
    await assert.rejects(driver.connectApp(port), /must be an integer/);
  }
  assert.equal(calls.length, 0);
  assert.throws(
    () => new TauriDriver({ defaultTimeout: 0 }),
    /must be an integer/,
  );
});

test("redirects are not followed", async (t) => {
  const { driver, calls } = await fixture(t, (c) =>
    c.url === "/session"
      ? { status: 302, headers: { location: "/unexpected" }, value: null }
      : undefined,
  );
  await assert.rejects(driver.connectApp(), /request failed/);
  assert.equal(calls.length, 1);
});

test("malformed and oversized response bodies are bounded errors", async (t) => {
  for (const raw of ["{broken", "{}", "x".repeat(1024 * 1024 + 1)]) {
    const { driver } = await fixture(t, (c) =>
      c.url.endsWith("/title") ? { raw } : undefined,
    );
    await driver.connectApp();
    await assert.rejects(driver.getPageTitle(), /request failed/);
  }
});

test("W3C errors do not echo driver message fields containing tool input", async (t) => {
  const { driver } = await fixture(t, (c) =>
    c.url.endsWith("/element")
      ? {
          status: 404,
          value: { error: "no such element", message: "secret-typed-value" },
        }
      : undefined,
  );
  await driver.connectApp();
  await assert.rejects(driver.clickElement("#missing"), (error) => {
    assert.equal(error.message, "WebDriver: no such element");
    return true;
  });
});

test("nonstandard W3C error codes cannot echo secret-looking text", async (t) => {
  const { driver } = await fixture(t, () => ({
    status: 500,
    value: { error: "secret phrase", message: "hidden" },
  }));
  await assert.rejects(
    driver.connectApp(),
    (error) => error.message === "WebDriver: unknown error",
  );
});

test("wait polls only observations and supports hidden/visible without implicit waits", async (t) => {
  let reads = 0;
  const { driver, calls } = await fixture(t, (c) =>
    c.url.endsWith("/displayed") ? { value: ++reads >= 2 } : undefined,
  );
  await driver.connectApp();
  await driver.waitForElement("#async", 500, "visible");
  assert.equal(reads, 2);
  assert.equal(calls.filter((c) => c.url.endsWith("/click")).length, 0);
  assert.equal(calls[1].body.implicit, 0);
});

test("inspect_ui uses a fixed script with separate arguments and enforces bounds", async (t) => {
  const { driver, calls } = await fixture(t, (c) =>
    c.url.endsWith("/execute/sync")
      ? { value: { elements: [], returned: 0 } }
      : undefined,
  );
  await driver.connectApp();
  assert.deepEqual(
    await driver.inspectUi({ selector: "#rail", limit: 2, maxTextLength: 40 }),
    { elements: [], returned: 0 },
  );
  assert.equal(calls.at(-1).body.script, INSPECT_UI_SCRIPT);
  assert.deepEqual(calls.at(-1).body.args, ["#rail", 2, 40]);
  await assert.rejects(driver.inspectUi({ limit: 101 }), /integer/);
});

test("snapshot bounds text/count and diagnoses invisible ancestor without reading form values", () => {
  const styles = new Map();
  function node(tag, text, attributes = {}, parentElement = null) {
    const el = {
      tagName: tag,
      parentElement,
      hidden: false,
      type: "password",
      getBoundingClientRect: () => ({
        x: 4,
        y: 8,
        left: 4,
        top: 8,
        right: 104,
        bottom: 28,
        width: 100,
        height: 20,
      }),
      getAttribute: (key) => attributes[key] ?? null,
      matches: (selector) =>
        selector === ":disabled"
          ? false
          : ["INPUT", "TEXTAREA", "SELECT"].includes(tag),
      closest: (selector) =>
        selector === "[inert]"
          ? null
          : ["INPUT", "TEXTAREA", "SELECT"].includes(tag)
            ? el
            : null,
      get value() {
        throw new Error("Must not read input values");
      },
      get innerHTML() {
        throw new Error("Must not read HTML");
      },
      get textContent() {
        throw new Error("Must use filtered text nodes");
      },
      text,
    };
    styles.set(el, { opacity: "1", display: "block", visibility: "visible" });
    return el;
  }
  const hiddenRail = node("DIV", "");
  styles.get(hiddenRail).opacity = "0";
  const button = node("BUTTON", "  Continue   with example text  ");
  const input = node("INPUT", "never read", { "aria-label": "Account" });
  const hidden = node("BUTTON", "Secret hidden control", {}, hiddenRail);
  const doc = {
    querySelectorAll: () => [button, input, hidden],
    getElementById: () => null,
    createTreeWalker: (el, _what, filter) => {
      let read = false;
      return {
        nextNode: () => {
          if (read) return null;
          read = true;
          const n = { parentElement: el, textContent: el.text };
          return filter.acceptNode(n) === 1 ? n : null;
        },
      };
    },
  };
  const run = (limit, maxTextLength) =>
    vm.runInNewContext(
      "(function(){" + INSPECT_UI_SCRIPT + "}).apply(null, args)",
      {
        document: doc,
        args: ["button,input", limit, maxTextLength],
        innerWidth: 1280,
        innerHeight: 840,
        NodeFilter: { SHOW_TEXT: 4, FILTER_ACCEPT: 1, FILTER_REJECT: 2 },
        getComputedStyle: (el) => styles.get(el),
      },
    );
  const bounded = JSON.parse(JSON.stringify(run(2, 8)));
  assert.equal(bounded.returned, 2);
  assert.equal(bounded.truncated, true);
  assert.equal(bounded.elements[0].text, "Continue");
  assert.equal(bounded.elements[0].textTruncated, true);
  assert.equal(bounded.elements[1].text, "");
  assert.equal(bounded.elements[1].name, "Account");
  assert.equal(JSON.stringify(bounded).includes("never read"), false);
  const diagnostic = run(3, 160).elements[2];
  assert.equal(diagnostic.visible, false);
  assert.equal(diagnostic.effectiveOpacity, 0);
  assert.equal(diagnostic.text, "");
});

test("Tauri 2 invocation awaits result and missing/rejected bridges are explicit failures", async (t) => {
  let api = {
    core: { invoke: async (command, args) => ({ command, count: args.count }) },
  };
  const { driver } = await fixture(t, async (c) => {
    if (!c.url.endsWith("/execute/async")) return;
    const value = await new Promise((resolve) =>
      vm.runInNewContext(
        "(function(){" + c.body.script + "}).apply(null, args)",
        { window: { __TAURI__: api }, args: [...c.body.args, resolve] },
      ),
    );
    return { value };
  });
  await driver.connectApp();
  assert.deepEqual(await driver.executeTauriCommand("count", { count: 3 }), {
    command: "count",
    count: 3,
  });
  api = {};
  await assert.rejects(
    driver.executeTauriCommand("count"),
    /bridge is unavailable/,
  );
  api = {
    core: {
      invoke: async () => {
        throw Error("secret");
      },
    },
  };
  await assert.rejects(
    driver.executeTauriCommand("count"),
    (error) => !error.message.includes("secret"),
  );
});
