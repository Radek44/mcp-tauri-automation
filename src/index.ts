#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TauriDriver } from "./tauri-driver.js";
import { createServer, shutdownServer } from "./server.js";
import type { TauriAutomationConfig } from "./types.js";

function optionalInteger(name: string): number | undefined {
  const value = process.env[name];
  if (value === undefined || value === "") return undefined;
  if (!/^\d+$/.test(value))
    throw new Error(`Invalid ${name}; expected an integer.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed))
    throw new Error(`Invalid ${name}; expected a safe integer.`);
  return parsed;
}
function configFromEnvironment(): TauriAutomationConfig {
  return {
    appPath: process.env.TAURI_APP_PATH,
    screenshotDir: process.env.TAURI_SCREENSHOT_DIR,
    webdriverPort: optionalInteger("TAURI_WEBDRIVER_PORT"),
    defaultTimeout: optionalInteger("TAURI_DEFAULT_TIMEOUT"),
    tauriDriverPath: process.env.TAURI_DRIVER_PATH,
  };
}
let server: ReturnType<typeof createServer> | undefined;
let cleanupPromise: Promise<void> | undefined;
function cleanup(): Promise<void> {
  return (cleanupPromise ??= server
    ? shutdownServer(server)
    : Promise.resolve());
}
async function exit(code: number): Promise<void> {
  try {
    await cleanup();
  } catch {
    console.error(
      "Cleanup timed out or failed; the application session may remain active.",
    );
    process.exit(1);
  }
  process.exit(code);
}
process.once("SIGINT", () => {
  void exit(0);
});
process.once("SIGTERM", () => {
  void exit(0);
});
process.stdin.once("end", () => {
  void exit(0);
});
async function main(): Promise<void> {
  server = createServer(new TauriDriver(configFromEnvironment()));
  server.server.onclose = () => {
    void exit(0);
  };
  await server.connect(new StdioServerTransport());
  console.error("MCP Tauri Automation server running on stdio");
}
main().catch((error: unknown) => {
  console.error(
    "Fatal error in MCP server startup:",
    error instanceof Error ? error.message : "unknown error",
  );
  void exit(1);
});
