import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Scene } from './components/Scene';
import { SceneErrorBoundary } from './components/SceneErrorBoundary';
import { CharacterBubble } from './components/CharacterBubble';
import {
  ambientIdleMotionUrls,
  animationUrlsForType,
  type AnimationType,
} from './animation-catalog';
import {
  finishBodyAnimationOverride,
  resolveBodyAnimation,
  type BodyAnimationOverride,
} from './animation-priority';
import {
  enqueueCharacterMessage,
  isMessageVisible,
  type CharacterMessage,
} from './character-message';
import {
  immediateAnimationFromResolved,
  resolveCharacterState,
  voiceActivityToStateEvent,
} from './character-state';
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
const DEFAULT_IDLE_REST_MS = 8000;

export function App() {
  const [voice, setVoice] = useState<VoiceState>(INITIAL_STATE);
  const [audioLevel, setAudioLevel] = useState(0);
  const [voiceAnimation, setVoiceAnimation] = useState<AnimationType>('IDLE');
  const [bodyOverride, setBodyOverride] =
    useState<BodyAnimationOverride | null>(null);
  const [idleCycle, setIdleCycle] = useState(0);
  const [settings, setSettings] =
    useState<VoxAvatarSettingsSnapshot>(SETTINGS_FALLBACK);
  const [messageQueue, setMessageQueue] = useState<CharacterMessage[]>([]);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const idleRestTimerRef = useRef<number | null>(null);

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
      } else if (event.type === 'message') {
        setMessageQueue((queue) =>
          enqueueCharacterMessage(queue, {
            id: event.id,
            text: event.text,
            durationMs: event.durationMs,
            mood: event.mood,
            sourceId: event.sourceId ?? null,
            atMs: event.atMs,
          }),
        );
        setNowMs(event.atMs);
      } else if (event.type === 'message-clear') {
        setMessageQueue((queue) =>
          event.sourceId
            ? queue.filter((item) => item.sourceId !== event.sourceId)
            : [],
        );
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

  const clearIdleRestTimer = useCallback(() => {
    if (idleRestTimerRef.current == null) return;
    window.clearTimeout(idleRestTimerRef.current);
    idleRestTimerRef.current = null;
  }, []);

  useEffect(() => () => clearIdleRestTimer(), [clearIdleRestTimer]);

  const speaking =
    voice.phase === 'active' &&
    voice.activity === 'speaking' &&
    !voice.outputMuted;

  useEffect(() => {
    const voiceEvent = voiceActivityToStateEvent(voice, Date.now());
    const resolved = resolveCharacterState([voiceEvent], Date.now());
    const immediateAnimation = immediateAnimationFromResolved(resolved);
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

  const activeMessage = useMemo(() => {
    const visible = messageQueue.filter((item) => isMessageVisible(item, nowMs));
    return visible.length > 0 ? visible[visible.length - 1]! : null;
  }, [messageQueue, nowMs]);

  useEffect(() => {
    if (!activeMessage) return;
    const remaining = Math.max(
      0,
      activeMessage.atMs + activeMessage.durationMs - Date.now(),
    );
    const timer = window.setTimeout(() => {
      setNowMs(Date.now());
      setMessageQueue((queue) =>
        queue.filter((item) => isMessageVisible(item, Date.now())),
      );
    }, remaining + 16);
    return () => window.clearTimeout(timer);
  }, [activeMessage]);

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
  const configuredAnimationUrls =
    !bodyOverride && animation === 'IDLE' ? ambientUrls : roleUrls;
  const animationUrls =
    bodyOverride?.animationUrls ?? configuredAnimationUrls;
  const cycleRandomMotions =
    !bodyOverride && animation === 'IDLE' && animationUrls.length > 0;
  const animationRequest = bodyOverride?.requestId ?? idleCycle;
  const overrideRequestId = bodyOverride?.requestId ?? null;
  const idleRestMs = Number.isFinite(settings.idle_rest_ms)
    ? Math.max(2000, Math.min(60000, settings.idle_rest_ms))
    : DEFAULT_IDLE_REST_MS;

  useEffect(() => {
    if (!cycleRandomMotions) clearIdleRestTimer();
  }, [clearIdleRestTimer, cycleRandomMotions]);

  const handleAnimationComplete = useCallback(() => {
    if (overrideRequestId != null) {
      setBodyOverride((current) =>
        finishBodyAnimationOverride(current, overrideRequestId),
      );
      return;
    }
    if (!cycleRandomMotions) return;
    clearIdleRestTimer();
    idleRestTimerRef.current = window.setTimeout(() => {
      idleRestTimerRef.current = null;
      setIdleCycle((value) => value + 1);
    }, idleRestMs);
  }, [clearIdleRestTimer, cycleRandomMotions, idleRestMs, overrideRequestId]);

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
        <CharacterBubble
          characterSize={settings.character_size}
          message={activeMessage}
        />
      </main>
    </SceneErrorBoundary>
  ) : (
    <main className="app" />
  );
}
