/**
 * Launch and lifecycle tools
 */

import type { TauriDriver } from '../tauri-driver.js';
import type { LaunchAppParams, ToolResponse } from '../types.js';

/**
 * Launch the Tauri application
 */
export async function launchApp(
  driver: TauriDriver,
  params: LaunchAppParams
): Promise<ToolResponse<{ message: string; sessionId?: string }>> {
  try {
    await driver.launchApp(params);
    const state = driver.getAppState();

    return {
      success: true,
      data: {
        message: `Application launched successfully: ${params.appPath}`,
        sessionId: state.sessionId,
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
 * Close the Tauri application
 */
export async function closeApp(
  driver: TauriDriver
): Promise<ToolResponse<{ message: string }>> {
  try {
    await driver.closeApp();

    return {
      success: true,
      data: {
        message: 'Application closed successfully',
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
 * Get current application state
 */
export async function getAppState(
  driver: TauriDriver
): Promise<ToolResponse<{
  isRunning: boolean;
  appPath?: string;
  sessionId?: string;
  pageTitle?: string;
  pageUrl?: string;
}>> {
  try {
    const state = driver.getAppState();
    let pageTitle: string | undefined;
    let pageUrl: string | undefined;

    if (state.isRunning) {
      try {
        pageTitle = await driver.getPageTitle();
        pageUrl = await driver.getPageUrl();
      } catch (error) {
        // Ignore errors getting page info
      }
    }

    return {
      success: true,
      data: {
        isRunning: state.isRunning,
        appPath: state.appPath,
        sessionId: state.sessionId,
        pageTitle,
        pageUrl,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
