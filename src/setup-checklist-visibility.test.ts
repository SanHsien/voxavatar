import { describe, expect, it } from 'vitest';
import { shouldShowSetupChecklist } from './setup-checklist-visibility';

describe('shouldShowSetupChecklist', () => {
  it('hides when readiness is missing or complete', () => {
    expect(shouldShowSetupChecklist(null)).toBe(false);
    expect(shouldShowSetupChecklist(undefined)).toBe(false);
    expect(shouldShowSetupChecklist({ complete: true })).toBe(false);
  });

  it('shows only while setup is incomplete', () => {
    expect(shouldShowSetupChecklist({ complete: false })).toBe(true);
  });
});
