import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SettingsVoiceSection } from './SettingsVoiceSection';
import { SETTINGS_FALLBACK } from '../../settings-defaults';
import { settingsT } from '../../settings-i18n';

function renderVoice(voiceMode: VoxAvatarVoiceSourceSettings['mode']) {
  const settings: VoxAvatarSettingsSnapshot = {
    ...SETTINGS_FALLBACK,
    // 模擬設定尚未寫入完成：仍為 output，但 UI 選取已切走
    voice_source: {
      mode: 'output',
      process_pattern: null,
      source_id: null,
      source_name: null,
    },
  };
  return renderToStaticMarkup(
    <SettingsVoiceSection
      bridge={undefined}
      busy={false}
      chooseApplicationSource={vi.fn()}
      chooseVoiceMode={vi.fn()}
      copyText={vi.fn()}
      listenerStateKey="helper.state.idle"
      listenerStatus={null}
      refreshVoiceSources={vi.fn()}
      saveCustomVoiceSource={vi.fn()}
      selectedVoiceSourceAvailable={false}
      setVoiceMode={vi.fn()}
      setVoicePattern={vi.fn()}
      setVoiceSourceSearch={vi.fn()}
      settings={settings}
      t={(key, vars) => settingsT('zh-TW', key, vars)}
      visibleVoiceSources={[]}
      voiceCatalog={null}
      voiceHeading="語音"
      voiceMode={voiceMode}
      voicePattern=""
      voiceSourceDirty={false}
      voiceSourceSearch=""
      voiceSourcesLoading={false}
    />,
  );
}

describe('SettingsVoiceSection output privacy warning', () => {
  it('shows privacy warning only while output mode is selected in the UI', () => {
    expect(renderVoice('output')).toContain('voice-output-privacy');
  });

  it('hides privacy warning immediately when UI mode leaves output even if settings lag', () => {
    expect(renderVoice('default')).not.toContain('voice-output-privacy');
    expect(renderVoice('application')).not.toContain('voice-output-privacy');
    expect(renderVoice('custom')).not.toContain('voice-output-privacy');
    expect(renderVoice('external')).not.toContain('voice-output-privacy');
  });
});
