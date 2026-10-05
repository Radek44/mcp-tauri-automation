# Native validation notes — 2026-10-05

Host: Linux ARM64; GTK 3.24.41, WebKitGTK/WebKitWebDriver 2.52.6,
tauri-driver 2.1.0, Node 24.21.0, Rust/Cargo 1.95.0. Embedded plugin is pinned
to 1.2.0. Native receipts retain the exact source and binary identities; Git
HEAD alone does not describe an uncommitted candidate.

## Final rc.2 candidate — both providers pass

The final executable fixture/harness source was tested once per provider after
adapting error handling to the MCP SDK's schema-error envelope. That envelope
sets `isError: true` and has no application `structuredContent`; the earlier
harness assertion incorrectly required both. Each final run proves SDK error
`-32602` for `button: left`, `middle` and `right`, then independently verifies
zero context-menu/auxiliary/primary activations and an empty mouse event trace.

From the isolated fixture worktree:

```sh
node scripts/native-acceptance.mjs --mcp-root ../tauri-mcp --mode embedded
node scripts/native-acceptance.mjs --mcp-root ../tauri-mcp --mode external
```

Both commands exited 0:

| Provider | Assertions | Receipt | PNG |
| --- | ---: | --- | --- |
| Embedded 1.2.0 | 10 | `/tmp/tauri-native-acceptance-Fj1zgY/receipt.json` | `/tmp/tauri-native-acceptance-Fj1zgY/native-embedded.png` |
| External tauri-driver/WebKitWebDriver | 9 | `/tmp/tauri-native-acceptance-B91yIh/receipt.json` | `/tmp/tauri-native-acceptance-B91yIh/native-external.png` |

Both PNGs are 960 × 720. Process cleanup completed in both receipts. Exact
compiled MCP module hashes, driver binary hashes, calls, session IDs and process
logs remain alongside those receipts.

- Fixture/harness source digest: `9db1030666bcd78c15d16dc67ebf1b5eeded290519c2f464fcf7521fb3a1dd78`.
- MCP source digest: `f3251ae3de60d424f30910c6bc249e15e3ce3fad95ac44acec504d6279418595`.
- Fixture binary SHA-256: `ed939262ea6d98418a082e1cb6ac37b755ff62ad827688e5ebfda628dba58043`.
- Fixture branch base: `cb0252a524bf13397db42bdee7edeaffec412afc`, with uncommitted fixture source.
- MCP branch HEAD: `5aef3dbc2b72e10e4ea576140d9cd74b16cba91a`, with the uncommitted rc.2 implementation.

Markdown evidence is excluded from the executable-source digest, so recording
these results does not change the tested fixture identity. This proves the
dedicated Linux fixture contract, including explicit DOM focus and rejected
non-primary inputs; it does not prove Saga/BeaverCraft acceptance, process
restart persistence, visual quality, native dialogs or other operating systems.

## Retained runs during implementation

- `cargo build --locked --manifest-path test/native-fixture/src-tauri/Cargo.toml --features native-acceptance,custom-protocol`: exit 0.
- `cargo check --locked --manifest-path test/native-fixture/src-tauri/Cargo.toml --features custom-protocol`: exit 0, without the optional embedded plugin.
- `cargo fmt --manifest-path test/native-fixture/src-tauri/Cargo.toml --check`: exit 0.
- `node --check scripts/native-acceptance.mjs` and `node --check test/native-fixture/ui/fixture.js`: exit 0.
- `node scripts/native-acceptance.mjs --mcp-root ../tauri-mcp --mode embedded`:
  exit 0, 10 assertions, `/tmp/tauri-native-acceptance-dvPls8/receipt.json`.
  This precedes the later bounded mouse event trace; it is retained evidence,
  not a claim about the final source candidate. MCP source digest was
  `9d58704a04651298649f983cce9c248c2a5acb54b8134a63bd31ab97b681f19d`.

The first external run found an out-of-viewport target after the focus test.
The harness now explicitly focuses the mouse target and asserts viewport
presence before dispatch. A later immediate-read failure was checked with a
bounded wait; the incorrect button result persisted. No failed mutation was
replayed in its old session; each diagnostic started a fresh fixture.

## External non-primary mouse actions are not accepted

`/tmp/tauri-native-acceptance-7qPDvO/receipt.json` records trusted event traces:

```text
right:  mousedown(button=2), contextmenu(button=2), mouseup(button=0), click(button=0)
middle: mousedown(button=1), mouseup(button=0), click(button=0)
```

Right-click did open a context menu, but also caused primary activation.
Middle-click caused primary activation and no `auxclick`. The acceptance
contract requires no primary activation and is not relaxed to accept this.

A targeted diagnostic separated the POST from cleanup:

```sh
node scripts/native-acceptance.mjs --mcp-root ../tauri-mcp --mode external --diagnose-release true
```

It intentionally exited 1 and retained
`/tmp/tauri-native-acceptance-KDKfFx/receipt.json`. The receipt includes exact
`POST /actions` and `DELETE /actions` bodies/statuses plus observations before
and after DELETE. The incorrect primary activation was already present after
POST; DELETE added no event. Removing cleanup therefore does not fix the
observed behavior. This is backend-specific evidence, not a claim that every
external WebDriver behaves this way.

The diagnostic uses only a fixed right-button sequence against the launcher-owned
synthetic fixture. It is not an arbitrary-script tool or a passing MCP acceptance
lane. Product apps, personal data, OS dialogs and production processes are not
involved.

Sanitized complete receipts are retained in the repository:
[embedded](../../docs/validation/2.0.0-rc.2-linux-embedded.json) and
[external](../../docs/validation/2.0.0-rc.2-linux-external.json).
