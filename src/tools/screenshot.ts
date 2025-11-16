/**
 * Screenshot capture tools
 */

import type { TauriDriver } from '../tauri-driver.js';
import type { ScreenshotParams, ToolResponse } from '../types.js';

/**
 * Capture a screenshot of the application
 */
export async function captureScreenshot(
  driver: TauriDriver,
  params: ScreenshotParams = {}
): Promise<ToolResponse<{ path?: string; base64?: string; message: string }>> {
  try {
    const returnBase64 = params.returnBase64 ?? true; // Default to base64 for MCP
    const result = await driver.captureScreenshot(params.filename, returnBase64);

    if (returnBase64) {
      return {
        success: true,
        data: {
          base64: result,
          message: 'Screenshot captured successfully',
        },
      };
    } else {
      return {
        success: true,
        data: {
          path: result,
          message: `Screenshot saved to: ${result}`,
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
