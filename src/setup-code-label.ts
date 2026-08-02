/**
 * 設定進度步驟 code → 人話標籤（無翻譯時回落 raw code）。
 */
export function resolveSetupCodeLabel(
  code: string | null | undefined,
  t: (key: string) => string,
): string {
  if (typeof code !== 'string' || code.length === 0) return '';
  const key = `setup.code.${code}`;
  const localized = t(key);
  return localized && localized !== key ? localized : code;
}
