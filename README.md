# MCP Tauri Automation

> **Automate Tauri desktop apps with AI.** An MCP server that lets Claude Code test, debug, and interact with your Tauri applications through natural language.

## What is this?

Testing Tauri apps usually means:
- ❌ Manually clicking through UIs for every change
- ❌ Writing complex test scripts for simple interactions
- ❌ Taking screenshots manually to debug visual issues
- ❌ Switching between code editor and running app constantly

With this MCP server:
- ✅ Ask Claude to "click the submit button and check the result"
- ✅ Get instant screenshots of your app state
- ✅ Test UI flows through natural language
- ✅ Automate repetitive testing while you code

## Quick Start

**1. Install tauri-driver**
```bash
cargo install tauri-driver
```

**2. Install this MCP server**
```bash
git clone <repo-url>
cd mcp-tauri-automation
npm install && npm run build
```

**3. Add to your MCP config**

<details>
<summary><b>Claude Code (Recommended)</b></summary>

Use the Claude Code CLI to register the server:

```bash
# Simplest setup - works with any Tauri app
# (you'll specify which app to launch when you ask Claude)
claude mcp add --transport stdio tauri-automation \
  --scope user \
  -- node /absolute/path/to/mcp-tauri-automation/dist/index.js
```

Replace `/absolute/path/to/mcp-tauri-automation` with the actual path where you cloned this repo. For example:
- Linux/macOS: `~/projects/mcp-tauri-automation/dist/index.js`
- Windows: `C:/Users/YourName/projects/mcp-tauri-automation/dist/index.js`

**Optional: Set a default app path**

If you mainly work with one Tauri app, you can set it as the default:

```bash
claude mcp add --transport stdio tauri-automation \
  --env TAURI_APP_PATH=/path/to/your-app/src-tauri/target/debug/your-app \
  --scope user \
  -- node /absolute/path/to/mcp-tauri-automation/dist/index.js
```

> **💡 Can I test multiple apps?** Yes! The `TAURI_APP_PATH` is just a convenience default. You can still launch any other Tauri app by specifying its path when you ask Claude (e.g., "Launch my calculator app at ~/projects/calculator-app/target/debug/calculator").

**Advanced: Customize defaults**

```bash
claude mcp add --transport stdio tauri-automation \
  --env TAURI_SCREENSHOT_DIR=./my-screenshots \
  --env TAURI_DEFAULT_TIMEOUT=10000 \
  --scope user \
  -- node /absolute/path/to/mcp-tauri-automation/dist/index.js
```

All environment variables have sensible defaults and are optional:
- `TAURI_APP_PATH`: No default (specify when launching, or set here for convenience)
- `TAURI_SCREENSHOT_DIR`: `./screenshots` (relative to where you run Claude Code)
- `TAURI_WEBDRIVER_PORT`: `4444` (where tauri-driver listens)
- `TAURI_DEFAULT_TIMEOUT`: `5000` ms (how long to wait for UI elements)

**Managing servers:**
```bash
# List all configured servers
claude mcp list

# Get details for a specific server
claude mcp get tauri-automation

# Remove a server
claude mcp remove tauri-automation

# Inside Claude Code, check server status
/mcp
```

**Alternative: JSON format**

<details>
<summary>Click to see JSON configuration format</summary>

```bash
claude mcp add-json tauri-automation '{
  "type": "stdio",
  "command": "node",
  "args": ["/absolute/path/to/mcp-tauri-automation/dist/index.js"],
  "env": {
    "TAURI_APP_PATH": "/optional/default/app/path"
  }
}'
```

</details>

**Scope options:**
- `--scope user`: Available to you across all projects (recommended)
- `--scope local` (default): Available only to you in the current project
- `--scope project`: Shared with everyone in the project via `.mcp.json` file

</details>

