/**
 * UI interaction tools
 */

import type { TauriDriver } from '../tauri-driver.js';
import type { ElementSelector, TypeTextParams, WaitForElementParams, ToolResponse } from '../types.js';

/**
 * Click an element by CSS selector
 */
export async function clickElement(
  driver: TauriDriver,
  params: ElementSelector
): Promise<ToolResponse<{ message: string }>> {
  try {
    await driver.clickElement(params.selector);

    return {
      success: true,
      data: {
        message: `Clicked element: ${params.selector}`,
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
 * Type text into an input element
 */
export async function typeText(
  driver: TauriDriver,
  params: TypeTextParams
): Promise<ToolResponse<{ message: string }>> {
  try {
    await driver.typeText(params.selector, params.text, params.clear);

    return {
      success: true,
      data: {
        message: `Typed text into element: ${params.selector}`,
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
 * Wait for an element to appear
 */
export async function waitForElement(
  driver: TauriDriver,
  params: WaitForElementParams
): Promise<ToolResponse<{ message: string }>> {
  try {
    await driver.waitForElement(params.selector, params.timeout);

    return {
      success: true,
      data: {
        message: `Element found: ${params.selector}`,
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
 * Get text content of an element
 */
export async function getElementText(
  driver: TauriDriver,
  params: ElementSelector
): Promise<ToolResponse<{ text: string }>> {
  try {
    const text = await driver.getElementText(params.selector);

    return {
      success: true,
      data: {
        text,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
