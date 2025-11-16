/**
 * Application state and command execution tools
 */

import type { TauriDriver } from '../tauri-driver.js';
import type { ExecuteTauriCommandParams, ToolResponse } from '../types.js';

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
