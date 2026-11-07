import { describe, expect, it } from 'vitest';
import { persistBlockedMessage } from './settings-persist-blocked';

describe('persistBlockedMessage', () => {
  it('returns null when persistence is not blocked', () => {
    expect(persistBlockedMessage('zh-TW', {})).toBeNull();
    expect(
      persistBlockedMessage('en', { persist_blocked: false }),
    ).toBeNull();
  });

  it('explains in zh-TW that the original could not be backed up and changes stay in memory', () => {
    const text = persistBlockedMessage('zh-TW', {
      persist_blocked: true,
      persist_blocked_reason: 'unsupported_schema_backup_failed',
    });
    expect(text).toContain('設定無法儲存');
    expect(text).toContain('只在記憶體中');
    expect(text).toContain('重新啟動後會重試');
  });

  it('explains in en and distinguishes the unreadable reason', () => {
    const unreadable = persistBlockedMessage('en', {
      persist_blocked: true,
      persist_blocked_reason: 'unreadable_backup_failed',
    });
    const unsupported = persistBlockedMessage('en', {
      persist_blocked: true,
      persist_blocked_reason: 'unsupported_schema_backup_failed',
    });
    expect(unreadable).toContain('Settings cannot be saved');
    expect(unreadable).not.toBe(unsupported);
  });

  it('falls back to a generic reason for unknown codes', () => {
    expect(
      persistBlockedMessage('en', {
        persist_blocked: true,
        persist_blocked_reason: 'something_new',
      }),
    ).toContain('Settings cannot be saved');
  });
});
