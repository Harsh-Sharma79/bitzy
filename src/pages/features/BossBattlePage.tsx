/**
 * src/pages/features/BossBattlePage.tsx
 *
 * ⚔️ BOSS BATTLE — Turn-based RPG combat.
 * Boss charges up an attack. Player must write correct code to BLOCK & COUNTER.
 * Boss has rage mode, taunts, attack animations, screen shake.
 * Learner code runs in a time-limited worker with app/network APIs disabled.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Shield, Zap, Heart, Trophy, RotateCcw, Swords, Skull, ChevronRight, Star } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { runSpellTests, readLocalBossBattleRecord, recordLocalBossVictory } from '@/lib/bossBattle';
import type { SpellTestCase, SpellTestResult } from '@/lib/bossBattle';
import { saveGameProgress } from '@/lib/gamification';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Spell {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  starterCode: string;
  tests: SpellTestCase[];
  hint: string;
  damage: number;  // boss HP damage on pass
  mana: number;    // mana cost
}

interface BossAttack {
  name: string;
  emoji: string;
  damage: number;   // player HP damage
  message: string;
}

interface Boss {
  id: string;
  name: string;
  emoji: string;
  sprite: string;   // large emoji or art
  world: string;
  maxHP: number;
  color: string;
  shadow: string;
  bg: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Legendary';
  xpReward: number;
  coinReward: number;
  minXP: number;
  taunt: string;
  rageThreshold: number;  // HP at which boss goes rage mode
  rageTaunt: string;
  attacks: BossAttack[];
  spells: Spell[];
}

// ─── Boss definitions ─────────────────────────────────────────────────────────
const BOSSES: Boss[] = [
  {
    id: 'html-dragon',
    name: 'The HTML Dragon',
    emoji: '🐉',
    sprite: '🐉',
    world: 'HTML Forest',
    maxHP: 5,
    color: '#E34C26',
    shadow: '#B03A1B',
    bg: 'linear-gradient(135deg, #1a0800 0%, #3d1000 50%, #1a0800 100%)',
    difficulty: 'Easy',
    xpReward: 500,
    coinReward: 250,
    minXP: 0,
    taunt: "Your HTML is as broken as your dreams! 🔥",
    rageThreshold: 2,
    rageTaunt: "ENOUGH! Feel my FIRE! 💥🔥💥",
    attacks: [
      { name: 'Fire Breath',   emoji: '🔥', damage: 1, message: 'Dragon breathes fire! Your shield cracks!' },
      { name: 'Tail Swipe',   emoji: '🌪️', damage: 1, message: 'Massive tail crushes your defenses!' },
      { name: 'Wing Slam',    emoji: '⚡', damage: 1, message: 'Wings create a shockwave!' },
    ],
    spells: [
      {
        id: 's1', name: 'HTML Strike', emoji: '📄', desc: 'Return an <a> tag with href and inner text.',
        mana: 30, damage: 2,
        starterCode: `function createLink(url, text) {\n  // Return: <a href="url">text</a>\n  return '';\n}`,
        tests: [
          { input: `createLink('https://google.com', 'Google')`, expected: `<a href="https://google.com">Google</a>`, label: 'Link' },
          { input: `createLink('https://bitzy.dev', 'Bitzy')`,   expected: `<a href="https://bitzy.dev">Bitzy</a>`,   label: 'Link 2' },
        ],
        hint: 'return `<a href="${url}">${text}</a>`;',
      },
      {
        id: 's2', name: 'List Conjure', emoji: '📋', desc: 'Build a <ul> from an array of strings.',
        mana: 40, damage: 2,
        starterCode: `function buildList(items) {\n  // Return <ul><li>...</li></ul>\n  return '';\n}`,
        tests: [
          { input: `buildList(['HTML','CSS','JS'])`, expected: `<ul><li>HTML</li><li>CSS</li><li>JS</li></ul>`, label: 'List' },
          { input: `buildList(['React'])`,           expected: `<ul><li>React</li></ul>`,                      label: 'Single' },
        ],
        hint: 'return `<ul>${items.map(i => `<li>${i}</li>`).join("")}</ul>`;',
      },
      {
        id: 's3', name: 'Final Blast', emoji: '💥', desc: 'Return a self-closing <img> tag.',
        mana: 50, damage: 3,
        starterCode: `function createImage(src, alt) {\n  // Return <img src="..." alt="...">\n  return '';\n}`,
        tests: [
          { input: `createImage('cat.jpg','A cat')`, expected: `<img src="cat.jpg" alt="A cat">`, label: 'Image' },
          { input: `createImage('logo.png','Logo')`, expected: `<img src="logo.png" alt="Logo">`, label: 'Logo' },
        ],
        hint: 'return `<img src="${src}" alt="${alt}">`;',
      },
    ],
  },
  {
    id: 'js-robot',
    name: 'JS WarBot 9000',
    emoji: '🤖',
    sprite: '🤖',
    world: 'Silicon Wasteland',
    maxHP: 6,
    color: '#F7DF1E',
    shadow: '#B8A800',
    bg: 'linear-gradient(135deg, #0a0a00 0%, #1a1a00 50%, #0d0d00 100%)',
    difficulty: 'Medium',
    xpReward: 900,
    coinReward: 450,
    minXP: 300,
    taunt: "Beep boop. Your code will throw exceptions. I. AM. INEVITABLE. ⚙️",
    rageThreshold: 2,
    rageTaunt: "CORE OVERLOAD. INITIATING DESTRUCTION PROTOCOL. 💀⚙️💀",
    attacks: [
      { name: 'Laser Beam',    emoji: '🔴', damage: 1, message: 'Laser cuts through your code shield!' },
      { name: 'EMP Pulse',     emoji: '⚡', damage: 1, message: 'EMP scrambles your logic circuits!' },
      { name: 'Missile Volley',emoji: '🚀', damage: 2, message: 'Three missiles destroy your defenses!' },
    ],
    spells: [
      {
        id: 's1', name: 'Array Cannon', emoji: '🗡️', desc: 'Flatten a nested array one level deep.',
        mana: 35, damage: 2,
        starterCode: `function flatten(arr) {\n  // [[1,2],[3,4]] => [1,2,3,4]\n  return [];\n}`,
        tests: [
          { input: `JSON.stringify(flatten([[1,2],[3,4]]))`,    expected: `[1,2,3,4]`,   label: 'Flat' },
          { input: `JSON.stringify(flatten([[1],[2],[3,4]]))`,  expected: `[1,2,3,4]`,   label: 'Mix' },
        ],
        hint: 'arr.reduce((acc, val) => acc.concat(val), [])',
      },
      {
        id: 's2', name: 'Memoize Shield', emoji: '🛡️', desc: 'Write a memoize function that caches results.',
        mana: 45, damage: 2,
        starterCode: `function memoize(fn) {\n  const cache = {};\n  return function(...args) {\n    // cache results by stringified args\n  };\n}`,
        tests: [
          { input: `(() => { let calls=0; const f=memoize(n=>{calls++;return n*2}); f(5); f(5); return String(calls); })()`, expected: `1`, label: 'Cached' },
          { input: `(() => { const f=memoize((a,b)=>a+b); return String(f(2,3)); })()`,               expected: `5`, label: 'Result' },
        ],
        hint: 'const key=JSON.stringify(args); if(key in cache) return cache[key]; return cache[key]=fn(...args);',
      },
      {
        id: 's3', name: 'Deep Clone Bomb', emoji: '💣', desc: 'Deep clone an object without sharing references.',
        mana: 55, damage: 3,
        starterCode: `function deepClone(obj) {\n  // Return a deep copy — changes to copy must not affect original\n  return null;\n}`,
        tests: [
          { input: `(() => { const o={a:{b:1}}; const c=deepClone(o); c.a.b=99; return String(o.a.b); })()`, expected: `1`, label: 'No mutation' },
          { input: `JSON.stringify(deepClone({x:[1,{y:2}]}))`,                          expected: `{"x":[1,{"y":2}]}`, label: 'Deep copy' },
        ],
        hint: 'JSON.parse(JSON.stringify(obj)) works for simple objects.',
      },
    ],
  },
  {
    id: 'react-titan',
    name: 'The React Titan',
    emoji: '⚛️',
    sprite: '⚛️',
    world: 'Component Realm',
    maxHP: 8,
    color: '#61DAFB',
    shadow: '#0EA5E9',
    bg: 'linear-gradient(135deg, #000a1a 0%, #001830 50%, #000a1a 100%)',
    difficulty: 'Legendary',
    xpReward: 2000,
    coinReward: 1000,
    minXP: 800,
    taunt: "Your components re-render endlessly. useEffect with missing deps? ROOKIE! ⚛️",
    rageThreshold: 3,
    rageTaunt: "INFINITE RENDER LOOP ACTIVATED. YOUR MIND WILL BREAK. 🌀💥🌀",
    attacks: [
      { name: 'Re-render Storm', emoji: '🌀', damage: 1, message: 'Infinite re-renders crash your defenses!' },
      { name: 'Memory Leak',     emoji: '💧', damage: 1, message: 'Memory leak drains your health!' },
      { name: 'Stale Closure',   emoji: '👻', damage: 2, message: 'Stale closure corrupts your state!' },
    ],
    spells: [
      {
        id: 's1', name: 'Reduce Spell', emoji: '⚡', desc: 'Implement myReduce from scratch.',
        mana: 30, damage: 2,
        starterCode: `function myReduce(arr, fn, initial) {\n  // Implement Array.reduce from scratch\n  return initial;\n}`,
        tests: [
          { input: `myReduce([1,2,3,4], (acc,val)=>acc+val, 0)`, expected: `10`, label: 'Sum' },
          { input: `myReduce([1,2,3], (acc,val)=>acc*val, 1)`,   expected: `6`,  label: 'Product' },
        ],
        hint: 'let acc=initial; for(const v of arr) acc=fn(acc,v); return acc;',
      },
      {
        id: 's2', name: 'Curry Strike', emoji: '🍛', desc: 'Write a curry function for 2-argument functions.',
        mana: 45, damage: 3,
        starterCode: `function curry(fn) {\n  // Return curried version: curry(add)(2)(3) === 5\n  return function(a) {\n    // your code\n  };\n}`,
        tests: [
          { input: `curry((a,b)=>a+b)(2)(3)`,   expected: `5`,  label: 'Add' },
          { input: `curry((a,b)=>a*b)(4)(5)`,   expected: `20`, label: 'Multiply' },
        ],
        hint: 'return function(a) { return function(b) { return fn(a,b); }; };',
      },
      {
        id: 's3', name: 'Compose Blast', emoji: '💥', desc: 'Implement function composition: compose(f,g)(x) = f(g(x)).',
        mana: 60, damage: 4,
        starterCode: `function compose(f, g) {\n  // compose(f,g)(x) should equal f(g(x))\n  return function(x) {\n    // your code\n  };\n}`,
        tests: [
          { input: `compose(x=>x*2, x=>x+1)(3)`, expected: `8`,  label: 'Double then add' },
          { input: `compose(x=>x+'!', x=>x.toUpperCase())('hi')`, expected: `HI!`, label: 'String' },
        ],
        hint: 'return function(x) { return f(g(x)); };',
      },
      {
        id: 's4', name: 'Event Nuke', emoji: '☢️', desc: 'Build a simple EventEmitter with on/emit/off.',
        mana: 70, damage: 4,
        starterCode: `class EventEmitter {\n  constructor() { this.listeners = {}; }\n  on(event, fn) { /* add listener */ }\n  off(event, fn) { /* remove listener */ }\n  emit(event, ...args) { /* call all listeners */ }\n}`,
        tests: [
          { input: `(() => { const e=new EventEmitter(); let r=''; e.on('x',v=>r+=v); e.emit('x','a'); e.emit('x','b'); return r; })()`, expected: `ab`, label: 'Emit' },
          { input: `(() => { const e=new EventEmitter(); let r=0; const f=()=>r++; e.on('x',f); e.off('x',f); e.emit('x'); return String(r); })()`, expected: `0`, label: 'Off' },
        ],
        hint: 'on: push to array. off: filter. emit: forEach call.',
      },
    ],
  },
];

type Phase = 'lobby' | 'battle' | 'victory' | 'defeat';
type BattleState = 'player_turn' | 'boss_attacking' | 'spell_result' | 'boss_rage';
type TestResult = SpellTestResult;

// ─── Boss HP Bar ──────────────────────────────────────────────────────────────
function BossHPBar({ hp, maxHP, color, rage }: { hp: number; maxHP: number; color: string; rage: boolean }) {
  const pct = Math.max(0, (hp / maxHP) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] font-bold mb-1">
        <span style={{ color: rage ? '#FF4B4B' : color }}>
          {rage ? '💀 RAGE MODE' : 'BOSS HP'}
        </span>
        <span style={{ color }}>{hp}/{maxHP}</span>
      </div>
      <div className="h-4 rounded-full overflow-hidden relative" style={{ backgroundColor: '#1a1a2e' }}>
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            background: rage
              ? 'linear-gradient(90deg, #FF4B4B, #FF9600, #FF4B4B)'
              : `linear-gradient(90deg, ${color}80, ${color})`,
          }}
        />
        {/* Rage pulse */}
        {rage && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            style={{ backgroundColor: '#FF4B4B' }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Player HP dots ───────────────────────────────────────────────────────────
function PlayerHP({ hp, maxHP }: { hp: number; maxHP: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>HP</span>
      {Array.from({ length: maxHP }).map((_, i) => (
        <motion.div
          key={i}
          animate={i < hp ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Heart
            className="w-5 h-5"
            fill={i < hp ? '#FF4B4B' : 'none'}
            style={{ color: i < hp ? '#FF4B4B' : 'var(--border)' }}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ─── Mana bar ─────────────────────────────────────────────────────────────────
function ManaBar({ mana, maxMana }: { mana: number; maxMana: number }) {
  const pct = Math.max(0, (mana / maxMana) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] font-bold mb-1">
        <span style={{ color: '#1CB0F6' }}>⚡ MANA</span>
        <span style={{ color: '#1CB0F6' }}>{mana}/{maxMana}</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: '#0a1a2e' }}>
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
          style={{ background: 'linear-gradient(90deg, #0EA5E9, #61DAFB)' }}
        />
      </div>
    </div>
  );
}

// ─── Attack FX overlay ────────────────────────────────────────────────────────
function AttackFX({ show, emoji, msg }: { show: boolean; emoji: string; msg: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl pointer-events-none"
          style={{ backgroundColor: 'rgba(255,0,0,0.15)', backdropFilter: 'blur(2px)' }}
        >
          <motion.span
            className="text-6xl"
            animate={{ rotate: [-10, 10, -10, 10, 0], scale: [1, 1.4, 1] }}
            transition={{ duration: 0.5 }}
          >{emoji}</motion.span>
          <p className="text-white font-bold text-center mt-2 px-4 text-sm">{msg}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Spell Card ───────────────────────────────────────────────────────────────
function SpellCard({ spell, canAfford, selected, onClick }: {
  spell: Spell; canAfford: boolean; selected: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={canAfford ? { scale: 0.95 } : {}}
      onClick={canAfford ? onClick : undefined}
      className="p-3 rounded-2xl border-2 text-left transition-all flex-shrink-0"
      style={{
        borderColor: selected ? '#1CB0F6' : canAfford ? 'var(--border)' : 'var(--border)',
        backgroundColor: selected ? '#0d1a2e' : canAfford ? 'var(--surface)' : 'var(--surface)',
        opacity: canAfford ? 1 : 0.4,
        cursor: canAfford ? 'pointer' : 'not-allowed',
        minWidth: 120,
      }}
    >
      <div className="text-2xl mb-1">{spell.emoji}</div>
      <p className="font-bold text-xs" style={{ color: selected ? '#61DAFB' : 'var(--text)' }}>{spell.name}</p>
      <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{spell.desc.slice(0, 40)}…</p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#0a1a2e', color: '#61DAFB' }}>
          ⚡{spell.mana} mana
        </span>
        <span className="text-[9px] font-bold" style={{ color: '#FF4B4B' }}>
          -{spell.damage}💀
        </span>
      </div>
    </motion.button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BossBattlePage() {
  const { showXPPopup, addXP, addCoins } = useGame();
  const { profile, user } = useAuth();

  const [phase, setPhase] = useState<Phase>('lobby');
  const [boss, setBoss] = useState<Boss | null>(null);
  const [bossHP, setBossHP] = useState(0);
  const [playerHP, setPlayerHP] = useState(5);
  const [mana, setMana] = useState(100);
  const [battleState, setBattleState] = useState<BattleState>('player_turn');
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [currentAttack, setCurrentAttack] = useState<BossAttack | null>(null);
  const [showAttackFX, setShowAttackFX] = useState(false);
  const [rage, setRage] = useState(false);
  const [score, setScore] = useState(0);
  const [bossMsg, setBossMsg] = useState('');
  const [spellCast, setSpellCast] = useState(false);
  const [localRecordState, setLocalRecordState] = useState(() => {
    const userId = user?.id ?? '';
    return { userId, record: readLocalBossBattleRecord(userId) };
  });
  const currentUserId = user?.id ?? '';
  const localRecord = localRecordState.userId === currentUserId
    ? localRecordState.record
    : readLocalBossBattleRecord(currentUserId);
  const [localRecordSaved, setLocalRecordSaved] = useState<boolean | null>(null);
  const [rewardSync, setRewardSync] = useState<{ status: 'idle' | 'saving' | 'confirmed' | 'pending'; xp: boolean | null; coins: boolean | null; history: boolean | null }>({ status: 'idle', xp: null, coins: null, history: null });

  const bossControls = useAnimation();
  const screenControls = useAnimation();

  const MAX_PLAYER_HP = 5;
  const MAX_MANA = 100;

  // Boss attack cycle — fires every 12s during player turn
  const attackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRefs = useRef(new Set<ReturnType<typeof setTimeout>>());
  const activeRunRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const clearAttackTimer = useCallback(() => {
    if (attackTimerRef.current) clearInterval(attackTimerRef.current);
    attackTimerRef.current = null;
  }, []);

  const clearPendingTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
  }, []);

  const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(() => {
      timeoutRefs.current.delete(timeout);
      callback();
    }, delay);
    timeoutRefs.current.add(timeout);
    return timeout;
  }, []);

  const bossAttack = useCallback((b: Boss, currentBossHP: number, currentPlayerHP: number) => {
    if (currentBossHP <= 0 || currentPlayerHP <= 0) return;
    const atk = b.attacks[Math.floor(Math.random() * b.attacks.length)];
    setCurrentAttack(atk);
    setBattleState('boss_attacking');
    setBossMsg(atk.message);

    // Boss bounce
    bossControls.start({
      x: [0, -20, 20, -10, 10, 0],
      transition: { duration: 0.5 }
    });
    // Screen shake
    screenControls.start({
      x: [0, -8, 8, -4, 4, 0],
      transition: { duration: 0.4 }
    });

    setShowAttackFX(true);
    scheduleTimeout(() => {
      setShowAttackFX(false);
      setPlayerHP(prev => {
        const newHP = Math.max(0, prev - atk.damage);
        if (newHP <= 0) {
          setPhase('defeat');
          clearAttackTimer();
        }
        return newHP;
      });
      setBattleState('player_turn');
    }, 1800);
  }, [bossControls, screenControls, scheduleTimeout, clearAttackTimer]);

  const startAttackTimer = useCallback((b: Boss) => {
    clearAttackTimer();
    attackTimerRef.current = setInterval(() => {
      setBossHP(currentBHP => {
        setPlayerHP(currentPHP => {
          if (currentBHP <= 0 || currentPHP <= 0) {
            clearAttackTimer();
            return currentPHP;
          }
          bossAttack(b, currentBHP, currentPHP);
          return currentPHP;
        });
        return currentBHP;
      });
    }, 12000);
  }, [bossAttack, clearAttackTimer]);

  const startBattle = (b: Boss) => {
    activeRunRef.current?.abort();
    activeRunRef.current = null;
    clearPendingTimeouts();
    clearAttackTimer();
    setBoss(b);
    setBossHP(b.maxHP);
    setPlayerHP(MAX_PLAYER_HP);
    setMana(MAX_MANA);
    setBattleState('player_turn');
    setSelectedSpell(null);
    setCode('');
    setCodeError(null);
    setResults(null);
    setShowHint(false);
    setRage(false);
    setScore(0);
    setBossMsg(b.taunt);
    setSpellCast(false);
    setRewardSync({ status: 'idle', xp: null, coins: null, history: null });
    setLocalRecordSaved(null);
    setPhase('battle');
    // Start attack timer after 15s grace period
    scheduleTimeout(() => startAttackTimer(b), 15000);
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      activeRunRef.current?.abort();
      activeRunRef.current = null;
      clearPendingTimeouts();
      clearAttackTimer();
    };
  }, [clearPendingTimeouts, clearAttackTimer]);

  const selectSpell = (spell: Spell) => {
    if (mana < spell.mana) return;
    setSelectedSpell(spell);
    setCode(spell.starterCode);
    setCodeError(null);
    setResults(null);
    setShowHint(false);
    setSpellCast(false);
  };

  const finalizeVictory = async (defeatedBoss: Boss, finalScore: number) => {
    const userId = user?.id ?? '';
    const local = recordLocalBossVictory(userId, defeatedBoss.id, finalScore);
    setLocalRecordSaved(local !== null);
    if (local) setLocalRecordState({ userId, record: local });
    setRewardSync({ status: 'saving', xp: null, coins: null, history: null });

    const work = Promise.allSettled([
      addXP(defeatedBoss.xpReward, 'boss_battle'),
      addCoins(defeatedBoss.coinReward),
      userId ? saveGameProgress(userId, 'boss-battle', {
        score: finalScore,
        xpEarned: defeatedBoss.xpReward,
        coinsEarned: defeatedBoss.coinReward,
        topic: defeatedBoss.id,
        questionIndex: 0,
      }) : Promise.resolve(null),
    ]);
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timedOut = new Promise<{ timedOut: true }>(resolve => {
      timeoutId = setTimeout(() => resolve({ timedOut: true }), 7000);
    });
    const outcome = await Promise.race([
      work.then(result => ({ timedOut: false as const, result })),
      timedOut,
    ]);
    if (timeoutId) clearTimeout(timeoutId);
    if (!mountedRef.current) return;

    let xpSaved: boolean | null = null;
    let coinsSaved: boolean | null = null;
    let historySaved: boolean | null = null;
    if (outcome.timedOut) {
      setRewardSync({ status: 'pending', xp: null, coins: null, history: null });
    } else {
      const [xpResult, coinResult, historyResult] = outcome.result;
      xpSaved = xpResult.status === 'fulfilled' && xpResult.value === true;
      coinsSaved = coinResult.status === 'fulfilled' && coinResult.value === true;
      historySaved = historyResult.status === 'fulfilled' && historyResult.value !== null;
      setRewardSync({
        status: xpSaved && coinsSaved && historySaved ? 'confirmed' : 'pending',
        xp: xpSaved,
        coins: coinsSaved,
        history: historySaved,
      });
      if (xpSaved) showXPPopup(defeatedBoss.xpReward, 'xp', `🏆 ${defeatedBoss.name} defeated! +${defeatedBoss.xpReward} XP`);
    }
    clearAttackTimer();
    setPhase('victory');
  };

  const castSpell = async () => {
    if (!selectedSpell || !boss || running || battleState !== 'player_turn') return;
    setCodeError(null);
    clearAttackTimer();
    const controller = new AbortController();
    activeRunRef.current?.abort();
    activeRunRef.current = controller;
    setRunning(true);
    setResults(null);
    const evaluation = await runSpellTests(code, selectedSpell.tests, undefined, controller.signal);
    if (activeRunRef.current === controller) activeRunRef.current = null;
    if (!mountedRef.current || controller.signal.aborted) return;
    setRunning(false);
    if (evaluation.kind !== 'results') {
      setCodeError(evaluation.error);
      startAttackTimer(boss);
      return;
    }
    await resolveSpellEvaluation(evaluation.results, selectedSpell, boss);
  };

  const resolveSpellEvaluation = async (testResults: TestResult[], spell: Spell, currentBoss: Boss) => {
    const allPassed = testResults.every(result => result.passed);
    setResults(testResults);
    setRunning(false);
    setBattleState('spell_result');
    setSpellCast(true);

    if (allPassed) {
      setMana(current => Math.max(0, current - spell.mana));
      const newBossHP = Math.max(0, bossHP - spell.damage);
      const finalScore = score + spell.damage * 100 + 50;
      setBossHP(newBossHP);
      setScore(finalScore);
      setBossMsg('');
      bossControls.start({
        x: [0, 30, -30, 15, -15, 0],
        filter: ['brightness(1)', 'brightness(3)', 'brightness(1)'],
        transition: { duration: 0.6 },
      });

      const isRage = !rage && newBossHP > 0 && newBossHP <= currentBoss.rageThreshold;
      if (isRage) {
        setRage(true);
        setBossMsg(currentBoss.rageTaunt);
        setBattleState('boss_rage');
        scheduleTimeout(() => {
          setBattleState('player_turn');
          startAttackTimer(currentBoss);
        }, 2500);
      } else if (newBossHP <= 0) {
        clearAttackTimer();
        await finalizeVictory(currentBoss, finalScore);
      } else {
        setMana(current => Math.min(MAX_MANA, current + 20));
        scheduleTimeout(() => {
          setBattleState('player_turn');
          setSpellCast(false);
          startAttackTimer(currentBoss);
        }, 2000);
      }
    } else {
      setMana(current => Math.min(MAX_MANA, Math.max(0, current - Math.floor(spell.mana / 2))));
      setBossMsg('Your spell fizzles. Review the failed tests and try again.');
      scheduleTimeout(() => {
        bossAttack(currentBoss, bossHP, playerHP);
        scheduleTimeout(() => {
          setSpellCast(false);
          startAttackTimer(currentBoss);
        }, 2500);
      }, 1000);
    }
  };

  // ── Lobby ───────────────────────────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-10">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Skull className="w-7 h-7" style={{ color: '#FF4B4B' }} /> Boss Battles
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Solve real JavaScript and HTML exercises, see each test result, and defeat the HTML Dragon.
          </p>
        </div>

        <section className="d-card space-y-3" aria-label="Boss battle instructions and local record">
          <div>
            <h2 className="text-sm font-extrabold">How a battle works</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Choose a spell, complete its function, then cast it. Pass every test to damage the boss; failed tests show the expected result before the boss counterattacks.</p>
          </div>
          <p className="rounded-xl border px-3 py-2 text-xs leading-5" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}>
            Your code runs in a separate, time-limited Web Worker. Network, storage, and nested-worker APIs are disabled. Personal bests are kept on this device; account rewards require a successful Supabase save.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-bold" aria-live="polite">
            <span>{localRecord.wins} {localRecord.wins === 1 ? 'win' : 'wins'} on this device</span>
            <span style={{ color: 'var(--text-muted)' }}>Best score: {localRecord.bestScore}</span>
          </div>
        </section>

        {BOSSES.map((b, idx) => {
          const userXP = profile?.xp ?? 0;
          const locked = userXP < b.minXP;
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="rounded-3xl overflow-hidden border-2"
              style={{
                borderColor: locked ? 'var(--border)' : b.color + '60',
                opacity: locked ? 0.6 : 1,
              }}
            >
              {/* Boss arena preview */}
              <div
                className="relative p-6 flex items-center gap-4"
                style={{ background: b.bg }}
              >
                {/* Ambient particles */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                      backgroundColor: b.color,
                      left: `${15 + i * 18}%`,
                      top: `${20 + (i % 3) * 25}%`,
                    }}
                    animate={{ y: [0, -15, 0], opacity: [0.3, 0.8, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2 + i * 0.4, delay: i * 0.3 }}
                  />
                ))}

                {/* Boss sprite */}
                <motion.div
                  className="text-6xl"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                >
                  {b.sprite}
                </motion.div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-black text-white text-xl">{b.name}</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: b.color + '40', color: b.color }}
                    >
                      {b.difficulty}
                    </span>
                  </div>
                  <p className="text-white/60 text-xs italic mb-3">"{b.taunt}"</p>

                  {/* HP dots */}
                  <div className="flex gap-1.5">
                    {Array.from({ length: b.maxHP }).map((_, i) => (
                      <div key={i} className="w-4 h-4 rounded-full border-2 border-white/40"
                        style={{ backgroundColor: b.color + '80' }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Info panel */}
              <div className="p-4" style={{ backgroundColor: 'var(--white)' }}>
                <div className="flex items-center gap-4 mb-3 text-xs">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" style={{ color: '#FFC800' }} />
                    <span className="font-bold" style={{ color: '#FFC800' }}>{b.xpReward} XP</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Swords className="w-3.5 h-3.5" style={{ color: b.color }} />
                    <span style={{ color: 'var(--text-muted)' }}>{b.spells.length} spells</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" style={{ color: '#1CB0F6' }} />
                    <span style={{ color: 'var(--text-muted)' }}>{b.attacks.length} attacks</span>
                  </span>
                  {locked && (
                    <span className="font-bold" style={{ color: '#FF4B4B' }}>
                      🔒 {b.minXP} XP required
                    </span>
                  )}
                </div>

                <button
                  onClick={() => !locked && startBattle(b)}
                  disabled={locked}
                  className="w-full py-3 rounded-2xl text-white font-display font-bold flex items-center justify-center gap-2"
                  style={{
                    background: locked ? 'var(--surface)' : `linear-gradient(135deg, ${b.color}, ${b.shadow})`,
                    boxShadow: locked ? 'none' : `0 4px 0 ${b.shadow}`,
                    color: locked ? 'var(--text-muted)' : 'white',
                  }}
                >
                  <Swords className="w-4 h-4" />
                  {locked ? `Locked — need ${b.minXP} XP` : 'ENTER ARENA'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    );
  }

  // ── Victory ─────────────────────────────────────────────────────────────────
  if (phase === 'victory' && boss) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-5 py-10"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.4, 1] }}
          transition={{ duration: 1.2 }}
          className="text-8xl"
        >
          🏆
        </motion.div>
        <h2 className="font-display text-3xl font-black" style={{ color: '#FFC800' }}>
          BOSS SLAIN!
        </h2>
        <p className="font-bold text-lg">{boss.name} falls before your code! 🎉</p>

        <div className="d-card p-6 max-w-xs mx-auto space-y-3">
          <div className="text-lg font-black" style={{ color: rewardSync.xp === true ? 'var(--green)' : 'var(--text-muted)' }}>
            {rewardSync.xp === true ? `+${boss.xpReward} XP saved` : rewardSync.xp === null ? 'XP confirmation pending' : 'XP not confirmed'}
          </div>
          <div className="font-bold" style={{ color: rewardSync.coins === true ? 'var(--purple-dark)' : 'var(--text-muted)' }}>
            {rewardSync.coins === true ? `+${boss.coinReward} coins saved` : rewardSync.coins === null ? 'Coin confirmation pending' : 'Coins not confirmed'}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Score: {score}</div>
          <div role="status" className="rounded-xl px-3 py-2 text-xs leading-5" style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}>
            {rewardSync.status === 'confirmed'
              ? 'XP, coins, and battle history were confirmed in your Bitzy account.'
              : 'This win is not fully confirmed in your account. The game keeps a separate on-device win record; queued account updates may sync later.'}
            {' '}{localRecordSaved === true ? 'This device’s win history was saved.' : 'This device could not save the win history.'}
          </div>
          <div className="flex justify-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.2 }}>
                <Star className="w-6 h-6" fill="#FFC800" style={{ color: '#FFC800' }} />
              </motion.div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setPhase('lobby')}
          className="d-btn d-btn-md flex items-center gap-2 mx-auto text-white"
          style={{ backgroundColor: '#58CC02', boxShadow: '0 4px 0 #45A301' }}
        >
          <Trophy className="w-4 h-4" /> Back to Bosses
        </button>
      </motion.div>
    );
  }

  // ── Defeat ──────────────────────────────────────────────────────────────────
  if (phase === 'defeat' && boss) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-5 py-10">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: 3, duration: 0.5 }}
          className="text-8xl"
        >
          💀
        </motion.div>
        <h2 className="font-display text-3xl font-black" style={{ color: '#FF4B4B' }}>DEFEATED!</h2>
        <p style={{ color: 'var(--text-muted)' }}>The boss was too strong this time...</p>
        <div className="d-card p-4 max-w-xs mx-auto" style={{ borderColor: '#FF4B4B40' }}>
          <p className="text-sm italic font-bold" style={{ color: '#FF4B4B' }}>"{boss.taunt}"</p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Score: {score}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => setPhase('lobby')}
            className="px-6 py-3 rounded-2xl border-2 font-bold text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
            Back
          </button>
          <button
            onClick={() => startBattle(boss)}
            className="px-6 py-3 rounded-2xl font-bold text-sm text-white flex items-center gap-2"
            style={{ backgroundColor: '#FF4B4B', boxShadow: '0 4px 0 #CC3333' }}
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Battle ──────────────────────────────────────────────────────────────────
  if (phase !== 'battle' || !boss) return null;

  return (
    <motion.div animate={screenControls} className="space-y-4 pb-10">
      {/* ── Arena Header ── */}
      <div
        className="rounded-3xl p-4 relative overflow-hidden"
        style={{ background: boss.bg, minHeight: 180 }}
      >
        {/* Ambient particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: boss.color, left: `${10 + i * 11}%`, top: `${10 + (i % 4) * 20}%` }}
            animate={{ y: [0, -20, 0], opacity: [0.2, 0.9, 0.2], scale: [1, 1.5, 1] }}
            transition={{ repeat: Infinity, duration: 2 + i * 0.3, delay: i * 0.2 }}
          />
        ))}

        {/* Boss sprite */}
        <div className="flex items-start gap-4 relative z-10">
          <div className="relative">
            <motion.div
              animate={bossControls}
              className="text-7xl"
              style={{ filter: rage ? 'drop-shadow(0 0 20px #FF4B4B)' : `drop-shadow(0 0 10px ${boss.color})` }}
            >
              {boss.sprite}
            </motion.div>
            {rage && (
              <motion.div
                className="absolute -inset-2 rounded-full"
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
                style={{ backgroundColor: '#FF4B4B', zIndex: -1 }}
              />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display font-black text-white text-lg">{boss.name}</span>
              {rage && (
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white"
                >
                  💀 RAGE
                </motion.span>
              )}
            </div>

            <BossHPBar hp={bossHP} maxHP={boss.maxHP} color={boss.color} rage={rage} />

            {/* Boss speech bubble */}
            <AnimatePresence>
              {bossMsg && (
                <motion.div
                  key={bossMsg}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-2 text-xs italic font-bold px-3 py-1.5 rounded-2xl"
                  style={{
                    backgroundColor: rage ? 'rgba(255,75,75,0.2)' : 'rgba(255,255,255,0.1)',
                    color: rage ? '#FF4B4B' : 'rgba(255,255,255,0.8)',
                    border: `1px solid ${rage ? '#FF4B4B40' : 'rgba(255,255,255,0.2)'}`,
                  }}
                >
                  💬 "{bossMsg}"
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Attack FX overlay */}
        <AttackFX show={showAttackFX} emoji={currentAttack?.emoji ?? '⚡'} msg={currentAttack?.message ?? ''} />
      </div>

      {/* ── Player HUD ── */}
      <div className="d-card p-3 flex items-center justify-between gap-4">
        <PlayerHP hp={playerHP} maxHP={MAX_PLAYER_HP} />
        <div className="flex-1">
          <ManaBar mana={mana} maxMana={MAX_MANA} />
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Score</p>
          <p className="font-display font-bold text-sm" style={{ color: '#FFC800' }}>{score}</p>
        </div>
      </div>

      {/* ── Battle state message ── */}
      <AnimatePresence>
        {battleState === 'boss_rage' && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            className="text-center py-3 rounded-2xl font-display font-black text-lg"
            style={{ backgroundColor: '#FF4B4B20', color: '#FF4B4B', border: '2px solid #FF4B4B60' }}
          >
            💀 BOSS ENTERS RAGE MODE 💀
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Spell selection ── */}
      {!selectedSpell && (
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>
            ⚔️ SELECT A SPELL TO CAST — Boss attacks every ~12s!
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {boss.spells.map((spell) => (
              <SpellCard
                key={spell.id}
                spell={spell}
                canAfford={mana >= spell.mana}
                selected={false}
                onClick={() => selectSpell(spell)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Code editor (spell selected) ── */}
      {selectedSpell && (
        <div className="space-y-3">
          {/* Selected spell header */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl" style={{ backgroundColor: 'var(--surface)' }}>
              <span className="text-2xl">{selectedSpell.emoji}</span>
            </div>
            <div className="flex-1">
              <p className="font-bold">{selectedSpell.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedSpell.desc}</p>
            </div>
            <button
              type="button"
              onClick={() => { setSelectedSpell(null); setResults(null); setSpellCast(false); clearAttackTimer(); startAttackTimer(boss); }}
              disabled={running}
              className="text-xs px-3 py-1.5 rounded-xl border-2 font-bold"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              ← Back
            </button>
          </div>

          {/* Test cases */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>PASS ALL TESTS TO HIT THE BOSS</p>
            {selectedSpell.tests.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] p-2 rounded-xl"
                style={{ backgroundColor: 'var(--surface)' }}>
                <span className="font-bold" style={{ color: 'var(--text-muted)' }}>{t.label}:</span>
                <span className="font-mono flex-1 truncate" style={{ color: '#58CC02' }}>→ {t.expected}</span>
                {results && (
                  results[i]?.passed
                    ? <span style={{ color: '#58CC02' }}>✓</span>
                    : <span style={{ color: '#FF4B4B' }}>✗</span>
                )}
              </div>
            ))}
          </div>

          {/* Code area */}
          <div className="relative rounded-2xl overflow-hidden" style={{ border: '2px solid #2d2d4e' }}>
            <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: '#0f0f1a' }}>
              <span className="text-[10px] font-bold" style={{ color: '#58CC02' }}>JavaScript</span>
              <span className="text-[10px]" style={{ color: '#CE82FF' }}>
                Cost: ⚡{selectedSpell.mana} · Dmg: -{selectedSpell.damage}💀
              </span>
            </div>
            <textarea
              aria-label={`JavaScript solution for ${selectedSpell.name}`}
              maxLength={10_000}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="w-full font-mono text-xs p-4 resize-none focus:outline-none"
              style={{
                backgroundColor: '#0f0f1a',
                color: '#e2e8f0',
                minHeight: 160,
                lineHeight: 1.6,
                caretColor: '#58CC02',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const s = e.currentTarget.selectionStart;
                  setCode(code.slice(0, s) + '  ' + code.slice(e.currentTarget.selectionEnd));
                  requestAnimationFrame(() => { e.currentTarget.selectionStart = e.currentTarget.selectionEnd = s + 2; });
                }
              }}
            />
          </div>

          {/* Hint */}
          <AnimatePresence>
            {showHint && (
              <motion.div
                id="boss-spell-hint"
                role="region"
                aria-label="Spell hint"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-2xl text-xs"
                style={{ backgroundColor: 'rgba(255,200,0,0.12)', color: '#8B6914' }}
              >
                💡 <strong>Hint:</strong> {selectedSpell.hint}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Test results */}
          <AnimatePresence>
        {results && spellCast && (
              <motion.div role="status" aria-live="polite" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                {results.every(r => r.passed) ? (
                  <motion.div
                    initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                    className="p-3 rounded-2xl text-center font-bold"
                    style={{ backgroundColor: 'rgba(88,204,2,0.12)', color: '#58CC02' }}
                  >
                    ⚔️ SPELL HIT! Boss takes {selectedSpell.damage} damage! -{selectedSpell.damage}💀
                  </motion.div>
                ) : (
                  <div className="p-3 rounded-2xl text-center font-bold"
                    style={{ backgroundColor: 'rgba(255,75,75,0.12)', color: '#FF4B4B' }}>
                    ❌ SPELL FIZZLED! Boss counterattacks!
                  </div>
                )}
                {results.map((r, i) => (
                  <div key={i} className="p-2 rounded-xl text-[10px]"
                    style={{ backgroundColor: r.passed ? '#F0FFE5' : '#FFE8E8' }}>
                    <span className="font-bold" style={{ color: r.passed ? '#58CC02' : '#FF4B4B' }}>
                      {r.passed ? '✓' : '✗'} {r.label}
                    </span>
                    {!r.passed && (
                      <div className="mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
                        Got: <span style={{ color: '#FF4B4B' }}>{r.got}</span>{' '}
                        Expected: <span style={{ color: '#58CC02' }}>{r.expected}</span>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {rewardSync.status === 'saving' && (
            <p role="status" className="rounded-xl px-3 py-2 text-center text-xs font-semibold" style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}>
              Boss defeated. Saving account rewards and recording this-device history…
            </p>
          )}

          {codeError && (
            <div role="alert" className="rounded-xl border px-3 py-2.5 text-sm font-semibold" style={{ borderColor: 'rgba(217,75,75,.24)', backgroundColor: 'rgba(217,75,75,.08)', color: '#B42318' }}>
              {codeError} No mana or health was lost. Fix the issue and cast again.
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowHint(value => !value)}
              aria-expanded={showHint}
              aria-controls="boss-spell-hint"
              className="d-btn d-btn-sm d-btn-white"
            >
              {showHint ? 'Hide hint' : 'Show hint'}
            </button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={castSpell}
              type="button"
              disabled={running || battleState !== 'player_turn'}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white"
              style={{
                background: `linear-gradient(135deg, ${boss.color}, ${boss.shadow})`,
                boxShadow: `0 4px 0 ${boss.shadow}`,
                opacity: running || battleState !== 'player_turn' ? 0.6 : 1,
              }}
            >
              {running ? (
                <span className="animate-pulse" role="status">Running isolated tests…</span>
              ) : (
                <>
                  <Swords className="w-4 h-4" />
                  CAST SPELL — {selectedSpell.name}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
