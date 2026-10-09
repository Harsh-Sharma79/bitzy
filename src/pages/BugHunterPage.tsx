import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bug, CheckCircle2, ChevronRight, Clock3, Code2, Flame, Lightbulb, RotateCcw, ShieldCheck, Sparkles, Trophy, Zap } from 'lucide-react';

type Mission = { title: string; level: string; language: string; brief: string; broken: string; expected: string; hint: string; explanation: string; checks: { label: string; test: (code: string) => boolean }[] };
const missions: Mission[] = [
  { title: 'The Off-by-One Trap', level: 'EASY', language: 'JavaScript', brief: 'This function should add every number in the array. It mysteriously skips the last one.', broken: `function sumNumbers(numbers) {\n  let total = 0;\n  for (let i = 0; i < numbers.length - 1; i++) {\n    total += numbers[i];\n  }\n  return total;\n}\n\n// sumNumbers([2, 4, 6]) should return 12`, expected: 'numbers.length', hint: 'Check the loop condition. What is the final valid index, and how does it relate to the array length?', explanation: 'Array indexes start at 0, so the loop should continue while i is less than numbers.length. Using length - 1 stops one item too early.', checks: [{ label: 'Loop uses the full array length', test: c => /i\s*<\s*numbers\.length\s*;/.test(c) }, { label: 'Each visited value is added to total', test: c => /total\s*\+=\s*numbers\[i\]/.test(c) }, { label: 'The function returns the total', test: c => /return\s+total/.test(c) }] },
  { title: 'The Equality Crisis', level: 'MEDIUM', language: 'JavaScript', brief: 'This function should return true only when a user is old enough. Why does it reject someone who is exactly 18?', broken: `function canEnter(age) {\n  if (age = 18) {\n    return true;\n  }\n  return age > 18;\n}\n\n// canEnter(18) should return true`, expected: 'age === 18', hint: 'One equals sign assigns a value. Which operator compares values without changing the variable?', explanation: 'A single = is assignment, not comparison. Use === for strict equality, or simplify the condition to age >= 18.', checks: [{ label: 'Uses a comparison, not assignment', test: c => !/if\s*\(\s*age\s*=\s*18\s*\)/.test(c) && /age\s*(===|>=|>)\s*18/.test(c) }, { label: 'Accepts the boundary age of 18', test: c => /age\s*(===|>=)\s*18/.test(c) }, { label: 'Returns a boolean result', test: c => /return\s+(true|false|age\s*[><=])/.test(c) }] },
  { title: 'The Missing Return', level: 'MEDIUM', language: 'JavaScript', brief: 'The map should double each number, but it produces an array of undefined values.', broken: `const doubled = [1, 2, 3].map((n) => {\n  n * 2;\n});\n\n// doubled should be [2, 4, 6]`, expected: 'return n * 2', hint: 'When an arrow function uses curly braces, what must it explicitly send back?', explanation: 'A callback with curly braces needs an explicit return. Alternatively, remove the braces and use the concise arrow-function body: n => n * 2.', checks: [{ label: 'Returns the computed value', test: c => /return\s+n\s*\*\s*2/.test(c) || /map\s*\(\s*n\s*=>\s*n\s*\*\s*2\s*\)/.test(c) }, { label: 'Keeps the map transformation', test: c => /\.map\s*\(/.test(c) }, { label: 'Doubles each item', test: c => /n\s*\*\s*2/.test(c) }] },
];
const STORAGE = 'bitzy-bug-hunter-v1';
type Saved = { xp: number; solved: number[]; best: number };
const getSaved = (): Saved => { try { const v = localStorage.getItem(STORAGE); return v ? JSON.parse(v) as Saved : { xp: 0, solved: [], best: 0 }; } catch { return { xp: 0, solved: [], best: 0 }; } };

export default function BugHunterPage() {
  const [index, setIndex] = useState(0);
  const [code, setCode] = useState(missions[0].broken);
  const [hintOpen, setHintOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [seconds, setSeconds] = useState(90);
  const [saved, setSaved] = useState<Saved>(getSaved);
  const [newlyCleared, setNewlyCleared] = useState(false);
  const mission = missions[index];
  const results = useMemo(() => mission.checks.map(c => ({ label: c.label, pass: c.test(code) })), [mission, code]);
  const passed = results.every(r => r.pass);
  const alreadySolved = saved.solved.includes(index);
  useEffect(() => { if (checked || seconds <= 0) return; const timer = window.setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000); return () => window.clearInterval(timer); }, [checked, seconds]);
  useEffect(() => { try { localStorage.setItem(STORAGE, JSON.stringify(saved)); } catch { /* private browsing may block storage */ } }, [saved]);
  const restart = (next = index) => { setIndex(next); setCode(missions[next].broken); setHintOpen(false); setChecked(false); setNewlyCleared(false); setSeconds(90); };
  const runTests = () => { setChecked(true); if (passed && !alreadySolved) { setNewlyCleared(true); setSaved(s => ({ ...s, xp: s.xp + Math.max(25, seconds), solved: [...s.solved, index], best: Math.max(s.best, seconds) })); } };
  const fmt = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bug-page space-y-5 pb-10">
    <section className="bug-hero relative overflow-hidden rounded-[28px] p-5 sm:p-7 text-white">
      <div className="bug-orb bug-orb-one"/><div className="bug-orb bug-orb-two"/>
      <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold"><Sparkles size={14}/> BITZY ARCADE · NEW MODE</div><h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">Bug Hunter<span className="text-cyan-300">.</span></h1><p className="mt-2 max-w-xl text-sm sm:text-base text-white/75">Find the bug. Fix the logic. Prove your instincts.</p></div>
        <div className="flex gap-2"><div className="bug-glass-stat"><Zap size={16} className="text-yellow-300"/><span><b>{saved.xp}</b><small>XP earned</small></span></div><div className="bug-glass-stat"><Trophy size={16} className="text-cyan-200"/><span><b>{saved.solved.length}/{missions.length}</b><small>Cleared</small></span></div></div>
      </div>
      <div className="relative z-10 mt-6 flex gap-2">{missions.map((m, i) => <button key={m.title} onClick={() => restart(i)} aria-label={`Open mission ${i + 1}`} className={`bug-mission-dot ${i === index ? 'selected' : ''} ${saved.solved.includes(i) ? 'cleared' : ''}`}>{saved.solved.includes(i) ? '✓' : `0${i + 1}`}</button>)}</div>
    </section>

    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)] gap-4 items-start">
      <section className="bug-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-4 sm:px-5"><div className="flex items-center gap-3"><div className="bug-icon-box"><Bug size={21}/></div><div><p className="font-extrabold" style={{ color: 'var(--text)' }}>{mission.title}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{mission.language} · Mission {index + 1} of {missions.length}</p></div></div><div className={`bug-timer ${seconds < 20 ? 'urgent' : ''}`}><Clock3 size={15}/>{fmt}</div></div>
        <div className="p-4 sm:p-5"><div className="flex items-center gap-2 mb-2"><span className="bug-level">{mission.level}</span><span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>DEBUG CHALLENGE</span></div><p className="text-sm leading-6 mb-4" style={{ color: 'var(--text-light)' }}>{mission.brief}</p>
          <div className="bug-editor-wrap"><div className="bug-editor-bar"><div className="flex gap-1.5"><i/><i/><i/></div><span><Code2 size={13}/> solution.js</span><span className="text-[10px] opacity-60">EDITABLE</span></div><textarea aria-label="Edit code to fix the bug" spellCheck={false} value={code} onChange={e => { setCode(e.target.value); setChecked(false); }} className="bug-code-editor" /></div>
          {seconds === 0 && !checked && <p className="mt-3 text-xs font-bold text-rose-500">Time's up! You can still submit your fix or restart the mission.</p>}
          {checked && <div className={`mt-4 rounded-2xl border p-4 ${passed ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/30 bg-amber-500/10'}`}><div className="flex items-center gap-2 font-extrabold" style={{ color: 'var(--text)' }}>{passed ? <CheckCircle2 className="text-emerald-500"/> : <Bug className="text-amber-500"/>}{passed ? (newlyCleared ? 'Bug squashed! Nice work.' : 'Mission already cleared!') : 'Not quite — keep debugging.'}</div><div className="mt-3 space-y-2">{results.map(r => <div key={r.label} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-light)' }}>{r.pass ? <CheckCircle2 size={14} className="text-emerald-500"/> : <span className="text-amber-500">○</span>}{r.label}</div>)}</div>{passed && <p className="mt-3 text-sm font-bold text-emerald-500">{newlyCleared ? `+${Math.max(25, seconds)} XP added to your Bug Hunter score!` : 'Practice makes progress.'}</p>}<p className="mt-3 text-xs leading-5" style={{ color: 'var(--text-muted)' }}>{mission.explanation}</p></div>}
          <div className="mt-4 flex flex-wrap gap-2"><button onClick={runTests} className="bug-primary-btn"><ShieldCheck size={17}/> Run test cases</button><button onClick={() => setHintOpen(v => !v)} className="bug-secondary-btn"><Lightbulb size={16}/>{hintOpen ? 'Hide hint' : 'Get a hint'}</button><button onClick={() => restart()} className="bug-secondary-btn" title="Restart mission"><RotateCcw size={16}/></button></div>
          {hintOpen && <div className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 text-sm leading-6" style={{ color: 'var(--text-light)' }}><Lightbulb size={16} className="inline mr-2 text-violet-400"/>{mission.hint}</div>}
          {checked && passed && <div className="mt-4 flex justify-end"><button onClick={() => restart((index + 1) % missions.length)} className="bug-primary-btn">Next mission <ChevronRight size={17}/></button></div>}
        </div>
      </section>

      <aside className="space-y-4">
        <section className="bug-panel p-4 sm:p-5"><div className="flex items-center gap-2 mb-4"><div className="bug-icon-box violet"><Flame size={19}/></div><div><h2 className="font-extrabold" style={{ color: 'var(--text)' }}>Hunter stats</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your local arcade record</p></div></div><div className="grid grid-cols-2 gap-3"><div className="bug-mini-stat"><span>MISSIONS</span><b>{saved.solved.length}<small>/{missions.length}</small></b></div><div className="bug-mini-stat"><span>BEST TIME LEFT</span><b>{saved.best ? `${saved.best}s` : '—'}</b></div></div><div className="mt-4"><div className="mb-2 flex justify-between text-xs font-bold" style={{ color: 'var(--text-muted)' }}><span>Arcade completion</span><span>{Math.round(saved.solved.length / missions.length * 100)}%</span></div><div className="bug-progress"><div style={{ width: `${saved.solved.length / missions.length * 100}%` }}/></div></div></section>
        <section className="bug-panel p-4 sm:p-5"><div className="flex items-center gap-2 mb-3"><Lightbulb size={18} className="text-amber-500"/><h2 className="font-extrabold" style={{ color: 'var(--text)' }}>Hunter protocol</h2></div><ol className="space-y-3">{['Read the bug report carefully.', 'Inspect the code and edit the logic.', 'Run the checks to validate your fix.'].map((s, i) => <li key={s} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-light)' }}><span className="bug-step-number">{i + 1}</span><span className="leading-5">{s}</span></li>)}</ol><p className="mt-4 text-xs leading-5" style={{ color: 'var(--text-muted)' }}>Test cases check common code patterns for this demo. This is a guided debugging game, not a secure code execution environment.</p></section>
        <button onClick={() => { setSaved({ xp: 0, solved: [], best: 0 }); restart(0); }} className="bug-reset-btn">Reset local arcade progress</button>
      </aside>
    </div>
  </motion.div>;
}
