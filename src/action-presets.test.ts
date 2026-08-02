import { describe, expect, it } from 'vitest';
import { ACTION_PRESETS, resolveActionPreset } from './action-presets';

describe('action presets', () => {
  it('uses unique lowercase hyphenated animation names', () => {
    const names = ACTION_PRESETS.map((preset) => preset.animation_name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) {
      expect(name).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('resolves Traditional Chinese and English copy', () => {
    const preset = ACTION_PRESETS[0];
    const zh = resolveActionPreset(preset, 'zh-TW');
    const en = resolveActionPreset(preset, 'en');
    expect(zh.animation_name).toBe(preset.animation_name);
    expect(zh.label).toBe(preset.zh.label);
    expect(en.label).toBe(preset.en.label);
    expect(zh.animation_description.length).toBeGreaterThan(0);
    expect(en.animation_trigger_scenario.length).toBeGreaterThan(0);
  });
});
