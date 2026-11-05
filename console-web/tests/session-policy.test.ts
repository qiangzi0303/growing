import { describe, expect, it } from 'vitest';
import { landing, safeReturn, canVisit, businessPages } from '../src/features/session/policy';

describe('console entry policy', () => {
  it('routes only confirmed adults into console', () => {
    expect(landing(null)).toBe('/console/login');
    expect(landing({ role: 'Student', roleSelectionRequired: false })).toBe('/');
    expect(landing({ role: 'Parent', roleSelectionRequired: true })).toBe('/?choose-role=1');
    expect(landing({ role: 'Student', roleSelectionRequired: true })).toBe('/?choose-role=1');
    expect(landing({ role: 'Parent', roleSelectionRequired: false })).toBe('/console/home');
    expect(landing({ role: 'Admin' })).toBe('/console/home');
    expect(landing({ role: 'Other' })).toBe('/console/403');
    expect(landing({ role: 'Parent' })).toBe('/?choose-role=1');
  });
  it('accepts only existing console return paths', () => {
    expect(safeReturn('/console/students?id=1')).toBe('/console/students?id=1');
    for (const path of [
      'https://evil.test/',
      '//evil.test/',
      '/api/admin/members',
      '/console/login',
      '/console/login?x=1',
      '/console/%2e%2e/home',
      '/console/students/%252e%252e',
      '/console/students\\evil',
      '/console/unknown'
    ]) {
      expect(safeReturn(path)).toBe('/console/home');
    }
  });
  for (const page of businessPages) {
    it(`enforces roles for ${page.path}`, () => {
      expect(canVisit({ role: 'Admin' }, page.path)).toBe(true);
      expect(canVisit({ role: 'Parent', roleSelectionRequired: false }, page.path)).toBe(!page.adminOnly);
      for (const profile of [
        null,
        { role: 'Student', roleSelectionRequired: false },
        { role: 'Parent', roleSelectionRequired: true },
        { role: 'Other' }
      ])
        expect(canVisit(profile, page.path)).toBe(false);
    });
  }
});
