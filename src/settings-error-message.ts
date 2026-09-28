import { redactDisplayText } from './listener-status-copy';

/** 設定頁 notice：剝 Electron IPC 前綴後再遮罩路徑／檔名。 */
export function settingsErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return redactDisplayText(
    message.replace(/^Error invoking remote method '[^']+': Error: /, ''),
  );
}
