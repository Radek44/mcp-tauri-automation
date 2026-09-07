# Saga / Vuea native probe

This is development tooling evidence, not an M12 acceptance receipt. Saga's
native gates, golden loop, author/reviewer separation, and explicit human Finish
Session boundary remain authoritative.

1. Use an unlocked macOS desktop. Confirm session state before visible tests;
   a locked or indeterminate desktop is a blocked check, not a product failure.
2. In a clean Saga checkout, use its documented native-smoke build recipe:
   `pnpm build:web`, then
   `pnpm --filter @saga/desktop tauri build --debug --no-bundle --features native-smoke --config src-tauri/tauri.smoke.conf.json`.
   Check the current package name/recipe if it changes. The executable is
   `apps/desktop/src-tauri/target/debug/saga-desktop`.
3. Create an empty temporary directory with `mktemp -d`. Launch that exact
   executable with `SAGA_NATIVE_SMOKE_APP_DATA_DIR` set to the absolute temporary
   directory, `TAURI_WEBDRIVER_PORT=44760`, and `WDIO_EMBEDDED_SERVER=true`.
   Record its PID, binary SHA-256, source SHA, and app-data path. Never use the
   registered personal Vuea application or default app-data directory.
4. In this repository, run `npm run build`, then `npm run smoke -- 44760`.
   The real stdio MCP client creates an embedded session, probes title/state,
   requests a bounded UI snapshot, saves a PNG, deletes its session, and emits
   local receipt/screenshot paths. It does not make document changes or stop
   the caller-owned native process.
5. Inspect the returned screenshot for the expected synthetic empty document
   list. Stop only the exact test-owned PID when done. Keep the receipt and
   source/binary identity together; never promote this probe to a milestone pass.

The public automation server contains no Saga-specific commands. Its ordinary
UI tools can exercise disposable test documents; document authoring should use
SagaDoc's validated service. The example Codex profile excludes arbitrary IPC
and app launching so the coordinator retains data/process isolation.

One useful future comparison: count tool calls and model input/output tokens
for the same native diagnostic before and after `inspect_ui`. The returned
snapshot byte count is a payload measurement, not a token or cost estimate.
