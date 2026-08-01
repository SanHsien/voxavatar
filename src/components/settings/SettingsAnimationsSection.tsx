import type { Dispatch, SetStateAction } from 'react';
import {
  ACTION_PRESETS,
  resolveActionPreset,
  type ActionPresetDefinition,
} from '../../action-presets';

type SettingsBridge = NonNullable<Window['voxavatarSettings']>;

type SettingsTranslate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

export interface SettingsAnimationsSectionProps {
  addAnimationClips: (animation: VoxAvatarAnimationSettings) => Promise<void>;
  addAnimationClipsFromDirectory: (
    animation: VoxAvatarAnimationSettings,
  ) => Promise<void>;
  animationMetadata: CustomAnimationMetadata;
  applyActionPreset: (preset: ActionPresetDefinition) => void;
  applyAndCreateActionPreset: (preset: ActionPresetDefinition) => Promise<void>;
  beginEditingAnimation: (animation: VoxAvatarAnimationSettings) => void;
  bridge: SettingsBridge | undefined;
  busy: boolean;
  chooseVrmaReportDir: () => Promise<void>;
  clearVrmaReportDir: () => Promise<void>;
  createAnimation: () => Promise<void>;
  deleteAllUserAnimationClips: () => void;
  deleteAnimation: (animation: VoxAvatarAnimationSettings) => void;
  deleteAnimationClip: (
    animation: VoxAvatarAnimationSettings,
    clip: VoxAvatarAnimationClipSettings,
  ) => void;
  editingAnimationId: string | null;
  editingAnimationMetadata: CustomAnimationMetadata;
  locale: 'zh-TW' | 'en';
  playAnimationClip: (
    animation: VoxAvatarAnimationSettings,
    clip: VoxAvatarAnimationClipSettings,
  ) => void;
  previewClipId: string | null;
  reorderAnimationClip: (
    animation: VoxAvatarAnimationSettings,
    clip: VoxAvatarAnimationClipSettings,
    direction: 'up' | 'down',
  ) => Promise<void>;
  resetPackagedAnimations: () => void;
  saveAnimation: () => Promise<void>;
  selectedActionPresetId: string | null;
  setAnimationMetadata: Dispatch<SetStateAction<CustomAnimationMetadata>>;
  setEditingAnimationId: (id: string | null) => void;
  setEditingAnimationMetadata: Dispatch<SetStateAction<CustomAnimationMetadata>>;
  setSelectedActionPresetId: (id: string | null) => void;
  setVrmaQualityGate: (
    value: VoxAvatarSettingsSnapshot['vrma_quality_gate'],
  ) => Promise<void>;
  settings: VoxAvatarSettingsSnapshot;
  t: SettingsTranslate;
}

