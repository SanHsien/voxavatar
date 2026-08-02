/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsVoiceSection } from './SettingsVoiceSection';
import { SETTINGS_FALLBACK } from '../../settings-defaults';
import { settingsT } from '../../settings-i18n';

describe('SettingsVoiceSection interaction', () => {
  it('hides the output privacy warning as soon as UI mode leaves output', async () => {
    const user = userEvent.setup();
    const chooseVoiceMode = vi.fn();

    const baseProps = {
      bridge: {
        get: vi.fn(),
      } as unknown as NonNullable<Window['voxavatarSettings']>,
      busy: false,
      chooseApplicationSource: vi.fn(),
      chooseVoiceMode,
      copyText: vi.fn(),
      listenerStateKey: 'helper.state.idle',
      listenerStatus: null,
      refreshVoiceSources: vi.fn(),
      saveCustomVoiceSource: vi.fn(),
      selectedVoiceSourceAvailable: false,
      setVoiceMode: vi.fn(),
      setVoicePattern: vi.fn(),
      setVoiceSourceSearch: vi.fn(),
      settings: {
        ...SETTINGS_FALLBACK,
        voice_source: {
          mode: 'output' as const,
          process_pattern: null,
          source_id: null,
          source_name: null,
        },
      },
      t: (key: string, vars?: Record<string, string | number>) =>
        settingsT('zh-TW', key, vars),
      visibleVoiceSources: [],
      voiceCatalog: null,
      voiceHeading: '語音',
      voicePattern: '',
      voiceSourceDirty: false,
      voiceSourceSearch: '',
      voiceSourcesLoading: false,
    };

    const { rerender } = render(
      <SettingsVoiceSection {...baseProps} voiceMode="output" />,
    );
    expect(screen.getByTestId('voice-output-privacy')).toBeTruthy();

    await user.click(screen.getByTestId('voice-mode-external'));
    expect(chooseVoiceMode).toHaveBeenCalledWith('external');

    rerender(<SettingsVoiceSection {...baseProps} voiceMode="external" />);
    expect(screen.queryByTestId('voice-output-privacy')).toBeNull();
  });
});
