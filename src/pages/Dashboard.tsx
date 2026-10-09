import { motion } from 'framer-motion';
import {
  Flame, Zap, Heart, Gem, ChevronRight,
  Gamepad2, BookOpen, Swords,
  Loader2, Bug, Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { useCourses } from '@/hooks/useDB';
import XPBar from '@/components/XPBar';

const W = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const I = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };



export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { gameState } = useGame();
  const { data: courses, loading: coursesLoading } = useCourses();
  const xp     = profile?.xp ?? 0;
  const coins  = profile?.coins ?? 0;
  const streak = profile?.current_streak ?? 0;
  const energy = profile?.energy ?? 0;

  const stats = [
    { icon: Flame,  color: '#FF4B4B', val: streak, label: 'Streak',  bg: 'rgba(255,75,75,0.12)' },
    { icon: Zap,    color: '#FFC800', val: xp,     label: 'XP',      bg: 'rgba(255,200,0,0.12)' },
    { icon: Gem,    color: '#CE82FF', val: coins,  label: 'Coins',   bg: 'rgba(206,130,255,0.12)' },
    { icon: Heart,  color: '#FF4B4B', val: energy, label: 'Energy',  bg: 'rgba(255,75,75,0.12)' },
  ];

  const quickActions = [
    { label: 'Courses', icon: BookOpen, color: '#58CC02', path: '/app/courses',    desc: 'Continue learning' },
    { label: 'Play',    icon: Gamepad2, color: '#CE82FF', path: '/app/games',      desc: 'Practice with games' },
    { label: 'Arena',   icon: Swords,   color: '#FF4B4B', path: '/app/challenges', desc: 'Solve challenges' },
  ];

  const displayName = profile?.display_name ?? 'Learner';

  return (
    <motion.div variants={W} initial="hidden" animate="show" className="space-y-5 pb-10">
      {/* Greeting */}
      <motion.div variants={I}>
        <h1 className="font-display text-2xl font-black" style={{ color: 'var(--text)' }}>
          Hey, {displayName}! 👋
        </h1>
        <XPBar xp={xp} variant="full" className="mt-2" />
      </motion.div>

      {/* Featured arcade mission */}
      <motion.div variants={I}>
        <button onClick={() => navigate('/app/bug-hunter')} className="w-full text-left overflow-hidden rounded-[26px] p-4 sm:p-5 text-white relative group" style={{ background: 'linear-gradient(115deg, #101A35 0%, #1A3263 58%, #38246D 100%)', boxShadow: '0 12px 32px rgba(31,66,140,.16)' }}>
          <div className="absolute -right-6 -top-10 w-40 h-40 rounded-full blur-2xl opacity-30" style={{ background: '#2B7FFF' }}/>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center border border-white/15 bg-white/10"><Bug className="w-7 h-7 text-cyan-200"/></div>
            <div className="flex-1 min-w-0"><div className="flex items-center gap-2 text-[10px] uppercase tracking-[.16em] font-black text-cyan-200"><Sparkles className="w-3.5 h-3.5"/> New arcade mode</div><p className="font-display text-xl sm:text-2xl font-bold mt-1">Bug Hunter</p><p className="text-xs sm:text-sm text-white/70 mt-1">Debug code. Beat the clock. Earn XP.</p></div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform"><ChevronRight className="w-5 h-5"/></div>
          </div>
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={I} className="grid grid-cols-4 gap-2">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="d-card p-3 text-center" style={{ backgroundColor: s.bg }}>
              <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: s.color }}/>
              <p className="font-display text-base font-black" style={{ color: s.color }}>{s.val}</p>
              <p className="text-[10px] font-bold" style={{ color: s.color + 'CC' }}>{s.label}</p>
            </div>
          );
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={I}>
        <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>QUICK START</p>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map(a => {
            const Icon = a.icon;
            return (
              <motion.button key={a.label} whileTap={{ scale: 0.95 }} onClick={() => navigate(a.path)}
                className="d-card p-4 flex flex-col items-center gap-2 cursor-pointer transition-all">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: a.color + '20' }}>
                  <Icon className="w-6 h-6" style={{ color: a.color }}/>
                </div>
                <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{a.label}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{a.desc}</p>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Continue Learning */}
      <motion.div variants={I}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>CONTINUE LEARNING</p>
          <button onClick={() => navigate('/app/courses')} className="text-xs font-bold" style={{ color: '#58CC02' }}>See all</button>
        </div>
        {coursesLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-muted)' }}/></div>
        ) : !courses?.length ? (
          <div className="d-card p-6 text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }}/>
            <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>No courses published yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {courses.slice(0, 4).map((course: any) => {
              const cp = gameState.courseProgress.find((p: any) => String(p.course_id) === String(course.id));
              const progress = cp?.overall_progress ?? 0;
              return (
                <motion.div key={course.id} whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/app/courses/${course.slug}`)}
                  className="d-card p-3 flex items-center gap-3 cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-display text-lg font-bold flex-shrink-0 text-white"
                    style={{ backgroundColor: course.color || '#6366f1' }}>
                    {course.icon || course.title[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>{course.title}</p>
                    <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>{course.difficulty}</p>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: course.color || '#6366f1' }}/>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm" style={{ color: course.color || '#6366f1' }}>{progress}%</p>
                    <ChevronRight className="w-4 h-4 ml-auto" style={{ color: 'var(--text-muted)' }}/>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}