/**
 * @vitest-environment jsdom
 */
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsConfirmationDialog } from './SettingsConfirmationDialog';
import { settingsT } from '../../settings-i18n';

describe('SettingsConfirmationDialog', () => {
  it('closes on Escape and backdrop click, and disables while confirming', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const dialogRef = createRef<HTMLDivElement>();
    const cancelRef = createRef<HTMLButtonElement>();
    const confirmRef = createRef<HTMLButtonElement>();

    const { rerender } = render(
      <SettingsConfirmationDialog
        cancelRef={cancelRef}
        confirmation={{
          title: '刪除全部？',
          detail: '此操作無法復原。',
          confirmLabel: '刪除',
        }}
        confirming={false}
        confirmRef={confirmRef}
        dialogRef={dialogRef}
        onClose={onClose}
        onConfirm={onConfirm}
        t={(key, vars) => settingsT('zh-TW', key, vars)}
      />,
    );

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.mouseDown(screen.getByRole('dialog').parentElement!);
    expect(onClose).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole('button', { name: '刪除' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    rerender(
      <SettingsConfirmationDialog
        cancelRef={cancelRef}
        confirmation={{
          title: '刪除全部？',
          detail: '此操作無法復原。',
          confirmLabel: '刪除',
        }}
        confirming={true}
        confirmRef={confirmRef}
        dialogRef={dialogRef}
        onClose={onClose}
        onConfirm={onConfirm}
        t={(key, vars) => settingsT('zh-TW', key, vars)}
      />,
    );

    expect(screen.getByRole('dialog').getAttribute('aria-busy')).toBe('true');
    const working = screen.getByRole('button', {
      name: settingsT('zh-TW', 'common.working'),
    }) as HTMLButtonElement;
    expect(working.disabled).toBe(true);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
