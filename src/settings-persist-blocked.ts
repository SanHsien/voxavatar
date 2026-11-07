import { settingsT, type UiLocale } from './settings-i18n';

const KNOWN_REASONS = new Set([
  'unsupported_schema_backup_failed',
  'unreadable_backup_failed',
]);

/** settings.json 無法備份、因此拒絕寫入時的說明；未受阻則回 null。 */
export function persistBlockedMessage(
  locale: UiLocale,
  snapshot: { persist_blocked?: boolean; persist_blocked_reason?: string | null },
): string | null {
  if (snapshot.persist_blocked !== true) return null;
  const reason = snapshot.persist_blocked_reason ?? '';
  return settingsT(
    locale,
    KNOWN_REASONS.has(reason)
      ? `persistBlocked.${reason}`
      : 'persistBlocked.backup_failed',
  );
}
