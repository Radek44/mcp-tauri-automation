# Test Harness Overview

This test harness provides a comprehensive testing framework for the MCP Tauri Automation project, including the Recipe Book demo application.

## Directory Structure

```
test-harness/
├── configs/                    # MCP configuration templates
│   ├── claude-code/           # Claude Code (CLI) configs
│   ├── claude-desktop/        # Claude Desktop app configs
│   └── cursor/                # Cursor editor configs (future)
├── scenarios/                  # Interactive test scenarios
│   ├── 01-getting-started.md
│   ├── 02-ui-automation.md
│   ├── 03-form-workflows.md
│   └── ...
├── scripts/                    # Helper scripts
│   ├── setup.sh              # One-command setup
│   ├── verify.sh             # Verify installation
│   └── demo-runner.sh        # Run demo + MCP server
└── automated-tests/           # Automated E2E tests
    ├── connection.test.js
    ├── tools.test.js
    └── scenarios.test.js
```

## Quick Start

### 1. Setup Everything

Run the setup script to configure your environment:

```bash
cd test-harness/scripts
./setup.sh
```

This will:
- Build the MCP server
- Install dependencies for the demo app
- Create MCP configuration files
- Verify tauri-driver installation

### 2. Start Services

Open three terminal windows:

**Terminal 1 - Start tauri-driver:**
```bash
tauri-driver
```

**Terminal 2 - Start demo app:**
```bash
cd demo-app
npm run tauri dev
```

**Terminal 3 - Run tests:**
```bash
cd test-harness/scripts
./verify.sh
```

### 3. Use with Claude

Once setup is complete, you can interact with Claude (Code or Desktop) to automate the Recipe Book app!

## Test Scenarios

Interactive test scenarios are in the `scenarios/` directory:

1. **[Getting Started](scenarios/01-getting-started.md)** - Basic MCP tool usage
2. **[UI Automation](scenarios/02-ui-automation.md)** - Finding and interacting with elements
3. **[Form Workflows](scenarios/03-form-workflows.md)** - Form filling and submission
4. **[Async Operations](scenarios/04-async-operations.md)** - Loading states and async data
5. **[Tauri Commands](scenarios/05-tauri-commands.md)** - Invoking backend commands
6. **[Error Handling](scenarios/06-error-handling.md)** - Testing error scenarios
7. **[Complex Workflows](scenarios/07-complex-workflows.md)** - Multi-step automation

## Agent Configurations

### Supported Agents

- ✅ **Claude Code** - Full support
- ✅ **Claude Desktop** - Full support
- 🚧 **Cursor** - Planned
- 🚧 **Cline** - Planned
- 🚧 **Continue.dev** - Planned

### Configuration Guide

Each agent has specific configuration requirements:

- **[Claude Code Setup](configs/claude-code/README.md)**
- **[Claude Desktop Setup](configs/claude-desktop/README.md)**
- **Cursor Setup** (coming soon)

## Automated Testing

Run automated tests to verify everything works:

```bash
cd test-harness/automated-tests
npm install
npm test
```

Test suites:
- `connection.test.js` - MCP server connectivity
- `tools.test.js` - Individual MCP tool functionality
- `scenarios.test.js` - End-to-end scenario tests

## Scripts

Utility scripts in the `scripts/` directory:

### setup.sh
One-command setup for the entire test harness
```bash
./scripts/setup.sh
```

### verify.sh
Verify your installation is working
```bash
./scripts/verify.sh
```

### demo-runner.sh
Start demo app and tauri-driver together
```bash
./scripts/demo-runner.sh
```

## Demo App Features

The Recipe Book demo showcases:

✅ **Search & Filtering** - Find recipes by title, category, tags
✅ **Dynamic Content** - Recipe cards with images and metadata
✅ **Navigation** - Multi-page app with routing
✅ **Forms** - Add/edit recipes (placeholder)
✅ **Tauri Commands** - Backend integration
✅ **Async Operations** - Loading states and simulated delays
✅ **Error Handling** - Intentional error triggers
✅ **Favorites** - Toggle favorite recipes
✅ **Responsive UI** - Tailwind CSS with animations

## MCP Tools Coverage

All tools from the MCP server are testable:

| Tool | Tested In | Scenario |
|------|-----------|----------|
| `get_element` | Scenario 2 | Find single element |
| `get_elements` | Scenario 2 | Find multiple elements |
| `click_element` | Scenario 2 | Click buttons/links |
| `input_text` | Scenario 3 | Fill form fields |
| `execute_script` | Scenario 2 | Run custom JavaScript |
| `take_screenshot` | Scenario 1 | Capture app state |
| `invoke_tauri_command` | Scenario 5 | Call backend functions |

## Platform Support

### macOS (Primary Target)
- ✅ Full support
- ✅ Native Tauri builds
- ✅ All features tested

### Linux
- ⚠️ Partial support
- ⚠️ Requires GTK dependencies
- ✅ MCP server works

### Windows
- 🚧 Planned
- 🚧 Tauri support available
- 🚧 Testing needed

## CI/CD Integration

GitHub Actions workflow for automated testing:

```yaml
name: Test Harness
on: [push, pull_request]
jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - run: cd test-harness/scripts && ./setup.sh
      - run: cd test-harness/automated-tests && npm test
```

## Troubleshooting

Common issues and solutions:

### Can't connect to tauri-driver
- Ensure `tauri-driver` is running on port 4444
- Check firewall settings
- Try `lsof -i :4444` to see if port is in use

### Demo app won't start
- Install Tauri prerequisites: https://tauri.app/start/prerequisites/
- Run `npm install` in demo-app directory
- Check for error messages in console

### MCP tools not working
- Verify MCP config path is absolute
- Restart Claude after changing config
- Check that demo app window is visible and in focus

### Elements not found
- Ensure demo app is fully loaded
- Use `get_elements` to list available elements
- Check data-testid attributes in source code
- Try CSS selectors if test IDs fail

## Contributing

To add new test scenarios:

1. Create a new markdown file in `scenarios/`
2. Follow the existing scenario format
3. Include:
   - Clear objective
   - Prerequisites
   - Step-by-step instructions
   - Expected results
   - Troubleshooting tips

## Next Steps

1. ✅ Review [configuration guides](configs/)
2. 🧪 Try [interactive scenarios](scenarios/)
3. 🤖 Run [automated tests](automated-tests/)
4. 📖 Read the [main documentation](../README.md)

## Support

- 📚 [Main README](../README.md)
- 🐛 [GitHub Issues](https://github.com/yourusername/mcp-tauri-automation/issues)
- 💬 Discussion Forum (coming soon)
