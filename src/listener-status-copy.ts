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
  text = text.replace(/\/(?:Users|home|root)\/[^/\s]+/g, '<home>');
  // 啟發式遮罩「user Name」字樣（無 Node os 時仍避免露出帳號）
  text = text.replace(
    /\b(user(?:name)?)\s+[A-Za-z0-9._-]{2,32}\b/gi,
    '$1 <user>',
  );
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

/**
 * 語音狀態旁的下一步提示：缺 helper 或已知 helper_error／launch_failed。
 */
export function resolveHelperNextHint(
  status: ListenerStatusLike | null | undefined,
  t: (key: string) => string,
): string | null {
  const code = status?.helper_error;
  if (code) {
    const key = `helper.hint.${code}`;
    const localized = t(key);
    if (localized && localized !== key) return localized;
  }
  if (status?.state === 'missing') {
    return t('helper.hint.native_helper_missing');
  }
  if (status?.state === 'launch_failed') {
    const fallback = t('helper.hint.launch_failed');
    return fallback === 'helper.hint.launch_failed' ? null : fallback;
  }
  if (status?.state === 'target_missing') {
    const hint = t('helper.hint.target_missing');
    return hint === 'helper.hint.target_missing' ? null : hint;
  }
  if (status?.state === 'no_output') {
    const hint = t('helper.hint.no_output');
    return hint === 'helper.hint.no_output' ? null : hint;
  }
  if (status?.state === 'inactive') {
    const hint = t('helper.hint.inactive');
    return hint === 'helper.hint.inactive' ? null : hint;
  }
  return null;
}
