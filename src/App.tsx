import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Scene } from './components/Scene';
import { SceneErrorBoundary } from './components/SceneErrorBoundary';
import {
  ambientIdleMotionUrls,
  animationUrlsForType,
  immediateVoiceAnimation,
  type AnimationType,
} from './animation-catalog';
import {
  finishBodyAnimationOverride,
  resolveBodyAnimation,
  type BodyAnimationOverride,
} from './animation-priority';
import {
  loadPackagedSettingsFallback,
  SETTINGS_FALLBACK,
} from './settings-defaults';

const INITIAL_STATE: VoiceState = {
  activity: 'idle',
  microphoneMuted: false,
  outputMuted: false,
  phase: 'inactive',
};

const BODY_IDLE_DELAY_MS = 650;

export function App() {
  const [voice, setVoice] = useState<VoiceState>(INITIAL_STATE);
  const [audioLevel, setAudioLevel] = useState(0);
  const [voiceAnimation, setVoiceAnimation] = useState<AnimationType>('IDLE');
  const [bodyOverride, setBodyOverride] =
    useState<BodyAnimationOverride | null>(null);
  const [idleCycle, setIdleCycle] = useState(0);
  const [settings, setSettings] =
    useState<VoxAvatarSettingsSnapshot>(SETTINGS_FALLBACK);

  useEffect(() => {
    const bridge = window.voxavatarBridge;
    if (!bridge) return;
    void bridge.getSnapshot().then((event) => {
      if (event?.type === 'state') setVoice(event.state);
    });
    return bridge.subscribe((event) => {
      if (event.type === 'state') {
        setVoice(event.state);
      } else if (event.type === 'audio-level') {
        setAudioLevel(event.level);
      } else if (event.type === 'animation') {
        if (event.requestId != null) {
          setBodyOverride({
            animation: event.animation,
            animationName: event.animationName,
            animationUrls: event.animationUrls,
            requestId: event.requestId,
          });
        } else if (event.animation !== 'CUSTOM') {
          setVoiceAnimation(event.animation);
        }
      }
    });
  }, []);

  useEffect(() => {
    const settingsBridge = window.voxavatarSettings;
    if (!settingsBridge) {
      void loadPackagedSettingsFallback().then(setSettings);
      return;
    }
    void settingsBridge.get().then(setSettings);
    return settingsBridge.subscribe(setSettings);
  }, []);

  const speaking =
    voice.phase === 'active' &&
    voice.activity === 'speaking' &&
    !voice.outputMuted;

  useEffect(() => {
    const immediateAnimation = immediateVoiceAnimation(voice);
    if (immediateAnimation != null) {
      setVoiceAnimation(immediateAnimation);
      if (immediateAnimation === 'IDLE') setAudioLevel(0);
      return;
    }

    const timer = window.setTimeout(
      () => setVoiceAnimation('IDLE'),
      BODY_IDLE_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [voice]);

  const animation = resolveBodyAnimation(voiceAnimation, bodyOverride);
  const defaultModel =
    settings.default_model_id == null
      ? undefined
      : settings.models.find(
          (model) => model.id === settings.default_model_id,
        );
  const ambientUrls = useMemo(
    () => ambientIdleMotionUrls(settings.animations),
    [settings.animations],
  );
  const roleUrls = useMemo(
    () => animationUrlsForType(settings.animations, animation),
    [animation, settings.animations],
  );
  // 待機：從 Idle＋其他非說話動作池隨機抽；說話：只用 TALK 池。
  const configuredAnimationUrls =
    !bodyOverride && animation === 'IDLE' ? ambientUrls : roleUrls;
  const animationUrls =
    bodyOverride?.animationUrls ?? configuredAnimationUrls;
  // 有素材就 once 播完再隨機重抽，絕不固定順序 loop 同一支。
  const cycleRandomMotions =
    !bodyOverride && animation === 'IDLE' && animationUrls.length > 0;
  const animationRequest = bodyOverride?.requestId ?? idleCycle;
  const overrideRequestId = bodyOverride?.requestId ?? null;
  const handleAnimationComplete = useCallback(() => {
    if (overrideRequestId != null) {
      setBodyOverride((current) =>
        finishBodyAnimationOverride(current, overrideRequestId),
      );
      return;
    }
    if (cycleRandomMotions) setIdleCycle((value) => value + 1);
  }, [cycleRandomMotions, overrideRequestId]);

  return defaultModel ? (
    <SceneErrorBoundary
      fallback={<main aria-label="Avatar failed to load" className="app" />}
      resetKey={defaultModel.id}
    >
      <main className="app">
        <Scene
          animation={animation}
          animationRequest={animationRequest}
          animationUrls={animationUrls}
          audioLevel={audioLevel}
          characterSize={settings.character_size}
          interactiveOverlay
          lighting={settings.model_lighting[defaultModel.id]}
          modelUrl={defaultModel.asset_url}
          onAnimationComplete={handleAnimationComplete}
          playback={bodyOverride || cycleRandomMotions ? 'once' : 'loop'}
          speaking={speaking}
        />
      </main>
    </SceneErrorBoundary>
  ) : (
    <main className="app" />
  );
}
