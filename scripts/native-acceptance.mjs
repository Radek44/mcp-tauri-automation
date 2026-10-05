import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, mkdir, readFile, writeFile, open, stat, readdir } from "node:fs/promises";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

// This launcher owns only its temporary fixture/driver/Xvfb processes. It never
// attaches to an existing desktop app, invokes app IPC, or retries a mutation.
const fixtureRoot = fileURLToPath(new URL("../test/native-fixture/", import.meta.url));
const repository = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
const options = {};
for (let index = 0; index < args.length; index += 2) {
  assert.ok(["--mcp-root", "--mode", "--binary", "--tauri-driver", "--native-driver", "--diagnose-release", "--probe-native-buttons"].includes(args[index]), `Unknown option: ${args[index]}`);
  assert.ok(args[index + 1] && !args[index + 1].startsWith("--"), `Missing value: ${args[index]}`);
  options[args[index].slice(2)] = args[index + 1];
}
assert.equal(process.platform, "linux", "This acceptance launcher currently supports Linux/Xvfb only.");
const mode = options.mode ?? "embedded";
assert.ok(["embedded", "external"].includes(mode), "--mode must be embedded or external");
assert.ok(options["diagnose-release"] === undefined || (options["diagnose-release"] === "true" && mode === "external"), "--diagnose-release true requires external mode");
assert.ok(options["probe-native-buttons"] === undefined || (options["probe-native-buttons"] === "true" && mode === "external"), "--probe-native-buttons true requires external mode");
const mcpRoot = path.resolve(options["mcp-root"] ?? repository);
const entry = path.join(mcpRoot, "dist/index.js");
const binary = path.resolve(options.binary ?? path.join(fixtureRoot, "src-tauri/target/debug/tauri-mcp-native-fixture"));
const tauriDriver = path.resolve(options["tauri-driver"] ?? path.join(fixtureRoot, "tooling/bin/tauri-driver"));
const nativeDriver = path.resolve(options["native-driver"] ?? path.join(fixtureRoot, "tooling/webkit/usr/bin/WebKitWebDriver"));
const requireFromMcp = createRequire(path.join(mcpRoot, "package.json"));
const { Client } = await import(pathToFileURL(requireFromMcp.resolve("@modelcontextprotocol/sdk/client/index.js")));
const { StdioClientTransport } = await import(pathToFileURL(requireFromMcp.resolve("@modelcontextprotocol/sdk/client/stdio.js")));
const output = await mkdtemp(path.join(tmpdir(), "tauri-native-acceptance-"));
const owned = [];
const logs = [];
let client;
let transport;
let activeSession = false;
let interrupted;
let failure;
let stderr = "";
const receipt = {
  status: "running", at: new Date().toISOString(), command: [process.execPath, ...process.argv.slice(1)],
  platform: process.platform, architecture: process.arch, node: process.version, mode,
  embeddedPlugin: "tauri-plugin-wdio-webdriver =1.2.0", output,
  calls: [], assertions: [], processes: [], cleanup: [], limitations: [
    "Dedicated synthetic fixture; not Saga or BeaverCraft product acceptance.",
    "Session reconnect is not process restart persistence.",
    "No native file picker, clipboard, OS shortcut, visual quality or cross-platform proof.",
    "Embedded events may be synthetic; external mouse assertions are reported separately.",
  ],
};
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function fileIdentity(filename) { return { path: filename, sha256: hash(await readFile(filename)) }; }
async function sourceIdentity(root, selected) {
  const names = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" })
    .split("\0").filter(Boolean).filter(selected).sort();
  const digest = createHash("sha256");
  for (const name of names) digest.update(name + "\0").update(await readFile(path.join(root, name))).update("\0");
  return { head: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
    files: names, sourceSha256: digest.digest("hex"),
    dirty: Boolean(execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim()) };
}
async function port() {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const chosen = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return chosen;
}
function checkInterrupted() { if (interrupted) throw new Error(`Interrupted by ${interrupted}`); }
async function spawnOwned(label, command, argv, env, extraPipe = false) {
  const log = await open(path.join(output, label + ".log"), "wx");
  logs.push(log);
  const child = spawn(command, argv, { env, detached: true,
    stdio: ["ignore", log.fd, log.fd, ...(extraPipe ? ["pipe"] : [])] });
  owned.push({ child, label });
  await new Promise((resolve, reject) => { child.once("spawn", resolve); child.once("error", reject); });
  receipt.processes.push({ label, pid: child.pid, command, args: argv });
  return child;
}
async function stopOwned({ child, label }) {
  // Group ownership comes from detached:true, never a discovered process name.
  const signal = (value) => { try { process.kill(-child.pid, value); } catch (error) { if (error.code !== "ESRCH") throw error; } };
  signal("SIGTERM");
  for (let attempt = 0; attempt < 20 && child.exitCode === null && child.signalCode === null; attempt++) await delay(50);
  signal("SIGKILL"); // Also remove a WebKit descendant if its launcher exited first.
  if (child.exitCode === null && child.signalCode === null) await Promise.race([once(child, "exit"), delay(1000)]);
  assert.ok(child.exitCode !== null || child.signalCode !== null, `Owned ${label} process did not exit`);
  receipt.cleanup.push({ label, pid: child.pid, exitCode: child.exitCode, signal: child.signalCode });
}
async function waitReady(endpoint, child) {
  const deadline = Date.now() + 20_000;
  let reason = "not listening";
  while (Date.now() < deadline) {
    checkInterrupted();
    assert.ok(child.exitCode === null && child.signalCode === null, `Owned process exited before ready: ${child.pid}`);
    try {
      const response = await fetch(endpoint + "/status", { signal: AbortSignal.timeout(1000) });
      if (response.ok && (await response.json()).value?.ready === true) return;
      reason = `status ${response.status}`;
    } catch (error) { reason = error.message; }
    await delay(100);
  }
  throw new Error(`Native endpoint was not ready: ${reason}`);
}
async function tool(name, args = {}, expectedFailure = false) {
  checkInterrupted();
  const started = Date.now();
  const response = await client.callTool({ name, arguments: args }, undefined, { timeout: 65_000 });
  const result = response.structuredContent;
  receipt.calls.push({ name, arguments: args, elapsedMs: Date.now() - started,
    success: result?.success === true, isError: response.isError,
    ...(result?.error ? { error: result.error } : {}),
    ...(response.isError && !result ? { validationError: response.content.filter((item) => item.type === "text").map((item) => item.text).join("\n").slice(0, 2000) } : {}) });
  if (expectedFailure) {
    // SDK schema errors have isError/content but no application envelope.
    assert.equal(response.isError, true, `${name} did not return an error`);
    assert.notEqual(result?.success, true, `${name} unexpectedly succeeded`);
    return result;
  }
  assert.equal(response.isError, undefined, `${name}: ${JSON.stringify(result)}`);
  assert.equal(result?.success, true, `${name}: ${JSON.stringify(result)}`);
  return result.data;
}
async function text(selector, expected) {
  assert.equal((await tool("get_element_text", { selector })).text, expected, selector);
}
function passed(name) { receipt.assertions.push(name); }
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => { interrupted = signal; });
try {
  receipt.fixture = await sourceIdentity(repository, (name) => (name.startsWith("test/native-fixture/") && !name.endsWith(".md")) || name === "scripts/native-acceptance.mjs");
  receipt.mcp = await sourceIdentity(mcpRoot, (name) => /^(src\/|scripts\/build\.mjs$|package(-lock)?\.json$|tsconfig\.json$)/.test(name));
  receipt.binary = await fileIdentity(binary);
  receipt.entry = await fileIdentity(entry);
  receipt.compiledModules = await Promise.all((await readdir(path.join(mcpRoot, "dist"))).filter((name) => name.endsWith(".js")).sort()
    .map((name) => fileIdentity(path.join(mcpRoot, "dist", name))));
  receipt.lockfile = await fileIdentity(path.join(fixtureRoot, "src-tauri/Cargo.lock"));
  const binaryMtime = (await stat(binary)).mtimeMs;
  for (const name of receipt.fixture.files.filter((name) => /test\/native-fixture\/(ui\/|src-tauri\/(Cargo\.(toml|lock)|build\.rs|tauri\.conf\.json|src\/|icons\/))/.test(name))) {
    assert.ok((await stat(path.join(repository, name))).mtimeMs <= binaryMtime,
      `Fixture binary predates ${name}; rebuild before native acceptance.`);
  }
  const driverPort = await port();
  receipt.port = driverPort;
  const env = { PATH: process.env.PATH ?? "/usr/bin:/bin", LANG: "C.UTF-8",
    GDK_BACKEND: "x11", LIBGL_ALWAYS_SOFTWARE: "1", WEBKIT_DISABLE_DMABUF_RENDERER: "1" };
  for (const variable of ["XDG_CONFIG_HOME", "XDG_DATA_HOME", "XDG_CACHE_HOME", "XDG_RUNTIME_DIR"]) {
    env[variable] = path.join(output, variable.toLowerCase());
    await mkdir(env[variable], { mode: 0o700 });
  }
  const display = await spawnOwned("xvfb", "Xvfb", ["-displayfd", "3", "-screen", "0", "1280x960x24", "-nolisten", "tcp"], env, true);
  const displayNumber = await Promise.race([
    new Promise((resolve, reject) => {
      let value = "";
      display.stdio[3].on("data", (chunk) => { value += chunk; if (value.includes("\n")) resolve(value.trim()); });
      display.once("exit", () => reject(new Error("Xvfb exited before announcing its display")));
    }), delay(5000).then(() => { throw new Error("Xvfb display timed out"); }),
  ]);
  assert.match(displayNumber, /^\d+$/);
  env.DISPLAY = ":" + displayNumber;
  receipt.display = env.DISPLAY;
  let app;
  if (mode === "embedded") {
    app = await spawnOwned("fixture", binary, [], { ...env, TAURI_WEBDRIVER_PORT: String(driverPort) });
    await waitReady(`http://127.0.0.1:${driverPort}`, app);
  } else {
    receipt.tauriDriver = await fileIdentity(tauriDriver);
    receipt.nativeDriver = await fileIdentity(nativeDriver);
    // A second private port avoids collision with an optional embedded plugin.
    env.TAURI_WEBDRIVER_PORT = String(await port());
    const driver = await spawnOwned("tauri-driver", tauriDriver,
      ["--port", String(driverPort), "--native-port", String(await port()), "--native-driver", nativeDriver], env);
    await waitReady(`http://127.0.0.1:${driverPort}`, driver);
  }
  transport = new StdioClientTransport({ command: process.execPath, args: [entry], stderr: "pipe", env: {
    ...env, TAURI_WEBDRIVER_PORT: String(driverPort), TAURI_SCREENSHOT_DIR: output, TAURI_DEFAULT_TIMEOUT: "5000",
  } });
  transport.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-12000); });
  client = new Client({ name: "tauri-native-acceptance", version: "1.0.0" });
  await client.connect(transport);
  const catalog = await client.listTools();
  for (const name of ["focus_element", "inspect_ui", "wait_for_element", "click_element", "capture_screenshot"]) {
    assert.ok(catalog.tools.some((entry) => entry.name === name), `Candidate lacks required tool ${name}; build the integrated MCP candidate first.`);
  }
  await tool(mode === "embedded" ? "connect_app" : "launch_app", mode === "embedded" ? {} : { appPath: binary });
  activeSession = true;
  const originalSession = (await tool("get_app_state")).sessionId;
  receipt.sessions = [originalSession];
  await tool("wait_for_element", { selector: "#fixture-version", conditions: { textEquals: "fixture-v1" }, timeout: 5000 });
  const snapshot = await tool("inspect_ui", { selector: "button, input", limit: 20, maxTextLength: 80 });
  assert.equal(snapshot.elements.filter((element) => element.name === "Duplicate label").length, 2);
  assert.equal(snapshot.elements.find((element) => element.name === "Unavailable action")?.enabled, false);
  assert.ok(!JSON.stringify(snapshot).includes("unchanged fixture value"), "Snapshot leaked the input value");
  assert.ok(snapshot.returned <= 20);
  passed("bounded snapshot preserves duplicate buttons, disabled state and form-value omission");
  await tool("click_element", { selector: "#activate" });
  await text("#activation-count", "1");
  passed("one ordinary click yields one activation");
  await tool("click_element", { selector: "#replace-status" });
  await tool("wait_for_element", { selector: "#async-status", conditions: { textEquals: "Ready", ariaBusy: false }, timeout: 5000 });
  await tool("wait_for_element", { selector: "#after-ready", conditions: { enabled: true }, timeout: 5000 });
  passed("predicate wait observes replaced status, busy=false and enabled control");
  const timeoutStarted = Date.now();
  await tool("wait_for_element", { selector: "#async-status", conditions: { textEquals: "Impossible" }, timeout: 150 }, true);
  assert.ok(Date.now() - timeoutStarted < 3000, "Predicate timeout was not bounded");
  passed("unmet predicate returns a bounded failure");
  await tool("focus_element", { selector: "#offscreen-focus" });
  const focused = await tool("inspect_ui", { selector: "#offscreen-focus", limit: 1 });
  assert.equal(focused.elements[0]?.focused, true);
  assert.equal(focused.elements[0]?.inViewport, true);
  await text("#focus-status", "focused");
  await text("#focus-activation-count", "0");
  await text("#input-count", "0");
  await text("#note-mirror", "unchanged fixture value");
  passed("explicit focus reaches off-screen button without activation or input changes");
  await tool("focus_element", { selector: "#disabled" }, true);
  await tool("focus_element", { selector: "#not-focusable" }, true);
  passed("disabled and non-focusable controls do not report focus success");
  if (options["diagnose-release"] === "true" || options["probe-native-buttons"] === "true") {
    // Element-origin pointer actions need a target in the viewport. The earlier
    // off-screen focus check intentionally scrolled away; do not replay a failed
    // click or mistake WebDriver's out-of-bounds error for native button proof.
    await tool("focus_element", { selector: "#mouse-target" });
    const mouseTarget = await tool("inspect_ui", { selector: "#mouse-target", limit: 1 });
    assert.equal(mouseTarget.elements[0]?.inViewport, true);
    if (options["diagnose-release"] === "true") {
      // Fixed, fixture-only transport diagnostic. Separating POST from DELETE
      // identifies which backend operation creates an unexpected activation.
      // This deliberately never records MCP mouse acceptance as passing.
      const session = (await tool("get_app_state")).sessionId;
      receipt.releaseDiagnostic = { requests: [] };
      async function nativeRequest(method, suffix, body) {
        const response = await fetch(`http://127.0.0.1:${driverPort}/session/${encodeURIComponent(session)}${suffix}`, {
          method, headers: { "Content-Type": "application/json" },
          ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(5000),
        });
        const result = await response.json();
        receipt.releaseDiagnostic.requests.push({ method, suffix, body, status: response.status, result });
        assert.ok(response.ok, `Diagnostic WebDriver response ${response.status}`);
        return result.value;
      }
      const element = await nativeRequest("POST", "/element", { using: "css selector", value: "#mouse-target" });
      await nativeRequest("POST", "/actions", { actions: [{ type: "pointer", id: "diagnostic-mouse", parameters: { pointerType: "mouse" }, actions: [
        { type: "pointerMove", duration: 0, origin: element, x: 0, y: 0 },
        { type: "pointerDown", button: 2 }, { type: "pointerUp", button: 2 },
      ] }] });
      await tool("wait_for_element", { selector: "#trusted-event", conditions: { textEquals: "true" }, timeout: 2000 });
      await delay(100); // Observe the completed mouseup/click task before cleanup.
      receipt.releaseDiagnostic.beforeDelete = JSON.parse((await tool("get_element_text", { selector: "#mouse-trace" })).text);
      await nativeRequest("DELETE", "/actions");
      await delay(100);
      receipt.releaseDiagnostic.afterDelete = JSON.parse((await tool("get_element_text", { selector: "#mouse-trace" })).text);
      throw new Error("Release diagnostic completed; this run intentionally does not claim MCP mouse acceptance.");
    }
    await tool("click_element", { selector: "#mouse-target", button: "right" });
    await tool("wait_for_element", { selector: "#context-count", conditions: { textEquals: "1" }, timeout: 2000 });
    receipt.eventsAfterRight = JSON.parse((await tool("get_element_text", { selector: "#mouse-trace" })).text);
    await text("#context-count", "1");
    await text("#left-click-count", "0");
    await tool("click_element", { selector: "#mouse-target", button: "middle" });
    await tool("wait_for_element", { selector: "#middle-aux-count", conditions: { textEquals: "1" }, timeout: 2000 });
    await text("#middle-aux-count", "1");
    await text("#trusted-event", "true");
    await text("#left-click-count", "0");
    receipt.eventsAfterMiddle = JSON.parse((await tool("get_element_text", { selector: "#mouse-trace" })).text);
    receipt.rightAuxiliaryEvents = (await tool("get_element_text", { selector: "#right-aux-count" })).text;
    passed("external right/middle clicks produce trusted contextmenu/auxclick events with no left click");
  } else {
    for (const button of ["left", "middle", "right"]) {
      await tool("click_element", { selector: "#mouse-target", button }, true);
    }
    await text("#right-count", "0");
    await text("#middle-count", "0");
    await text("#context-count", "0");
    await text("#aux-count", "0");
    await text("#left-click-count", "0");
    await text("#mouse-trace", "[]");
    passed("unsupported button fields fail validation without any mouse event or activation");
  }
  const capture = await tool("capture_screenshot", { filename: `native-${mode}`, returnBase64: false, timeout: 10_000 });
  const png = await readFile(capture.path);
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  assert.ok(width > 0 && height > 0);
  receipt.screenshot = { ...await fileIdentity(capture.path), width, height, viewport: focused.viewport };
  passed("per-call screenshot deadline returns a nonempty native PNG");
  await tool("close_app");
  activeSession = false;
  assert.equal((await tool("get_app_state")).isRunning, false);
  await tool("get_element_text", { selector: "#fixture-version" }, true);
  passed("closed session cannot read UI");
  if (mode === "embedded") {
    assert.ok(app.exitCode === null && app.signalCode === null, "Session close terminated the launcher-owned app");
    await tool("connect_app");
    activeSession = true;
    const nextSession = (await tool("get_app_state")).sessionId;
    assert.notEqual(nextSession, originalSession);
    receipt.sessions.push(nextSession);
    await text("#activation-count", "1");
    await text("#async-status", "Ready");
    await tool("close_app");
    activeSession = false;
    passed("embedded close leaves app alive and reconnect preserves same-process state");
  }
  receipt.status = "pass";
} catch (error) {
  failure = error;
  receipt.status = "fail";
  receipt.error = error instanceof Error ? error.message : String(error);
  if (activeSession && client && !interrupted) {
    try {
      receipt.lastUiObservation = await tool("inspect_ui", {
        selector: "#mouse-target, #left-count, #middle-count, #right-count, #context-count, #aux-count, #trusted-event",
        limit: 10, maxTextLength: 100,
      });
      receipt.lastMouseEvents = JSON.parse((await tool("get_element_text", { selector: "#mouse-trace" })).text);
    } catch (observationError) { receipt.observationError = observationError.message; }
  }
} finally {
  if (activeSession && client) {
    try { await tool("close_app"); } catch (error) { receipt.cleanup.push({ sessionError: error.message }); }
  }
  try { await client?.close(); } catch (error) { receipt.cleanup.push({ clientError: error.message }); }
  for (const child of owned.reverse()) {
    try { await stopOwned(child); } catch (error) { receipt.cleanup.push({ processError: error.message }); }
  }
  for (const log of logs) await log.close();
  const cleanupErrors = receipt.cleanup.filter((item) => item.sessionError || item.clientError || item.processError);
  if (cleanupErrors.length) {
    receipt.status = "fail";
    failure ??= new Error("Owned resource cleanup failed; inspect receipt cleanup details.");
    receipt.error ??= failure.message;
  }
  receipt.stderr = stderr;
  receipt.finishedAt = new Date().toISOString();
  await writeFile(path.join(output, "receipt.json"), JSON.stringify(receipt, null, 2) + "\n", { flag: "wx" });
  console.log(JSON.stringify({ status: receipt.status, receipt: path.join(output, "receipt.json"), assertions: receipt.assertions.length }));
}
if (failure) { console.error(failure.message); process.exitCode = 1; }
