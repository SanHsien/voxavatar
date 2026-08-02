import type { CharacterState } from '../../character-state';

type SettingsBridge = NonNullable<Window['voxavatarSettings']>;

type SettingsTranslate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

const STATE_SLOT_KEYS: CharacterState[] = [
  'idle',
  'listening',
  'speaking',
  'working',
  'reviewing',
  'success',
  'failed',
];

export interface SettingsStateSlotsSectionProps {
  bridge: SettingsBridge | undefined;
  busy: boolean;
  importActionPack: () => Promise<void>;
  setStateSlotBinding: (
    state: CharacterState,
    animationName: string | null,
  ) => Promise<void>;
  settings: VoxAvatarSettingsSnapshot;
  t: SettingsTranslate;
}

export function SettingsStateSlotsSection({
  bridge,
  busy,
  importActionPack,
  setStateSlotBinding,
  settings,
  t,
}: SettingsStateSlotsSectionProps) {
  const playable = settings.animations.filter(
    (animation) => animation.asset_urls.length > 0,
  );
  const bindings = settings.state_slot_bindings ?? {};

  return (
    <section className="settings-panel">
      <div className="panel-heading">
        <div>
          <h2>{t('stateSlots.title')}</h2>
          <p>{t('stateSlots.desc')}</p>
        </div>
        <div className="panel-heading-actions">
          <button
            className="secondary-button"
            disabled={busy || !bridge?.importActionPack}
            onClick={() => void importActionPack()}
            type="button"
          >
            {t('stateSlots.importPack')}
          </button>
        </div>
      </div>

      <div className="state-slot-grid">
        {STATE_SLOT_KEYS.map((state) => (
          <label className="settings-select-field" key={state}>
            {t(`stateSlots.state.${state}`)}
            <select
              disabled={busy || !bridge?.setStateSlotBinding}
              onChange={(event) => {
                const value = event.target.value;
                void setStateSlotBinding(state, value ? value : null);
              }}
              value={bindings[state] ?? ''}
            >
              <option value="">{t('stateSlots.none')}</option>
              {playable.map((animation) => (
                <option
                  key={animation.id}
                  value={animation.animation_name}
                >
                  {animation.animation_name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {playable.length === 0 && (
        <p className="empty-clips">{t('stateSlots.noPlayable')}</p>
      )}
    </section>
  );
}
