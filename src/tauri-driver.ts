/**
 * Tauri Driver Wrapper
 * Manages WebDriver connection to Tauri applications
 */

import { remote } from 'webdriverio';
import type { AppState, LaunchAppParams, SelectorStrategy, TauriAutomationConfig } from './types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class TauriDriver {
  private config: Required<TauriAutomationConfig>;
  private appState: AppState;

  constructor(config: TauriAutomationConfig = {}) {
    this.config = {
      appPath: config.appPath || '',
      screenshotDir: config.screenshotDir || path.join(process.cwd(), 'screenshots'),
      webdriverPort: config.webdriverPort || 4444,
      defaultTimeout: config.defaultTimeout || 5000,
      tauriDriverPath: config.tauriDriverPath || 'tauri-driver',
    };

    this.appState = {
      isRunning: false,
      browser: null,
    };
  }

  /**
   * Launch the Tauri application
   */
  async launchApp(params: LaunchAppParams): Promise<void> {
    if (this.appState.isRunning) {
      throw new Error('Application is already running. Close it first.');
    }

    const appPath = params.appPath || this.config.appPath;
    if (!appPath) {
      throw new Error('Application path is required');
    }

    try {
      // Ensure screenshot directory exists
      await fs.mkdir(this.config.screenshotDir, { recursive: true });

      // Connect to tauri-driver via WebDriver
      const browser = await remote({
        capabilities: {
          'tauri:options': {
            application: appPath,
            args: params.args || [],
            env: params.env || {},
          },
        } as any,
        logLevel: 'error',
        port: this.config.webdriverPort,
      });

      this.appState.browser = browser;
      this.appState.isRunning = true;
      this.appState.appPath = appPath;
      this.appState.sessionId = browser.sessionId;

      // Set default timeout
      await browser.setTimeout({
        implicit: this.config.defaultTimeout,
      });
    } catch (error) {
      this.appState.isRunning = false;
      this.appState.browser = null;
      throw new Error(`Failed to launch application: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Close the Tauri application
   */
  async closeApp(): Promise<void> {
    if (!this.appState.browser || !this.appState.isRunning) {
      throw new Error('No application is currently running');
    }

    try {
      await this.appState.browser.deleteSession();
    } catch (error) {
      console.error('Error closing browser session:', error);
    } finally {
      this.appState.browser = null;
      this.appState.isRunning = false;
      this.appState.sessionId = undefined;
      this.appState.appPath = undefined;
    }
  }

  /**
   * Capture a screenshot
   */
  async captureScreenshot(filename?: string, returnBase64: boolean = false): Promise<string> {
    this.ensureAppRunning();

    const screenshot = await this.appState.browser!.takeScreenshot();

    if (returnBase64) {
      return screenshot;
    }

    // Save to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = filename ? `${filename}.png` : `screenshot-${timestamp}.png`;
    const filePath = path.join(this.config.screenshotDir, fileName);

    await fs.writeFile(filePath, screenshot, 'base64');
    return filePath;
  }

  /**
   * Resolve a selector string for WebDriverIO based on the strategy.
   * - css (default): passed through as-is
   * - xpath: passed through (WDIO auto-detects // prefix)
   * - text: exact text match using XPath (works for all elements, not just links)
   * - partial_text: partial text match using XPath (works for all elements)
   */
  private resolveSelector(selector: string, by: SelectorStrategy = 'css'): string {
    switch (by) {
      case 'xpath':
        return selector;
      case 'text':
        // Use XPath for exact text match - works for all element types
        // Escape single quotes in selector for XPath safety
        const escapedText = selector.replace(/'/g, "\\'");
        return `//*[text()='${escapedText}']`;
      case 'partial_text':
        // Use XPath for partial text match - works for all element types
        const escapedPartial = selector.replace(/'/g, "\\'");
        return `//*[contains(., '${escapedPartial}')]`;
      case 'css':
      default:
        return selector;
    }
  }

  /**
   * Click an element
   */
  async clickElement(selector: string, by: SelectorStrategy = 'css'): Promise<void> {
    this.ensureAppRunning();

    const resolved = this.resolveSelector(selector, by);
    const element = await this.appState.browser!.$(resolved);
    if (!(await element.isExisting())) {
      throw new Error(`Element not found (${by}): ${selector}`);
    }

    await element.click();
  }

  /**
   * Type text into an element
   */
  async typeText(selector: string, text: string, clear: boolean = false, by: SelectorStrategy = 'css'): Promise<void> {
    this.ensureAppRunning();

    const resolved = this.resolveSelector(selector, by);
    const element = await this.appState.browser!.$(resolved);
    if (!(await element.isExisting())) {
      throw new Error(`Element not found (${by}): ${selector}`);
    }

    if (clear) {
      await element.clearValue();
    }

    await element.setValue(text);
  }

  /**
   * Wait for an element to appear
   */
  async waitForElement(selector: string, timeout?: number, by: SelectorStrategy = 'css'): Promise<void> {
    this.ensureAppRunning();

    const waitTimeout = timeout || this.config.defaultTimeout;
    const resolved = this.resolveSelector(selector, by);
    const element = await this.appState.browser!.$(resolved);

    await element.waitForExist({
      timeout: waitTimeout,
      timeoutMsg: `Element not found within ${waitTimeout}ms (${by}): ${selector}`,
    });
  }

  /**
   * Get text content of an element
   */
  async getElementText(selector: string, by: SelectorStrategy = 'css'): Promise<string> {
    this.ensureAppRunning();

    const resolved = this.resolveSelector(selector, by);
    const element = await this.appState.browser!.$(resolved);
    if (!(await element.isExisting())) {
      throw new Error(`Element not found (${by}): ${selector}`);
    }

    return await element.getText();
  }

  /**
   * Execute a Tauri IPC command
   */
  async executeTauriCommand(command: string, args: Record<string, unknown> = {}): Promise<unknown> {
    this.ensureAppRunning();

    try {
      // Execute JavaScript in the Tauri window to call the command
      const result = await this.appState.browser!.execute(
        (cmd: string, cmdArgs: Record<string, unknown>) => {
          // @ts-ignore - Tauri's invoke function is injected globally
          return window.__TAURI__?.invoke(cmd, cmdArgs);
        },
        command,
        args
      );

      return result;
    } catch (error) {
      throw new Error(`Failed to execute Tauri command '${command}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get current application state
   */
  getAppState(): Readonly<AppState> {
    return {
      isRunning: this.appState.isRunning,
      browser: this.appState.browser,
      processId: this.appState.processId,
      appPath: this.appState.appPath,
      sessionId: this.appState.sessionId,
    };
  }

  /**
   * Get current page title
   */
  async getPageTitle(): Promise<string> {
    this.ensureAppRunning();
    return await this.appState.browser!.getTitle();
  }

  /**
   * Get current page URL
   */
  async getPageUrl(): Promise<string> {
    this.ensureAppRunning();
    return await this.appState.browser!.getUrl();
  }

  /**
   * Execute arbitrary JavaScript in the app context
   */
  async executeScript(script: string, ...args: unknown[]): Promise<unknown> {
    this.ensureAppRunning();
    return await this.appState.browser!.execute(script, ...args);
  }

  /**
   * Ensure the app is running, throw error if not
   */
  private ensureAppRunning(): void {
    if (!this.appState.isRunning || !this.appState.browser) {
      throw new Error('No application is currently running. Launch an app first.');
    }
  }

  /**
   * Get configuration
   */
  getConfig(): Readonly<Required<TauriAutomationConfig>> {
    return { ...this.config };
  }
}
