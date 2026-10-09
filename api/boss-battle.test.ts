import { describe, expect, it, vi } from 'vitest';
import {
  MAX_SPELL_CODE_CHARS,
  compareSpellOutput,
  emptyBossBattleRecord,
  readLocalBossBattleRecord,
  recordLocalBossVictory,
  runSpellTests,
  validateSpellSubmission,
  type RecordStorage,
  type SpellTestCase,
} from '../src/lib/bossBattle';

class MemoryStorage implements RecordStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const tests: SpellTestCase[] = [
  { input: "createLink('https://bitzy.dev', 'Bitzy')", expected: '<a href="https://bitzy.dev">Bitzy</a>', label: 'Link' },
  { input: "createLink('https://example.test', 'Demo')", expected: '<a href="https://example.test">Demo</a>', label: 'Link 2' },
];

describe('Boss Battle spell evaluation', () => {
  it('rejects empty, overlong, or invalid test submissions before running code', async () => {
    expect(validateSpellSubmission('  ', tests)).toMatch(/Write a JavaScript solution/);
    expect(validateSpellSubmission('x'.repeat(MAX_SPELL_CODE_CHARS + 1), tests)).toMatch(/characters/);
    expect(validateSpellSubmission('function ok(){}', [])).toMatch(/valid set of test cases/);
    const executor = vi.fn(async () => []);
    const result = await runSpellTests('', tests, executor);
    expect(result).toMatchObject({ kind: 'invalid' });
    expect(executor).not.toHaveBeenCalled();
  });

  it('returns a passing result only when every expected output matches', async () => {
    const executor = vi.fn(async () => [
      { output: '<a href="https://bitzy.dev">Bitzy</a>\n', error: null },
      { output: '<a href="https://example.test">Demo</a>', error: null },
    ]);
    const result = await runSpellTests('function createLink() {}', tests, executor);
    expect(result).toMatchObject({ kind: 'results', passed: true });
    if (result.kind === 'results') expect(result.results.map(item => item.passed)).toEqual([true, true]);
    expect(executor).toHaveBeenCalledWith('function createLink() {}', tests, undefined);
  });

  it('preserves per-case failures and execution errors instead of treating them as success', async () => {
    const executor = vi.fn(async () => [
      { output: 'wrong result', error: null },
      { output: '', error: 'SyntaxError: Unexpected token' },
    ]);
    const result = await runSpellTests('broken code', tests, executor);
    expect(result).toMatchObject({ kind: 'results', passed: false });
    if (result.kind === 'results') {
      expect(result.results[0]).toMatchObject({ passed: false, got: 'wrong result' });
      expect(result.results[1]).toMatchObject({ passed: false, got: 'Error: SyntaxError: Unexpected token' });
    }
  });

  it('turns a runner failure into a visible execution error result', async () => {
    const result = await runSpellTests('function ok() {}', tests, async () => {
      throw new Error('worker timed out');
    });
    expect(result).toEqual({ kind: 'execution-error', error: 'worker timed out' });
  });

  it('compares trimmed strings but never ignores a runtime error', () => {
    expect(compareSpellOutput({ output: ' pass \n', error: null }, 'pass')).toBe(true);
    expect(compareSpellOutput({ output: 'pass', error: 'ReferenceError' }, 'pass')).toBe(false);
  });
});

describe('Boss Battle on-device completion history', () => {
  it('records each victory and retains the best score for that account on this device', () => {
    const storage = new MemoryStorage();
    const first = recordLocalBossVictory('user/a', 'html-dragon', 450, storage, '2026-10-01T00:00:00.000Z');
    const second = recordLocalBossVictory('user/a', 'html-dragon', 350, storage, '2026-10-02T00:00:00.000Z');
    expect(first).toMatchObject({ wins: 1, bestScore: 450, lastBossId: 'html-dragon' });
    expect(second).toMatchObject({ wins: 2, bestScore: 450, lastWinAt: '2026-10-02T00:00:00.000Z' });
    expect(readLocalBossBattleRecord('user/a', storage)).toEqual(second);
    expect(readLocalBossBattleRecord('another-user', storage)).toEqual(emptyBossBattleRecord());
  });

  it('does not claim persistence when storage is unavailable or corrupt', () => {
    const storage = new MemoryStorage();
    storage.setItem('bitzy_boss_battle_v1:user', '{invalid');
    expect(readLocalBossBattleRecord('user', storage)).toEqual(emptyBossBattleRecord());
    expect(recordLocalBossVictory('user', 'html-dragon', 100, null)).toBeNull();
  });
});
