export interface SpellTestCase {
  input: string;
  expected: string;
  label: string;
}

export interface CodeRunOutput {
  output: string;
  error: string | null;
}

export interface SpellTestResult extends SpellTestCase {
  passed: boolean;
  got: string;
}

export type SpellEvaluation =
  | { kind: 'invalid'; error: string }
  | { kind: 'execution-error'; error: string }
  | { kind: 'results'; passed: boolean; results: SpellTestResult[] };

export type SpellBatchExecutor = (
  code: string,
  tests: readonly SpellTestCase[],
  signal?: AbortSignal,
) => Promise<CodeRunOutput[]>;

export const MAX_SPELL_CODE_CHARS = 10_000;
export const MAX_SPELL_TESTS = 12;
export const MAX_SPELL_INPUT_CHARS = 1_500;
export const MAX_SPELL_OUTPUT_CHARS = 2_000;
export const SPELL_EXECUTION_TIMEOUT_MS = 6_000;
const LOCAL_RECORD_PREFIX = 'bitzy_boss_battle_v1:';

interface IsolatedWorker {
  postMessage(message: unknown, transfer?: unknown[]): void;
  terminate(): void;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((event: { preventDefault?: () => void; message?: string }) => void) | null;
  onmessageerror: (() => void) | null;
}

interface IsolatedMessagePort {
  postMessage(message: unknown): void;
  close(): void;
  start(): void;
  onmessage: ((event: { data: unknown }) => void) | null;
  onmessageerror: (() => void) | null;
}

interface IsolatedMessageChannel {
  port1: IsolatedMessagePort;
  port2: IsolatedMessagePort;
}

function browserStorage(): RecordStorage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; }
  catch { return null; }
}

export function validateSpellSubmission(
  code: string,
  tests: readonly SpellTestCase[],
): string | null {
  if (typeof code !== 'string' || code.trim().length === 0) {
    return 'Write a JavaScript solution before casting your spell.';
  }
  if (code.length > MAX_SPELL_CODE_CHARS) {
    return `Keep your solution under ${MAX_SPELL_CODE_CHARS.toLocaleString()} characters.`;
  }
  if (!Array.isArray(tests) || tests.length === 0 || tests.length > MAX_SPELL_TESTS) {
    return 'This spell does not have a valid set of test cases. Return to the boss list and try again.';
  }
  if (tests.some(test =>
    typeof test.input !== 'string' || test.input.length > MAX_SPELL_INPUT_CHARS ||
    typeof test.expected !== 'string' || typeof test.label !== 'string'
  )) {
    return 'A spell test is invalid or too large to run safely.';
  }
  return null;
}

export function compareSpellOutput(output: CodeRunOutput, expected: string): boolean {
  return output.error === null && output.output.trim() === expected.trim();
}

export async function runSpellTests(
  code: string,
  tests: readonly SpellTestCase[],
  execute: SpellBatchExecutor = runInIsolatedWorker,
  signal?: AbortSignal,
): Promise<SpellEvaluation> {
  const validationError = validateSpellSubmission(code, tests);
  if (validationError) return { kind: 'invalid', error: validationError };

  try {
    const outputs = await execute(code, tests, signal);
    if (outputs.length !== tests.length) {
      return { kind: 'execution-error', error: 'The isolated runner returned an incomplete test result. Please try again.' };
    }
    const results = tests.map((test, index) => {
      const run = outputs[index] ?? { output: '', error: 'No result returned.' };
      const got = run.error ? `Error: ${run.error}` : run.output;
      return { ...test, got, passed: compareSpellOutput(run, test.expected) };
    });
    return { kind: 'results', passed: results.every(result => result.passed), results };
  } catch (error) {
    return {
      kind: 'execution-error',
      error: error instanceof Error ? error.message : 'The isolated runner could not complete. Please try again.',
    };
  }
}

function makeWorkerSource(): string {
  return `(() => {
    const blockedApis = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'indexedDB', 'caches', 'BroadcastChannel', 'Worker', 'SharedWorker'];
    for (const name of blockedApis) {
      try { Object.defineProperty(self, name, { value: undefined, writable: false, configurable: false }); }
      catch { try { self[name] = undefined; } catch {} }
    }

    function toText(value) {
      try { return String(value).slice(0, ${MAX_SPELL_OUTPUT_CHARS}); }
      catch { return '[result could not be converted to text]'; }
    }

    async function handleMessage(event) {
      const request = event.data;
      const resultPort = event.ports && event.ports[0];
      if (!request || request.type !== 'run' || !resultPort || typeof resultPort.postMessage !== 'function') return;
      const results = [];
      for (const test of request.tests) {
        try {
          const source = request.code + '\\nreturn (async () => { return ' + test.input + '; })();';
          const execute = new Function(source);
          const value = await execute();
          results.push({ output: toText(value), error: null });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown JavaScript error';
          results.push({ output: '', error: String(message).slice(0, 500) });
        }
      }
      resultPort.postMessage({ type: 'results', results });
    }

    self.addEventListener('message', event => { void handleMessage(event); });
  })();`;
}

