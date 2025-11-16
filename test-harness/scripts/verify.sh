#!/bin/bash

# Verification Script
# Checks if the MCP Tauri Automation setup is correct

set +e  # Don't exit on errors, we want to show all results

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  MCP Tauri Automation Verification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS_COUNT++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL_COUNT++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC}  $1"
    ((WARN_COUNT++))
}

# Check 1: MCP Server Built
echo -e "${YELLOW}Checking MCP server...${NC}"
if [ -f "${PROJECT_ROOT}/dist/index.js" ]; then
    check_pass "MCP server is built (dist/index.js exists)"
else
    check_fail "MCP server not built (run: npm run build)"
fi

if [ -f "${PROJECT_ROOT}/package.json" ]; then
    check_pass "package.json exists"
else
    check_fail "package.json not found"
fi

# Check 2: Demo App Setup
echo ""
echo -e "${YELLOW}Checking demo app...${NC}"
if [ -d "${PROJECT_ROOT}/demo-app" ]; then
    check_pass "Demo app directory exists"

    if [ -d "${PROJECT_ROOT}/demo-app/node_modules" ]; then
        check_pass "Demo app dependencies installed"
    else
        check_fail "Demo app dependencies not installed (run: cd demo-app && npm install)"
    fi

    if [ -f "${PROJECT_ROOT}/demo-app/src/App.tsx" ]; then
        check_pass "Demo app source files exist"
    else
        check_fail "Demo app source files missing"
    fi

    if [ -f "${PROJECT_ROOT}/demo-app/src-tauri/src/lib.rs" ]; then
        check_pass "Tauri backend files exist"
    else
        check_fail "Tauri backend files missing"
    fi
else
    check_fail "Demo app directory not found"
fi

# Check 3: tauri-driver
echo ""
echo -e "${YELLOW}Checking tauri-driver...${NC}"
if command -v tauri-driver &> /dev/null; then
    check_pass "tauri-driver is installed"

    # Check if tauri-driver is running
    if lsof -i :4444 &> /dev/null || nc -z localhost 4444 2>/dev/null; then
        check_pass "tauri-driver is running on port 4444"
    else
        check_warn "tauri-driver not running (start with: tauri-driver)"
    fi
else
    check_fail "tauri-driver not installed (install with: cargo install tauri-driver)"
fi

# Check 4: Node.js and npm
echo ""
echo -e "${YELLOW}Checking Node.js environment...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js installed (${NODE_VERSION})"
else
    check_fail "Node.js not installed"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check_pass "npm installed (${NPM_VERSION})"
else
    check_fail "npm not installed"
fi

# Check 5: Rust and Cargo
echo ""
echo -e "${YELLOW}Checking Rust environment...${NC}"
if command -v cargo &> /dev/null; then
    CARGO_VERSION=$(cargo --version | cut -d' ' -f2)
    check_pass "Cargo installed (${CARGO_VERSION})"
else
    check_fail "Cargo not installed (required for tauri-driver)"
fi

# Check 6: MCP Config
echo ""
echo -e "${YELLOW}Checking MCP configuration...${NC}"
if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
    MCP_CONFIG_FILE="$HOME/.config/Claude/mcp_config.json"

    if [ -f "$MCP_CONFIG_FILE" ]; then
        check_pass "MCP config file exists"

        # Verify it contains tauri-automation
        if grep -q "tauri-automation" "$MCP_CONFIG_FILE"; then
            check_pass "MCP config includes tauri-automation server"
        else
            check_warn "MCP config exists but doesn't include tauri-automation"
        fi
    else
        check_warn "MCP config not found (run: test-harness/scripts/setup.sh)"
    fi
else
    check_warn "Platform not auto-detected, verify MCP config manually"
fi

# Check 7: Test Scenarios
echo ""
echo -e "${YELLOW}Checking test scenarios...${NC}"
SCENARIO_COUNT=$(ls -1 "${PROJECT_ROOT}/test-harness/scenarios/"*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$SCENARIO_COUNT" -gt 0 ]; then
    check_pass "${SCENARIO_COUNT} test scenarios available"
else
    check_warn "No test scenarios found"
fi

# Check 8: Demo App Process
echo ""
echo -e "${YELLOW}Checking if demo app is running...${NC}"
# This is platform-specific and might not work in all environments
if pgrep -f "tauri dev" > /dev/null || pgrep -f "demo-app" > /dev/null; then
    check_pass "Demo app appears to be running"
else
    check_warn "Demo app not detected (start with: cd demo-app && npm run tauri dev)"
fi

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Verification Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Passed:${NC}  $PASS_COUNT"
echo -e "${YELLOW}Warnings:${NC} $WARN_COUNT"
echo -e "${RED}Failed:${NC}  $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ] && [ $WARN_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! You're ready to go!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open test-harness/scenarios/01-getting-started.md"
    echo "2. Follow the interactive scenarios with Claude"
    exit 0
elif [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${YELLOW}⚠ Setup is mostly complete, but some optional components need attention.${NC}"
    echo ""
    echo "Review the warnings above and:"
    echo "- Start tauri-driver if not running"
    echo "- Start demo app if not running"
    echo "- Review MCP configuration if needed"
    exit 0
else
    echo -e "${RED}✗ Some required components are missing.${NC}"
    echo ""
    echo "Please run the setup script:"
    echo "  cd test-harness/scripts && ./setup.sh"
    echo ""
    echo "Or fix the failed checks manually."
    exit 1
fi
