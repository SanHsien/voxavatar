import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type DragEvent,
  type SetStateAction,
} from 'react';
import {
  ACTION_PRESETS,
  resolveActionPreset,
  type ActionPresetDefinition,
} from '../../action-presets';
import { SettingsQualityGatePanel } from './SettingsQualityGatePanel';
import { SettingsIdlePoolPanel } from './SettingsIdlePoolPanel';

type SettingsBridge = NonNullable<Window['voxavatarSettings']>;
type ClipPurpose = VoxAvatarAnimationClipSettings['purpose'];

type ClipSelectionKey = `pool:${string}` | `assigned:${string}:${string}`;

const CLIP_DRAG_MIME = 'application/vnd.voxavatar-clip+json';

type ClipDragPayload = {
  clipId: string;
  pool: boolean;
  animationId?: string;
};

function clipSelectionKey(
  clipId: string,
  animationId?: string,
): ClipSelectionKey {
  return animationId
    ? `assigned:${animationId}:${clipId}`
    : `pool:${clipId}`;
}

function parseClipDragPayload(data: string): ClipDragPayload | null {
  try {
    const parsed = JSON.parse(data) as ClipDragPayload;
    if (typeof parsed?.clipId !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

function purposeTargetFromKey(
  key: ClipSelectionKey,
): VoxAvatarClipPurposeTarget {
  if (key.startsWith('pool:')) {
    return { clipId: key.slice(5), pool: true };
  }
  const parts = key.split(':');
  return {
    clipId: parts[2] ?? '',
    animationId: parts[1],
    pool: false,
  };
}

type SettingsTranslate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

export interface SettingsAnimationsSectionProps {
  addAnimationClips: (animation: VoxAvatarAnimationSettings) => Promise<void>;
  addAnimationClipsFromDirectory: (
    animation: VoxAvatarAnimationSettings,
  ) => Promise<void>;
  addUnassignedClips: () => Promise<void>;
  assignUnassignedClip: (
    clipId: string,
    animation: VoxAvatarAnimationSettings,
  ) => Promise<boolean>;
  assignVrmaByFilename: () => Promise<void>;
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
  deleteUnassignedClip: (clip: VoxAvatarAnimationClipSettings) => void;
  editingAnimationId: string | null;
  editingAnimationMetadata: CustomAnimationMetadata;
  highlightedAnimationId: string | null;
  locale: 'zh-TW' | 'en';
  moveAnimationClip: (
    from: VoxAvatarAnimationSettings,
    clip: VoxAvatarAnimationClipSettings,
    toAnimationId: string,
  ) => Promise<boolean>;
  moveAnimationClipToUnassigned: (
    animation: VoxAvatarAnimationSettings,
    clip: VoxAvatarAnimationClipSettings,
  ) => Promise<boolean>;
  playAnimationClip: (
    animation: VoxAvatarAnimationSettings,
    clip: VoxAvatarAnimationClipSettings,
  ) => void;
  playUnassignedClip: (clip: VoxAvatarAnimationClipSettings) => void;
  previewClipId: string | null;
  reorderAnimationClip: (
    animation: VoxAvatarAnimationSettings,
    clip: VoxAvatarAnimationClipSettings,
    direction: 'up' | 'down',
  ) => Promise<void>;
  resetPackagedAnimations: () => void;
  saveAnimation: () => Promise<void>;
  setIdlePoolAnimationEnabled: (
    animation: VoxAvatarAnimationSettings,
    enabled: boolean,
  ) => Promise<void>;
  selectedActionPresetId: string | null;
  setAnimationMetadata: Dispatch<SetStateAction<CustomAnimationMetadata>>;
  setEditingAnimationId: (id: string | null) => void;
  setEditingAnimationMetadata: Dispatch<SetStateAction<CustomAnimationMetadata>>;
  setSelectedActionPresetId: (id: string | null) => void;
  setVrmaQualityGate: (
    value: VoxAvatarSettingsSnapshot['vrma_quality_gate'],
  ) => Promise<void>;
  setVrmaQualityScoreThresholds: (
    rejectBelow: number,
    keepAtLeast: number,
  ) => Promise<void>;
  settings: VoxAvatarSettingsSnapshot;
  t: SettingsTranslate;
  updateAnimationClip: (
    animation: VoxAvatarAnimationSettings,
    clip: VoxAvatarAnimationClipSettings,
    patch: { clip_name?: string; purpose?: ClipPurpose },
  ) => Promise<boolean>;
  updateClipsPurpose: (
    targets: VoxAvatarClipPurposeTarget[],
    purpose: ClipPurpose,
  ) => Promise<boolean>;
  updateUnassignedClip: (
    clip: VoxAvatarAnimationClipSettings,
    patch: { clip_name?: string; purpose?: ClipPurpose },
  ) => Promise<boolean>;
}

function ClipAddButtons({
  addAnimationClips,
  addAnimationClipsFromDirectory,
  animation,
  bridge,
  busy,
  primary,
  t,
}: {
  addAnimationClips: (animation: VoxAvatarAnimationSettings) => Promise<void>;
  addAnimationClipsFromDirectory: (
    animation: VoxAvatarAnimationSettings,
  ) => Promise<void>;
  animation: VoxAvatarAnimationSettings;
  bridge: SettingsBridge | undefined;
  busy: boolean;
  primary?: boolean;
  t: SettingsTranslate;
}) {
  return (
    <div className="animation-clip-actions">
      <button
        className={primary ? 'primary-button add-clips-button' : 'secondary-button add-clips-button'}
        disabled={busy || !bridge}
        onClick={() => void addAnimationClips(animation)}
        type="button"
      >
        {t('actions.addClips')}
      </button>
      <button
        className="secondary-button add-clips-button"
        disabled={busy || !bridge?.addAnimationClipsFromDirectory}
        onClick={() => void addAnimationClipsFromDirectory(animation)}
        type="button"
      >
        {t('actions.addClipsFolder')}
      </button>
    </div>
  );
}

export function SettingsAnimationsSection({
  addAnimationClips,
  addAnimationClipsFromDirectory,
  addUnassignedClips,
  assignUnassignedClip,
  assignVrmaByFilename,
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
  deleteUnassignedClip,
  editingAnimationId,
  editingAnimationMetadata,
  highlightedAnimationId,
  locale,
  moveAnimationClip,
  moveAnimationClipToUnassigned,
  playAnimationClip,
  playUnassignedClip,
  previewClipId,
  reorderAnimationClip,
  resetPackagedAnimations,
  saveAnimation,
  setIdlePoolAnimationEnabled,
  selectedActionPresetId,
  setAnimationMetadata,
  setEditingAnimationId,
  setEditingAnimationMetadata,
  setSelectedActionPresetId,
  setVrmaQualityGate,
  setVrmaQualityScoreThresholds,
  settings,
  t,
  updateAnimationClip,
  updateClipsPurpose,
  updateUnassignedClip,
}: SettingsAnimationsSectionProps) {
  const highlightedCardRef = useRef<HTMLElement | null>(null);
  const [editingClipId, setEditingClipId] = useState<string | null>(null);
  const [editingPoolClipId, setEditingPoolClipId] = useState<string | null>(
    null,
  );
  const [clipDraftName, setClipDraftName] = useState('');
  const [clipDraftPurpose, setClipDraftPurpose] =
    useState<ClipPurpose>('loop');
  const [clipMoveTargetId, setClipMoveTargetId] = useState('');
  const [selectedClipKeys, setSelectedClipKeys] = useState<
    Set<ClipSelectionKey>
  >(() => new Set());
  const [dragOverAnimationId, setDragOverAnimationId] = useState<string | null>(
    null,
  );
  const [draggingClipKey, setDraggingClipKey] = useState<string | null>(null);

  const unassignedClips = settings.unassigned_clips ?? [];

  const beginEditingClip = (
    animation: VoxAvatarAnimationSettings,
    clip: VoxAvatarAnimationClipSettings,
  ) => {
    setEditingPoolClipId(null);
    setEditingClipId(clip.id);
    setClipDraftName(clip.animation_name);
    setClipDraftPurpose(clip.purpose);
    setClipMoveTargetId(animation.id);
  };

  const beginEditingPoolClip = (clip: VoxAvatarAnimationClipSettings) => {
    setEditingClipId(null);
    setEditingPoolClipId(clip.id);
    setClipDraftName(clip.animation_name);
    setClipDraftPurpose(clip.purpose);
    setClipMoveTargetId('');
  };

  const cancelEditingClip = () => {
    setEditingClipId(null);
    setEditingPoolClipId(null);
    setClipDraftName('');
    setClipMoveTargetId('');
  };

  const toggleClipSelection = (
    clipId: string,
    animationId?: string,
    selected?: boolean,
  ) => {
    const key = clipSelectionKey(clipId, animationId);
    setSelectedClipKeys((current) => {
      const next = new Set(current);
      const shouldSelect = selected ?? !next.has(key);
      if (shouldSelect) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const applyBatchPurpose = async (purpose: ClipPurpose) => {
    if (selectedClipKeys.size === 0) return;
    const targets = [...selectedClipKeys].map(purposeTargetFromKey);
    const updated = await updateClipsPurpose(targets, purpose);
    if (updated) setSelectedClipKeys(new Set());
  };

  const handleClipDragStart = (
    event: DragEvent<HTMLElement>,
    payload: ClipDragPayload,
    visualKey: string,
  ) => {
    event.dataTransfer.setData(CLIP_DRAG_MIME, JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'move';
    setDraggingClipKey(visualKey);
  };

  const handleClipDragEnd = () => {
    setDraggingClipKey(null);
    setDragOverAnimationId(null);
  };

  const handleAnimationDragOver = (
    event: DragEvent<HTMLElement>,
    animationId: string,
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverAnimationId(animationId);
  };

  const handleAnimationDrop = async (
    event: DragEvent<HTMLElement>,
    animation: VoxAvatarAnimationSettings,
  ) => {
    event.preventDefault();
    setDragOverAnimationId(null);
    const payload = parseClipDragPayload(
      event.dataTransfer.getData(CLIP_DRAG_MIME),
    );
    if (!payload) return;
    if (payload.pool) {
      await assignUnassignedClip(payload.clipId, animation);
      return;
    }
    if (
      payload.animationId &&
      payload.animationId !== animation.id
    ) {
      const fromAnimation = settings.animations.find(
        (candidate) => candidate.id === payload.animationId,
      );
      const clip = fromAnimation?.clips.find(
        (candidate) => candidate.id === payload.clipId,
      );
      if (fromAnimation && clip) {
        await moveAnimationClip(fromAnimation, clip, animation.id);
      }
    }
  };

  const saveEditingClip = async (
    animation: VoxAvatarAnimationSettings,
    clip: VoxAvatarAnimationClipSettings,
  ) => {
    const nameChanged = clipDraftName.trim() !== clip.animation_name;
    const purposeChanged = clipDraftPurpose !== clip.purpose;
    if (nameChanged || purposeChanged) {
      const updated = await updateAnimationClip(animation, clip, {
        ...(nameChanged ? { clip_name: clipDraftName.trim() } : {}),
        ...(purposeChanged ? { purpose: clipDraftPurpose } : {}),
      });
      if (!updated) return;
    }
    if (clipMoveTargetId && clipMoveTargetId !== animation.id) {
      const moved = await moveAnimationClip(
        animation,
        clip,
        clipMoveTargetId,
      );
      if (!moved) return;
    }
    cancelEditingClip();
  };

  const saveEditingPoolClip = async (
    clip: VoxAvatarAnimationClipSettings,
  ) => {
    const nameChanged = clipDraftName.trim() !== clip.animation_name;
    const purposeChanged = clipDraftPurpose !== clip.purpose;
    if (nameChanged || purposeChanged) {
      const updated = await updateUnassignedClip(clip, {
        ...(nameChanged ? { clip_name: clipDraftName.trim() } : {}),
        ...(purposeChanged ? { purpose: clipDraftPurpose } : {}),
      });
      if (!updated) return;
    }
    cancelEditingClip();
  };

  const renderClipEditForm = (
    clip: VoxAvatarAnimationClipSettings,
    onSubmit: () => void | Promise<void>,
    options?: {
      showMoveToAction?: boolean;
      showMoveToPool?: boolean;
      animation?: VoxAvatarAnimationSettings;
    },
  ) => (
    <form
      className="clip-edit-form"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      <label>
        {t('actions.clipNameLabel')}
        <input
          maxLength={64}
          onChange={(event) => setClipDraftName(event.target.value)}
          value={clipDraftName}
        />
      </label>
      <label>
        {t('actions.clipPurposeLabel')}
        <select
          onChange={(event) =>
            setClipDraftPurpose(event.target.value as ClipPurpose)
          }
          value={clipDraftPurpose}
        >
          <option value="loop">{t('actions.purpose.loop')}</option>
          <option value="one-shot">{t('actions.purpose.one-shot')}</option>
          <option value="pose">{t('actions.purpose.pose')}</option>
        </select>
      </label>
      {options?.showMoveToAction && options.animation ? (
        <label>
          {t('actions.moveClipTo')}
          <select
            onChange={(event) => setClipMoveTargetId(event.target.value)}
            value={clipMoveTargetId}
          >
            {settings.animations.map((target) => (
              <option key={target.id} value={target.id}>
                {target.system
                  ? target.animation_type === 'IDLE'
                    ? t('actions.idle')
                    : t('actions.speaking')
                  : target.animation_name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {options?.showMoveToPool && options.animation ? (
        <button
          className="secondary-button"
          disabled={busy || !bridge?.moveAnimationClipToUnassigned}
          onClick={() =>
            void moveAnimationClipToUnassigned(options.animation!, clip)
          }
          type="button"
        >
          {t('actions.moveClipToPool')}
        </button>
      ) : null}
      <div className="clip-edit-actions">
        <button
          className="primary-button"
          disabled={busy || !clipDraftName.trim()}
          type="submit"
        >
          {t('actions.saveClip')}
        </button>
        <button
          className="secondary-button"
          disabled={busy}
          onClick={cancelEditingClip}
          type="button"
        >
          {t('common.cancel')}
        </button>
      </div>
      {clip.stored_filename ? (
        <p className="desktop-note">
          {t('actions.storedFilename')}: <code>{clip.stored_filename}</code>
        </p>
      ) : null}
      <p className="desktop-note">{t('actions.clipEditHint')}</p>
    </form>
  );

  useEffect(() => {
    if (!highlightedAnimationId) return;
    highlightedCardRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [highlightedAnimationId]);

  return (
    <>
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
                      onClick={() => void applyAndCreateActionPreset(preset)}
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

      <SettingsIdlePoolPanel
        animations={settings.animations}
        bindings={settings.state_slot_bindings}
        busy={busy}
        excludedAnimationIds={settings.idle_pool_excluded_animation_ids}
        onSetEnabled={setIdlePoolAnimationEnabled}
        setterAvailable={Boolean(bridge?.setIdlePoolAnimationEnabled)}
        t={t}
      />

      <section className="settings-panel unassigned-pool-panel">
        <div className="panel-heading">
          <div>
            <h2>{t('actions.poolTitle')}</h2>
            <p>{t('actions.poolDesc')}</p>
          </div>
          <button
            className="primary-button add-clips-button"
            disabled={busy || !bridge?.addUnassignedClips}
            onClick={() => void addUnassignedClips()}
            type="button"
          >
            {t('actions.addPoolClips')}
          </button>
        </div>

        {selectedClipKeys.size > 0 ? (
          <div className="clip-batch-toolbar">
            <span>
              {t('actions.batchSelected', { count: selectedClipKeys.size })}
            </span>
            <button
              className="secondary-button"
              disabled={busy || !bridge?.updateClipsPurpose}
              onClick={() => void applyBatchPurpose('loop')}
              type="button"
            >
              {t('actions.batchPurposeLoop')}
            </button>
            <button
              className="secondary-button"
              disabled={busy || !bridge?.updateClipsPurpose}
              onClick={() => void applyBatchPurpose('one-shot')}
              type="button"
            >
              {t('actions.batchPurposeOneShot')}
            </button>
            <button
              className="secondary-button"
              disabled={busy || !bridge?.updateClipsPurpose}
              onClick={() => void applyBatchPurpose('pose')}
              type="button"
            >
              {t('actions.batchPurposePose')}
            </button>
          </div>
        ) : null}

        {unassignedClips.length === 0 ? (
          <p className="empty-clips">{t('actions.poolEmpty')}</p>
        ) : (
          <div className="clip-list pool-clip-list">
            {unassignedClips.map((clip) => {
              const selectionKey = clipSelectionKey(clip.id);
              const isEditingPoolClip = editingPoolClipId === clip.id;
              const isSelected = selectedClipKeys.has(selectionKey);
              return (
                <div className="clip-row" key={clip.id}>
                  <div
                    aria-label={t('actions.previewClip', {
                      name: clip.animation_name,
                    })}
                    className={`clip-chip ${
                      previewClipId === clip.id ? 'playing' : ''
                    } ${draggingClipKey === selectionKey ? 'dragging' : ''}`}
                    draggable={!busy && Boolean(bridge?.assignUnassignedClip)}
                    onClick={(event) => {
                      if (
                        (event.target as Element).closest(
                          'button, select, input, label, form, .clip-select',
                        )
                      ) {
                        return;
                      }
                      playUnassignedClip(clip);
                    }}
                    onDragEnd={handleClipDragEnd}
                    onDragStart={(event) =>
                      handleClipDragStart(
                        event,
                        { clipId: clip.id, pool: true },
                        selectionKey,
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.target !== event.currentTarget ||
                        (event.key !== 'Enter' && event.key !== ' ')
                      ) {
                        return;
                      }
                      event.preventDefault();
                      playUnassignedClip(clip);
                    }}
                    tabIndex={0}
                    title={t('actions.previewClip', {
                      name: clip.animation_name,
                    })}
                  >
                    <label className="clip-select">
                      <input
                        aria-label={t('actions.selectClip', {
                          name: clip.animation_name,
                        })}
                        checked={isSelected}
                        onChange={() => toggleClipSelection(clip.id)}
                        onClick={(event) => event.stopPropagation()}
                        type="checkbox"
                      />
                    </label>
                    <span className="clip-file-icon">VRMA</span>
                    <div className="clip-chip-copy">
                      <strong>{clip.animation_name}</strong>
                      <small>
                        {t('common.uploaded')}
                        {' · '}
                        {t(`actions.purpose.${clip.purpose}`)}
                        {clip.source_basename ? ` · ${clip.source_basename}` : ''}
                        {clip.stored_filename
                          ? ` · ${clip.stored_filename}`
                          : ''}
                      </small>
                    </div>
                    <div className="clip-controls">
                      <button
                        aria-label={t('actions.previewClip', {
                          name: clip.animation_name,
                        })}
                        className="clip-preview"
                        disabled={busy}
                        onClick={() => playUnassignedClip(clip)}
                        title={t('actions.previewButton')}
                        type="button"
                      >
                        {t('actions.previewButton')}
                      </button>
                      <button
                        aria-label={t('actions.editClip', {
                          name: clip.animation_name,
                        })}
                        className="clip-edit"
                        disabled={busy || !bridge?.updateUnassignedClip}
                        onClick={() => beginEditingPoolClip(clip)}
                        title={t('actions.editClip', {
                          name: clip.animation_name,
                        })}
                        type="button"
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        aria-label={t('actions.deleteClip', {
                          name: clip.animation_name,
                        })}
                        className="clip-delete"
                        disabled={busy || !bridge?.deleteUnassignedClip}
                        onClick={() => deleteUnassignedClip(clip)}
                        title={t('actions.deleteClip', {
                          name: clip.animation_name,
                        })}
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  {isEditingPoolClip
                    ? renderClipEditForm(clip, () => saveEditingPoolClip(clip))
                    : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="settings-panel">
        <div className="panel-heading">
          <div>
            <h2>{t('actions.listTitle')}</h2>
            <p>{t('actions.listDesc')}</p>
            <p>{t('actions.assignByFilenameHint')}</p>
          </div>
          <div className="panel-heading-actions">
            <button
              className="secondary-button"
              disabled={busy || !bridge?.assignVrmaByFilename}
              onClick={() => void assignVrmaByFilename()}
              type="button"
            >
              {t('actions.assignByFilename')}
            </button>
            <button
              className="secondary-button danger-text-button"
              disabled={
                busy ||
                !bridge?.deleteAllUserAnimationClips ||
                (settings.unassigned_clips?.length ?? 0) === 0 &&
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
          {settings.animations.map((animation) => {
            const isEditing = editingAnimationId === animation.id;
            const isHighlighted = highlightedAnimationId === animation.id;
            return (
              <article
                className={`animation-card ${
                  animation.system ? 'system-action-card' : ''
                } ${isHighlighted ? 'highlighted' : ''} ${
                  isEditing ? 'editing' : ''
                }`}
                key={animation.id}
                onDragLeave={() => {
                  if (dragOverAnimationId === animation.id) {
                    setDragOverAnimationId(null);
                  }
                }}
                onDragOver={(event) => handleAnimationDragOver(event, animation.id)}
                onDrop={(event) => void handleAnimationDrop(event, animation)}
                ref={
                  isHighlighted
                    ? (node) => {
                        highlightedCardRef.current = node;
                      }
                    : undefined
                }
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
                    {!isEditing && (
                      <>
                        <p>{animation.animation_description}</p>
                        <small>
                          <b>{t('actions.trigger')}</b>{' '}
                          {animation.animation_trigger_scenario}
                        </small>
                      </>
                    )}
                  </div>
                  <div className="animation-card-actions">
                    {animation.editable && !isEditing && (
                      <button
                        disabled={busy || !bridge}
                        onClick={() => beginEditingAnimation(animation)}
                        type="button"
                      >
                        {t('common.edit')}
                      </button>
                    )}
                    {animation.removable && !isEditing && (
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

                {isEditing && (
                  <div className="animation-card-edit">
                    <div className="panel-heading">
                      <div>
                        <h3>{t('actions.editTitle')}</h3>
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
                  </div>
                )}

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
                    {animation.clips.length > 0 && (
                      <ClipAddButtons
                        addAnimationClips={addAnimationClips}
                        addAnimationClipsFromDirectory={
                          addAnimationClipsFromDirectory
                        }
                        animation={animation}
                        bridge={bridge}
                        busy={busy}
                        t={t}
                      />
                    )}
                  </div>
                  {animation.clips.length === 0 ? (
                    <div className="empty-clips-cta">
                      <p className="empty-clips">
                        {isHighlighted
                          ? t('actions.nextAddClips')
                          : animation.system
                            ? animation.animation_type === 'IDLE'
                              ? t('actions.emptyClipsSystemIdle')
                              : t('actions.emptyClipsSystemSpeaking')
                            : t('actions.emptyClipsCustom')}
                      </p>
                      <ClipAddButtons
                        addAnimationClips={addAnimationClips}
                        addAnimationClipsFromDirectory={
                          addAnimationClipsFromDirectory
                        }
                        animation={animation}
                        bridge={bridge}
                        busy={busy}
                        primary
                        t={t}
                      />
                    </div>
                  ) : (
                    <div className="clip-list">
                      <p className="desktop-note">{t('actions.clipsManageHint')}</p>
                      {animation.clips.map((clip, clipIndex) => {
                        const isEditingClip = editingClipId === clip.id;
                        const selectionKey = clipSelectionKey(
                          clip.id,
                          animation.id,
                        );
                        const isSelected = selectedClipKeys.has(selectionKey);
                        return (
                          <div className="clip-row" key={clip.id}>
                            <div
                              aria-label={t('actions.previewClip', {
                                name: clip.animation_name,
                              })}
                              className={`clip-chip ${
                                previewClipId === clip.id ? 'playing' : ''
                              } ${
                                draggingClipKey === selectionKey ? 'dragging' : ''
                              }`}
                              draggable={
                                clip.removable &&
                                !busy &&
                                Boolean(
                                  bridge?.moveAnimationClip ||
                                    bridge?.assignUnassignedClip,
                                )
                              }
                              onClick={(event) => {
                                if (
                                  (event.target as Element).closest(
                                    'button, select, input, label, form, .clip-select',
                                  )
                                ) {
                                  return;
                                }
                                playAnimationClip(animation, clip);
                              }}
                              onDragEnd={handleClipDragEnd}
                              onDragStart={(event) => {
                                if (!clip.removable) return;
                                handleClipDragStart(
                                  event,
                                  {
                                    clipId: clip.id,
                                    pool: false,
                                    animationId: animation.id,
                                  },
                                  selectionKey,
                                );
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
                              {clip.removable ? (
                                <label className="clip-select">
                                  <input
                                    aria-label={t('actions.selectClip', {
                                      name: clip.animation_name,
                                    })}
                                    checked={isSelected}
                                    onChange={() =>
                                      toggleClipSelection(
                                        clip.id,
                                        animation.id,
                                      )
                                    }
                                    onClick={(event) =>
                                      event.stopPropagation()
                                    }
                                    type="checkbox"
                                  />
                                </label>
                              ) : null}
                              <span className="clip-file-icon">VRMA</span>
                              <div className="clip-chip-copy">
                                <strong>{clip.animation_name}</strong>
                                <small>
                                  {clip.origin === 'packaged'
                                    ? t('common.packaged')
                                    : t('common.uploaded')}
                                  {' · '}
                                  {t(`actions.purpose.${clip.purpose}`)}
                                  {clip.source_basename
                                    ? ` · ${clip.source_basename}`
                                    : ''}
                                  {clip.stored_filename
                                    ? ` · ${clip.stored_filename}`
                                    : ''}
                                </small>
                              </div>
                              <div className="clip-controls">
                                <button
                                  aria-label={t('actions.previewClip', {
                                    name: clip.animation_name,
                                  })}
                                  className="clip-preview"
                                  disabled={busy}
                                  onClick={() =>
                                    playAnimationClip(animation, clip)
                                  }
                                  title={t('actions.previewButton')}
                                  type="button"
                                >
                                  {t('actions.previewButton')}
                                </button>
                                {clip.removable && (
                                  <>
                                    <button
                                      aria-label={t('actions.editClip', {
                                        name: clip.animation_name,
                                      })}
                                      className="clip-edit"
                                      disabled={busy || !bridge?.updateAnimationClip}
                                      onClick={() =>
                                        beginEditingClip(animation, clip)
                                      }
                                      title={t('actions.editClip', {
                                        name: clip.animation_name,
                                      })}
                                      type="button"
                                    >
                                      {t('common.edit')}
                                    </button>
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
                                  </>
                                )}
                              </div>
                            </div>
                            {isEditingClip && clip.removable
                              ? renderClipEditForm(
                                  clip,
                                  () => saveEditingClip(animation, clip),
                                  {
                                    showMoveToAction: true,
                                    showMoveToPool: true,
                                    animation,
                                  },
                                )
                              : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div
                    className={`animation-card-drop-target ${
                      dragOverAnimationId === animation.id ? 'active' : ''
                    }`}
                  >
                    {t('actions.poolDropHint')}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <details className="settings-panel action-secondary-help">
        <summary>
          <strong>{t('actions.idleGuideTitle')}</strong>
          <span>{t('actions.idleGuideDesc')}</span>
        </summary>
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
      </details>

      <SettingsQualityGatePanel
        bridge={bridge}
        busy={busy}
        chooseVrmaReportDir={chooseVrmaReportDir}
        clearVrmaReportDir={clearVrmaReportDir}
        setVrmaQualityGate={setVrmaQualityGate}
        setVrmaQualityScoreThresholds={setVrmaQualityScoreThresholds}
        settings={settings}
        t={t}
      />
    </>
  );
}
