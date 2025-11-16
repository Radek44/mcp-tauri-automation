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

## 🎯 Try the Demo!

We've built a complete **Recipe Book demo app** to showcase all features. Get started in 5 minutes:

```bash
# Quick setup
cd test-harness/scripts
./setup.sh

# Start services
tauri-driver                    # Terminal 1
cd demo-app && npm run tauri dev  # Terminal 2

# Try interactive scenarios
open test-harness/scenarios/01-getting-started.md
```

**👉 See [demo-app/README.md](demo-app/README.md) for full details.**

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
<summary><b>Claude Desktop</b></summary>

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tauri-automation": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-tauri-automation/dist/index.js"],
      "env": {
        "TAURI_APP_PATH": "/path/to/your/tauri/app/target/debug/your-app"
      }
    }
  }
}
```
</details>

<details>
<summary><b>Claude Code CLI</b></summary>

Edit `~/.config/claude-code/mcp_config.json`:

```json
{
  "mcpServers": {
    "tauri-automation": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-tauri-automation/dist/index.js"],
      "env": {
        "TAURI_APP_PATH": "/path/to/your/tauri/app/target/debug/your-app"
      }
    }
  }
}
```
</details>

<details>
<summary><b>Other MCP Clients</b></summary>

Any MCP client that supports stdio transport can use this server. Pass the environment variables via the client's configuration mechanism.

</details>

**4. Start tauri-driver**
```bash
# In a separate terminal, keep this running
tauri-driver
```

**5. Use with Claude**
```
Launch my Tauri app, click the "Start" button, and take a screenshot
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

Configure the server using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `TAURI_APP_PATH` | Path to your Tauri app binary | None (required in tool call or env) |
| `TAURI_SCREENSHOT_DIR` | Where to save screenshots | `./screenshots` |
| `TAURI_WEBDRIVER_PORT` | Port where tauri-driver runs | `4444` |
| `TAURI_DEFAULT_TIMEOUT` | Element wait timeout in ms | `5000` |
| `TAURI_DRIVER_PATH` | Path to tauri-driver binary | `tauri-driver` |

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

## 📦 Demo App & Test Harness

This project includes a complete testing framework:

### Recipe Book Demo App
A fully-featured Tauri application showcasing automation capabilities:
- 🍳 6 sample recipes with search, filtering, and favorites
- 🎨 Beautiful UI with Tailwind CSS and Framer Motion
- ⚙️ Comprehensive Tauri commands (CRUD, filters, async operations)
- 🧪 Test-friendly with data-testid on all elements

**[📖 Demo App Documentation →](demo-app/README.md)**

### Test Harness
A complete testing suite with:
- 📝 **7 Interactive Scenarios** - Step-by-step guides for testing different features
- ⚙️ **Configuration Templates** - Ready-to-use configs for Claude Code/Desktop
- 🔧 **Setup Scripts** - Automated environment setup and verification
- 🤖 **Automated Tests** - E2E tests for CI/CD integration

**[📖 Test Harness Documentation →](test-harness/README.md)**

### Quick Links
- [Getting Started Scenario](test-harness/scenarios/01-getting-started.md)
- [UI Automation Scenario](test-harness/scenarios/02-ui-automation.md)
- [Tauri Commands Scenario](test-harness/scenarios/05-tauri-commands.md)
- [Setup Script](test-harness/scripts/setup.sh)
- [Verification Script](test-harness/scripts/verify.sh)

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
│      App        │  (or our Recipe Book demo!)
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
