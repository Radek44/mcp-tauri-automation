# MCP Tauri Automation

An MCP (Model Context Protocol) server that enables AI coding agents like Claude Code to automate and interact with Tauri desktop applications. This server provides tools for launching apps, capturing screenshots, interacting with UI elements, and executing Tauri IPC commands.

## Features

- **Application Lifecycle**: Launch and close Tauri applications programmatically
- **UI Interaction**: Click elements, type text, and interact with the interface via CSS selectors
- **Visual Feedback**: Capture screenshots with automatic base64 encoding for MCP clients
- **State Management**: Query application state and wait for async UI updates
- **IPC Integration**: Execute Tauri commands directly from AI agents
- **Robust Error Handling**: Clear error messages and graceful cleanup

## Table of Contents

- [Installation](#installation)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Usage with Claude Code](#usage-with-claude-code)
- [Available Tools](#available-tools)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)
- [Examples](#examples)

## Installation

```bash
# Clone or download this repository
cd mcp-tauri-automation

# Install dependencies
npm install

# Build the project
npm run build
```

## Prerequisites

### 1. Install tauri-driver

The `tauri-driver` is required to automate Tauri applications via WebDriver protocol.

**Using Cargo (recommended):**
```bash
cargo install tauri-driver
```

**Or download from releases:**
Visit [tauri-driver releases](https://github.com/tauri-apps/tauri/releases) and download the appropriate binary for your platform.

### 2. Start tauri-driver

Before using this MCP server, you need to run tauri-driver:

```bash
# Default port 4444
tauri-driver

# Or specify a custom port
tauri-driver --port 4445
```

Keep this running in a separate terminal while using the MCP server.

### 3. Prepare Your Tauri Application

Your Tauri app must be built for testing. For development:

```bash
cd your-tauri-app
cargo build  # Or cargo build --release
```

The binary will be located at:
- **Development**: `src-tauri/target/debug/your-app-name`
- **Release**: `src-tauri/target/release/your-app-name`
- **macOS**: Add `.app` extension (e.g., `your-app-name.app`)

## Configuration

The MCP server can be configured via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `TAURI_APP_PATH` | Default path to Tauri application binary | None |
| `TAURI_SCREENSHOT_DIR` | Directory to save screenshots | `./screenshots` |
| `TAURI_WEBDRIVER_PORT` | Port where tauri-driver is running | `4444` |
| `TAURI_DEFAULT_TIMEOUT` | Default timeout for element waits (ms) | `5000` |
| `TAURI_DRIVER_PATH` | Path to tauri-driver binary | `tauri-driver` |

### Example .env file:

```bash
TAURI_APP_PATH=/path/to/your/app/target/debug/your-app
TAURI_SCREENSHOT_DIR=/tmp/screenshots
TAURI_WEBDRIVER_PORT=4444
TAURI_DEFAULT_TIMEOUT=10000
```

## Usage with Claude Code

### 1. Configure MCP Server

Add this server to your Claude Code MCP configuration file:

**For Claude.app** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "tauri-automation": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-tauri-automation/dist/index.js"],
      "env": {
        "TAURI_APP_PATH": "/path/to/your/tauri/app/binary",
        "TAURI_WEBDRIVER_PORT": "4444"
      }
    }
  }
}
```

**For Claude Code CLI** (`~/.config/claude-code/mcp_config.json`):

```json
{
  "mcpServers": {
    "tauri-automation": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-tauri-automation/dist/index.js"],
      "env": {
        "TAURI_APP_PATH": "/path/to/your/tauri/app/binary"
      }
    }
  }
}
```

### 2. Start tauri-driver

```bash
tauri-driver
```

### 3. Use in Claude Code

Once configured, you can ask Claude Code to interact with your Tauri app:

```
Launch my Tauri app and click the "Start" button, then take a screenshot
```

```
Open the app, type "Hello World" into the search box, and check what results appear
```

## Available Tools

### launch_app

Launch a Tauri application via tauri-driver.

**Parameters:**
- `appPath` (string, required): Path to the Tauri application binary
- `args` (string[], optional): Command-line arguments to pass to the app
- `env` (object, optional): Environment variables to set

**Example:**
```json
{
  "appPath": "/path/to/app/target/debug/my-app",
  "args": ["--debug"],
  "env": { "LOG_LEVEL": "debug" }
}
```

### close_app

Close the currently running Tauri application gracefully.

**Parameters:** None

### capture_screenshot

Capture a screenshot of the application window.

**Parameters:**
- `filename` (string, optional): Filename without extension (will be saved as PNG)
- `returnBase64` (boolean, optional): Return base64 data (true) or save to file (false). Default: `true`

**Returns:** Base64-encoded PNG image data or file path

### click_element

Click a UI element identified by a CSS selector.

**Parameters:**
- `selector` (string, required): CSS selector (e.g., `"#button-id"`, `".button-class"`, `"button[name=submit]"`)

### type_text

Type text into an input field or editable element.

**Parameters:**
- `selector` (string, required): CSS selector for the input element
- `text` (string, required): Text to type
- `clear` (boolean, optional): Clear existing text first. Default: `false`

### wait_for_element

Wait for an element to appear in the DOM. Useful for handling async UI states.

**Parameters:**
- `selector` (string, required): CSS selector to wait for
- `timeout` (number, optional): Timeout in milliseconds. Default: `5000`

### get_element_text

Get the text content of an element.

**Parameters:**
- `selector` (string, required): CSS selector for the element

**Returns:** Text content of the element

### execute_tauri_command

Execute a Tauri IPC command. The command must be exposed in your Tauri app's `src-tauri/src/main.rs` file.

**Parameters:**
- `command` (string, required): Name of the Tauri command
- `args` (object, optional): Arguments to pass to the command

**Example:**
```json
{
  "command": "get_user_data",
  "args": { "userId": 123 }
}
```

### get_app_state

Get the current state of the application.

**Parameters:** None

**Returns:**
- `isRunning`: Whether the app is currently running
- `appPath`: Path to the running application
- `sessionId`: WebDriver session ID
- `pageTitle`: Current page title (if running)
- `pageUrl`: Current page URL (if running)

## Architecture

```
┌─────────────────┐
│   Claude Code   │
│   (MCP Client)  │
└────────┬────────┘
         │ MCP Protocol (stdio)
         │
