import { resolveListenerStatusDetail } from '../../listener-status-copy';

type SettingsBridge = NonNullable<Window['voxavatarSettings']>;

type SettingsTranslate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

export interface SettingsVoiceSectionProps {
  bridge: SettingsBridge | undefined;
  busy: boolean;
  chooseApplicationSource: (source: VoxAvatarVoiceSourceCatalogEntry) => void;
  chooseVoiceMode: (mode: VoxAvatarVoiceSourceSettings['mode']) => void;
  copyText: (value: string, label: string) => Promise<void>;
  listenerStateKey: string;
  listenerStatus: VoxAvatarVoiceSourceCatalog['listener'];
  refreshVoiceSources: () => Promise<void>;
  saveCustomVoiceSource: () => void;
  selectedVoiceSourceAvailable: boolean;
  setVoiceMode: (mode: VoxAvatarVoiceSourceSettings['mode']) => void;
  setVoicePattern: (value: string) => void;
  setVoiceSourceSearch: (value: string) => void;
  settings: VoxAvatarSettingsSnapshot;
  t: SettingsTranslate;
  visibleVoiceSources: VoxAvatarVoiceSourceCatalogEntry[];
  voiceCatalog: VoxAvatarVoiceSourceCatalog | null;
  voiceHeading: string;
  voiceMode: VoxAvatarVoiceSourceSettings['mode'];
  voicePattern: string;
  voiceSourceDirty: boolean;
  voiceSourceSearch: string;
  voiceSourcesLoading: boolean;
}

