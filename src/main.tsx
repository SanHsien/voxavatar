import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { SettingsPage } from './components/SettingsPage';
import { applyTheme, readStoredTheme, resolveTheme } from './theme';
import './styles.css';

const settingsView =
  new URLSearchParams(window.location.search).get('view') === 'settings';
if (settingsView) {
  document.title = 'VoxAvatar Settings';
  // Applied before the first render so a light window never paints dark first.
  // The avatar overlay is left untouched, keeping its dark transparent canvas.
  applyTheme(resolveTheme(readStoredTheme()));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {settingsView ? <SettingsPage /> : <App />}
  </StrictMode>,
);
