/**
 * src/pages/features/SkillTreePage.tsx
 *
 * Skill Tree — fully DB-connected.
 * Branches & skill definitions stay here (display metadata only).
 * Each skill maps to a course SLUG — looked up against published courses from DB.
 * If course not published, skill is hidden. Zero hardcoded content.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle2, Star, Zap, ChevronRight, Loader2, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { useCourses } from '@/hooks/useDB';

const W = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const I = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

// ── Skill definitions — display metadata only, no content ─────────────────
// courseSlug must match a slug in the `courses` table. If not published → hidden.
interface SkillDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  xpRequired: number;
  prereqs: string[];   // other skill IDs in same branch
  color: string;
  xpReward: number;
  tier: number;
  courseSlug: string;  // maps to courses.slug in DB
}

const BRANCHES: Record<string, { name: string; color: string; icon: string; skills: SkillDef[] }> = {
  frontend: {
    name: 'Frontend',
    color: '#E34C26',
    icon: '🖥️',
    skills: [
      { id: 'html-basics',    name: 'HTML Basics',        icon: '📄', desc: 'Structure web pages with HTML',       xpRequired: 0,    prereqs: [],             color: '#E34C26', xpReward: 100, tier: 1, courseSlug: 'html-basics'      },
      { id: 'css-styling',    name: 'CSS Styling',        icon: '🎨', desc: 'Style elements beautifully',          xpRequired: 200,  prereqs: ['html-basics'], color: '#264DE4', xpReward: 150, tier: 2, courseSlug: 'css-fundamentals' },
      { id: 'css-layout',     name: 'CSS Layout',         icon: '📐', desc: 'Flexbox & Grid mastery',             xpRequired: 400,  prereqs: ['css-styling'], color: '#264DE4', xpReward: 200, tier: 3, courseSlug: 'css-fundamentals' },
      { id: 'js-dom',         name: 'JS & DOM',           icon: '⚡', desc: 'Make pages interactive',             xpRequired: 600,  prereqs: ['css-layout'],  color: '#F7DF1E', xpReward: 250, tier: 4, courseSlug: 'javascript-basics'},
      { id: 'react-comp',     name: 'React Components',   icon: '⚛️', desc: 'Build with components',              xpRequired: 900,  prereqs: ['js-dom'],      color: '#61DAFB', xpReward: 300, tier: 5, courseSlug: 'react-basics'     },
      { id: 'react-advanced', name: 'Advanced React',     icon: '🚀', desc: 'Hooks, Context, Performance',        xpRequired: 1300, prereqs: ['react-comp'],  color: '#61DAFB', xpReward: 400, tier: 6, courseSlug: 'react-basics'     },
    ],
  },
  backend: {
    name: 'Backend',
    color: '#68A063',
    icon: '⚙️',
    skills: [
      { id: 'python-basics',   name: 'Python Basics',    icon: '🐍', desc: 'Learn the backend workhorse',         xpRequired: 0,    prereqs: [],                   color: '#68A063', xpReward: 100, tier: 1, courseSlug: 'python-basics'    },
      { id: 'data-structures', name: 'Data Structures',  icon: '🗂️', desc: 'Arrays, objects, trees',             xpRequired: 200,  prereqs: ['python-basics'],    color: '#68A063', xpReward: 150, tier: 2, courseSlug: 'data-structures'  },
      { id: 'algorithms',      name: 'Algorithms',       icon: '🧮', desc: 'Sorting, searching, recursion',       xpRequired: 500,  prereqs: ['data-structures'],  color: '#FF9600', xpReward: 250, tier: 3, courseSlug: 'data-structures'  },
      { id: 'databases',       name: 'Databases',        icon: '🗄️', desc: 'SQL & data modelling',               xpRequired: 800,  prereqs: ['algorithms'],       color: '#336791', xpReward: 300, tier: 4, courseSlug: 'sql-basics'       },
      { id: 'apis',            name: 'REST APIs',        icon: '🔌', desc: 'Build server endpoints',              xpRequired: 1100, prereqs: ['databases'],        color: '#58CC02', xpReward: 350, tier: 5, courseSlug: 'nodejs-backend'   },
      { id: 'nodejs',          name: 'Node.js',          icon: '🟢', desc: 'JS on the server side',              xpRequired: 1400, prereqs: ['apis'],             color: '#68A063', xpReward: 400, tier: 6, courseSlug: 'nodejs-backend'   },
    ],
  },
  ai: {
    name: 'AI/ML',
    color: '#CE82FF',
    icon: '🤖',
    skills: [
      { id: 'math-foundations', name: 'Math Foundations', icon: '📐', desc: 'Linear algebra, calculus basics',   xpRequired: 0,    prereqs: [],                    color: '#FF4B4B', xpReward: 100, tier: 1, courseSlug: 'math-foundations' },
      { id: 'python-data',      name: 'Python + Data',    icon: '📊', desc: 'NumPy, Pandas basics',              xpRequired: 300,  prereqs: ['math-foundations'],  color: '#68A063', xpReward: 150, tier: 2, courseSlug: 'python-basics'    },
      { id: 'ml-basics',        name: 'ML Basics',        icon: '🧠', desc: 'Regression, classification',        xpRequired: 600,  prereqs: ['python-data'],       color: '#CE82FF', xpReward: 200, tier: 3, courseSlug: 'machine-learning' },
      { id: 'neural-nets',      name: 'Neural Networks',  icon: '🕸️', desc: 'Deep learning fundamentals',        xpRequired: 1000, prereqs: ['ml-basics'],         color: '#CE82FF', xpReward: 300, tier: 4, courseSlug: 'machine-learning' },
      { id: 'llm-prompting',    name: 'LLM Prompting',    icon: '💬', desc: 'Work with AI APIs',                 xpRequired: 1400, prereqs: ['neural-nets'],       color: '#1CB0F6', xpReward: 350, tier: 5, courseSlug: 'ai-applications'  },
      { id: 'ai-apps',          name: 'AI Applications',  icon: '🚀', desc: 'Build real AI products',            xpRequired: 1800, prereqs: ['llm-prompting'],     color: '#FFC800', xpReward: 500, tier: 6, courseSlug: 'ai-applications'  },
    ],
  },
  gamedev: {
    name: 'Game Dev',
    color: '#FF9600',
    icon: '🎮',
    skills: [
      { id: 'game-logic',   name: 'Game Logic',          icon: '🎲', desc: 'Game loops, state, events',          xpRequired: 0,    prereqs: [],               color: '#FF9600', xpReward: 100, tier: 1, courseSlug: 'javascript-basics'},
      { id: 'canvas-api',   name: 'Canvas API',          icon: '🖼️', desc: '2D graphics with JS',               xpRequired: 300,  prereqs: ['game-logic'],   color: '#FF4B4B', xpReward: 150, tier: 2, courseSlug: 'javascript-basics'},
      { id: 'physics',      name: 'Game Physics',        icon: '⚽', desc: 'Collisions, movement, gravity',      xpRequired: 600,  prereqs: ['canvas-api'],   color: '#FF9600', xpReward: 200, tier: 3, courseSlug: 'javascript-basics'},
      { id: 'sprites',      name: 'Sprites & Animation', icon: '🦊', desc: 'Character animation systems',        xpRequired: 900,  prereqs: ['physics'],      color: '#CE82FF', xpReward: 250, tier: 4, courseSlug: 'react-basics'     },
      { id: 'webgl',        name: 'WebGL/3D',            icon: '🌐', desc: '3D graphics fundamentals',           xpRequired: 1200, prereqs: ['sprites'],      color: '#1CB0F6', xpReward: 350, tier: 5, courseSlug: 'webgl-basics'     },
      { id: 'game-engine',  name: 'Game Engine',         icon: '🏆', desc: 'Build your own engine',             xpRequired: 1600, prereqs: ['webgl'],        color: '#FFC800', xpReward: 500, tier: 6, courseSlug: 'game-engine'      },
    ],
  },
};

// ── Skill card ────────────────────────────────────────────────────────────────
function SkillNodeCard({
  skill, unlocked, completed, courseExists, onSelect,
}: {
  skill: SkillDef; unlocked: boolean; completed: boolean; courseExists: boolean; onSelect: () => void;
}) {
  const canClick = unlocked && courseExists;
  return (
    <motion.button
      whileHover={canClick ? { scale: 1.05 } : {}}
      whileTap={canClick ? { scale: 0.94 } : {}}
      onClick={canClick ? onSelect : undefined}
      className="relative w-full p-3 rounded-2xl border-2 text-left transition-all"
      style={{
        borderColor: completed ? skill.color : unlocked ? skill.color + '60' : 'var(--border)',
        backgroundColor: completed ? skill.color + '15' : unlocked ? 'var(--white)' : 'var(--surface)',
        opacity: canClick ? 1 : 0.5,
        cursor: canClick ? 'pointer' : 'not-allowed',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{skill.icon}</span>
        <span className="text-xs font-bold flex-1" style={{ color: unlocked ? 'var(--text)' : 'var(--text-muted)' }}>
          {skill.name}
        </span>
        {completed
          ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: skill.color }} />
          : !unlocked || !courseExists
            ? <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            : <Star className="w-3.5 h-3.5 flex-shrink-0" style={{ color: skill.color }} />}
      </div>
      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{skill.desc}</p>
      {!courseExists && (
        <p className="text-[9px] mt-1 font-bold" style={{ color: 'var(--text-muted)' }}>Course not published yet</p>
      )}
      {unlocked && !completed && courseExists && (
        <div className="mt-2 flex items-center gap-1">
          <Zap className="w-3 h-3" style={{ color: '#FFC800' }} />
          <span className="text-[10px] font-bold" style={{ color: '#FFC800' }}>+{skill.xpReward} XP</span>
        </div>
      )}
    </motion.button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SkillTreePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { gameState } = useGame();
  const { data: dbCourses, loading } = useCourses();

  const [activeBranch, setActiveBranch] = useState('frontend');
  const [selectedSkill, setSelectedSkill] = useState<SkillDef | null>(null);

  const xp = profile?.xp ?? 0;

  // Build slug→course map from DB
  const courseBySlug: Record<string, any> = {};
  (dbCourses ?? []).forEach((c: any) => { courseBySlug[c.slug] = c; });

  // Build slug→progress map from gameState
  const progressBySlug: Record<string, number> = {};
  (dbCourses ?? []).forEach((c: any) => {
    const cp = gameState.courseProgress.find((p: any) => String(p.course_id) === String(c.id));
    progressBySlug[c.slug] = cp?.overall_progress ?? 0;
  });

  const isSkillCompleted = (skill: SkillDef) =>
    (progressBySlug[skill.courseSlug] ?? 0) >= 50;

  // Skills/courses are never gated behind XP or prerequisites — anyone can
  // start any published course right away. `xpRequired`/`prereqs` are kept
  // in the data purely as a recommended learning order (used for sorting
  // and the "+XP" hint), not as an access restriction.
  const isSkillUnlocked = (_skill: SkillDef): boolean => true;

  // Filter branches to only those with at least 1 published course
  const visibleBranches = Object.entries(BRANCHES).filter(([, b]) =>
    b.skills.some((s) => !!courseBySlug[s.courseSlug])
  );

  // If active branch got filtered out, reset
  const activeBranchData = BRANCHES[activeBranch];
  const branch = activeBranchData;

  // Only show skills whose course is published
  const visibleSkills = branch?.skills.filter((s) => !!courseBySlug[s.courseSlug]) ?? [];
  const completedCount = visibleSkills.filter((s) => isSkillCompleted(s)).length;
  const totalVisible = visibleSkills.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
      </div>
    );
  }

  if (!dbCourses?.length) {
    return (
      <div className="text-center py-20">
        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
        <p className="font-bold" style={{ color: 'var(--text-muted)' }}>No courses published yet.</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Admin can publish courses to unlock the Skill Tree.</p>
      </div>
    );
  }

  return (
    <motion.div variants={W} initial="hidden" animate="show" className="space-y-5">
      {/* Header */}
      <motion.div variants={I}>
        <h1 className="font-display text-2xl font-bold mb-1">🌳 Skill Tree</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Unlock abilities as you gain XP •{' '}
          <span className="font-bold" style={{ color: '#FFC800' }}>{xp} XP</span>
        </p>
      </motion.div>

      {/* Branch selector — only published branches */}
      <motion.div variants={I} className="flex gap-2 overflow-x-auto pb-1">
        {visibleBranches.map(([key, b]) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveBranch(key)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 font-bold text-sm transition-all"
            style={{
              borderColor: activeBranch === key ? b.color : 'var(--border)',
              backgroundColor: activeBranch === key ? b.color + '15' : 'var(--white)',
              color: activeBranch === key ? b.color : 'var(--text-muted)',
            }}
          >
            <span>{b.icon}</span>
            <span className="font-display">{b.name}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Branch progress */}
      {totalVisible > 0 && (
        <motion.div variants={I} className="d-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{branch?.icon}</span>
              <div>
                <h2 className="font-display font-bold">{branch?.name} Branch</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {completedCount}/{totalVisible} skills mastered
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-display font-bold" style={{ color: branch?.color }}>
                {Math.round((completedCount / totalVisible) * 100)}%
              </div>
            </div>
          </div>
          <div className="d-progress h-3">
            <motion.div
              className="d-progress-fill"
              style={{ backgroundColor: branch?.color }}
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / totalVisible) * 100}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </motion.div>
      )}

      {/* Skill nodes by tier */}
      <motion.div variants={I} className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((tier) => {
          const tierSkills = visibleSkills.filter((s) => s.tier === tier);
          if (!tierSkills.length) return null;
          return (
            <div key={tier}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: branch?.color }}>
                  {tier}
                </div>
                <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                  Tier {tier} — {tier <= 2 ? 'Foundation' : tier <= 4 ? 'Intermediate' : 'Advanced'}
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {tierSkills.map((skill) => (
                  <SkillNodeCard
                    key={skill.id}
                    skill={skill}
                    unlocked={isSkillUnlocked(skill)}
                    completed={isSkillCompleted(skill)}
                    courseExists={!!courseBySlug[skill.courseSlug]}
                    onSelect={() => setSelectedSkill(skill)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </motion.div>

      {totalVisible === 0 && (
        <div className="text-center py-8">
          <p className="font-bold" style={{ color: 'var(--text-muted)' }}>
            No courses published for this branch yet.
          </p>
        </div>
      )}

      {/* Skill detail modal */}
      <AnimatePresence>
        {selectedSkill && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setSelectedSkill(null)}
          >
            <motion.div
              initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
              className="d-card w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{selectedSkill.icon}</span>
                  <div>
                    <h3 className="font-display text-lg font-bold">{selectedSkill.name}</h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedSkill.desc}</p>
                  </div>
                </div>

                {/* Course info from DB */}
                {courseBySlug[selectedSkill.courseSlug] && (
                  <div className="d-card p-3 mb-4 flex items-center gap-3"
                    style={{ backgroundColor: 'var(--surface)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: courseBySlug[selectedSkill.courseSlug].color || '#6366f1' }}>
                      {courseBySlug[selectedSkill.courseSlug].icon ||
                        courseBySlug[selectedSkill.courseSlug].title?.[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{courseBySlug[selectedSkill.courseSlug].title}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {courseBySlug[selectedSkill.courseSlug].total_lessons} lessons ·{' '}
                        {courseBySlug[selectedSkill.courseSlug].difficulty}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="d-card p-3 text-center" style={{ backgroundColor: 'var(--surface)' }}>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>XP Required</div>
                    <div className="font-display font-bold" style={{ color: '#FFC800' }}>{selectedSkill.xpRequired}</div>
                  </div>
                  <div className="d-card p-3 text-center" style={{ backgroundColor: 'var(--surface)' }}>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>XP Reward</div>
                    <div className="font-display font-bold" style={{ color: '#58CC02' }}>+{selectedSkill.xpReward}</div>
                  </div>
                </div>

                {isSkillCompleted(selectedSkill) ? (
                  <div className="text-center py-2">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: '#58CC02' }} />
                    <p className="font-bold text-sm" style={{ color: '#58CC02' }}>Skill Mastered! 🎉</p>
                  </div>
                ) : (
                  <button
                    className="d-btn d-btn-md w-full flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: selectedSkill.color,
                      color: 'white',
                      boxShadow: `0 4px 0 ${selectedSkill.color}90`,
                    }}
                    onClick={() => {
                      setSelectedSkill(null);
                      navigate(`/app/courses/${selectedSkill.courseSlug}`);
                    }}
                  >
                    Go to Course <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}