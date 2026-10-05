import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const entry = fileURLToPath(new URL("../dist/index.js", import.meta.url));
test("invalid startup config fails without protocol noise or echoing values", async () => {
  const child = spawn(process.execPath, [entry], {
    env: { ...process.env, TAURI_WEBDRIVER_PORT: "secret-invalid-port" },
    stdio: ["pipe", "pipe", "pipe"],
  });
  let stdout = "",
    stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  const [code] = await once(child, "close");
  assert.equal(code, 1);
  assert.equal(stdout, "");
  assert.match(stderr, /Invalid TAURI_WEBDRIVER_PORT/);
  assert.equal(stderr.includes("secret-invalid-port"), false);
});

test(
  "real stdio initialize/catalog/connect and SIGTERM delete only the owned embedded session",
  { timeout: 10000 },
  async (t) => {
    const calls = [];
    const endpoint = createServer(async (req, res) => {
      for await (const _chunk of req) {
        /* consume request */
      }
      calls.push({ method: req.method, url: req.url });
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          value: req.url === "/session" ? { sessionId: "stdio-owned" } : null,
        }),
      );
    });
    await new Promise((resolve) => endpoint.listen(0, "127.0.0.1", resolve));
    t.after(() => new Promise((resolve) => endpoint.close(resolve)));
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [entry],
      env: {
        TAURI_WEBDRIVER_PORT: String(endpoint.address().port),
        TAURI_DEFAULT_TIMEOUT: "1000",
      },
      stderr: "pipe",
    });
    const client = new Client({ name: "stdio-test", version: "1.0.0" });
    let stderr = "";
    transport.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    t.after(() => client.close());
    await client.connect(transport);
    const listed = await client.listTools();
    assert.equal(listed.tools.length, 12);
    const connected = await client.callTool({
      name: "connect_app",
      arguments: {},
    });
    assert.equal(connected.structuredContent.success, true);
    const ended = new Promise((resolve) => {
      client.onclose = resolve;
    });
    process.kill(transport.pid, "SIGTERM");
    await ended;
    assert.deepEqual(
      calls.filter((c) => c.method === "DELETE"),
      [{ method: "DELETE", url: "/session/stdio-owned" }],
    );
    assert.equal(endpoint.listening, true);
    assert.doesNotMatch(stderr, /Cleanup timed out|failed/);
  },
);

test(
  "stdio EOF performs cleanup and terminates without waiting for another signal",
  { timeout: 10000 },
  async (t) => {
    const requests = [];
    const endpoint = createServer(async (req, res) => {
      for await (const _chunk of req) {
        /* consume */
      }
      requests.push(req.method + " " + req.url);
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          value: req.url === "/session" ? { sessionId: "eof-owned" } : null,
        }),
      );
    });
    await new Promise((resolve) => endpoint.listen(0, "127.0.0.1", resolve));
    t.after(() => new Promise((resolve) => endpoint.close(resolve)));
    const child = spawn(process.execPath, [entry], {
      env: {
        ...process.env,
        TAURI_WEBDRIVER_PORT: String(endpoint.address().port),
        TAURI_DEFAULT_TIMEOUT: "1000",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });
    t.after(() => {
      if (child.exitCode === null) child.kill("SIGTERM");
    });
    let output = "",
      errors = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      errors += chunk;
    });
    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "eof-test", version: "1" },
        },
      }) + "\n",
    );
    while (!output.includes('"id":1'))
      await new Promise((resolve) => setTimeout(resolve, 10));
    child.stdin.write(
      JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) +
        "\n",
    );
    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "connect_app", arguments: {} },
      }) + "\n",
    );
    while (!output.includes('"id":2'))
      await new Promise((resolve) => setTimeout(resolve, 10));
    const exit = once(child, "close");
    child.stdin.end();
    const [code] = await exit;
    assert.equal(code, 0, errors);
    assert.equal(
      requests.filter((p) => p === "DELETE /session/eof-owned").length,
      1,
    );
    for (const line of output.trim().split("\n"))
      assert.equal(JSON.parse(line).jsonrpc, "2.0");
  },
);
