import { type ReactNode, type RefObject } from 'react';

type SettingsTranslate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

export interface SettingsConfirmationState {
  title: string;
  detail: string;
  confirmLabel: string;
}

export interface SettingsConfirmationDialogProps {
  confirmation: SettingsConfirmationState;
  confirming: boolean;
  t: SettingsTranslate;
  dialogRef: RefObject<HTMLDivElement | null>;
  cancelRef: RefObject<HTMLButtonElement | null>;
  confirmRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onConfirm: () => void;
}

export function SettingsConfirmationDialog({
  confirmation,
  confirming,
  t,
  dialogRef,
  cancelRef,
  confirmRef,
  onClose,
  onConfirm,
}: SettingsConfirmationDialogProps): ReactNode {
  return (
    <div
      className="settings-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !confirming) {
          onClose();
        }
      }}
    >
      <div
        aria-busy={confirming}
        aria-describedby="settings-confirmation-detail"
        aria-labelledby="settings-confirmation-title"
        aria-modal="true"
        className="settings-dialog"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !confirming) {
            event.preventDefault();
            onClose();
            return;
          }
          if (event.key !== 'Tab') return;
          const first = cancelRef.current;
          const last = confirmRef.current;
          if (!first || !last) return;
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
        ref={dialogRef}
        role="dialog"
      >
        <div className="settings-dialog-icon" aria-hidden="true">
          !
        </div>
        <div className="settings-dialog-copy">
          <span className="eyebrow">{t('common.confirmChange')}</span>
          <h2 id="settings-confirmation-title">{confirmation.title}</h2>
          <p id="settings-confirmation-detail">{confirmation.detail}</p>
        </div>
        <div className="settings-dialog-actions">
          <button
            className="secondary-button"
            disabled={confirming}
            onClick={onClose}
            ref={cancelRef}
            type="button"
          >
            {t('common.cancel')}
          </button>
          <button
            className="settings-dialog-confirm"
            disabled={confirming}
            onClick={onConfirm}
            ref={confirmRef}
            type="button"
          >
            {confirming ? t('common.working') : confirmation.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
