/**
 * Application state and command execution tools
 */

import type { TauriDriver } from '../tauri-driver.js';
import type { ExecuteTauriCommandParams, ExecuteScriptParams, ToolResponse } from '../types.js';

/**
 * Execute a Tauri IPC command
 */
export async function executeTauriCommand(
  driver: TauriDriver,
  params: ExecuteTauriCommandParams
): Promise<ToolResponse<{ result: unknown }>> {
  try {
    const result = await driver.executeTauriCommand(params.command, params.args);

    return {
      success: true,
      data: {
        result,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Execute arbitrary JavaScript in the application context
 */
export async function executeScript(
  driver: TauriDriver,
  params: ExecuteScriptParams
): Promise<ToolResponse<{ result: unknown }>> {
  try {
    const result = await driver.executeScript(params.script, ...(params.args || []));

    return {
      success: true,
      data: {
        result,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get the current page title
 */
export async function getPageTitle(
  driver: TauriDriver
): Promise<ToolResponse<{ title: string }>> {
  try {
    const title = await driver.getPageTitle();

    return {
      success: true,
      data: {
        title,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get the current page URL
 */
export async function getPageUrl(
  driver: TauriDriver
): Promise<ToolResponse<{ url: string }>> {
  try {
    const url = await driver.getPageUrl();

    return {
      success: true,
      data: {
        url,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
