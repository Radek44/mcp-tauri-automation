# Changelog

## 2.0.0-rc.2

- Add unique-target focus and focused state in bounded inspection.
- Add bounded public-text, enabled, and explicit aria-busy wait predicates with
  fresh element lookup and one shared deadline.
- Adapt the per-call screenshot timeout proposed by Daniel in [#7](https://github.com/Radek44/mcp-tauri-automation/pull/7)
  to the abortable direct-WebDriver transport; omission keeps the configured
  default and invalid deadlines fail before dispatch.
- Preserve arrival order across asynchronous MCP validation, skip cancelled
  queued work, and drain active work before owned-session cleanup.
- Update fast-uri and ip-address lockfile resolutions for reported advisories.
- Add an isolated native fixture and embedded/external Linux acceptance harness.
  Right/middle clicks from #9 remain deferred after native WebKit emitted an
  unintended primary click. Button fields are rejected before driver dispatch.
- Keep arbitrary scripts, XPath and navigation-change waits outside this scope.
  Existing contributor discussions document the decisions and remaining work.

### Native validation — October 5, 2026

Linux ARM64 acceptance passed against the final rc.2 runtime: 10 embedded and
9 external assertions covering real focus, state predicates, screenshot deadlines,
session cleanup and rejected button overrides without input. Embedded reconnect
preserved same-process state. Exact source, binary and compiled-module hashes
are in the [embedded receipt](docs/validation/2.0.0-rc.2-linux-embedded.json) and
[external receipt](docs/validation/2.0.0-rc.2-linux-external.json).
This synthetic fixture does not establish product acceptance or macOS/Windows
support for the new capabilities.

## 2.0.0-rc.1

Release candidate for a smaller local Tauri automation server. Contract review
approved retaining the nine existing tools and adding only `connect_app` and
`inspect_ui`. Node.js 22+ makes this a major version.

- Connect to an already running embedded WebDriver test app, including macOS.
  The MCP server owns its session; the launcher owns the external process.
- Bounded UI diagnostics report text/name hints, visibility, effective opacity,
  enabled state, viewport intersection, and rectangles in one call.
- Replace WebdriverIO with the W3C commands actually used, through Node fetch.
  Dependency inventory falls from 326 to 98 installed packages. Updated runtime
  dependencies have zero npm-audit findings at preparation time.
- Validate actual MCP inputs, mark tool failures as errors, preserve the result
  envelope, and send images as native MCP content without base64 text copies.
- Serialize tool calls, clean up on SIGTERM/EOF, never replay action requests,
  cap responses, reject redirects, and retain failed cleanup ownership.
- Fix default app-path selection, append-versus-clear typing, screenshot path
  traversal/overwrites, silent failed state probes, and Tauri 2 invocation.
- Add protocol/lifecycle tests, CI on Node 22/24, and a repeatable native probe.

### Native validation — September 7, 2026

The merged PR #11 runtime passed on macOS 26.6.2 arm64 with Node 24.18.0
against an isolated, current-source Saga/Vuea Tauri development build:

- Six-call native probe: connect, live state, bounded snapshot, PNG, close,
  and closed state.
- Nineteen-call interaction flow: visible first-run UI, dialog click, clear
  and append typing, template creation, rendered title/revision assertions,
  bounded snapshot without form values, PNG, session deletion, and reconnect.
- Screenshot review confirmed a populated document and no conspicuous
  clipping at the tested window size.
- Closing a session left the caller-owned app alive; the test launcher then
  stopped its exact process and confirmed the loopback listener was gone.

An initial test-harness assertion selected the draft-status label instead of
the revision control. It failed and was preserved; correcting that selector
and repeating against fresh test data passed without a runtime code change.
See the [sanitized validation receipt](https://github.com/Radek44/mcp-tauri-automation/blob/main/docs/validation/2.0.0-rc.1-macos.md).
This is development-tool evidence, not Saga milestone acceptance, an app-restart
persistence test, or Linux/Windows native certification.

### Migration and limits

- Upgrade Node 18/20 clients to Node 22 or later.
- Selectors are CSS, as the existing tools documented. Undocumented
  WebdriverIO selector shortcuts and arbitrary script execution are not exposed.
- `type_text` now honors its documented `clear:false` append behavior.
- Long element text (>12,000 characters) and IPC output (>16,000 characters)
  return actionable errors. Use narrower selectors; an IPC operation with an
  oversized result has already completed and must not be repeated blindly.
- Page URLs omit userinfo, query strings, and fragments. Screenshots accept only
  basenames and no longer overwrite existing files.
- WebDriver requests time out (default 5 seconds). Lost session-creation responses
  require restarting the isolated app/driver and MCP server, since ownership
  cannot be recovered without the session ID.
- The repository gate tests MCP/W3C behavior against synthetic local endpoints.
  Native macOS, Linux, and Windows acceptance are separate and are not implied
  by those tests. This candidate does not claim stable cross-platform support.

### Existing community proposals

Reviewed PRs #5–#9 when preparing this candidate. No contributor PR is silently
merged or closed by this refactor. Several contain overlapping feature stacks.

- #5: title/location already belong in `get_app_state`; fixed diagnostics cover
  the immediate inspection use case. Arbitrary JavaScript is deferred.
- #6: richer selectors remain a useful follow-up when a concrete interaction
  needs them, with equivalent tests for both drivers.
- #7: every request now has a deadline; a screenshot-specific override can be
  reconsidered with native evidence.
- #8: waiting for the resulting visible UI is currently sufficient; a separate
  navigation tool is deferred until demonstrated necessary.
- #9: right/middle click is useful and remains a candidate for a separately
  verified W3C Actions increment with contributor attribution preserved.