┌────────▼────────────────┐
│  MCP Tauri Automation   │
│       Server            │
│  ┌──────────────────┐   │
│  │  Tool Handlers   │   │
│  ├──────────────────┤   │
│  │  TauriDriver     │   │
│  │   (Wrapper)      │   │
│  └─────────┬────────┘   │
└────────────┼────────────┘
             │ WebDriver Protocol
             │
┌────────────▼────────┐
│   tauri-driver      │
│  (WebDriver Server) │
└────────────┬────────┘
             │
┌────────────▼────────┐
│   Tauri App         │
│  (Desktop App)      │
└─────────────────────┘
```

### Components

1. **MCP Server** (`src/index.ts`): Main entry point, handles MCP protocol communication
2. **TauriDriver** (`src/tauri-driver.ts`): Wrapper around WebDriverIO for Tauri app automation
3. **Tool Implementations** (`src/tools/`): Individual tool handlers for each MCP tool
4. **Type Definitions** (`src/types.ts`): TypeScript interfaces and types

## Troubleshooting

### tauri-driver not starting

**Error:** `Failed to launch application: connect ECONNREFUSED`

**Solution:** Ensure tauri-driver is running before starting the MCP server:
```bash
tauri-driver
```

### Application not launching

**Error:** `Failed to launch application: application path not found`

**Solutions:**
1. Verify the app path is correct and the binary exists
2. Ensure the binary is executable: `chmod +x /path/to/app`
3. For macOS, use the `.app` bundle path
4. For development builds, use the debug binary: `target/debug/app-name`

### Element not found errors

**Error:** `Element not found: #my-button`

**Solutions:**
1. Use `wait_for_element` before interacting with dynamically loaded elements
2. Verify the selector using browser DevTools
3. Check if the element is in a shadow DOM (Tauri apps may use web components)
4. Increase timeout for slow-loading UIs

### Screenshots not working

**Error:** `Screenshot capture failed`

**Solutions:**
1. Ensure the screenshots directory exists and is writable
2. Check that the app is actually running (`get_app_state`)
3. Verify the WebDriver session is active

### Tauri commands not executing

**Error:** `Failed to execute Tauri command`

**Solutions:**
1. Verify the command is registered in `src-tauri/src/main.rs`:
   ```rust
   #[tauri::command]
   fn my_command(arg: String) -> String {
       format!("Received: {}", arg)
   }

   fn main() {
       tauri::Builder::default()
           .invoke_handler(tauri::generate_handler![my_command])
           .run(tauri::generate_context!())
           .expect("error while running tauri application");
   }
   ```
2. Ensure the command name matches exactly (case-sensitive)
3. Check that arguments match the expected types

### Port conflicts

**Error:** `Port 4444 already in use`

**Solution:** Use a different port:
```bash
# Start tauri-driver on custom port
tauri-driver --port 4445

# Update environment variable
TAURI_WEBDRIVER_PORT=4445
```

## Examples

### Basic Workflow

```typescript
// 1. Launch app
await launch_app({
  appPath: "/path/to/app/target/debug/my-app"
});

// 2. Wait for UI to load
await wait_for_element({
  selector: "#main-content",
  timeout: 10000
});

// 3. Interact with UI
await click_element({
  selector: "button.start-button"
});

await type_text({
  selector: "input[name='search']",
  text: "test query",
  clear: true
});

// 4. Capture state
const screenshot = await capture_screenshot({
  filename: "after-interaction"
});

const text = await get_element_text({
  selector: ".result-text"
});

// 5. Execute custom command
await execute_tauri_command({
  command: "save_data",
  args: { data: "test" }
});

// 6. Clean up
await close_app();
```

## Development

### Building

```bash
npm run build
```

### Watching for changes

```bash
npm run watch
```

### Project Structure

```
mcp-tauri-automation/
├── src/
│   ├── index.ts          # MCP server entry point
│   ├── tauri-driver.ts   # WebDriver wrapper
│   ├── types.ts          # TypeScript types
│   └── tools/
│       ├── launch.ts     # App lifecycle tools
│       ├── screenshot.ts # Screenshot capture
│       ├── interact.ts   # UI interaction tools
│       └── state.ts      # State management tools
├── dist/                 # Compiled JavaScript (generated)
├── screenshots/          # Screenshot output (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing

Contributions are welcome! Please ensure:
1. TypeScript compiles without errors (`npm run build`)
2. Code follows the existing style
3. Add tests for new features (when test framework is added)

## License

MIT

## Acknowledgments

- Built with [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk)
- Uses [WebDriverIO](https://webdriver.io/) for browser automation
- Designed for [Tauri](https://tauri.app/) applications
- Created for use with [Claude Code](https://claude.ai/)
