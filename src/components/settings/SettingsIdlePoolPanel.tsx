import { isForcedSpeakingIdleAction } from '../../animation-catalog';

type SettingsTranslate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

export interface SettingsIdlePoolPanelProps {
  animations: readonly VoxAvatarAnimationSettings[];
  bindings: VoxAvatarStateSlotBindings;
  busy: boolean;
  excludedAnimationIds: readonly string[];
  onSetEnabled: (
    animation: VoxAvatarAnimationSettings,
    enabled: boolean,
  ) => Promise<void>;
  setterAvailable: boolean;
  t: SettingsTranslate;
}

export function SettingsIdlePoolPanel({
  animations,
  bindings,
  busy,
  excludedAnimationIds,
  onSetEnabled,
  setterAvailable,
  t,
}: SettingsIdlePoolPanelProps) {
  const excludedIds = new Set(excludedAnimationIds);
  return (
    <section className="settings-panel idle-pool-panel">
      <div className="panel-heading">
        <div>
          <h2>{t('actions.idlePoolTitle')}</h2>
          <p>{t('actions.idlePoolDesc')}</p>
        </div>
      </div>
      <div className="idle-pool-grid">
        {animations.map((animation) => {
          const forcedSpeaking = isForcedSpeakingIdleAction(
            animation,
            bindings,
          );
          const checked = !forcedSpeaking && !excludedIds.has(animation.id);
          const label = animation.system
            ? animation.animation_type === 'IDLE'
              ? t('actions.idle')
              : t('actions.speaking')
            : animation.animation_name;
          return (
            <label className="idle-pool-item" key={animation.id}>
              <input
                checked={checked}
                disabled={busy || !setterAvailable || forcedSpeaking}
                onChange={(event) =>
                  void onSetEnabled(animation, event.target.checked)
                }
                type="checkbox"
              />
              <span>
                <strong>{label}</strong>
                <small>
                  {forcedSpeaking
                    ? t('actions.idlePoolSpeakingExcluded')
                    : checked
                      ? t('actions.idlePoolIncluded')
                      : t('actions.idlePoolExcluded')}
                </small>
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
