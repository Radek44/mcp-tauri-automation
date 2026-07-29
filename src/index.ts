#!/usr/bin/env node

/**
 * MCP Server for Tauri Application Automation
 *
 * This server provides tools for automating Tauri desktop applications
 * through the Model Context Protocol (MCP).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TauriDriver } from './tauri-driver.js';
import { launchApp, closeApp, getAppState } from './tools/launch.js';
import { captureScreenshot } from './tools/screenshot.js';
import { clickElement, typeText, waitForElement, getElementText } from './tools/interact.js';
import { executeTauriCommand, executeScript, getPageTitle, getPageUrl } from './tools/state.js';
import type { TauriAutomationConfig } from './types.js';

// Parse config from environment variables
const config: TauriAutomationConfig = {
  appPath: process.env.TAURI_APP_PATH,
  screenshotDir: process.env.TAURI_SCREENSHOT_DIR,
  webdriverPort: process.env.TAURI_WEBDRIVER_PORT ? parseInt(process.env.TAURI_WEBDRIVER_PORT) : undefined,
  defaultTimeout: process.env.TAURI_DEFAULT_TIMEOUT ? parseInt(process.env.TAURI_DEFAULT_TIMEOUT) : undefined,
  tauriDriverPath: process.env.TAURI_DRIVER_PATH,
};

// Initialize driver
const driver = new TauriDriver(config);

// Create MCP server
const server = new Server(
  {
    name: 'mcp-tauri-automation',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'launch_app',
        description: 'Launch a Tauri application via tauri-driver. The tauri-driver must be running on the configured port (default: 4444).',
        inputSchema: {
          type: 'object',
          properties: {
            appPath: {
              type: 'string',
              description: 'Path to the Tauri application binary',
            },
            args: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional command-line arguments to pass to the application',
            },
            env: {
              type: 'object',
              additionalProperties: { type: 'string' },
              description: 'Optional environment variables to set for the application',
            },
          },
          required: ['appPath'],
        },
      },
      {
        name: 'close_app',
        description: 'Close the currently running Tauri application gracefully',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'capture_screenshot',
        description: 'Capture a screenshot of the application window. Returns base64-encoded PNG image data by default.',
        inputSchema: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'Optional filename (without extension) to save the screenshot. If not provided, a timestamp will be used.',
            },
            returnBase64: {
              type: 'boolean',
              description: 'Whether to return base64 image data (true) or save to file and return path (false). Default: true',
              default: true,
            },
          },
        },
      },
      {
        name: 'click_element',
        description: 'Click a UI element identified by a selector. Supports CSS selectors, XPath, exact text match, and partial text match.',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'Selector to identify the element. For CSS: "#id", ".class". For XPath: "//button[@name=\'submit\']". For text: "Submit". For partial_text: "Subm".',
            },
            by: {
              type: 'string',
              enum: ['css', 'xpath', 'text', 'partial_text'],
              description: 'Selector strategy. Default: "css"',
              default: 'css',
            },
          },
          required: ['selector'],
        },
      },
      {
        name: 'type_text',
        description: 'Type text into an input field or editable element',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'Selector to identify the input element',
            },
            text: {
              type: 'string',
              description: 'Text to type into the element',
            },
            clear: {
              type: 'boolean',
              description: 'Whether to clear existing text before typing. Default: false',
              default: false,
            },
            by: {
              type: 'string',
              enum: ['css', 'xpath', 'text', 'partial_text'],
              description: 'Selector strategy. Default: "css"',
              default: 'css',
            },
          },
          required: ['selector', 'text'],
        },
      },
      {
        name: 'wait_for_element',
        description: 'Wait for an element to appear in the DOM. Useful for handling async UI states.',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'Selector to wait for',
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds. Default: 5000',
              default: 5000,
            },
            by: {
              type: 'string',
              enum: ['css', 'xpath', 'text', 'partial_text'],
              description: 'Selector strategy. Default: "css"',
              default: 'css',
            },
          },
          required: ['selector'],
        },
      },
      {
        name: 'get_element_text',
        description: 'Get the text content of an element',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'Selector to identify the element',
            },
            by: {
              type: 'string',
              enum: ['css', 'xpath', 'text', 'partial_text'],
              description: 'Selector strategy. Default: "css"',
              default: 'css',
            },
          },
          required: ['selector'],
        },
      },
      {
        name: 'execute_tauri_command',
        description: 'Execute a Tauri IPC command. The command must be exposed in the Tauri app\'s src-tauri/src/main.rs file.',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'Name of the Tauri command to execute',
            },
            args: {
              type: 'object',
              description: 'Arguments to pass to the command',
              additionalProperties: true,
            },
          },
          required: ['command'],
        },
      },
      {
        name: 'execute_script',
        description: 'Execute arbitrary JavaScript in the application context and return the result',
        inputSchema: {
          type: 'object',
          properties: {
            script: {
              type: 'string',
              description: 'JavaScript code to execute. Use "return" to get a value back.',
            },
            args: {
              type: 'array',
              description: 'Optional arguments accessible as arguments[0], arguments[1], etc.',
              items: {},
            },
          },
          required: ['script'],
        },
      },
      {
        name: 'get_page_title',
        description: 'Get the current page title of the application',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_page_url',
        description: 'Get the current page URL of the application',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_app_state',
        description: 'Get the current state of the application, including whether it\'s running, session info, and page details',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'launch_app': {
        const result = await launchApp(driver, args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'close_app': {
        const result = await closeApp(driver);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'capture_screenshot': {
        const result = await captureScreenshot(driver, args as any);

        if (result.success && result.data?.base64) {
          // Return both text description and image
          return {
            content: [
              {
                type: 'text',
                text: result.data.message,
              },
              {
                type: 'image',
                data: result.data.base64,
                mimeType: 'image/png',
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'click_element': {
        const result = await clickElement(driver, args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'type_text': {
        const result = await typeText(driver, args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'wait_for_element': {
        const result = await waitForElement(driver, args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_element_text': {
        const result = await getElementText(driver, args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'execute_tauri_command': {
        const result = await executeTauriCommand(driver, args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'execute_script': {
        const result = await executeScript(driver, args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_page_title': {
        const result = await getPageTitle(driver);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_page_url': {
        const result = await getPageUrl(driver);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_app_state': {
        const result = await getAppState(driver);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Cleanup handler
async function cleanup() {
  try {
    const state = driver.getAppState();
    if (state.isRunning) {
      console.error('Cleaning up: Closing application...');
      await driver.closeApp();
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

process.on('SIGINT', async () => {
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cleanup();
  process.exit(0);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Tauri Automation server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
