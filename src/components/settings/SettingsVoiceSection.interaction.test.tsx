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

  it('shows human-readable helper missing hint without raw paths', () => {
    render(
      <SettingsVoiceSection
        bridge={
          { get: vi.fn() } as unknown as NonNullable<
            Window['voxavatarSettings']
          >
        }
        busy={false}
        chooseApplicationSource={vi.fn()}
        chooseVoiceMode={vi.fn()}
        copyText={vi.fn()}
        listenerStateKey="helper.state.missing"
        listenerStatus={{
          available: false,
          capturing: false,
          monitoring: false,
          state: 'missing',
          helper_error: 'native_helper_missing',
          error: 'C:\\Users\\SanHsien\\voxavatar-audio-listener.exe missing',
          source: null,
        }}
        refreshVoiceSources={vi.fn()}
        saveCustomVoiceSource={vi.fn()}
        selectedVoiceSourceAvailable={false}
        setVoiceMode={vi.fn()}
        setVoicePattern={vi.fn()}
        setVoiceSourceSearch={vi.fn()}
        settings={{
          ...SETTINGS_FALLBACK,
          voice_source: {
            mode: 'application' as const,
            process_pattern: null,
            source_id: null,
            source_name: null,
          },
        }}
        t={(key: string, vars?: Record<string, string | number>) =>
          settingsT('zh-TW', key, vars)
        }
        visibleVoiceSources={[]}
        voiceCatalog={null}
        voiceHeading="語音"
        voicePattern=""
        voiceSourceDirty={false}
        voiceSourceSearch=""
        voiceSourcesLoading={false}
        voiceMode="application"
      />,
    );

    expect(
      screen.getByText(
        settingsT('zh-TW', 'helper.error.native_helper_missing'),
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(settingsT('zh-TW', 'helper.missingHint')),
    ).toBeTruthy();
    expect(screen.queryByText(/SanHsien/i)).toBeNull();
  });

  it('selects application voice mode from the segmented control', async () => {
    const user = userEvent.setup();
    const setVoiceMode = vi.fn();
    render(
      <SettingsVoiceSection
        bridge={
          { get: vi.fn() } as unknown as NonNullable<
            Window['voxavatarSettings']
          >
        }
        busy={false}
        chooseApplicationSource={vi.fn()}
        chooseVoiceMode={vi.fn()}
        copyText={vi.fn()}
        listenerStateKey="helper.state.idle"
        listenerStatus={null}
        refreshVoiceSources={vi.fn()}
        saveCustomVoiceSource={vi.fn()}
        selectedVoiceSourceAvailable={false}
        setVoiceMode={setVoiceMode}
        setVoicePattern={vi.fn()}
        setVoiceSourceSearch={vi.fn()}
        settings={{
          ...SETTINGS_FALLBACK,
          voice_source: {
            mode: 'output',
            process_pattern: null,
            source_id: null,
            source_name: null,
          },
        }}
        t={(key, vars) => settingsT('zh-TW', key, vars)}
        visibleVoiceSources={[]}
        voiceCatalog={null}
        voiceHeading="語音"
        voiceMode="output"
        voicePattern=""
        voiceSourceDirty={false}
        voiceSourceSearch=""
        voiceSourcesLoading={false}
      />,
    );

    await user.click(screen.getByTestId('voice-mode-application'));
    expect(setVoiceMode).toHaveBeenCalledWith('application');
  });
});
