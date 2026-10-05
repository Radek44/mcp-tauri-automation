# Dedicated native acceptance fixture

Baseline: `cb0252a524bf13397db42bdee7edeaffec412afc`.
Scope: this directory and `scripts/native-acceptance.mjs` only. Runtime tool
changes and the npm dependency update belong to the parallel runtime worktree.

- [x] Build a dependency-light Tauri 2 fixture with a feature-gated, pinned
  embedded WebDriver plugin and ordinary public HTML controls.
- [x] Add an isolated, serial MCP acceptance harness with machine-readable
  identities, assertions, failure receipts and launcher-owned cleanup.
- [x] Exercise the fixture under Linux/Xvfb against the integrated MCP candidate;
  distinguish embedded focus/DOM behavior from external native mouse buttons.
- [x] Document exact commands, observed outcomes, limits and package wiring.

Checkpoint: embedded implementation candidate passed 10 assertions. External
WebKitWebDriver 2.52.6 generated trusted primary activations for right/middle
POST actions; the separated POST/DELETE diagnostic proves cleanup is not the
cause. Non-primary button support is deferred. The default harness now requires
selector-only validation rejection with no event dispatch on both providers.
Final rc.2 candidate: embedded PASS (10 assertions) and external PASS (9), both
exit 0. The final harness accepts SDK schema error envelopes and proves all
three button fields are rejected with an empty event trace. See `ACCEPTANCE.md`
for exact receipts, source hashes and limitations. No package wiring is needed.

No edits to Saga or other consumers; no deployment, personal data, generic IPC,
automatic mutation retries, commits or pushes.
