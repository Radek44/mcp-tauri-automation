#!/bin/bash

# Test Harness Setup Script
# Sets up the MCP Tauri Automation demo and test environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  MCP Tauri Automation Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
echo -e "${GREEN}✓${NC} Project root: ${PROJECT_ROOT}"

# Step 1: Build MCP Server
echo ""
echo -e "${YELLOW}[1/5]${NC} Building MCP server..."
cd "${PROJECT_ROOT}"
if [ ! -d "node_modules" ]; then
    echo "  Installing dependencies..."
    npm install
fi
echo "  Building server..."
npm run build

if [ -f "dist/index.js" ]; then
    echo -e "${GREEN}✓${NC} MCP server built successfully"
else
    echo -e "${RED}✗${NC} MCP server build failed"
    exit 1
fi

# Step 2: Setup Demo App
echo ""
echo -e "${YELLOW}[2/5]${NC} Setting up Recipe Book demo app..."
cd "${PROJECT_ROOT}/demo-app"
if [ ! -d "node_modules" ]; then
    echo "  Installing dependencies..."
    npm install
else
    echo -e "${GREEN}✓${NC} Dependencies already installed"
fi

# Step 3: Check tauri-driver
echo ""
echo -e "${YELLOW}[3/5]${NC} Checking for tauri-driver..."
if command -v tauri-driver &> /dev/null; then
    echo -e "${GREEN}✓${NC} tauri-driver is installed"
    TAURI_DRIVER_VERSION=$(tauri-driver --version 2>&1 || echo "unknown")
    echo "  Version: ${TAURI_DRIVER_VERSION}"
else
    echo -e "${YELLOW}⚠${NC}  tauri-driver not found"
    echo "  Install with: cargo install tauri-driver"
    echo ""
fi

# Step 4: Create MCP Config
echo ""
echo -e "${YELLOW}[4/5]${NC} Creating MCP configuration..."

# Detect platform and set config path
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    MCP_CONFIG_DIR="$HOME/.config/Claude"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    MCP_CONFIG_DIR="$HOME/.config/Claude"
else
    # Windows or other
    echo -e "${YELLOW}⚠${NC}  Platform not auto-detected. Please configure manually."
    MCP_CONFIG_DIR=""
fi

if [ -n "$MCP_CONFIG_DIR" ]; then
    mkdir -p "$MCP_CONFIG_DIR"
    MCP_CONFIG_FILE="$MCP_CONFIG_DIR/mcp_config.json"

    # Create config from template
    cat > "$MCP_CONFIG_FILE" <<EOF
{
  "mcpServers": {
    "tauri-automation": {
      "command": "node",
      "args": [
        "${PROJECT_ROOT}/dist/index.js"
      ],
      "env": {
        "TAURI_DRIVER_URL": "http://localhost:4444"
      }
    }
  }
}
EOF

    echo -e "${GREEN}✓${NC} MCP config created at: ${MCP_CONFIG_FILE}"
else
    echo -e "${YELLOW}⚠${NC}  Skipping MCP config creation"
fi

# Step 5: Setup Automated Tests
echo ""
echo -e "${YELLOW}[5/5]${NC} Setting up automated tests..."
cd "${PROJECT_ROOT}/test-harness/automated-tests"
if [ -f "package.json" ]; then
    npm install 2>/dev/null || echo "  (Automated tests not yet implemented)"
    echo -e "${GREEN}✓${NC} Test dependencies installed"
else
    echo -e "${YELLOW}⚠${NC}  Automated tests not yet available"
fi

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Setup Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}✓${NC} MCP server is built"
echo -e "${GREEN}✓${NC} Demo app is ready"
if [ -n "$MCP_CONFIG_FILE" ]; then
    echo -e "${GREEN}✓${NC} MCP config is created"
fi
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Start tauri-driver:"
echo -e "   ${BLUE}tauri-driver${NC}"
echo ""
echo "2. Start the demo app:"
echo -e "   ${BLUE}cd ${PROJECT_ROOT}/demo-app${NC}"
echo -e "   ${BLUE}npm run tauri dev${NC}"
echo ""
echo "3. Verify setup:"
echo -e "   ${BLUE}cd ${PROJECT_ROOT}/test-harness/scripts${NC}"
echo -e "   ${BLUE}./verify.sh${NC}"
echo ""
echo "4. Try scenarios:"
echo -e "   ${BLUE}Open test-harness/scenarios/01-getting-started.md${NC}"
echo ""
echo -e "${GREEN}Happy testing!${NC}"