export function SettingsVoiceSection({
  bridge,
  busy,
  chooseApplicationSource,
  chooseVoiceMode,
  copyText,
  listenerStateKey,
  listenerStatus,
  refreshVoiceSources,
  saveCustomVoiceSource,
  selectedVoiceSourceAvailable,
  setVoiceMode,
  setVoicePattern,
  setVoiceSourceSearch,
  settings,
  t,
  visibleVoiceSources,
  voiceCatalog,
  voiceHeading,
  voiceMode,
  voicePattern,
  voiceSourceDirty,
  voiceSourceSearch,
  voiceSourcesLoading,
}: SettingsVoiceSectionProps) {
  return (
    <>

<section className="settings-panel voice-source-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t('voice.chooseTitle')}</h2>
                    <p>{t('voice.chooseDesc')}</p>
                  </div>
                </div>

                <div
                  aria-label={t('voice.modeAria')}
                  className="voice-mode-grid"
                  role="group"
                >
                  <button
                    aria-pressed={voiceMode === 'default'}
                    data-testid="voice-mode-default"
                    disabled={busy || !bridge}
                    onClick={() => chooseVoiceMode('default')}
                    type="button"
                  >
                    <span className="voice-mode-icon" aria-hidden="true">
                      A
                    </span>
                    <strong>{t('voice.mode.default.title')}</strong>
                    <small>{t('voice.mode.default.desc')}</small>
                  </button>
                  <button
                    aria-pressed={voiceMode === 'application'}
                    data-testid="voice-mode-application"
                    disabled={busy || !bridge}
                    onClick={() => setVoiceMode('application')}
                    type="button"
                  >
                    <span className="voice-mode-icon" aria-hidden="true">
                      ◎
                    </span>
                    <strong>{t('voice.mode.application.title')}</strong>
                    <small>{t('voice.mode.application.desc')}</small>
                  </button>
                  <button
                    aria-pressed={voiceMode === 'output'}
                    data-testid="voice-mode-output"
                    disabled={busy || !bridge}
                    onClick={() => chooseVoiceMode('output')}
                    type="button"
                  >
                    <span className="voice-mode-icon" aria-hidden="true">
                      ♪
                    </span>
                    <strong>{t('voice.mode.output.title')}</strong>
                    <small>{t('voice.mode.output.desc')}</small>
                  </button>
                  <button
                    aria-pressed={voiceMode === 'custom'}
                    data-testid="voice-mode-custom"
                    disabled={busy || !bridge}
                    onClick={() => setVoiceMode('custom')}
                    type="button"
                  >
                    <span className="voice-mode-icon" aria-hidden="true">
                      .*
                    </span>
                    <strong>{t('voice.mode.custom.title')}</strong>
                    <small>{t('voice.mode.custom.desc')}</small>
                  </button>
                  <button
                    aria-pressed={voiceMode === 'external'}
                    data-testid="voice-mode-external"
                    disabled={busy || !bridge}
                    onClick={() => chooseVoiceMode('external')}
                    type="button"
                  >
                    <span className="voice-mode-icon" aria-hidden="true">
                      ↗
                    </span>
                    <strong>{t('voice.mode.external.title')}</strong>
                    <small>{t('voice.mode.external.desc')}</small>
                  </button>
                </div>
              </section>

              {voiceMode === 'output' && (
                <section
                  className="settings-panel voice-privacy-panel"
                  data-testid="voice-output-privacy"
                  role="note"
                >
                  <div className="panel-heading">
                    <div>
                      <h2>{t('voice.outputPrivacyTitle')}</h2>
                      <p>{t('voice.outputPrivacyWarn')}</p>
                    </div>
                  </div>
                </section>
              )}

              {voiceMode === 'application' && (
                <section className="settings-panel voice-application-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>{t('voice.applicationTitle')}</h2>
                      <p>{t('voice.applicationDesc')}</p>
                    </div>
                    <button
                      className="secondary-button"
                      disabled={voiceSourcesLoading || !bridge}
                      onClick={() => void refreshVoiceSources()}
                      type="button"
                    >
                      {voiceSourcesLoading
                        ? t('common.refreshing')
                        : t('common.refresh')}
                    </button>
                  </div>

                  <label className="voice-source-search">
                    <span>{t('voice.filterLabel')}</span>
                    <input
                      onChange={(event) =>
                        setVoiceSourceSearch(event.currentTarget.value)
                      }
                      placeholder={t('voice.filterPlaceholder')}
                      type="search"
                      value={voiceSourceSearch}
                    />
                  </label>

                  {!voiceSourcesLoading &&
                    voiceCatalog &&
                    settings.voice_source.mode === 'application' &&
                    !selectedVoiceSourceAvailable && (
                      <div className="voice-saved-source">
                        <div>
                          <strong>
                            {settings.voice_source.source_name ??
                              t('voice.savedApplication')}
                          </strong>
                          <small>{t('voice.notRunning')}</small>
                        </div>
                        <span className="source-state unavailable">
                          {t('common.unavailable')}
                        </span>
                      </div>
                    )}

                  <div className="voice-source-list">
                    {visibleVoiceSources.map((source) => {
                      const selected =
                        settings.voice_source.mode === 'application' &&
                        settings.voice_source.source_id === source.id;
                      return (
                        <button
                          aria-pressed={selected}
                          disabled={busy || !bridge}
                          key={source.id}
                          onClick={() => chooseApplicationSource(source)}
                          type="button"
                        >
                          <span className="source-app-mark" aria-hidden="true">
                            {source.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="source-copy">
                            <strong>{source.name}</strong>
                            <small>{source.detail}</small>
                          </span>
                          <span
                            className={`source-state ${
                              selected ? 'selected' : ''
                            }`}
                          >
                            {selected
                              ? t('common.selected')
                              : t('common.available')}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {voiceCatalog?.error && (
                    <p className="mcp-error-message" role="alert">
                      {voiceCatalog.error}
                    </p>
                  )}

                  {!voiceSourcesLoading &&
                    voiceCatalog &&
                    !voiceCatalog?.error &&
                    visibleVoiceSources.length === 0 && (
                      <div className="empty-library">
                        <strong>{t('voice.noMatchesTitle')}</strong>
                        <p>{t('voice.noMatchesDesc')}</p>
                      </div>
                    )}
                </section>
              )}

              {voiceMode === 'custom' && (
                <section className="settings-panel voice-pattern-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>{t('voice.patternTitle')}</h2>
                      <p>{t('voice.patternDesc')}</p>
                    </div>
                  </div>
                  <label className="voice-pattern-field">
                    <span>{t('voice.patternLabel')}</span>
                    <input
                      aria-label={t('voice.patternAria')}
                      data-testid="voice-process-pattern"
                      disabled={busy || !bridge}
                      onChange={(event) =>
                        setVoicePattern(event.currentTarget.value)
                      }
                      placeholder={t('voice.patternPlaceholder')}
                      spellCheck={false}
                      type="text"
                      value={voicePattern}
                    />
                  </label>
                  <p className="theme-note">{t('voice.patternNote')}</p>
                  <div className="panel-actions">
                    <button
                      className="primary-button"
                      data-testid="voice-source-save"
                      disabled={
                        busy ||
                        !bridge ||
                        !voiceSourceDirty ||
                        !voicePattern.trim()
                      }
                      onClick={saveCustomVoiceSource}
                      type="button"
                    >
                      {t('voice.savePattern')}
                    </button>
                  </div>
                </section>
              )}

              {voiceMode === 'external' && (
                <section className="settings-panel voice-external-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>{t('voice.externalTitle')}</h2>
                      <p>{t('voice.externalDesc')}</p>
                    </div>
                  </div>
                  <div className="mcp-copy-field">
                    <div>
                      <span>{t('voice.eventsEndpoint')}</span>
                      <code>
                        {voiceCatalog?.events_url ??
                          'http://127.0.0.1:47831/events'}
                      </code>
                    </div>
                    <button
                      className="secondary-button"
                      onClick={() =>
                        void copyText(
                          voiceCatalog?.events_url ??
                            'http://127.0.0.1:47831/events',
                          t('voice.eventsEndpoint'),
                        )
                      }
                      type="button"
                    >
                      {t('common.copy')}
                    </button>
                  </div>
                  <p className="desktop-note">{t('voice.externalNote')}</p>
                </section>
              )}

              <section className="settings-panel voice-status-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t('voice.statusTitle')}</h2>
                    <p>{t('voice.statusDesc')}</p>
                  </div>
                  <button
                    className="secondary-button"
                    disabled={voiceSourcesLoading || !bridge}
                    onClick={() => void refreshVoiceSources()}
                    type="button"
                  >
                    {t('common.checkStatus')}
                  </button>
                </div>
                <div className="voice-status-grid">
                  <article>
                    <span>{t('voice.statusMode')}</span>
                    <strong>{voiceHeading}</strong>
                    <small>
                      {settings.voice_source.mode === 'custom'
                        ? settings.voice_source.process_pattern
                        : settings.voice_source.mode === 'external'
                          ? t('voice.detail.loopback')
                          : (settings.voice_source.source_name ??
                            t('voice.detail.chatgptCodex'))}
                    </small>
                  </article>
                  <article>
                    <span>{t('voice.statusState')}</span>
                    <strong>
                      {settings.voice_source.mode === 'external'
                        ? t('voice.state.waitingEvents')
                        : t(listenerStateKey)}
                    </strong>
                    <small>
                      {resolveListenerStatusDetail(listenerStatus, t)}
                    </small>
                    {listenerStatus?.state === 'missing' ||
                    listenerStatus?.helper_error ===
                      'native_helper_missing' ? (
                      <small className="desktop-note">
                        {t('helper.missingHint')}
                      </small>
                    ) : null}
                  </article>
                  <article>
                    <span>{t('voice.statusAvailable')}</span>
                    <strong>{voiceCatalog?.sources.length ?? 0}</strong>
                    <small>{t('voice.statusRunningApps')}</small>
                  </article>
                </div>
              </section>

    </>
  );
}