export function SettingsAnimationsSection({
  addAnimationClips,
  addAnimationClipsFromDirectory,
  animationMetadata,
  applyActionPreset,
  applyAndCreateActionPreset,
  beginEditingAnimation,
  bridge,
  busy,
  chooseVrmaReportDir,
  clearVrmaReportDir,
  createAnimation,
  deleteAllUserAnimationClips,
  deleteAnimation,
  deleteAnimationClip,
  editingAnimationId,
  editingAnimationMetadata,
  locale,
  playAnimationClip,
  previewClipId,
  reorderAnimationClip,
  resetPackagedAnimations,
  saveAnimation,
  selectedActionPresetId,
  setAnimationMetadata,
  setEditingAnimationId,
  setEditingAnimationMetadata,
  setSelectedActionPresetId,
  setVrmaQualityGate,
  settings,
  t,
}: SettingsAnimationsSectionProps) {
  return (
    <>

<section className="settings-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t('actions.idleGuideTitle')}</h2>
                    <p>{t('actions.idleGuideDesc')}</p>
                  </div>
                </div>
                <ol className="settings-steps">
                  <li>
                    {t('actions.idleGuideStep1Prefix')}{' '}
                    <a
                      href="https://booth.pm/en/items/5512385"
                      rel="noreferrer"
                      target="_blank"
                    >
                      BOOTH
                    </a>{' '}
                    {t('actions.idleGuideStep1Suffix')}
                  </li>
                  <li>{t('actions.idleGuideStep2')}</li>
                  <li>
                    <a
                      href="https://github.com/SanHsien/voxavatar/blob/main/docs/CHARACTER_BEHAVIOR.md"
                      rel="noreferrer"
                      target="_blank"
                    >
                      {t('actions.idleGuideStep3')}
                    </a>
                  </li>
                </ol>
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
                    <option value="report">
                      {t('actions.qualityGate.report')}
                    </option>
                    <option value="strict">
                      {t('actions.qualityGate.strict')}
                    </option>
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
                        busy ||
                        !bridge?.clearVrmaReportDir ||
                        !settings.vrma_report_dir
                      }
                      onClick={() => void clearVrmaReportDir()}
                      type="button"
                    >
                      {t('actions.reportDirClear')}
                    </button>
                  </div>
                </div>
              </section>

              <section className="settings-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t('actions.listTitle')}</h2>
                    <p>{t('actions.listDesc')}</p>
                  </div>
                  <div className="panel-heading-actions">
                    <button
                      className="secondary-button danger-text-button"
                      disabled={
                        busy ||
                        !bridge?.deleteAllUserAnimationClips ||
                        settings.animations.every(
                          (animation) =>
                            animation.clips.filter(
                              (clip) =>
                                clip.removable || clip.origin === 'user',
                            ).length === 0,
                        )
                      }
                      onClick={() => deleteAllUserAnimationClips()}
                      type="button"
                    >
                      {t('actions.deleteAllClips')}
                    </button>
                    <button
                      className="secondary-button"
                      disabled={
                        busy ||
                        !bridge ||
                        settings.packaged_animation_change_count === 0
                      }
                      onClick={() => void resetPackagedAnimations()}
                      type="button"
                    >
                      {t('actions.resetPackaged')}
                    </button>
                  </div>
                </div>
                <div className="animation-list">
                  {settings.animations.map((animation) => (
                    <article
                      className={`animation-card ${
                        animation.system ? 'system-action-card' : ''
                      }`}
                      key={animation.id}
                    >
                      <div className="animation-card-header">
                        <div className="animation-card-copy">
                          <div>
                            <strong>
                              {animation.system
                                ? animation.animation_type === 'IDLE'
                                  ? t('actions.idle')
                                  : t('actions.speaking')
                                : animation.animation_name}
                            </strong>
                            <span>
                              {animation.system
                                ? t('actions.systemAction')
                                : animation.origin === 'packaged'
                                  ? animation.modified
                                    ? t('actions.packagedModified')
                                    : t('common.packaged')
                                  : t('actions.customAction')}
                            </span>
                          </div>
                          <p>{animation.animation_description}</p>
                          <small>
                            <b>{t('actions.trigger')}</b>{' '}
                            {animation.animation_trigger_scenario}
                          </small>
                        </div>
                        <div className="animation-card-actions">
                          {animation.editable && (
                            <button
                              disabled={busy || !bridge}
                              onClick={() => beginEditingAnimation(animation)}
                              type="button"
                            >
                              {t('common.edit')}
                            </button>
                          )}
                          {animation.removable && (
                            <button
                              className="danger-text-button"
                              disabled={busy || !bridge}
                              onClick={() => void deleteAnimation(animation)}
                              type="button"
                            >
                              {t('common.delete')}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="animation-clips">
                        <div className="animation-clips-heading">
                          <div>
                            <strong>{t('actions.clipsTitle')}</strong>
                            <span>
                              {animation.clips.length === 0
                                ? t('actions.noClips')
                                : t(
                                    animation.clips.length === 1
                                      ? 'actions.clipCount.one'
                                      : 'actions.clipCount.other',
                                    { count: animation.clips.length },
                                  )}
                            </span>
                          </div>
                          <div className="animation-clip-actions">
                            <button
                              className="secondary-button add-clips-button"
                              disabled={busy || !bridge}
                              onClick={() => void addAnimationClips(animation)}
                              type="button"
                            >
                              {t('actions.addClips')}
                            </button>
                            <button
                              className="secondary-button add-clips-button"
                              disabled={
                                busy || !bridge?.addAnimationClipsFromDirectory
                              }
                              onClick={() =>
                                void addAnimationClipsFromDirectory(animation)
                              }
                              type="button"
                            >
                              {t('actions.addClipsFolder')}
                            </button>
                          </div>
                        </div>
                        {animation.clips.length === 0 ? (
                          <p className="empty-clips">
                            {animation.system
                              ? animation.animation_type === 'IDLE'
                                ? t('actions.emptyClipsSystemIdle')
                                : t('actions.emptyClipsSystemSpeaking')
                              : t('actions.emptyClipsCustom')}
                          </p>
                        ) : (
                          <div className="clip-list">
                            {animation.clips.map((clip, clipIndex) => (
                              <div
                                aria-label={t('actions.previewClip', {
                                  name: clip.animation_name,
                                })}
                                className={`clip-chip ${
                                  previewClipId === clip.id ? 'playing' : ''
                                }`}
                                key={clip.id}
                                onClick={(event) => {
                                  if (
                                    (event.target as Element).closest('button')
                                  ) {
                                    return;
                                  }
                                  playAnimationClip(animation, clip);
                                }}
                                onKeyDown={(event) => {
                                  if (
                                    event.target !== event.currentTarget ||
                                    (event.key !== 'Enter' && event.key !== ' ')
                                  ) {
                                    return;
                                  }
                                  event.preventDefault();
                                  playAnimationClip(animation, clip);
                                }}
                                tabIndex={0}
                                title={t('actions.previewClip', {
                                  name: clip.animation_name,
                                })}
                              >
                                <span className="clip-file-icon">VRMA</span>
                                <strong>{clip.animation_name}</strong>
                                <small>
                                  {clip.origin === 'packaged'
                                    ? t('common.packaged')
                                    : t('common.uploaded')}
                                </small>
                                {clip.removable && (
                                  <div className="clip-controls">
                                    <button
                                      aria-label={t('actions.moveClipUp', {
                                        name: clip.animation_name,
                                      })}
                                      className="clip-reorder"
                                      disabled={
                                        busy ||
                                        !bridge?.reorderAnimationClip ||
                                        clipIndex === 0
                                      }
                                      onClick={() =>
                                        void reorderAnimationClip(
                                          animation,
                                          clip,
                                          'up',
                                        )
                                      }
                                      title={t('actions.moveClipUp', {
                                        name: clip.animation_name,
                                      })}
                                      type="button"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      aria-label={t('actions.moveClipDown', {
                                        name: clip.animation_name,
                                      })}
                                      className="clip-reorder"
                                      disabled={
                                        busy ||
                                        !bridge?.reorderAnimationClip ||
                                        clipIndex ===
                                          animation.clips.length - 1
                                      }
                                      onClick={() =>
                                        void reorderAnimationClip(
                                          animation,
                                          clip,
                                          'down',
                                        )
                                      }
                                      title={t('actions.moveClipDown', {
                                        name: clip.animation_name,
                                      })}
                                      type="button"
                                    >
                                      ↓
                                    </button>
                                    <button
                                      aria-label={t('actions.deleteClip', {
                                        name: clip.animation_name,
                                      })}
                                      className="clip-delete"
                                      disabled={busy || !bridge}
                                      onClick={() =>
                                        void deleteAnimationClip(
                                          animation,
                                          clip,
                                        )
                                      }
                                      title={t('actions.deleteClip', {
                                        name: clip.animation_name,
                                      })}
                                      type="button"
                                    >
                                      ×
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {editingAnimationId && (
                <section className="settings-panel import-panel edit-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>{t('actions.editTitle')}</h2>
                      <p>{t('actions.editDesc')}</p>
                  </div>
                  </div>
                  <div className="form-stack">
                    <label>
                      {t('actions.nameLabel')}
                      <input
                        maxLength={48}
                        onChange={(event) =>
                          setEditingAnimationMetadata((current) => ({
                            ...current,
                            animation_name: event.target.value,
                          }))
                        }
                        value={editingAnimationMetadata.animation_name}
                      />
                    </label>
                    <label>
                      {t('actions.descriptionLabel')}
                      <textarea
                        maxLength={240}
                        onChange={(event) =>
                          setEditingAnimationMetadata((current) => ({
                            ...current,
                            animation_description: event.target.value,
                          }))
                        }
                        rows={3}
                        value={
                          editingAnimationMetadata.animation_description
                        }
                      />
                    </label>
                    <label>
                      {t('actions.triggerLabel')}
                      <textarea
                        maxLength={240}
                        onChange={(event) =>
                          setEditingAnimationMetadata((current) => ({
                            ...current,
                            animation_trigger_scenario: event.target.value,
                          }))
                        }
                        rows={3}
                        value={
                          editingAnimationMetadata.animation_trigger_scenario
                        }
                      />
                    </label>
                  </div>
                  <div className="form-actions">
                    <button
                      className="primary-button"
                      disabled={
                        busy ||
                        !editingAnimationMetadata.animation_name.trim() ||
                        !editingAnimationMetadata.animation_description.trim() ||
                        !editingAnimationMetadata.animation_trigger_scenario.trim()
                      }
                      onClick={() => void saveAnimation()}
                      type="button"
                    >
                      {t('common.saveChanges')}
                    </button>
                    <button
                      className="secondary-button"
                      disabled={busy}
                      onClick={() => setEditingAnimationId(null)}
                      type="button"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </section>
              )}

              <section className="settings-panel import-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t('actions.createTitle')}</h2>
                    <p>{t('actions.createDesc')}</p>
                  </div>
                  <span className="file-pill">{t('sections.animations.label')}</span>
                </div>

                <div className="action-preset-block">
                  <div className="action-preset-heading">
                    <strong>{t('actions.presetsTitle')}</strong>
                    <p>{t('actions.presetsDesc')}</p>
                  </div>
                  <div
                    aria-label={t('actions.presetsTitle')}
                    className="action-preset-grid"
                    role="list"
                  >
                    {ACTION_PRESETS.map((preset) => {
                      const resolved = resolveActionPreset(preset, locale);
                      const alreadyExists = settings.animations.some(
                        (animation) =>
                          animation.animation_name === preset.animation_name,
                      );
                      const selected = selectedActionPresetId === preset.id;
                      return (
                        <article
                          className={`action-preset-card ${
                            selected ? 'selected' : ''
                          }`}
                          key={preset.id}
                          role="listitem"
                        >
                          <button
                            className="action-preset-main"
                            onClick={() => applyActionPreset(preset)}
                            type="button"
                          >
                            <strong>{resolved.label}</strong>
                            <code>{preset.animation_name}</code>
                            <small>{resolved.animation_description}</small>
                            <span>{resolved.animation_trigger_scenario}</span>
                          </button>
                          <div className="action-preset-actions">
                            <button
                              disabled={busy}
                              onClick={() => applyActionPreset(preset)}
                              type="button"
                            >
                              {t('actions.presetsApply')}
                            </button>
                            <button
                              className="primary-button"
                              disabled={busy || !bridge || alreadyExists}
                              onClick={() =>
                                void applyAndCreateActionPreset(preset)
                              }
                              type="button"
                            >
                              {alreadyExists
                                ? t('actions.presetsExists')
                                : t('actions.presetsApplyCreate')}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>

                <div className="form-stack">
                  <label>
                    {t('actions.nameLabel')}
                    <input
                      maxLength={48}
                      onChange={(event) => {
                        setSelectedActionPresetId(null);
                        setAnimationMetadata((current) => ({
                          ...current,
                          animation_name: event.target.value,
                        }));
                      }}
                      placeholder={t('actions.createNamePlaceholder')}
                      value={animationMetadata.animation_name}
                    />
                    <small>{t('actions.createNameHint')}</small>
                  </label>
                  <label>
                    {t('actions.descriptionLabel')}
                    <textarea
                      maxLength={240}
                      onChange={(event) => {
                        setSelectedActionPresetId(null);
                        setAnimationMetadata((current) => ({
                          ...current,
                          animation_description: event.target.value,
                        }));
                      }}
                      placeholder={t('actions.createDescPlaceholder')}
                      rows={3}
                      value={animationMetadata.animation_description}
                    />
                  </label>
                  <label>
                    {t('actions.triggerLabel')}
                    <textarea
                      maxLength={240}
                      onChange={(event) => {
                        setSelectedActionPresetId(null);
                        setAnimationMetadata((current) => ({
                          ...current,
                          animation_trigger_scenario: event.target.value,
                        }));
                      }}
                      placeholder={t('actions.createTriggerPlaceholder')}
                      rows={3}
                      value={animationMetadata.animation_trigger_scenario}
                    />
                  </label>
                </div>
                <button
                  className="primary-button"
                  disabled={
                    busy ||
                    !bridge ||
                    !animationMetadata.animation_name.trim() ||
                    !animationMetadata.animation_description.trim() ||
                    !animationMetadata.animation_trigger_scenario.trim()
                  }
                  onClick={() => void createAnimation()}
                  type="button"
                >
                  {t('actions.createButton')}
                </button>
              </section>

    </>
  );
}
