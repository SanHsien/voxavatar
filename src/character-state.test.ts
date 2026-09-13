import { describe, expect, it } from 'vitest';
import {
  animationHintForState,
  clearEventsForSource,
  immediateAnimationFromResolved,
  normalizeExternalStateEvent,
  pruneExpiredEvents,
  resolveCharacterState,
  voiceActivityToStateEvent,
  type CharacterStateEvent,
} from './character-state';

describe('resolveCharacterState', () => {
  it('falls back to idle when no events', () => {
    const resolved = resolveCharacterState([], 1000);
    expect(resolved.state).toBe('idle');
    expect(resolved.animationHint).toBe('IDLE');
  });

  it('prefers speaking over listening and working', () => {
    const events: CharacterStateEvent[] = [
      {
        id: '1',
        state: 'listening',
        sourceKind: 'voice',
        atMs: 100,
      },
      {
        id: '2',
        state: 'working',
        sourceKind: 'mcp',
        sourceId: 's1',
        atMs: 200,
      },
      {
        id: '3',
        state: 'speaking',
        sourceKind: 'voice',
        atMs: 300,
      },
    ];
    const resolved = resolveCharacterState(events, 400);
    expect(resolved.state).toBe('speaking');
    expect(resolved.animationHint).toBe('TALK');
  });

  it('lets user override beat speaking', () => {
    const events: CharacterStateEvent[] = [
      {
        id: 'speak',
        state: 'speaking',
        sourceKind: 'voice',
        atMs: 500,
      },
      {
        id: 'user-idle',
        state: 'idle',
        sourceKind: 'user',
        atMs: 600,
        ttlMs: 10_000,
      },
    ];
    expect(resolveCharacterState(events, 700).state).toBe('idle');
  });

  it('prefers failed over success over speaking', () => {
    const events: CharacterStateEvent[] = [
      { id: 'a', state: 'speaking', sourceKind: 'voice', atMs: 1 },
      { id: 'b', state: 'success', sourceKind: 'mcp', sourceId: 'x', atMs: 2 },
      { id: 'c', state: 'failed', sourceKind: 'mcp', sourceId: 'x', atMs: 3 },
    ];
    expect(resolveCharacterState(events, 10).state).toBe('failed');
  });

  it('drops expired short-lived feedback', () => {
    const events: CharacterStateEvent[] = [
      {
        id: 'ok',
        state: 'success',
        sourceKind: 'system',
        atMs: 0,
        ttlMs: 1000,
      },
      {
        id: 'work',
        state: 'working',
        sourceKind: 'mcp',
        sourceId: 's',
        atMs: 0,
        ttlMs: 60_000,
      },
    ];
    expect(resolveCharacterState(events, 500).state).toBe('success');
    expect(resolveCharacterState(events, 2000).state).toBe('working');
  });

  it('same priority keeps the newer event', () => {
    const events: CharacterStateEvent[] = [
      {
        id: 'old',
        state: 'working',
        sourceKind: 'mcp',
        sourceId: 'a',
        atMs: 10,
      },
      {
        id: 'new',
        state: 'working',
        sourceKind: 'mcp',
        sourceId: 'b',
        atMs: 20,
      },
    ];
    expect(resolveCharacterState(events, 30).event?.id).toBe('new');
  });
});

describe('event helpers', () => {
  it('clears events for a disconnected source', () => {
    const events: CharacterStateEvent[] = [
      {
        id: '1',
        state: 'working',
        sourceKind: 'mcp',
        sourceId: 'gone',
        atMs: 1,
      },
      {
        id: '2',
        state: 'listening',
        sourceKind: 'voice',
        sourceId: 'voice',
        atMs: 1,
      },
    ];
    const next = clearEventsForSource(events, 'gone');
    expect(next).toHaveLength(1);
    expect(next[0]?.sourceId).toBe('voice');
  });

  it('prunes expired events', () => {
    const events: CharacterStateEvent[] = [
      { id: '1', state: 'failed', sourceKind: 'system', atMs: 0, ttlMs: 100 },
      { id: '2', state: 'idle', sourceKind: 'voice', atMs: 0, ttlMs: 0 },
    ];
    expect(pruneExpiredEvents(events, 200)).toHaveLength(1);
  });
});

describe('voice mapping', () => {
  it('maps speaking and listening like the legacy voice path', () => {
    const speaking = voiceActivityToStateEvent(
      { activity: 'speaking', outputMuted: false, phase: 'active' },
      1000,
    );
    const listening = voiceActivityToStateEvent(
      { activity: 'listening', outputMuted: false, phase: 'active' },
      1000,
    );
    const muted = voiceActivityToStateEvent(
      { activity: 'speaking', outputMuted: true, phase: 'active' },
      1000,
    );
    expect(immediateAnimationFromResolved(resolveCharacterState([speaking], 1000))).toBe(
      'TALK',
    );
    expect(
      immediateAnimationFromResolved(resolveCharacterState([listening], 1000)),
    ).toBeNull();
    expect(immediateAnimationFromResolved(resolveCharacterState([muted], 1000))).toBe(
      'IDLE',
    );
  });

  it('animationHintForState covers speaking and idle family', () => {
    expect(animationHintForState('speaking')).toBe('TALK');
    expect(animationHintForState('idle')).toBe('IDLE');
    expect(animationHintForState('working')).toBeNull();
  });
});

describe('normalizeExternalStateEvent', () => {
  it('accepts mcp working events and clamps ttl', () => {
    const result = normalizeExternalStateEvent(
      {
        state: 'working',
        sourceKind: 'mcp',
        sourceId: 'session-1',
        ttlMs: 999_999,
      },
      1000,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.event.state).toBe('working');
    expect(result.event.sourceKind).toBe('mcp');
    expect(result.event.ttlMs).toBe(600_000);
  });

  it('rejects invalid state and voice sourceKind', () => {
    expect(
      normalizeExternalStateEvent({ state: 'dancing', sourceKind: 'mcp' }, 1)
        .ok,
    ).toBe(false);
    expect(
      normalizeExternalStateEvent({ state: 'idle', sourceKind: 'voice' }, 1)
        .ok,
    ).toBe(false);
  });
});
