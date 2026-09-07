# Changelog

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
