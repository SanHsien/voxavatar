/**
 * 將可能含路徑／使用者名的 listener 錯誤字串遮罩後再顯示。
 * 不依賴 Node os；僅做啟發式替換。
 */
export function redactDisplayText(input: string | null | undefined): string {
  if (typeof input !== 'string' || input.length === 0) return '';
  let text = input;
  // 先遮罩媒體／helper 檔名（含完整路徑或殘段），避免 home 替換後仍露出 basename
  text = text.replace(
    /(?:[A-Za-z]:\\|\/)?[^\s"'<>]*?\.(?:vrm|vrma|glb|gltf|exe|dll)\b/gi,
    '<asset>',
  );
  text = text.replace(/[A-Za-z]:\\(?:Users|home)\\[^\\\s]+/gi, '<home>');
  text = text.replace(/\/(?:Users|home)\/[^/\s]+/g, '<home>');
  text = text.replace(/(?:[A-Za-z]:\\|\/)[^\s"'<>]{8,}/g, '<path>');
  return text;
}

export type ListenerStatusLike = {
  error?: string;
  source?: string | null;
  helper_error?: string;
  state?: string;
};

/** 語音狀態列次要說明：優先分類碼，再遮罩 raw error，最後來源。 */
export function resolveListenerStatusDetail(
  status: ListenerStatusLike | null | undefined,
  t: (key: string) => string,
  fallbackKey = 'voice.state.noStream',
): string {
  if (status?.helper_error) {
    const key = `helper.error.${status.helper_error}`;
    const localized = t(key);
    if (localized && localized !== key) return localized;
  }
  const redacted = redactDisplayText(status?.error);
  if (redacted) return redacted;
  if (typeof status?.source === 'string' && status.source.trim()) {
    return redactDisplayText(status.source);
  }
  return t(fallbackKey);
}
