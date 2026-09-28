/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsModelsSection } from './SettingsModelsSection';
import { SETTINGS_FALLBACK } from '../../settings-defaults';
import { settingsT } from '../../settings-i18n';

describe('SettingsModelsSection interaction', () => {
  it('calls import handlers from spaced action buttons', async () => {
    const user = userEvent.setup();
    const importModel = vi.fn(async () => undefined);
    const importModelsFromDirectory = vi.fn(async () => undefined);
    const bridge = {
      importModel: vi.fn(),
      importModelsFromDirectory: vi.fn(),
      deleteAllUserModels: vi.fn(),
      chooseVrmaReportDir: vi.fn(),
      clearVrmaReportDir: vi.fn(),
    } as unknown as NonNullable<Window['voxavatarSettings']>;

    render(
      <SettingsModelsSection
        bridge={bridge}
        busy={false}
        chooseVrmaReportDir={vi.fn()}
        clearVrmaReportDir={vi.fn()}
        customModelCount={0}
        deleteAllUserModels={vi.fn()}
        deleteModel={vi.fn()}
        importModel={importModel}
        importModelsFromDirectory={importModelsFromDirectory}
        modelName="Studio"
        selectedModel={undefined}
        setDefaultModel={vi.fn()}
        setModelName={vi.fn()}
        setSelectedModelId={vi.fn()}
        setVrmaQualityGate={vi.fn()}
        setVrmaQualityScoreThresholds={vi.fn()}
        settings={SETTINGS_FALLBACK}
        t={(key, vars) => settingsT('zh-TW', key, vars)}
      />,
    );

    await user.click(
      screen.getByRole('button', {
        name: settingsT('zh-TW', 'models.chooseVrm'),
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: settingsT('zh-TW', 'models.chooseVrmFolder'),
      }),
    );
    expect(importModel).toHaveBeenCalledTimes(1);
    expect(importModelsFromDirectory).toHaveBeenCalledTimes(1);
  });
});
