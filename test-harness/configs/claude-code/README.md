# Claude Code Configuration Guide

This guide explains how to configure the MCP Tauri Automation server for use with Claude Code.

## Prerequisites

1. **Build the MCP Server**
   ```bash
   cd /path/to/mcp-tauri-automation
   npm install
   npm run build
   ```

2. **Build the Demo App**
   ```bash
   cd demo-app
   npm install
   # Note: Building the Tauri app requires platform-specific dependencies
   # On macOS: npm run tauri build
   ```

3. **Install tauri-driver**
   ```bash
   cargo install tauri-driver
   ```

## Configuration Steps

### 1. Create MCP Configuration

Copy the template and replace placeholders:

```bash
cp test-harness/configs/claude-code/mcp_config.json.template ~/.config/Claude/mcp_config.json
```

Edit `~/.config/Claude/mcp_config.json` and replace:
- `{{MCP_SERVER_PATH}}`: The absolute path to your `mcp-tauri-automation` directory
  - Example: `/Users/yourname/projects/mcp-tauri-automation`

**Final config should look like:**
```json
{
  "mcpServers": {
    "tauri-automation": {
      "command": "node",
      "args": [
        "/Users/yourname/projects/mcp-tauri-automation/dist/index.js"
      ],
      "env": {
        "TAURI_DRIVER_URL": "http://localhost:4444"
      }
    }
  }
}
```

### 2. Start tauri-driver

In a separate terminal, start the tauri-driver server:

```bash
tauri-driver
```

This will start the WebDriver server on `http://localhost:4444`.

**Keep this terminal running** while using the MCP server.

### 3. Start the Demo App

In another terminal, start the Recipe Book demo app:

```bash
cd demo-app
npm run tauri dev
```

The app should open in a new window.

### 4. Verify Configuration

Use the verification script to test your setup:

```bash
cd test-harness/scripts
./verify.sh
```

This will check:
- ✅ MCP server is built
- ✅ tauri-driver is running
- ✅ Demo app is accessible
- ✅ MCP tools are working

## Testing with Claude Code

Once configured, you can interact with Claude Code and ask it to:

- "Find all buttons in the Recipe Book app"
- "Click on the first recipe card"
- "Search for 'pizza' in the search bar"
- "Take a screenshot of the current page"
- "Get the recipe title from the detail page"

See the [scenarios directory](../../scenarios/) for comprehensive test scenarios.

## Troubleshooting

### tauri-driver connection errors

**Problem:** MCP server can't connect to tauri-driver

**Solution:**
1. Ensure tauri-driver is running: `ps aux | grep tauri-driver`
2. Check the port: `lsof -i :4444`
3. Restart tauri-driver if needed

### Demo app not launching

**Problem:** `npm run tauri dev` fails

**Solution:**
1. Install platform prerequisites: https://tauri.app/start/prerequisites/
2. Run `npm install` in demo-app directory
3. Check error messages for missing dependencies

### MCP server not found

**Problem:** Claude Code can't find the MCP server

**Solution:**
1. Verify the path in `mcp_config.json` is absolute (not relative)
2. Check that `dist/index.js` exists after running `npm run build`
3. Restart Claude Code after changing config

### Element not found errors

**Problem:** MCP tools can't find elements

**Solution:**
1. Ensure the demo app is running and visible
2. Use `get_elements` to see what elements are available
3. Check data-testid attributes in the app code
4. Try using CSS selectors instead of test IDs

## Advanced Configuration

### Custom Tauri Driver URL

If running tauri-driver on a different port:

```json
{
  "mcpServers": {
    "tauri-automation": {
      "env": {
        "TAURI_DRIVER_URL": "http://localhost:9999"
      }
    }
  }
}
```

### Debug Mode

Enable verbose logging:

```json
{
  "mcpServers": {
    "tauri-automation": {
      "env": {
        "TAURI_DRIVER_URL": "http://localhost:4444",
        "DEBUG": "true"
      }
    }
  }
}
```

## Next Steps

1. ✅ Configuration complete
2. 📚 Read the [test scenarios](../../scenarios/)
3. 🧪 Try the [interactive examples](../../scenarios/01-getting-started.md)
4. 🤖 Run [automated tests](../../automated-tests/)

## Support

For issues or questions:
- Check the [main README](../../../README.md)
- Review [troubleshooting guide](../../../docs/TROUBLESHOOTING.md)
- Open an issue on GitHub
