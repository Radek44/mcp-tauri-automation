export interface TauriAutomationConfig {
  appPath?: string;
  screenshotDir?: string;
  webdriverPort?: number;
  defaultTimeout?: number;
  /** Retained for old config readers; this server does not spawn tauri-driver. */
  tauriDriverPath?: string;
}

export interface AppState {
  /** A tracked session, not proof that the external process is alive. */
  isRunning: boolean;
  connectionUncertain?: boolean;
  appPath?: string;
  sessionId?: string;
  mode?: "tauri-driver" | "embedded";
  port?: number;
}

export interface LaunchAppParams {
  appPath?: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface ScreenshotParams {
  filename?: string;
  returnBase64?: boolean;
  timeout?: number;
}
export interface ElementSelector {
  selector: string;
}
export interface TypeTextParams extends ElementSelector {
  text: string;
  clear?: boolean;
}
export interface WaitForElementParams extends ElementSelector {
  timeout?: number;
  state?: "attached" | "visible" | "hidden";
  conditions?: ElementConditions;
}
export interface ElementConditions {
  textEquals?: string;
  enabled?: boolean;
  ariaBusy?: boolean;
}
export interface InspectUiParams {
  selector?: string;
  limit?: number;
  maxTextLength?: number;
}
export interface ExecuteTauriCommandParams {
  command: string;
  args?: Record<string, unknown>;
}
export interface ToolResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
