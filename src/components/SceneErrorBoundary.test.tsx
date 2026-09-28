import { describe, expect, it, vi } from 'vitest';
import { SceneErrorBoundary } from './SceneErrorBoundary';
import type { SceneErrorBoundaryProps } from './SceneErrorBoundary';

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

  it('clears failed state when resetKey changes after an error', () => {
    const child = <span>scene</span>;
    const fallback = <span>recovery</span>;
    const previousProps: SceneErrorBoundaryProps = {
      children: child,
      fallback,
      resetKey: 'model-a',
    };
    const nextProps: SceneErrorBoundaryProps = {
      ...previousProps,
      resetKey: 'model-b',
    };
    const boundary = new SceneErrorBoundary(previousProps);

    boundary.state = SceneErrorBoundary.getDerivedStateFromError();
    expect(boundary.render()).toBe(fallback);

    Object.defineProperty(boundary, 'props', {
      configurable: true,
      get: () => nextProps,
    });
    boundary.setState = ((update) => {
      boundary.state = {
        ...boundary.state,
        ...(typeof update === 'function'
          ? update(boundary.state, nextProps)
          : update),
      };
    }) as typeof boundary.setState;
    boundary.componentDidUpdate(previousProps);

    expect(boundary.state.failed).toBe(false);
    expect(boundary.render()).toBe(child);
  });
});
