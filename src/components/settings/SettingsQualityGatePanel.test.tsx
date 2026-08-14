import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SettingsQualityGatePanel } from './SettingsQualityGatePanel';
import { SETTINGS_FALLBACK } from '../../settings-defaults';
import { settingsT } from '../../settings-i18n';

describe('SettingsQualityGatePanel', () => {
  it('shows current reject／keep thresholds in copy and inputs', () => {
    const settings: VoxAvatarSettingsSnapshot = {
      ...SETTINGS_FALLBACK,
      vrma_quality_gate: 'strict',
      vrma_quality_reject_below: 55,
      vrma_quality_keep_at_least: 80,
    };
    const html = renderToStaticMarkup(
      <SettingsQualityGatePanel
        bridge={undefined}
        busy={false}
        chooseVrmaReportDir={vi.fn()}
        clearVrmaReportDir={vi.fn()}
        setVrmaQualityGate={vi.fn()}
        setVrmaQualityScoreThresholds={vi.fn()}
        settings={settings}
        t={(key, vars) => settingsT('zh-TW', key, vars)}
      />,
    );
    expect(html).toContain('目錄匯入品質把關');
    expect(html).toContain('value="55"');
    expect(html).toContain('value="80"');
    expect(html).toContain('分數低於 55 淘汰');
    expect(html).toContain('80 以上保留');
    expect(html).toContain('value="strict"');
  });

  it('disables threshold inputs when score API is missing', () => {
    const html = renderToStaticMarkup(
      <SettingsQualityGatePanel
        bridge={{ setVrmaQualityGate: vi.fn() } as never}
        busy={false}
        chooseVrmaReportDir={vi.fn()}
        clearVrmaReportDir={vi.fn()}
        setVrmaQualityGate={vi.fn()}
        setVrmaQualityScoreThresholds={vi.fn()}
        settings={SETTINGS_FALLBACK}
        t={(key, vars) => settingsT('zh-TW', key, vars)}
      />,
    );
    expect(html).toContain('type="number"');
    expect(html).toContain('disabled=""');
  });

  it('does not describe an impossible review range when thresholds are equal', () => {
    const html = renderToStaticMarkup(
      <SettingsQualityGatePanel
        bridge={undefined}
        busy={false}
        chooseVrmaReportDir={vi.fn()}
        clearVrmaReportDir={vi.fn()}
        setVrmaQualityGate={vi.fn()}
        setVrmaQualityScoreThresholds={vi.fn()}
        settings={{
          ...SETTINGS_FALLBACK,
          vrma_quality_reject_below: 75,
          vrma_quality_keep_at_least: 75,
        }}
        t={(key, vars) => settingsT('zh-TW', key, vars)}
      />,
    );

    expect(html).toContain('未設觀察區間');
    expect(html).not.toContain('75–75');
  });
});
