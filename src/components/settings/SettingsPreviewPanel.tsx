import type { ReactNode } from 'react';
import { Scene } from '../Scene';
import { SceneErrorBoundary } from '../SceneErrorBoundary';
import type { PlayableAnimationType } from '../../animation-catalog';

type SettingsTranslate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

export interface SettingsPreviewPanelProps {
  modelName: string;
  modelUrl: string | undefined;
  modelId: string | undefined;
  previewCollapsed: boolean;
  previewType: PlayableAnimationType;
  previewRequest: number;
  previewAnimationUrls: string[];
  previewLighting: VoxAvatarLightingSettings;
  characterSize: number;
  playback: 'once' | 'loop';
  previewTitle: string;
  previewDescription: string | null;
  t: SettingsTranslate;
  onToggleCollapsed: () => void;
  onAnimationComplete: () => void;
}

export function SettingsPreviewPanel({
  modelName,
  modelUrl,
  modelId,
  previewCollapsed,
  previewType,
  previewRequest,
  previewAnimationUrls,
  previewLighting,
  characterSize,
  playback,
  previewTitle,
  previewDescription,
  t,
  onToggleCollapsed,
  onAnimationComplete,
}: SettingsPreviewPanelProps): ReactNode {
  return (
    <aside className="settings-preview">
      <button
        aria-expanded={!previewCollapsed}
        aria-label={
          previewCollapsed
            ? t('preview.expandAria')
            : t('preview.collapseAria')
        }
        className="settings-preview-toggle"
        onClick={onToggleCollapsed}
        title={
          previewCollapsed ? t('preview.expand') : t('preview.collapse')
        }
        type="button"
      >
        <span aria-hidden="true">{previewCollapsed ? '‹' : '›'}</span>
      </button>

      {!previewCollapsed && (
        <>
          <div className="preview-header">
            <div>
              <span className="eyebrow">{t('preview.live')}</span>
              <strong>{modelName}</strong>
            </div>
            <span className="preview-live">
              <i />
              {t('preview.liveBadge')}
            </span>
          </div>
          <div className="preview-stage" data-testid="settings-preview">
            {modelUrl && modelId && (
              <SceneErrorBoundary
                fallback={(
                  <div className="preview-load-error" role="alert">
                    <strong>{t('preview.loadError')}</strong>
                    <p>{t('preview.loadErrorHint')}</p>
                  </div>
                )}
                resetKey={modelId}
              >
                <Scene
                  animation={previewType}
                  animationRequest={previewRequest}
                  animationUrls={previewAnimationUrls}
                  audioLevel={0}
                  characterSize={characterSize}
                  lighting={previewLighting}
                  enablePan={false}
                  framingMargin={1.22}
                  groundShadow
                  modelUrl={modelUrl}
                  onAnimationComplete={onAnimationComplete}
                  playback={playback}
                  speaking={false}
                />
              </SceneErrorBoundary>
            )}
            <div className="preview-hint">{t('preview.hint')}</div>
          </div>
          <div className="preview-now-playing">
            <span>{t('preview.nowPlaying')}</span>
            <strong>{previewTitle}</strong>
            {previewDescription && <small>{previewDescription}</small>}
          </div>
        </>
      )}
    </aside>
  );
}
