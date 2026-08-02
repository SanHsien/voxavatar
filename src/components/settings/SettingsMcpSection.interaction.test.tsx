/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsMcpSection } from './SettingsMcpSection';
import { mcpToolDescriptionKeys, settingsT } from '../../settings-i18n';

describe('SettingsMcpSection', () => {
  it('lists set_character_state and schema versions from status', () => {
    render(
      <SettingsMcpSection
        copyText={vi.fn(async () => undefined)}
        mcpHealth="online"
        mcpLoading={false}
        mcpServerUrl="http://127.0.0.1:47831/mcp"
        mcpSetupCommand="codex mcp add voxavatar --url http://127.0.0.1:47831/mcp"
        mcpShowMessageEnabled={false}
        mcpStatus={{
          checked_at: new Date().toISOString(),
          error: null,
          health: 'online',
          health_url: 'http://127.0.0.1:47831/health',
          local_only: true,
          playable_actions: [],
          server_url: 'http://127.0.0.1:47831/mcp',
          setup_command:
            'codex mcp add voxavatar --url http://127.0.0.1:47831/mcp',
          status_schema_version: 2,
          tools: [
            'play_animation',
            'list_animations',
            'control_window',
            'get_status',
            'show_message',
            'set_character_state',
          ],
          tools_schema_version: 3,
          transport: 'Streamable HTTP',
          version: '0.15.1',
        }}
        onToggleMcpShowMessage={vi.fn()}
        refreshMcpStatus={vi.fn(async () => undefined)}
        t={(key, vars) => settingsT('zh-TW', key, vars)}
      />,
    );

    expect(screen.getByText('set_character_state')).toBeTruthy();
    expect(screen.getByTestId('mcp-schema-versions').textContent).toContain(
      'tools=3',
    );
    expect(screen.getByTestId('mcp-schema-versions').textContent).toContain(
      'status=2',
    );
    expect(mcpToolDescriptionKeys()).toContain('set_character_state');
  });

  it('shows diagnostic copy when handler is provided', () => {
    const copyDiagnosticSummary = vi.fn();
    render(
      <SettingsMcpSection
        copyDiagnosticSummary={copyDiagnosticSummary}
        copyText={vi.fn(async () => undefined)}
        mcpHealth="online"
        mcpLoading={false}
        mcpServerUrl="http://127.0.0.1:47831/mcp"
        mcpSetupCommand="codex mcp add voxavatar --url http://127.0.0.1:47831/mcp"
        mcpShowMessageEnabled={false}
        mcpStatus={null}
        onToggleMcpShowMessage={vi.fn()}
        refreshMcpStatus={vi.fn(async () => undefined)}
        t={(key, vars) => settingsT('zh-TW', key, vars)}
      />,
    );

    const button = screen.getByRole('button', { name: '複製診斷摘要' });
    button.click();
    expect(copyDiagnosticSummary).toHaveBeenCalledTimes(1);
  });
});
