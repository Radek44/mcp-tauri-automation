import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const port = Number(process.argv[2]);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(
    "Usage: npm run smoke -- PORT (already running, isolated embedded test app; unlocked desktop)",
  );
}
const output = await mkdtemp(path.join(tmpdir(), "tauri-mcp-smoke-"));
const entry = fileURLToPath(new URL("../dist/index.js", import.meta.url));
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [entry],
  stderr: "pipe",
  env: {
    TAURI_WEBDRIVER_PORT: String(port),
    TAURI_SCREENSHOT_DIR: output,
    TAURI_DEFAULT_TIMEOUT: "5000",
  },
});
// Keep stderr local; tool failures below contain the actionable, bounded error.
let stderr = "";
transport.stderr.on("data", (chunk) => {
  stderr = (stderr + chunk).slice(-8000);
});
const client = new Client({ name: "tauri-automation-smoke", version: "1.0.0" });
const calls = [];
async function call(name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  calls.push({ name, success: result.structuredContent?.success === true });
  assert.equal(
    result.isError,
    undefined,
    JSON.stringify(result.structuredContent),
  );
  assert.equal(result.structuredContent?.success, true);
  return result.structuredContent.data;
}
try {
  await client.connect(transport);
  const catalog = await client.listTools();
  assert.equal(catalog.tools.length, 11);
  const connected = await call("connect_app");
  const state = await call("get_app_state");
  assert.equal(state.isRunning, true);
  const snapshot = await call("inspect_ui", { limit: 20, maxTextLength: 100 });
  assert.ok(snapshot.returned > 0 && snapshot.returned <= 20);
  const screenshot = await call("capture_screenshot", {
    filename: "native-smoke",
    returnBase64: false,
  });
  const png = await readFile(screenshot.path);
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  await call("close_app");
  assert.equal((await call("get_app_state")).isRunning, false);
  const receipt = {
    status: "pass",
    at: new Date().toISOString(),
    platform: process.platform,
    node: process.version,
    port,
    sessionId: connected.sessionId,
    serverVersion: client.getServerVersion(),
    entrySha256: createHash("sha256")
      .update(await readFile(entry))
      .digest("hex"),
    viewport: snapshot.viewport,
    elementCount: snapshot.returned,
    snapshotBytes: Buffer.byteLength(JSON.stringify(snapshot)),
    screenshot: screenshot.path,
    screenshotSha256: createHash("sha256").update(png).digest("hex"),
    calls,
    limitations:
      "Read-only UI probe; no visual judgment, interaction, or app-process teardown assertion.",
  };
  const receiptPath = path.join(output, "receipt.json");
  await writeFile(receiptPath, JSON.stringify(receipt, null, 2) + "\n", {
    flag: "wx",
  });
  console.log(
    JSON.stringify({
      status: "pass",
      receipt: receiptPath,
      screenshot: screenshot.path,
    }),
  );
} catch (error) {
  await writeFile(
    path.join(output, "failure.json"),
    JSON.stringify({ status: "fail", calls, stderr }, null, 2),
    { flag: "wx" },
  );
  throw error;
} finally {
  await client.close();
}