<details>
<summary><b>Claude Desktop</b></summary>

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tauri-automation": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-tauri-automation/dist/index.js"]
    }
  }
}
```

**Optional: Add environment variables**

```json
{
  "mcpServers": {
    "tauri-automation": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-tauri-automation/dist/index.js"],
      "env": {
        "TAURI_APP_PATH": "/path/to/your/default/app"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Claude Code (Manual Config)</b></summary>

Edit `~/.config/claude-code/mcp_config.json`:

```json
{
  "mcpServers": {
    "tauri-automation": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-tauri-automation/dist/index.js"]
    }
  }
}
```

**Optional: Add environment variables**

```json
{
  "mcpServers": {
    "tauri-automation": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-tauri-automation/dist/index.js"],
      "env": {
        "TAURI_APP_PATH": "/path/to/your/default/app"
      }
    }
  }
}
```

**Note**: Using the `claude mcp add` command (see "Claude Code (Recommended)" above) is easier and less error-prone than manual editing.

</details>

<details>
<summary><b>Other MCP Clients</b></summary>

Any MCP client that supports stdio transport can use this server. Pass the environment variables via the client's configuration mechanism.

</details>

**4. Start tauri-driver**

Before using the MCP server, start `tauri-driver` in a separate terminal:

```bash
# In a separate terminal, keep this running
tauri-driver
```

> **Why is tauri-driver separate?**
>
> `tauri-driver` is a standalone WebDriver server that controls Tauri apps. Keeping it separate means:
> - ✅ You can restart your MCP server without losing app state
> - ✅ Multiple tools can connect to the same driver instance
> - ✅ It runs on a known port (4444) that's easy to configure
>
> **Future improvement**: This MCP server could be enhanced to auto-start tauri-driver if it's not running. Interested in contributing? See [Contributing](#development) below!

**5. Use with Claude**
```
Launch my Tauri app, click the "Start" button, and take a screenshot
```

Or if you didn't set a default app path:
```
Launch my calculator app at ~/projects/calculator/target/debug/calculator and test addition
```

## Available Tools

| Tool | Description |
|------|-------------|
| `launch_app` | Launch your Tauri application |
| `close_app` | Close the running application |
| `capture_screenshot` | Take a screenshot (returns base64 PNG) |
| `click_element` | Click UI elements by CSS selector |
| `type_text` | Type into input fields |
| `wait_for_element` | Wait for elements to appear |
| `get_element_text` | Read text from elements |
| `execute_tauri_command` | Call your Tauri IPC commands |
| `get_app_state` | Check if app is running and get session info |

## Configuration

**All environment variables are optional** with sensible defaults:

| Variable | Description | Default | When to set |
|----------|-------------|---------|-------------|
| `TAURI_APP_PATH` | Path to your Tauri app binary | None | Set if you mainly work with one app (but you can still launch others) |
| `TAURI_SCREENSHOT_DIR` | Where to save screenshots | `./screenshots` | Change if you want screenshots in a different location |
| `TAURI_WEBDRIVER_PORT` | Port where tauri-driver runs | `4444` | Only if you're running tauri-driver on a custom port |
| `TAURI_DEFAULT_TIMEOUT` | Element wait timeout in ms | `5000` | Increase for slow-loading apps, decrease for faster feedback |
| `TAURI_DRIVER_PATH` | Path to tauri-driver binary | `tauri-driver` | Only if tauri-driver isn't in your PATH |

### Finding Your Tauri App Binary

After building your Tauri app, the binary is located at:

- **Development build**: `your-tauri-project/src-tauri/target/debug/your-app-name`
- **Release build**: `your-tauri-project/src-tauri/target/release/your-app-name`
- **macOS apps**: Add `.app` extension (e.g., `your-app-name.app`)
- **Windows apps**: Add `.exe` extension

Build your app first:
```bash
cd your-tauri-project
cargo build  # or: cargo build --release
```

## Usage Examples

### Basic Testing Workflow

```
You: Launch my calculator app and test the addition feature

Claude will:
1. Launch the app using launch_app
2. Wait for the UI to load with wait_for_element
3. Click buttons and type numbers
4. Capture screenshots to verify results
5. Report back with findings
```

### Debugging UI Issues

```
You: Take a screenshot of my app's settings page

Claude will:
1. Check if app is running (or launch it)
2. Navigate to settings (if needed)
3. Capture and display the screenshot
```

### Testing Tauri Commands

```
You: Call the save_preferences command with theme='dark' and verify it worked

Claude will:
1. Use execute_tauri_command to call your Rust backend
2. Verify the response
3. Optionally check the UI updated correctly
```

## Architecture

```
┌─────────────────┐
│   Claude Code   │  Ask in natural language
└────────┬────────┘
         │ MCP Protocol (stdio)
┌────────▼────────────────┐
│  MCP Tauri Automation   │  Translate to automation commands
│       Server            │
└────────┬────────────────┘
         │ WebDriver Protocol
┌────────▼────────┐
│   tauri-driver  │  Control the application
└────────┬────────┘
         │
┌────────▼────────┐
│   Your Tauri    │  Desktop app being tested
│      App        │
└─────────────────┘
```

## Troubleshooting

### "Failed to launch application: connect ECONNREFUSED"

**Solution**: Make sure `tauri-driver` is running before using the MCP server.

```bash
# In a separate terminal
tauri-driver
```

### "Element not found: #my-button"

**Solutions**:
1. Use `wait_for_element` first for dynamically loaded content
2. Verify the selector in your browser DevTools (Tauri apps use web technologies)
3. Increase timeout for slow-loading UIs

### "Application path not found"

**Solutions**:
1. Build your Tauri app first: `cargo build`
2. Use absolute path to the binary
3. Make sure the binary is executable: `chmod +x /path/to/app`
4. On macOS, use the `.app` bundle path

### Port conflicts (Port 4444 already in use)

**Solution**: Use a custom port:

```bash
# Start tauri-driver on different port
tauri-driver --port 4445
```

Then update your MCP config:
```json
{
  "env": {
    "TAURI_WEBDRIVER_PORT": "4445"
  }
}
```

### Screenshots not appearing

**Solutions**:
1. Ensure the app is actually running: ask Claude to check with `get_app_state`
2. Check that the screenshots directory exists and is writable
3. For base64 screenshots (default), ensure your MCP client supports image display

## How It Works

This server uses the WebDriver protocol to control Tauri applications. Here's what happens:

1. **tauri-driver** acts as a WebDriver server for Tauri apps
2. **This MCP server** translates Claude's requests into WebDriver commands
3. **WebDriverIO** handles the low-level WebDriver communication
4. **Your Tauri app** responds to automation commands

The server maintains a single active session and ensures proper cleanup when closing apps or on shutdown.

## Advanced Usage

### Calling Custom Tauri Commands

First, expose commands in your `src-tauri/src/main.rs`:

```rust
#[tauri::command]
fn get_user_data(user_id: i32) -> Result<String, String> {
    Ok(format!("User {}", user_id))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_user_data])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Then ask Claude:
```
Execute the get_user_data command with user_id 123
```

### Multiple Test Runs

The server can launch and close apps multiple times in a session:

```
Launch the app, test feature A, close it.
Launch again, test feature B, close it.
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run watch

# Project structure
src/
├── index.ts          # MCP server entry point
├── tauri-driver.ts   # WebDriver wrapper
├── types.ts          # TypeScript types
└── tools/
    ├── launch.ts     # App lifecycle
    ├── screenshot.ts # Screenshot capture
    ├── interact.ts   # UI interaction
    └── state.ts      # State & IPC commands
```

## Requirements

- **Node.js** 18+
- **Rust/Cargo** (for tauri-driver)
- **tauri-driver** installed and running
- A **built Tauri application** to test

## License

MIT

## Acknowledgments

- Built with [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk)
- Powered by [WebDriverIO](https://webdriver.io/)
- Made for [Tauri](https://tauri.app/) applications
