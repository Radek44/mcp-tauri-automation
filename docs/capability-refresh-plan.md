# Tauri capability refresh — 2026-10-05

Approved scope: contributor triage and a small upgrade grounded in Saga and
BeaverCraft native workflows. Keep direct WebDriver, bounded diagnostics,
loopback sessions, launcher ownership and no automatic mutation retries.

## Implementation

- [x] Land compatible fast-uri and ip-address lockfile patches separately.
- [x] Port #7's per-call screenshot timeout through the abortable request path.
- [x] Evaluate #9 on both native providers. Defer: embedded does not synthesize
  the required events; external WebKit emits a primary click. Reject button
  overrides instead of silently accepting an unsafe interaction.
- [x] Add exact normalized text, enabled and aria-busy wait conditions with
  fresh lookup, one overall deadline and unchanged default wait behavior.
- [x] Add unique-target focus with verified activeElement, no typing/activation,
  and focused state in bounded inspection.
- [x] Integrate an isolated native fixture; embedded10/external9 native assertions pass.
- [ ] Review public contracts independently, run the final full gate and CI,
  merge passing increments and close superseded contributor PRs with credit.

## Public contracts

`capture_screenshot.timeout`: optional integer 1..60000; omitted uses config.
`click_element`: selector only; any button field is rejected before dispatch.
`wait_for_element.conditions`: optional textEquals, enabled, ariaBusy; all must
match, and conditions cannot accompany state hidden. Text is whitespace
normalized and bounded; predicates never expose form values.
`focus_element({selector})`: CSS must identify exactly one public focusable
element. Scroll/focus uses a fixed implementation and confirms activeElement.
`inspect_ui`: adds focused boolean per element; all prior limits remain.

## Independent review fixes

- [x] Prevent cancelled queued mutations from executing after the prior call.
- [x] Preserve inline text adjacency and count hidden/private traversal work.
- [x] Prove shutdown during an active mutation and no replay on cancellation.

## Acceptance

Deterministic protocol tests cover schema validation, timeout, stale nodes,
raw versus path-encoded IDs, failure without replay and cleanup. Native tests
must prove actual event/state changes, not merely successful HTTP requests.
Use synthetic data only and record exact app/MCP/plugin builds. Do not alter
Saga or BeaverCraft, claim native platforms not executed, or publish to npm.

PR #5 is covered/declined as an omnibus. #6 XPath and #8 URL waits stay deferred;
their specific review feedback and the original authors remain linked in the
PR discussions. Dependency findings are independently verified by npm audit.

Final local gate: `npm run verify` exited 0 on the integrated source (40 tests,
zero runtime audit findings, dry-run package passed). Native receipts bind the
unchanged runtime/fixture bytes. CI and merge are the remaining publication steps.
