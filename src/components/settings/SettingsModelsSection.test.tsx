import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SettingsModelsSection } from './SettingsModelsSection';
import { SETTINGS_FALLBACK } from '../../settings-defaults';
import { settingsT } from '../../settings-i18n';

function noopProps(
  overrides: Partial<React.ComponentProps<typeof SettingsModelsSection>> = {},
): React.ComponentProps<typeof SettingsModelsSection> {
  return {
    bridge: undefined,
    busy: false,
    chooseVrmaReportDir: vi.fn(),
    clearVrmaReportDir: vi.fn(),
    customModelCount: 0,
    deleteAllUserModels: vi.fn(),
    deleteModel: vi.fn(),
    importModel: vi.fn(),
    importModelsFromDirectory: vi.fn(),
    modelName: '',
    selectedModel: undefined,
    setDefaultModel: vi.fn(),
    setModelName: vi.fn(),
    setSelectedModelId: vi.fn(),
    setVrmaQualityGate: vi.fn(),
    setVrmaQualityScoreThresholds: vi.fn(),
    settings: SETTINGS_FALLBACK,
    t: (key, vars) => settingsT('zh-TW', key, vars),
    ...overrides,
  };
}

describe('SettingsModelsSection', () => {
  it('spaces import buttons with form-actions model-import-actions', () => {
    const t = (key: string, vars?: Record<string, string | number>) =>
      settingsT('zh-TW', key, vars);
    const html = renderToStaticMarkup(
      <SettingsModelsSection {...noopProps({ t })} />,
    );
    expect(html).toContain('form-actions model-import-actions');
    expect(html).toContain(t('models.chooseVrm'));
    expect(html).toContain(t('models.chooseVrmFolder'));
    expect(html).toContain('disabled');
  });
});
