import { mcpToolDescriptionKeys } from '../../settings-i18n';

type SettingsTranslate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

export interface SettingsMcpSectionProps {
  copyText: (value: string, label: string) => Promise<void>;
  mcpHealth: 'online' | 'starting' | 'unavailable';
  mcpLoading: boolean;
  mcpServerUrl: string;
  mcpSetupCommand: string;
  mcpStatus: VoxAvatarMcpStatus | null;
  refreshMcpStatus: () => Promise<void>;
  t: SettingsTranslate;
}

export function SettingsMcpSection({
  copyText,
  mcpHealth,
  mcpLoading,
  mcpServerUrl,
  mcpSetupCommand,
  mcpStatus,
  refreshMcpStatus,
  t,
}: SettingsMcpSectionProps) {
  return (
    <>
      <section className="settings-panel mcp-overview-panel">
        <div className="panel-heading">
          <div>
            <h2>{t('mcp.serverTitle')}</h2>
            <p>{t('mcp.serverDesc')}</p>
          </div>
          <span className={`mcp-health-badge ${mcpHealth}`}>
            <i aria-hidden="true" />
            {mcpHealth === 'online'
              ? t('common.online')
              : mcpHealth === 'starting'
                ? t('common.starting')
                : t('common.unavailable')}
          </span>
        </div>

        <div className="mcp-status-grid">
          <article>
            <span>{t('mcp.health')}</span>
            <strong>
              {mcpHealth === 'online'
                ? t('common.ready')
                : mcpHealth === 'starting'
                  ? t('common.starting')
                  : t('common.notRunning')}
            </strong>
            <small>
              {mcpStatus?.checked_at
                ? t('mcp.checkedAt', {
                    time: new Date(mcpStatus.checked_at).toLocaleTimeString(),
                  })
                : t('mcp.waitingBridge')}
            </small>
          </article>
          <article>
            <span>{t('mcp.transport')}</span>
            <strong>
              {mcpStatus?.transport ?? t('mcp.transportDefault')}
            </strong>
            <small>{t('mcp.transportDesc')}</small>
          </article>
          <article>
            <span>{t('mcp.access')}</span>
            <strong>
              {mcpStatus?.local_only === false
                ? t('mcp.accessNetwork')
                : t('mcp.accessLocal')}
            </strong>
            <small>{t('mcp.accessBound')}</small>
          </article>
          <article>
            <span>{t('mcp.version')}</span>
            <strong>v{mcpStatus?.version ?? '—'}</strong>
            <small>{t('mcp.versionDesc')}</small>
          </article>
        </div>

        {mcpStatus?.error && (
          <p className="mcp-error-message" role="alert">
            {mcpStatus.error}
          </p>
        )}
      </section>

      <section className="settings-panel mcp-endpoint-panel">
        <div className="panel-heading">
          <div>
            <h2>{t('mcp.endpointTitle')}</h2>
            <p>{t('mcp.endpointDesc')}</p>
          </div>
          <button
            className="secondary-button"
            disabled={mcpLoading}
            onClick={() => void refreshMcpStatus()}
            type="button"
          >
            {mcpLoading ? t('common.checking') : t('mcp.checkHealth')}
          </button>
        </div>

        <div className="mcp-copy-field">
          <div>
            <span>{t('mcp.serverUrl')}</span>
            <code>{mcpServerUrl}</code>
          </div>
          <button
            className="secondary-button"
            onClick={() => void copyText(mcpServerUrl, t('mcp.serverUrl'))}
            type="button"
          >
            {t('common.copy')}
          </button>
        </div>

        <div className="mcp-copy-field">
          <div>
            <span>{t('mcp.setupCommand')}</span>
            <code>{mcpSetupCommand}</code>
          </div>
          <button
            className="secondary-button"
            onClick={() =>
              void copyText(mcpSetupCommand, t('mcp.setupCommandLabel'))
            }
            type="button"
          >
            {t('common.copy')}
          </button>
        </div>

        <p className="desktop-note">{t('mcp.portNote')}</p>
      </section>

      <section className="settings-panel">
        <div className="panel-heading">
          <div>
            <h2>{t('mcp.toolsTitle')}</h2>
            <p>{t('mcp.toolsDesc')}</p>
          </div>
          <span className="file-pill">
            {t('mcp.toolsCount', {
              count: mcpStatus?.tools.length ?? 4,
            })}
          </span>
        </div>
        <div className="mcp-tool-list">
          {(mcpStatus?.tools ?? mcpToolDescriptionKeys()).map((tool) => (
            <article key={tool}>
              <code>{tool}</code>
              <p>
                {(() => {
                  const key = `mcp.tools.${tool}`;
                  const text = t(key);
                  return text === key ? t('mcp.tools.fallback') : text;
                })()}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="settings-panel">
        <div className="panel-heading">
          <div>
            <h2>{t('mcp.actionsTitle')}</h2>
            <p>{t('mcp.actionsDesc')}</p>
          </div>
          <span className="file-pill">
            {t('mcp.actionsActive', {
              count: mcpStatus?.playable_actions.length ?? 0,
            })}
          </span>
        </div>
        {mcpStatus && mcpStatus.playable_actions.length > 0 ? (
          <div className="mcp-action-list">
            {mcpStatus.playable_actions.map((action) => (
              <code key={action}>{action}</code>
            ))}
          </div>
        ) : (
          <div className="empty-library">
            <strong>{t('mcp.noActionsTitle')}</strong>
            <p>{t('mcp.noActionsDesc')}</p>
          </div>
        )}
        <p className="mcp-session-note">{t('mcp.sessionNote')}</p>
      </section>
    </>
  );
}
