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
  clearEventsForSource,
  defaultTtlForState,
  immediateAnimationFromResolved,
  pruneExpiredEvents,
  resolveCharacterState,
  voiceActivityToStateEvent,
  type CharacterStateEvent,
} from './character-state';
import { resolveStateMotion } from './character-state-slots';
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
  const [stateDrivenOverride, setStateDrivenOverride] =
    useState<BodyAnimationOverride | null>(null);
  const [idleCycle, setIdleCycle] = useState(0);
  const [settings, setSettings] =
    useState<VoxAvatarSettingsSnapshot>(SETTINGS_FALLBACK);
  const [messageQueue, setMessageQueue] = useState<CharacterMessage[]>([]);
  const [externalStateEvents, setExternalStateEvents] = useState<
    CharacterStateEvent[]
  >([]);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const idleRestTimerRef = useRef<number | null>(null);
  const stateMotionKeyRef = useRef('');

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
      } else if (event.type === 'character-state') {
        const next = event.event;
        setExternalStateEvents((events) => {
          const without = next.sourceId
            ? events.filter((item) => item.sourceId !== next.sourceId)
            : events;
          return [...without, next];
        });
        setNowMs(next.atMs);
      } else if (event.type === 'character-state-clear') {
        if (event.sourceId) {
          setExternalStateEvents((events) =>
            clearEventsForSource(events, event.sourceId!),
          );
        }
        setNowMs(event.atMs);
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
    const now = Date.now();
    const voiceEvent = voiceActivityToStateEvent(voice, now);
    const activeExternal = pruneExpiredEvents(externalStateEvents, now);
    const resolved = resolveCharacterState(
      [voiceEvent, ...activeExternal],
      now,
    );
    const playableNames = settings.animations
      .filter((animation) => animation.asset_urls.length > 0)
      .map((animation) => animation.animation_name);
    const motion = resolveStateMotion({
      state: resolved.state,
      bindings: settings.state_slot_bindings ?? {},
      playableNames,
    });
    const motionKey = `${resolved.state}:${motion.animationName ?? motion.animationHint ?? ''}`;

    if (motion.animationName) {
      const matched = settings.animations.find(
        (animation) => animation.animation_name === motion.animationName,
      );
      if (matched && matched.asset_urls.length > 0) {
        if (stateMotionKeyRef.current !== motionKey) {
          stateMotionKeyRef.current = motionKey;
          setStateDrivenOverride({
            animation: 'CUSTOM',
            animationName: motion.animationName,
            animationUrls: matched.asset_urls,
            requestId: Date.now(),
          });
        }
        return;
      }
    }

    if (stateMotionKeyRef.current !== motionKey) {
      stateMotionKeyRef.current = motionKey;
      setStateDrivenOverride(null);
    }

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
  }, [externalStateEvents, settings.animations, settings.state_slot_bindings, voice]);

  // 外部狀態 TTL 到期時主動剪除，避免只靠語音／設定變更才重算仲裁。
  useEffect(() => {
    const now = Date.now();
    const active = pruneExpiredEvents(externalStateEvents, now);
    if (active.length !== externalStateEvents.length) {
      setExternalStateEvents(active);
      return;
    }
    let soonest: number | null = null;
    for (const event of active) {
      const ttl =
        event.ttlMs != null && Number.isFinite(event.ttlMs)
          ? Math.max(0, event.ttlMs)
          : defaultTtlForState(event.state);
      if (ttl <= 0) continue;
      const expiresAt = event.atMs + ttl;
      if (expiresAt > now && (soonest == null || expiresAt < soonest)) {
        soonest = expiresAt;
      }
    }
    if (soonest == null) return;
    const timer = window.setTimeout(() => {
      setExternalStateEvents((events) => pruneExpiredEvents(events, Date.now()));
    }, Math.max(16, soonest - now));
    return () => window.clearTimeout(timer);
  }, [externalStateEvents]);

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

  const effectiveOverride = bodyOverride ?? stateDrivenOverride;
  const animation = resolveBodyAnimation(voiceAnimation, effectiveOverride);
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
    !effectiveOverride && animation === 'IDLE' ? ambientUrls : roleUrls;
  const animationUrls =
    effectiveOverride?.animationUrls ?? configuredAnimationUrls;
  const cycleRandomMotions =
    !effectiveOverride && animation === 'IDLE' && animationUrls.length > 0;
  const animationRequest = effectiveOverride?.requestId ?? idleCycle;
  const overrideRequestId = bodyOverride?.requestId ?? null;
  const idleRestMs = Number.isFinite(settings.idle_rest_ms)
    ? Math.max(2000, Math.min(60000, settings.idle_rest_ms))
    : DEFAULT_IDLE_REST_MS;
  const playback =
    bodyOverride || cycleRandomMotions
      ? 'once'
      : stateDrivenOverride
        ? 'loop'
        : 'loop';

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
          playback={playback}
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
