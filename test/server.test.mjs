import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer, shutdownServer } from "../dist/server.js";

class FakeDriver {
  calls = [];
  state = {
    isRunning: true,
    sessionId: "session-1",
    mode: "embedded",
    port: 4444,
  };
  async launchApp(params) {
    this.calls.push(["launch", params]);
  }
  async connectApp(port) {
    this.calls.push(["connect", port]);
  }
  async closeApp() {
    this.calls.push(["close"]);
    this.state.isRunning = false;
  }
  async captureScreenshot(_filename, _base64) {
    this.calls.push(["screenshot"]);
    return "cG5n";
  }
  async clickElement(selector) {
    this.calls.push(["click", selector]);
  }
  async typeText(selector, text, clear) {
    this.calls.push(["type", selector, text, clear]);
  }
  async waitForElement(selector, timeout, state) {
    this.calls.push(["wait", selector, timeout, state]);
  }
  async getElementText(selector) {
    this.calls.push(["text", selector]);
    return "hello";
  }
  async inspectUi(params) {
    this.calls.push(["inspect", params]);
    return { nodes: [] };
  }
  async executeTauriCommand(command, args) {
    this.calls.push(["command", command, args]);
    return { ok: true };
  }
  getAppState() {
    return this.state;
  }
  async getPageTitle() {
    return "Title";
  }
  async getPageUrl() {
    return "tauri://localhost";
  }
}

async function connected(driver = new FakeDriver()) {
  const server = createServer(driver);
  const client = new Client({ name: "test", version: "1.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  return { driver, server, client };
}
function envelope(response) {
  return JSON.parse(response.content[0].text);
}

test("arbitrary clicks are conservatively annotated as potentially destructive", async () => {
  const { server, client } = await connected();
  try {
    const catalog = await client.listTools();
    assert.notEqual(
      catalog.tools.find((t) => t.name === "click_element").annotations
        .destructiveHint,
      false,
    );
  } finally {
    await shutdownServer(server);
    await client.close();
  }
});

test("health probes never overlap commands within the same WebDriver session", async () => {
  const { driver, server, client } = await connected();
  let active = 0,
    peak = 0;
  const probe = async () => {
    active++;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active--;
    return "page";
  };
  driver.getPageTitle = probe;
  driver.getPageUrl = probe;
  try {
    const result = await client.callTool({
      name: "get_app_state",
      arguments: {},
    });
    assert.equal(result.structuredContent.success, true);
    assert.equal(peak, 1);
  } finally {
    await shutdownServer(server);
    await client.close();
  }
});

test("catalog exposes eleven bounded tools and applies defaults", async () => {
  const { driver, server, client } = await connected();
  try {
    const list = await client.listTools();
    assert.equal(list.tools.length, 11);
    assert.ok(list.tools.some((tool) => tool.name === "connect_app"));
    await client.callTool({ name: "inspect_ui", arguments: {} });
    assert.deepEqual(driver.calls.at(-1), [
      "inspect",
      { limit: 20, maxTextLength: 160 },
    ]);
    await client.callTool({
      name: "wait_for_element",
      arguments: { selector: "#ok" },
    });
    assert.deepEqual(driver.calls.at(-1), [
      "wait",
      "#ok",
      undefined,
      "attached",
    ]);
  } finally {
    await shutdownServer(server);
    await client.close();
  }
});

test("invalid arguments never invoke the driver and ordinary failures are MCP errors", async () => {
  const { driver, server, client } = await connected();
  try {
    const invalid = await client.callTool({
      name: "inspect_ui",
      arguments: { limit: 101 },
    });
    assert.equal(invalid.isError, true);
    assert.equal(driver.calls.length, 0);
    driver.clickElement = async () => {
      throw new Error("webdriver failure");
    };
    const failed = await client.callTool({
      name: "click_element",
      arguments: { selector: "#x" },
    });
    assert.equal(failed.isError, true);
    assert.deepEqual(envelope(failed), {
      success: false,
      error: "webdriver failure",
    });
  } finally {
    await shutdownServer(server);
    await client.close();
  }
});

test("screenshots return a native image without duplicating base64 in text", async () => {
  const { server, client } = await connected();
  try {
    const response = await client.callTool({
      name: "capture_screenshot",
      arguments: {},
    });
    assert.equal("isError" in response, false);
    assert.deepEqual(envelope(response), {
      success: true,
      data: { message: "Screenshot captured successfully" },
    });
    assert.equal(
      response.content.filter((item) => item.type === "image").length,
      1,
    );
    assert.equal(response.content[0].text.includes("cG5n"), false);
  } finally {
    await shutdownServer(server);
    await client.close();
  }
});

test("app-state probe failures retain tracked session data without claiming it is alive", async () => {
  const { driver, server, client } = await connected();
  driver.getPageTitle = async () => {
    throw new Error("gone");
  };
  try {
    const response = await client.callTool({
      name: "get_app_state",
      arguments: {},
    });
    assert.equal(response.isError, true);
    assert.deepEqual(envelope(response), {
      success: false,
      data: {
        state: {
          isRunning: true,
          sessionId: "session-1",
          mode: "embedded",
          port: 4444,
        },
      },
      error: "Unable to probe the tracked application session.",
    });
  } finally {
    await shutdownServer(server);
    await client.close();
  }
});

test("an uncertain connection is an error even when no local session is tracked", async () => {
  const { driver, server, client } = await connected();
  driver.state = { isRunning: false, connectionUncertain: true };
  try {
    const response = await client.callTool({
      name: "get_app_state",
      arguments: {},
    });
    assert.equal(response.isError, true);
    assert.equal(envelope(response).data.state.connectionUncertain, true);
  } finally {
    await shutdownServer(server);
    await client.close();
  }
});

test("tool calls share a queue and shutdown waits before session cleanup", async () => {
  const { driver, server, client } = await connected();
  let release;
  driver.clickElement = async () => {
    driver.calls.push(["click-start"]);
    await new Promise((resolve) => {
      release = resolve;
    });
    driver.calls.push(["click-end"]);
  };
  try {
    const first = client.callTool({
      name: "click_element",
      arguments: { selector: "#a" },
    });
    const second = client.callTool({
      name: "get_element_text",
      arguments: { selector: "#b" },
    });
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(driver.calls, [["click-start"]]);
    release();
    await Promise.all([first, second]);
    assert.deepEqual(
      driver.calls.map(([name]) => name),
      ["click-start", "click-end", "text"],
    );
  } finally {
    await shutdownServer(server);
    await client.close();
  }
});
