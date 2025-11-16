/**
 * Type definitions for MCP Tauri Automation server
 */

import type { Browser } from 'webdriverio';

/**
 * Configuration for the Tauri automation server
 */
export interface TauriAutomationConfig {
  /** Path to the Tauri application binary */
  appPath?: string;
  /** Directory to save screenshots */
  screenshotDir?: string;
  /** WebDriver server port */
  webdriverPort?: number;
  /** Default timeout for element waits (ms) */
  defaultTimeout?: number;
  /** Tauri driver binary path */
  tauriDriverPath?: string;
}

/**
 * Application state tracking
 */
export interface AppState {
  /** Whether the app is currently running */
  isRunning: boolean;
  /** WebDriver browser instance */
  browser: Browser | null;
  /** Application process ID */
  processId?: number;
  /** Current app path */
  appPath?: string;
  /** WebDriver session ID */
  sessionId?: string;
}

/**
 * Launch app parameters
 */
export interface LaunchAppParams {
  /** Path to the Tauri application binary */
  appPath: string;
  /** Optional additional arguments to pass to the app */
  args?: string[];
  /** Optional environment variables */
  env?: Record<string, string>;
}

/**
 * Screenshot parameters
 */
export interface ScreenshotParams {
  /** Optional filename (without extension, will be saved as PNG) */
  filename?: string;
  /** Whether to return base64 data instead of saving to file */
  returnBase64?: boolean;
}

/**
 * Element interaction parameters
 */
export interface ElementSelector {
  /** CSS selector string */
  selector: string;
}

/**
 * Type text parameters
 */
export interface TypeTextParams {
  /** CSS selector for the input element */
  selector: string;
  /** Text to type */
  text: string;
  /** Whether to clear existing text first */
  clear?: boolean;
}

/**
 * Wait for element parameters
 */
export interface WaitForElementParams {
  /** CSS selector to wait for */
  selector: string;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Execute Tauri command parameters
 */
export interface ExecuteTauriCommandParams {
  /** Command name to execute */
  command: string;
  /** Arguments to pass to the command */
  args?: Record<string, unknown>;
}

/**
 * Tool response wrapper
 */
export interface ToolResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
