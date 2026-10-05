# Native acceptance fixture

This small Tauri 2 app tests the MCP public UI contract against a real native
WebView. Its controls model repeated needs from Saga and BeaverCraft without
changing either product or loading real documents. There is no account, network
API, fixture-control IPC or persistent application state.

The embedded plugin is pinned to `tauri-plugin-wdio-webdriver =1.2.0` and is
registered only with the `native-acceptance` Cargo feature. The fixture is not
published in the npm package and is not a production app. `Cargo.lock` pins its
Rust dependency graph. The single-color icon is generated fixture artwork.

## Prerequisites and build

Linux with Rust/Cargo, GTK 3, WebKitGTK 4.1 development libraries, Xvfb and Node
22+. The fixture has no npm dependencies. Build/install the MCP candidate using
its normal `npm ci` and `npm run build` commands first.

From the repository root:

```sh
cargo build --locked --manifest-path test/native-fixture/src-tauri/Cargo.toml --features native-acceptance,custom-protocol
node scripts/native-acceptance.mjs --mode embedded
```

An independently built MCP worktree can be selected without copying its code:

```sh
node scripts/native-acceptance.mjs --mcp-root ../tauri-mcp --mode embedded
```

The launcher deliberately fails when required candidate tools are absent or
the binary predates its Rust/config/frontend inputs. Rebuild after fixture
changes. It never starts a dev server or substitutes browser-preview evidence.

## External provider lane

Non-primary mouse support is deferred: the tested external backend generated
accidental primary clicks. Default acceptance requires both providers to reject
any `button` field before dispatch. See [the evidence](ACCEPTANCE.md).
An Ubuntu ARM64 development machine can install both
drivers into ignored task-local tooling without modifying system packages:

```sh
mkdir -p test/native-fixture/tooling
cd test/native-fixture/tooling
apt-get download webkit2gtk-driver
dpkg-deb -x webkit2gtk-driver_*.deb webkit
cd ../../..
CARGO_TARGET_DIR="$PWD/test/native-fixture/tooling/cargo-target" cargo install tauri-driver --version 2.1.0 --locked --root "$PWD/test/native-fixture/tooling"
node scripts/native-acceptance.mjs --mode external
```

The downloaded driver must match the installed WebKitGTK libraries; the observed
Ubuntu package was `2.52.6-0ubuntu0.24.04.1` for ARM64. Other distributions can
provide explicit absolute `--tauri-driver` and `--native-driver` paths. The
harness also accepts `--binary` for a different build of this fixture only.

## Assertions and receipts

Both lanes use ordinary public controls and serial MCP calls:

- Inspect labelled, duplicate and disabled buttons without exposing form values.
- Click once and confirm exactly one activation.
- Wait for exact text and `aria-busy=false` while the DOM element is replaced;
  then observe the enabled control. An impossible predicate must fail promptly.
- Focus an off-screen button, verify focus and viewport presence, and prove no
  activation or input/value changes. Disabled/non-focusable targets must fail.
- Capture a nonempty native PNG with a per-call deadline.
- Close the owned session and verify that further UI reads fail.

Both lanes verify rejection of unsupported button fields, an empty event trace,
and zero primary/context-menu/auxiliary activations. The embedded lane also
reconnects to the same live process with a new session ID and preserved
transient state.

Two explicit diagnostic options are retained for future backend work, only in
external mode. `--probe-native-buttons true` requires a future MCP candidate
that advertises non-primary buttons: it strictly tests right `contextmenu`,
middle `auxclick`, trusted events and no primary activation. It fails against
the current selector-only API. `--diagnose-release true` sends one fixed native
right-button sequence to this synthetic fixture and compares the event trace
before and after input cleanup. This diagnostic intentionally exits nonzero
and never claims MCP mouse acceptance. Neither option fabricates DOM events.

Each run creates a fresh private directory under the operating-system temp
directory with isolated XDG config/data/cache/runtime paths, process logs, PNG
and `receipt.json`. The receipt includes exact invocation, source HEADs and
content hashes (including dirty candidate files, excluding fixture Markdown),
binary/lockfile/compiled-module hashes,
platform/provider, owned PIDs, calls, assertions, session IDs and cleanup
results. A failed assertion produces a failed receipt and nonzero exit.

The launcher starts its own Xvfb display using `-displayfd`, chooses ephemeral
loopback ports, and owns only the process groups it starts. MCP session cleanup
comes before launcher process teardown. No existing app, desktop display or
driver is reused. Temporary evidence is retained for inspection; remove only
the exact run directory after review. No process restart/persistence, native
picker, clipboard, OS-shortcut, visual-quality, macOS/Windows or product-level
acceptance is implied by a passing fixture run.

No package wiring is required: invoke the script directly. An optional future
`test:native` npm script can point to `node scripts/native-acceptance.mjs`; keep
this opt-in lane separate from portable unit tests and the package contents.
