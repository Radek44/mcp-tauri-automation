import assert from "node:assert/strict";
import { createServer } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { TauriDriver } from "../dist/tauri-driver.js";

const KEY = "element-6066-11e4-a52e-4f735466cecf";
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==";

async function fixture(t, handler = () => undefined, config = {}) {
  const calls = [];
  const output = await mkdtemp(path.join(tmpdir(), "tauri-capability-test-"));
  const server = createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const call = { method: req.method, url: req.url, body: raw ? JSON.parse(raw) : undefined };
    calls.push(call);
    const custom = await handler(call, calls);
    if (res.destroyed) return;
    const value = req.url === "/session" ? { sessionId: "owned" }
      : req.url.endsWith("/element") ? { [KEY]: "element/with spaces" }
      : req.url.endsWith("/displayed") ? true
      : req.url.endsWith("/screenshot") ? PNG : null;
    res.writeHead(custom?.status ?? 200, { "content-type": "application/json" });
    res.end(JSON.stringify({ value: custom?.value === undefined ? value : custom.value }));
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await rm(output, { recursive: true, force: true });
  });
  return { calls, output, driver: new TauriDriver({
    webdriverPort: server.address().port, screenshotDir: output,
    defaultTimeout: 1000, ...config,
  }) };
}

test("screenshot override uses an abortable request deadline without changing the configured default", async t => {
  // The configured default bounds every request, session start included, so keep the fixture's 1000 ms
  // default (enough for session setup on a loaded machine) and make the screenshot slower than it instead.
  const { driver, calls, output } = await fixture(t, async c => {
    if (c.url.endsWith("/screenshot")) await delay(1200);
  });
  await driver.connectApp();
  assert.equal(await driver.captureScreenshot(undefined, true, 5000), PNG);
  await assert.rejects(driver.captureScreenshot("timeout", false, 10), /timed out/);
  assert.deepEqual(await readdir(output), []);
  await assert.rejects(driver.captureScreenshot(undefined, true), /timed out/);
  assert.equal(calls.filter(c => c.url.endsWith("/screenshot")).length, 3);
});

test("invalid screenshot deadlines fail before sending a request", async t => {
  const { driver, calls } = await fixture(t);
  await driver.connectApp();
  const count = calls.length;
  for (const timeout of [0, -1, 60001, 1.5, NaN]) {
    await assert.rejects(driver.captureScreenshot(undefined, true, timeout), /integer/);
  }
  assert.equal(calls.length, count);
});

test("left clicks retain the element endpoint and path-encoded ID", async t => {
  const { driver, calls } = await fixture(t);
  await driver.launchApp({ appPath: "/synthetic" });
  await driver.clickElement("#button");
  assert.equal(calls.at(-1).url, "/session/owned/element/element%2Fwith%20spaces/click");
  assert.equal(calls.at(-1).method, "POST");
  assert.equal(calls.some(c => c.url.endsWith("/actions")), false);
});

test("predicate waits reacquire replaced elements and use one deadline", async t => {
  let observations = 0;
  const { driver, calls } = await fixture(t, c => c.url.endsWith("/execute/sync")
    ? { value: { matches: ++observations === 2 } } : undefined);
  await driver.connectApp();
  await driver.waitForElement("#status", 500, "visible", { textEquals: "Saved", enabled: true, ariaBusy: false });
  assert.equal(observations, 2);
  assert.equal(calls.filter(c => c.url.endsWith("/element")).length, 2);
  const execution = calls.filter(c => c.url.endsWith("/execute/sync")).at(-1);
  assert.deepEqual(execution.body.args, [{ [KEY]: "element/with spaces" }, { textEquals: "Saved", enabled: true, ariaBusy: false }]);
  const count = calls.length;
  await assert.rejects(driver.waitForElement("#status", 500, "hidden", { enabled: true }), /hidden/);
  assert.equal(calls.length, count);
});

test("predicate deadline covers slow observations and malformed values never mean success", async t => {
  const { driver, calls } = await fixture(t, async c => {
    if (c.url.endsWith("/execute/sync")) { await delay(150); return { value: { matches: false } }; }
  });
  await driver.connectApp();
  const start = Date.now();
  await assert.rejects(driver.waitForElement("#status", 30, "attached", { textEquals: "Saved" }), /timed out|within/);
  assert.ok(Date.now() - start < 500);
  assert.equal(calls.filter(c => c.url.endsWith("/execute/sync")).length, 1);
});

test("focus uses a fixed operation and treats failed focus as failure", async t => {
  let reason = "focused";
  const { driver, calls } = await fixture(t, c => c.url.endsWith("/execute/sync") ? { value: { reason } } : undefined);
  await driver.connectApp();
  await driver.focusElement("#target");
  const call = calls.at(-1);
  assert.deepEqual(call.body.args, ["#target"]);
  assert.equal(call.body.script.includes("#target"), false);
  for (reason of ["ambiguous", "not_found", "disabled", "hidden", "not_focusable", "unrecognized"]) {
    await assert.rejects(driver.focusElement("#target"));
  }
  assert.equal(calls.some(c => c.url.endsWith("/click") || c.url.endsWith("/value")), false);
});
