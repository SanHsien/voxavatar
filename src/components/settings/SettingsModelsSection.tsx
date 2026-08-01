type SettingsBridge = NonNullable<Window['voxavatarSettings']>;

type SettingsTranslate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

export interface SettingsModelsSectionProps {
  bridge: SettingsBridge | undefined;
  busy: boolean;
  chooseVrmaReportDir: () => Promise<void>;
  clearVrmaReportDir: () => Promise<void>;
  customModelCount: number;
  deleteAllUserModels: () => void;
  deleteModel: (model: VoxAvatarModelSettings) => void;
  importModel: () => Promise<void>;
  importModelsFromDirectory: () => Promise<void>;
  modelName: string;
  selectedModel: VoxAvatarModelSettings | undefined;
  setDefaultModel: (modelId: string) => Promise<void>;
  setModelName: (value: string) => void;
  setSelectedModelId: (id: string) => void;
  setVrmaQualityGate: (
    value: VoxAvatarSettingsSnapshot['vrma_quality_gate'],
  ) => Promise<void>;
  settings: VoxAvatarSettingsSnapshot;
  t: SettingsTranslate;
}

export function SettingsModelsSection({
  bridge,
  busy,
  chooseVrmaReportDir,
  clearVrmaReportDir,
  customModelCount,
  deleteAllUserModels,
  deleteModel,
  importModel,
  importModelsFromDirectory,
  modelName,
  selectedModel,
  setDefaultModel,
  setModelName,
  setSelectedModelId,
  setVrmaQualityGate,
  settings,
  t,
}: SettingsModelsSectionProps) {
  return (
    <>
      <section className="settings-panel">
        <div className="panel-heading">
          <div>
            <h2>{t('models.libraryTitle')}</h2>
            <p>{t('models.libraryDesc')}</p>
          </div>
          <button
            className="secondary-button danger-text-button"
            disabled={
              busy || !bridge?.deleteAllUserModels || customModelCount === 0
            }
            onClick={() => deleteAllUserModels()}
            type="button"
          >
            {t('models.deleteAll')}
          </button>
        </div>
        <div className="asset-grid">
          {settings.models.length === 0 && (
            <div className="empty-library first-run-guide">
              <strong>{t('models.empty.title')}</strong>
              <p>{t('models.empty.intro')}</p>
              <p>{t('models.empty.sourcesHeading')}</p>
              <ul className="settings-steps first-run-links">
                <li>
                  <a href="https://hub.vroid.com/" rel="noreferrer" target="_blank">
                    VRoid Hub
                  </a>
                  {t('common.listDescSep')}
                  {t('models.empty.linkVroidHubDesc')}
                </li>
                <li>
                  <a href="https://booth.pm/" rel="noreferrer" target="_blank">
                    BOOTH
                  </a>
                  {t('common.listDescSep')}
                  {t('models.empty.linkBoothDesc')}
                </li>
                <li>
                  <a
                    href="https://tyc.rei-yumesaki.net/material/avatar/3d-a/"
                    rel="noreferrer"
                    target="_blank"
                  >
                    つくよみちゃん 公式 3D タイプA
                  </a>
                  {t('common.listDescSep')}
                  {t('models.empty.linkTsukuyomiDesc')}
                </li>
                <li>
                  <a
                    href="https://hub.vroid.com/en/characters/3131752290308902516/models/6951337039436301724"
                    rel="noreferrer"
                    target="_blank"
                  >
                    Angel v1.2.4
                  </a>
                  {t('common.listDescSep')}
                  {t('models.empty.linkAngelDesc')}
                </li>
                <li>
                  <a
                    href="https://hub.vroid.com/en/characters/3437260818058077430/models/4604979810309943843"
                    rel="noreferrer"
                    target="_blank"
                  >
                    ポニーテルの女の子（水色2）
                  </a>
                  {t('common.listDescSep')}
                  {t('models.empty.linkPonytailDesc')}
                </li>
                <li>
                  <a
                    href="https://hub.vroid.com/en/characters/5216127528712133624/models/5722719060381403696"
                    rel="noreferrer"
                    target="_blank"
                  >
                    Ki（Free model）
                  </a>
                  {t('common.listDescSep')}
                  {t('models.empty.linkKiDesc')}
                </li>
                <li>
                  <a
                    href="https://hub.vroid.com/en/characters/1248981995540129234/models/8640547963669442173"
                    rel="noreferrer"
                    target="_blank"
                  >
                    AvatarSample_C
                  </a>
                  {t('common.listDescSep')}
                  {t('models.empty.linkSampleCDesc')}
                </li>
                <li>
                  <a href="https://tohozunko.booth.pm/" rel="noreferrer" target="_blank">
                    東北ずん子・ずんだもん 官方商店
                  </a>
                  {t('common.listDescSep')}
                  {t('models.empty.linkTohokuDesc')}
                </li>
                <li>
                  <a href="https://vroid.com/studio" rel="noreferrer" target="_blank">
                    VRoid Studio
                  </a>
                  {t('common.listDescSep')}
                  {t('models.empty.linkStudioDesc')}
                </li>
              </ul>
              <p>
                {t('models.empty.afterDownloadPrefix')}{' '}
                <a href="https://booth.pm/en/items/5512385" rel="noreferrer" target="_blank">
                  {t('models.empty.vrmaPackLink')}
                </a>
                {t('models.empty.afterDownloadSuffix')}
              </p>
            </div>
          )}
          {settings.models.map((model) => {
            const selected = model.id === selectedModel?.id;
            const isDefault = model.id === settings.default_model_id;
            return (
              <article
                className={`asset-card ${selected ? 'selected' : ''}`}
                key={model.id}
              >
                <button
                  className="asset-card-main"
                  onClick={() => setSelectedModelId(model.id)}
                  type="button"
                >
                  <span className="asset-icon">VRM</span>
                  <span>
                    <strong>{model.model_name}</strong>
                    <small>
                      {model.origin === 'packaged'
                        ? t('models.packagedModel')
                        : t('models.userModel')}
                    </small>
                  </span>
                </button>
                <div className="asset-card-footer">
                  {isDefault ? (
                    <span className="default-badge">{t('models.defaultBadge')}</span>
                  ) : (
                    <button
                      disabled={busy || !bridge}
                      onClick={() => void setDefaultModel(model.id)}
                      type="button"
                    >
                      {t('models.makeDefault')}
                    </button>
                  )}
                  <div className="asset-card-actions">
                    <button
                      onClick={() => setSelectedModelId(model.id)}
                      type="button"
                    >
                      {t('common.preview')}
                    </button>
                    {model.removable && (
                      <button
                        className="danger-text-button"
                        disabled={busy || !bridge}
                        onClick={() => void deleteModel(model)}
                        type="button"
                      >
                        {t('common.delete')}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="settings-panel quality-gate-panel">
        <div className="panel-heading">
          <div>
            <h2>{t('actions.qualityGateTitle')}</h2>
            <p>{t('actions.qualityGateDesc')}</p>
          </div>
        </div>
        <label className="settings-select-field">
          {t('actions.qualityGateTitle')}
          <select
            disabled={busy || !bridge?.setVrmaQualityGate}
            onChange={(event) =>
              void setVrmaQualityGate(
                event.target.value as VoxAvatarSettingsSnapshot['vrma_quality_gate'],
              )
            }
            value={settings.vrma_quality_gate ?? 'strict'}
          >
            <option value="report">{t('actions.qualityGate.report')}</option>
            <option value="strict">{t('actions.qualityGate.strict')}</option>
            <option value="off">{t('actions.qualityGate.off')}</option>
          </select>
        </label>
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

      <section className="settings-panel import-panel">
        <div className="panel-heading">
          <div>
            <h2>{t('models.addTitle')}</h2>
            <p>{t('models.addDesc')}</p>
          </div>
          <span className="file-pill">.vrm</span>
        </div>
        <label>
          {t('models.nameLabel')}
          <input
            maxLength={80}
            onChange={(event) => setModelName(event.target.value)}
            placeholder={t('models.namePlaceholder')}
            value={modelName}
          />
        </label>
        <button
          className="primary-button"
          disabled={busy || !bridge}
          onClick={() => void importModel()}
          type="button"
        >
          {t('models.chooseVrm')}
        </button>
        <button
          className="secondary-button"
          disabled={busy || !bridge?.importModelsFromDirectory}
          onClick={() => void importModelsFromDirectory()}
          type="button"
        >
          {t('models.chooseVrmFolder')}
        </button>
        <p className="desktop-note">{t('models.chooseVrmFolderHint')}</p>
        {!bridge && <p className="desktop-note">{t('models.desktopOnly')}</p>}
      </section>
    </>
  );
}
