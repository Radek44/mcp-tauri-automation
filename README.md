# MCP Tauri Automation

A small local MCP server for testing Tauri desktop apps. Connect to a test app,
inspect a bounded UI snapshot, click/type/wait, and capture a screenshot.

**2.0.0-rc.1** requires Node.js 22 or newer. It supports an already running
embedded WebDriver server (including macOS) and the external tauri-driver flow.
This is a release candidate; see [CHANGELOG.md](CHANGELOG.md) for compatibility
changes and the distinction between automated protocol tests and native proof.
The embedded flow passed a native macOS arm64 smoke on September 7, 2026,
including click/type, screenshot capture, and session reconnection. Linux and
Windows native acceptance remains unverified; see the
[validation receipt](https://github.com/Radek44/mcp-tauri-automation/blob/main/docs/validation/2.0.0-rc.1-macos.md).

## Install

From source:

~~~bash
git clone https://github.com/Radek44/mcp-tauri-automation.git
cd mcp-tauri-automation
npm ci
npm test
~~~

The server uses stdio. Start it with Node and an absolute path:

~~~bash
node /absolute/path/to/mcp-tauri-automation/dist/index.js
~~~

Register with Codex ([official configuration guide](https://learn.chatgpt.com/docs/extend/mcp)):

~~~bash
codex mcp add tauri-automation -- node /absolute/path/to/mcp-tauri-automation/dist/index.js
~~~

Or Claude Code:

~~~bash
claude mcp add --transport stdio tauri-automation --scope user -- node /absolute/path/to/mcp-tauri-automation/dist/index.js
~~~

Any stdio MCP client can use the same command and arguments. No provider API key
or additional model service is needed. Restart/reconnect the MCP client after
changing its configuration.

## Connect a test app

### Embedded WebDriver — macOS, Linux, Windows

Build your app with the optional tauri-plugin-wdio-webdriver test plugin.
Launch that build yourself with a dedicated port and isolated test data:

~~~bash
TAURI_WEBDRIVER_PORT=4445 WDIO_EMBEDDED_SERVER=true /absolute/path/to/test-app
~~~

Then call connect_app with {"port":4445}. It creates a new session on
127.0.0.1; it does not discover apps, take over an existing session, or launch
a process. close_app deletes that session; your externally launched app remains
running. The launcher remains responsible for stopping the exact process.

The WebDriver plugin belongs in test builds, and visible UI tests need an
unlocked desktop. See the [Tauri WebDriver guide](https://v2.tauri.app/develop/tests/webdriver/)
and [plugin setup](https://webdriver.io/docs/desktop-testing/tauri/plugin-setup/).

### External tauri-driver — Linux and Windows

Install and run the platform driver as described in
[Tauri's manual setup](https://v2.tauri.app/develop/tests/webdriver/manual/).
Then call launch_app with {"appPath":"/absolute/path/to/app"}.
The driver owns launching the app; deleting its session requests teardown.
Native process behavior ultimately belongs to that driver.

## Tools

| Tool | Inputs / behavior |
| --- | --- |
| connect_app | Optional port; create a session on a running embedded server. |
| launch_app | Optional appPath, args, env; use TAURI_APP_PATH when path is omitted. |
| close_app | Delete the owned session. |
| get_app_state | Session metadata and a live title/location probe; reports failed health checks. |
| inspect_ui | Optional CSS selector, limit (1–100, default 20), maxTextLength (0–1000, default 160). |
| click_element | CSS selector; standard WebDriver click. |
| type_text | selector, text, optional clear (false appends, true clears then types). |
| wait_for_element | selector, optional timeout and state: attached (default), visible, or hidden. |
| get_element_text | CSS selector; maximum 12,000 characters, otherwise use a narrower selector. |
| capture_screenshot | Native MCP PNG by default; returnBase64:false saves a local file. Optional basename filename. |
| execute_tauri_command | Compatibility/debug tool: command, optional args; requires an enabled global Tauri invoke bridge. |

inspect_ui returns bounded text, role/name hints, enabled/visible state,
viewport intersection, rectangles, and own/effective opacity. Truncation flags
disclose omitted results. It does not return HTML, input values, application
stores, or an accessibility-tree conformance claim. A screenshot is still
needed for visual judgment; geometry does not prove appearance or interaction.

Start with inspect_ui, narrow the selector if necessary, perform the action,
then use wait_for_element or a targeted read to confirm the result.
Capture images when they answer a visual question. This reduces repetitive
diagnostic calls and large DOM dumps; no measured model-token saving is claimed.

All calls execute in order. Action requests are never automatically retried.
If an action times out, it may already have happened: inspect before retrying.
If session creation has an unknown outcome, restart the isolated app/driver
and this MCP server before creating another session. A failed session deletion
retains ownership so close_app can retry cleanup.

## Configuration

All variables are optional. Invalid numeric configuration fails startup.

| Variable | Default |
| --- | --- |
| TAURI_APP_PATH | No default |
| TAURI_WEBDRIVER_PORT | 4444; connect_app.port overrides it |
| TAURI_DEFAULT_TIMEOUT | 5000 ms, range 1–60,000; per WebDriver request |
| TAURI_SCREENSHOT_DIR | ./screenshots, resolved when the MCP process starts |

Only 127.0.0.1 is used; redirects are rejected. Responses are capped at 1 MiB,
or 16 MiB for screenshot JSON. Screenshot filenames cannot include directories;
existing files are never overwritten. TAURI_DRIVER_PATH was never used to
spawn a driver and remains unnecessary.

UI text, names, titles, and images can contain user content. Use disposable test
data and expose only the tools appropriate to the task. Page locations omit
credentials, query strings, and fragments; this is not a general secret scanner.

For Saga/Vuea, use this server for native UI evidence with a test-owned data
directory. Use SagaDoc's own validated MCP tools for document authoring and its
normal review controls for human decisions. Exclude execute_tauri_command
from that automation profile; it must not become a shortcut around the
document service or human Finish Session boundary.
See [the local example](examples/codex.toml) and [Saga smoke recipe](examples/saga.md).

## Development

~~~bash
npm ci
npm run verify
~~~

The gate builds TypeScript, runs Node's test runner against local fake WebDriver
servers and real MCP transports, audits runtime dependencies, and checks the
package contents. It does not require a desktop session. Native testing is
separate and must identify the app build, isolated data, platform, and results.

The runtime uses Node fetch for the narrow W3C command set; it does not download
browsers or require WebdriverIO. Diagnostics go to stderr; stdout carries MCP.
The package contains the compiled runtime, docs/examples, and native probe.

MIT license. Contributions welcome; keep additions tied to a demonstrated
workflow and include a deterministic failure/success oracle.
