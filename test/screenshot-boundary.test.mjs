import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { TauriDriver } from "../dist/tauri-driver.js";

test("screenshot names cannot escape their configured directory or overwrite an existing file", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "tauri-mcp-path-test-"));
  const screenshotDir = path.join(root, "screenshots");
  await mkdir(screenshotDir);
  const driver = new TauriDriver({ screenshotDir });
  // Stub only the camera; exercise the real persistence boundary.
  driver.request = async () => "cG5n";
  driver.session = { sessionId: "test", mode: "embedded" };
  try {
    await assert.rejects(
      driver.captureScreenshot("../outside", false),
      /filename|basename/i,
    );
    const saved = await driver.captureScreenshot("proof", false);
    assert.equal(saved, path.join(screenshotDir, "proof.png"));
    await assert.rejects(driver.captureScreenshot("proof", false), /exist/i);
    assert.equal(await readFile(saved, "utf8"), "png");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
