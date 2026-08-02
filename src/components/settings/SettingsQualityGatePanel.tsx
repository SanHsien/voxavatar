type SettingsBridge = NonNullable<Window['voxavatarSettings']>;

type SettingsTranslate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

export interface SettingsQualityGatePanelProps {
  bridge: SettingsBridge | undefined;
  busy: boolean;
  chooseVrmaReportDir: () => Promise<void>;
  clearVrmaReportDir: () => Promise<void>;
  setVrmaQualityGate: (
    value: VoxAvatarSettingsSnapshot['vrma_quality_gate'],
  ) => Promise<void>;
  setVrmaQualityScoreThresholds: (
    rejectBelow: number,
    keepAtLeast: number,
  ) => Promise<void>;
  settings: VoxAvatarSettingsSnapshot;
  t: SettingsTranslate;
}

export function SettingsQualityGatePanel({
  bridge,
  busy,
  chooseVrmaReportDir,
  clearVrmaReportDir,
  setVrmaQualityGate,
  setVrmaQualityScoreThresholds,
  settings,
  t,
}: SettingsQualityGatePanelProps) {
  const rejectBelow = settings.vrma_quality_reject_below ?? 60;
  const keepAtLeast = settings.vrma_quality_keep_at_least ?? 75;
  const reviewUpper = Math.max(rejectBelow, keepAtLeast - 1);

  return (
    <section className="settings-panel quality-gate-panel">
      <div className="panel-heading">
        <div>
          <h2>{t('actions.qualityGateTitle')}</h2>
          <p>
            {t('actions.qualityGateDesc', {
              reject: rejectBelow,
              reviewLow: rejectBelow,
              reviewHigh: reviewUpper,
              keep: keepAtLeast,
            })}
          </p>
        </div>
      </div>
      <label className="settings-select-field">
        {t('actions.qualityGateMode')}
        <select
          disabled={busy || !bridge?.setVrmaQualityGate}
          onChange={(event) =>
            void setVrmaQualityGate(
              event.target
                .value as VoxAvatarSettingsSnapshot['vrma_quality_gate'],
            )
          }
          value={settings.vrma_quality_gate ?? 'strict'}
        >
          <option value="report">{t('actions.qualityGate.report')}</option>
          <option value="strict">{t('actions.qualityGate.strict')}</option>
          <option value="off">{t('actions.qualityGate.off')}</option>
        </select>
      </label>
      <div className="quality-score-row">
        <label className="settings-select-field">
          {t('actions.qualityRejectBelow')}
          <input
            disabled={busy || !bridge?.setVrmaQualityScoreThresholds}
            max={100}
            min={0}
            onChange={(event) => {
              const nextReject = Number(event.target.value);
              if (!Number.isFinite(nextReject)) return;
              void setVrmaQualityScoreThresholds(nextReject, keepAtLeast);
            }}
            step={1}
            type="number"
            value={rejectBelow}
          />
        </label>
        <label className="settings-select-field">
          {t('actions.qualityKeepAtLeast')}
          <input
            disabled={busy || !bridge?.setVrmaQualityScoreThresholds}
            max={100}
            min={0}
            onChange={(event) => {
              const nextKeep = Number(event.target.value);
              if (!Number.isFinite(nextKeep)) return;
              void setVrmaQualityScoreThresholds(rejectBelow, nextKeep);
            }}
            step={1}
            type="number"
            value={keepAtLeast}
          />
        </label>
      </div>
      <p className="quality-score-hint">
        {t('actions.qualityScoreHint', {
          reject: rejectBelow,
          reviewLow: rejectBelow,
          reviewHigh: reviewUpper,
          keep: keepAtLeast,
        })}
      </p>
      <div className="report-dir-row">
        <div className="report-dir-copy">
          <strong>{t('actions.reportDirTitle')}</strong>
          <p>{t('actions.reportDirDesc')}</p>
          <code>
            {settings.vrma_report_dir?.trim()
              ? settings.vrma_report_dir
              : t('actions.reportDirScan')}
          </code>
        </div>
        <div className="report-dir-actions">
          <button
            className="secondary-button"
            disabled={busy || !bridge?.chooseVrmaReportDir}
            onClick={() => void chooseVrmaReportDir()}
            type="button"
          >
            {t('actions.reportDirChoose')}
          </button>
          <button
            className="secondary-button"
            disabled={
              busy || !bridge?.clearVrmaReportDir || !settings.vrma_report_dir
            }
            onClick={() => void clearVrmaReportDir()}
            type="button"
          >
            {t('actions.reportDirClear')}
          </button>
        </div>
      </div>
    </section>
  );
}