export async function runInIsolatedWorker(
  code: string,
  tests: readonly SpellTestCase[],
  signal?: AbortSignal,
): Promise<CodeRunOutput[]> {
  if (signal?.aborted) throw new Error('Execution cancelled.');
  const browser = globalThis as unknown as {
    window?: unknown;
    Worker?: new (url: string, options?: { name?: string }) => IsolatedWorker;
    MessageChannel?: new () => IsolatedMessageChannel;
  };
  const WorkerCtor = browser.Worker;
  const MessageChannelCtor = browser.MessageChannel;
  if (!WorkerCtor || !MessageChannelCtor || typeof Blob === 'undefined' || typeof URL.createObjectURL !== 'function') {
    throw new Error('This browser cannot start an isolated code runner. Try a current desktop or mobile browser.');
  }
  if (!browser.window) {
    throw new Error('The isolated JavaScript runner is only available in a browser.');
  }

  const workerBlob = new Blob([makeWorkerSource()], { type: 'text/javascript' });
  const workerUrl = URL.createObjectURL(workerBlob);
  let worker: IsolatedWorker;
  try {
    worker = new WorkerCtor(workerUrl, { name: 'bitzy-spell-runner' }) as unknown as IsolatedWorker;
  } catch {
    URL.revokeObjectURL(workerUrl);
    throw new Error('The browser blocked the isolated runner. Check the site worker/CSP settings and try again.');
  }
  const channel = new MessageChannelCtor();

  return new Promise<CodeRunOutput[]>((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      finish(() => reject(new Error('Execution took too long and was stopped. Remove long-running loops and try again.')));
    }, SPELL_EXECUTION_TIMEOUT_MS);

    const finish = (complete: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal?.removeEventListener('abort', onAbort);
      URL.revokeObjectURL(workerUrl);
      channel.port1.close();
      try { channel.port2.close(); } catch { /* it may already be transferred */ }
      worker.terminate();
      complete();
    };
    const onAbort = () => finish(() => reject(new Error('Execution cancelled.')));
    signal?.addEventListener('abort', onAbort, { once: true });
    channel.port1.onmessage = (event: { data: unknown }) => {
      const rawData = event.data;
      if (!rawData || typeof rawData !== 'object') return;
      const data = rawData as { type?: unknown; results?: unknown };
      if (data.type !== 'results' || !Array.isArray(data.results)) return;
      finish(() => resolve(data.results as CodeRunOutput[]));
    };
    channel.port1.onmessageerror = () => finish(() => reject(new Error('The isolated runner returned unreadable results. Please try again.')));
    channel.port1.start();
    worker.onerror = event => {
      event.preventDefault?.();
      const detail = event.message ? ` ${event.message}` : '';
      finish(() => reject(new Error(`The isolated runner stopped unexpectedly.${detail} Try again in a current browser.`)));
    };
    worker.onmessageerror = () => finish(() => reject(new Error('The isolated runner returned unreadable results. Please try again.')));

    if (signal?.aborted) {
      onAbort();
      return;
    }
    try {
      worker.postMessage({ type: 'run', code, tests }, [channel.port2]);
    } catch {
      finish(() => reject(new Error('Your solution could not be sent to the isolated runner.')));
    }
  });
}

export interface LocalBossBattleRecord {
  version: 1;
  wins: number;
  bestScore: number;
  lastBossId: string | null;
  lastWinAt: string | null;
}

export type RecordStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function emptyBossBattleRecord(): LocalBossBattleRecord {
  return { version: 1, wins: 0, bestScore: 0, lastBossId: null, lastWinAt: null };
}

export function readLocalBossBattleRecord(
  userId: string,
  storage: RecordStorage | null = browserStorage(),
): LocalBossBattleRecord {
  if (!storage || !userId) return emptyBossBattleRecord();
  try {
    const raw = storage.getItem(`${LOCAL_RECORD_PREFIX}${encodeURIComponent(userId)}`);
    if (!raw) return emptyBossBattleRecord();
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return emptyBossBattleRecord();
    const record = value as Partial<LocalBossBattleRecord>;
    if (record.version !== 1 || !Number.isSafeInteger(record.wins) || (record.wins ?? -1) < 0 ||
        !Number.isFinite(record.bestScore) || (record.bestScore ?? -1) < 0) {
      return emptyBossBattleRecord();
    }
    return {
      version: 1,
      wins: record.wins ?? 0,
      bestScore: record.bestScore ?? 0,
      lastBossId: typeof record.lastBossId === 'string' ? record.lastBossId : null,
      lastWinAt: typeof record.lastWinAt === 'string' ? record.lastWinAt : null,
    };
  } catch {
    return emptyBossBattleRecord();
  }
}

export function recordLocalBossVictory(
  userId: string,
  bossId: string,
  score: number,
  storage: RecordStorage | null = browserStorage(),
  completedAt = new Date().toISOString(),
): LocalBossBattleRecord | null {
  if (!storage || !userId || !bossId || !Number.isFinite(score) || score < 0) return null;
  try {
    const previous = readLocalBossBattleRecord(userId, storage);
    const next: LocalBossBattleRecord = {
      version: 1,
      wins: previous.wins + 1,
      bestScore: Math.max(previous.bestScore, Math.floor(score)),
      lastBossId: bossId,
      lastWinAt: completedAt,
    };
    storage.setItem(`${LOCAL_RECORD_PREFIX}${encodeURIComponent(userId)}`, JSON.stringify(next));
    return next;
  } catch {
    return null;
  }
}
