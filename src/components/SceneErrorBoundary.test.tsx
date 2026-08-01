import { describe, expect, it, vi } from 'vitest';
import { SceneErrorBoundary } from './SceneErrorBoundary';

describe('SceneErrorBoundary', () => {
  it('switches from the scene to the recovery fallback after a render error', () => {
    const child = <span>scene</span>;
    const fallback = <span>recovery</span>;
    const boundary = new SceneErrorBoundary({
      children: child,
      fallback,
      resetKey: 'model-a',
    });

    expect(boundary.render()).toBe(child);
    boundary.state = SceneErrorBoundary.getDerivedStateFromError();
    expect(boundary.render()).toBe(fallback);
  });

  it('reports the loader error to an optional observer', () => {
    const onError = vi.fn();
    const boundary = new SceneErrorBoundary({
      children: null,
      fallback: null,
      onError,
      resetKey: 'model-a',
    });
    const error = new Error('broken model');
    const info = { componentStack: '\n at Scene' };

    boundary.componentDidCatch(error, info);

    expect(onError).toHaveBeenCalledWith(error, info);
  });
});
