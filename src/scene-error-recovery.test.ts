import { describe, expect, it } from 'vitest';
import { shouldResetSceneError } from './scene-error-recovery';

describe('shouldResetSceneError', () => {
  it('matches the App preview recovery contract when the model id changes', () => {
    expect(shouldResetSceneError('model-a', 'model-b', true)).toBe(true);
    expect(shouldResetSceneError('model-a', 'model-a', true)).toBe(false);
  });
});
