import { useMemo, useState } from 'react';
import type { CharacterState } from '../../character-state';
import { applyDefaultStateSlotBindings } from '../../state-slot-defaults';

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

/** Settings 內嵌的最小範例（與 docs/examples/action-pack.example.json 對齊精簡版）。 */
export const ACTION_PACK_MINI_EXAMPLE = `{
  "schema_version": 1,
  "name": "my-action-pack",
  "description": "與同資料夾的 .vrma 一併匯入",
  "actions": [
    {
      "animation_name": "idle-breathe",
      "purpose": "loop",
      "state_slot": "idle",
      "files": ["idle-breathe.vrma"]
    },
    {
      "animation_name": "talk-soft",
      "purpose": "loop",
      "state_slot": "speaking",
      "files": ["talk-soft.vrma"]
    },
    {
      "animation_name": "work-nod",
      "purpose": "one-shot",
      "state_slot": "working",
      "files": ["work-nod.vrma"]
    }
  ]
}
`;

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
  const [copied, setCopied] = useState(false);
  const playable = settings.animations.filter(
    (animation) => animation.asset_urls.length > 0,
  );
  const bindings = useMemo(
    () =>
      applyDefaultStateSlotBindings(
        settings.state_slot_bindings ?? {},
        playable.map((animation) => ({
          animation_name: animation.animation_name,
          animation_type: animation.animation_type,
        })),
      ),
    [playable, settings.state_slot_bindings],
  );

  async function copyExample() {
    try {
      await navigator.clipboard.writeText(ACTION_PACK_MINI_EXAMPLE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

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

      <details className="state-slot-pack-help">
        <summary>{t('stateSlots.packHelpSummary')}</summary>
        <ol className="state-slot-pack-steps">
          <li>{t('stateSlots.packHelpStep1')}</li>
          <li>{t('stateSlots.packHelpStep2')}</li>
          <li>{t('stateSlots.packHelpStep3')}</li>
          <li>{t('stateSlots.packHelpStep4')}</li>
        </ol>
        <p className="state-slot-pack-note">{t('stateSlots.packHelpNote')}</p>
        <div className="state-slot-pack-example-header">
          <strong>{t('stateSlots.packExampleTitle')}</strong>
          <button
            className="secondary-button"
            onClick={() => void copyExample()}
            type="button"
          >
            {copied
              ? t('stateSlots.packExampleCopied')
              : t('stateSlots.packExampleCopy')}
          </button>
        </div>
        <pre className="state-slot-pack-example">{ACTION_PACK_MINI_EXAMPLE}</pre>
      </details>

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
