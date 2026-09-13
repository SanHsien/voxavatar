/** 設定進度面板僅在尚未完成必要項時顯示（DECISIONS §11）。 */
export function shouldShowSetupChecklist<T extends { complete: boolean }>(
  readiness: T | null | undefined,
): readiness is T & { complete: false } {
  return Boolean(readiness && !readiness.complete);
}
