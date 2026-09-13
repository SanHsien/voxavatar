/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsQualityGatePanel } from './SettingsQualityGatePanel';
import { SETTINGS_FALLBACK } from '../../settings-defaults';
import { settingsT } from '../../settings-i18n';

describe('SettingsQualityGatePanel interaction', () => {
  it('changes gate mode and score thresholds', async () => {
    const user = userEvent.setup();
    const setVrmaQualityGate = vi.fn(async () => undefined);
    const setVrmaQualityScoreThresholds = vi.fn(async () => undefined);
    const bridge = {
      setVrmaQualityGate,
      setVrmaQualityScoreThresholds,
      chooseVrmaReportDir: vi.fn(),
      clearVrmaReportDir: vi.fn(),
    } as unknown as NonNullable<Window['voxavatarSettings']>;

    const settings: VoxAvatarSettingsSnapshot = {
      ...SETTINGS_FALLBACK,
      vrma_quality_gate: 'strict',
      vrma_quality_reject_below: 60,
      vrma_quality_keep_at_least: 75,
    };

    const { container } = render(
      <SettingsQualityGatePanel
        bridge={bridge}
        busy={false}
        chooseVrmaReportDir={vi.fn(async () => undefined)}
        clearVrmaReportDir={vi.fn(async () => undefined)}
        setVrmaQualityGate={setVrmaQualityGate}
        setVrmaQualityScoreThresholds={setVrmaQualityScoreThresholds}
        settings={settings}
        t={(key, vars) => settingsT('zh-TW', key, vars)}
      />,
    );

    const modeField = screen.getByText(
      settingsT('zh-TW', 'actions.qualityGateMode'),
      { selector: 'label' },
    );
    await user.selectOptions(within(modeField).getByRole('combobox'), 'report');
    expect(setVrmaQualityGate).toHaveBeenCalledWith('report');

    const rejectField = screen.getByText(
      settingsT('zh-TW', 'actions.qualityRejectBelow'),
      { selector: 'label' },
    );
    fireEvent.change(within(rejectField).getByRole('spinbutton'), {
      target: { value: '55' },
    });
    expect(setVrmaQualityScoreThresholds).toHaveBeenCalledWith(55, 75);

    const keepField = screen.getByText(
      settingsT('zh-TW', 'actions.qualityKeepAtLeast'),
      { selector: 'label' },
    );
    fireEvent.change(within(keepField).getByRole('spinbutton'), {
      target: { value: '80' },
    });
    expect(setVrmaQualityScoreThresholds).toHaveBeenCalledWith(60, 80);
    expect(container.querySelector('.quality-gate-panel')).not.toBeNull();
  });

  it('chooses and clears the report directory', async () => {
    const user = userEvent.setup();
    const chooseVrmaReportDir = vi.fn(async () => undefined);
    const clearVrmaReportDir = vi.fn(async () => undefined);
    const bridge = {
      setVrmaQualityGate: vi.fn(),
      setVrmaQualityScoreThresholds: vi.fn(),
      chooseVrmaReportDir: vi.fn(),
      clearVrmaReportDir: vi.fn(),
    } as unknown as NonNullable<Window['voxavatarSettings']>;

    const { rerender, container } = render(
      <SettingsQualityGatePanel
        bridge={bridge}
        busy={false}
        chooseVrmaReportDir={chooseVrmaReportDir}
        clearVrmaReportDir={clearVrmaReportDir}
        setVrmaQualityGate={vi.fn(async () => undefined)}
        setVrmaQualityScoreThresholds={vi.fn(async () => undefined)}
        settings={{
          ...SETTINGS_FALLBACK,
          vrma_report_dir: null,
        }}
        t={(key, vars) => settingsT('zh-TW', key, vars)}
      />,
    );

    await user.click(
      within(container).getByRole('button', {
        name: settingsT('zh-TW', 'actions.reportDirChoose'),
      }),
    );
    expect(chooseVrmaReportDir).toHaveBeenCalledTimes(1);

    rerender(
      <SettingsQualityGatePanel
        bridge={bridge}
        busy={false}
        chooseVrmaReportDir={chooseVrmaReportDir}
        clearVrmaReportDir={clearVrmaReportDir}
        setVrmaQualityGate={vi.fn(async () => undefined)}
        setVrmaQualityScoreThresholds={vi.fn(async () => undefined)}
        settings={{
          ...SETTINGS_FALLBACK,
          vrma_report_dir: 'C:\\Reports',
        }}
        t={(key, vars) => settingsT('zh-TW', key, vars)}
      />,
    );

    await user.click(
      within(container).getByRole('button', {
        name: settingsT('zh-TW', 'actions.reportDirClear'),
      }),
    );
    expect(clearVrmaReportDir).toHaveBeenCalledTimes(1);
  });
});
