import { motion } from 'framer-motion';
import {
  Flame, Zap, Heart, Gem, ArrowRight, ChevronRight,
  Gamepad2, BookOpen, Swords, Loader2, Sparkles, Skull,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { useCourses } from '@/hooks/useDB';
import type { fetchCourses } from '@/lib/db';
import XPBar from '@/components/XPBar';

type CourseSummary = Awaited<ReturnType<typeof fetchCourses>>[number];

const W = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const I = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { gameState } = useGame();
  const { data: courses, loading: coursesLoading, error: coursesError } = useCourses();
  const xp = profile?.xp ?? 0;
  const coins = profile?.coins ?? 0;
  const streak = profile?.current_streak ?? 0;
  const energy = profile?.energy ?? 0;
  const displayName = profile?.display_name ?? 'Learner';

  const stats = [
    { icon: Flame, color: '#D94B4B', value: streak, label: 'Day streak' },
    { icon: Zap, color: '#A86C00', value: xp.toLocaleString(), label: 'Total XP' },
    { icon: Gem, color: '#7550B5', value: coins.toLocaleString(), label: 'Coins' },
    { icon: Heart, color: '#D94B4B', value: energy, label: 'Energy' },
  ];

  const quickActions = [
    { label: 'Courses', icon: BookOpen, tone: '#16845F', path: '/app/courses', description: 'Build your skills' },
    { label: 'Practice', icon: Gamepad2, tone: '#6355A5', path: '/app/games', description: 'Learn by playing' },
    { label: 'Challenges', icon: Swords, tone: '#B04F49', path: '/app/challenges', description: 'Put skills to work' },
    { label: 'Boss Battle', icon: Skull, tone: '#B04F49', path: '/app/boss-battle', description: 'Defeat the HTML Dragon with code' },
  ];

  const progressFor = (courseId: number | string) =>
    gameState.courseProgress.find((item) => String(item.course_id) === String(courseId))?.overall_progress ?? 0;
  const activeCourse = courses?.find((course: CourseSummary) => {
    const progress = progressFor(course.id);
    return progress > 0 && progress < 100;
  }) ?? courses?.find((course: CourseSummary) => progressFor(course.id) < 100);

  return (
    <motion.div variants={W} initial="hidden" animate="show" className="space-y-7 pb-10">
      <motion.section variants={I} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-muted)' }}>YOUR LEARNING SPACE</p>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
            Welcome back, {displayName}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Small steps make strong developers. Pick up where you left off.</p>
        </div>
        <div className="w-full sm:w-64"><XPBar xp={xp} variant="full" /></div>
      </motion.section>

      <motion.section variants={I} aria-label="Your learning statistics" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ icon: Icon, color, value, label }) => (
          <div key={label} className="d-card flex items-center gap-3 p-3 sm:p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ color, backgroundColor: `${color}16` }}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-extrabold leading-tight tabular-nums" style={{ color: 'var(--text)' }}>{value}</span>
              <span className="block text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</span>
            </span>
          </div>
        ))}
      </motion.section>

      <motion.section variants={I} aria-labelledby="continue-heading" className="d-card overflow-hidden p-0">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="max-w-xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold" style={{ backgroundColor: 'rgba(43,127,255,.10)', color: 'var(--blue)' }}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> YOUR NEXT STEP
            </div>
            <h2 id="continue-heading" className="font-display text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
              {activeCourse ? `Continue ${activeCourse.title}` : 'Choose what to learn next'}
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
              {activeCourse ? 'Your progress is saved as you learn.' : 'Explore the course library and start building momentum.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(activeCourse ? `/app/courses/${activeCourse.slug}` : '/app/courses')}
            className="d-btn d-btn-md d-btn-green w-full sm:w-auto"
          >
            {activeCourse ? 'Continue learning' : 'Explore courses'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {activeCourse && (
          <div className="flex items-center gap-3 border-t px-5 py-3 sm:px-6" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold text-white" style={{ backgroundColor: activeCourse.color || 'var(--blue)' }} aria-hidden="true">
              {activeCourse.icon || activeCourse.title?.[0] || 'C'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3 text-xs font-bold">
                <span className="truncate" style={{ color: 'var(--text)' }}>{activeCourse.title}</span>
                <span className="shrink-0 tabular-nums" style={{ color: 'var(--text-muted)' }}>{progressFor(activeCourse.id)}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--border)' }} role="progressbar" aria-label={`${activeCourse.title} course progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressFor(activeCourse.id)}>
                <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min(100, progressFor(activeCourse.id))}%`, backgroundColor: 'var(--blue)' }} />
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
          </div>
        )}
      </motion.section>

      <motion.section variants={I} aria-labelledby="quick-start-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="quick-start-heading" className="text-base font-extrabold" style={{ color: 'var(--text)' }}>Explore Bitzy</h2>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>Choose a way to keep moving forward.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(({ label, icon: Icon, tone, path, description }) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate(path)}
              className="d-card group flex items-center gap-3 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none"
              aria-label={`${label}: ${description}`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ color: tone, backgroundColor: `${tone}16` }}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold" style={{ color: 'var(--text)' }}>{label}</span>
                <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{description}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
            </button>
          ))}
        </div>
      </motion.section>

      <motion.section variants={I} aria-labelledby="courses-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 id="courses-heading" className="text-base font-extrabold" style={{ color: 'var(--text)' }}>Your courses</h2>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>Progress that moves with you.</p>
          </div>
          <button type="button" onClick={() => navigate('/app/courses')} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-2 text-sm font-bold focus-visible:outline-none" style={{ color: 'var(--blue)' }}>
            All courses <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {coursesLoading ? (
          <div className="d-card flex min-h-28 items-center justify-center gap-3 text-sm" role="status" style={{ color: 'var(--text-muted)' }}>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Loading your courses…
          </div>
        ) : coursesError ? (
          <div className="d-card flex flex-col items-start gap-3 p-5" role="alert">
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>We couldn’t load your courses right now.</p>
            <button type="button" onClick={() => navigate('/app/courses')} className="d-btn d-btn-sm d-btn-white">Open course library</button>
          </div>
        ) : !courses?.length ? (
          <div className="d-card flex flex-col items-center p-7 text-center">
            <BookOpen className="mb-2 h-7 w-7" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>No courses published yet.</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Check back soon for new learning content.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {courses.slice(0, 4).map((course: CourseSummary) => {
              const progress = progressFor(course.id);
              return (
                <button key={course.id} type="button" onClick={() => navigate(`/app/courses/${course.slug}`)} className="d-card group flex w-full items-center gap-3 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white" style={{ backgroundColor: course.color || 'var(--blue)' }} aria-hidden="true">
                    {course.icon || course.title?.[0] || 'C'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold" style={{ color: 'var(--text)' }}>{course.title}</span>
                    <span className="mt-0.5 block text-xs" style={{ color: 'var(--text-muted)' }}>{course.difficulty || 'Course'} · {progress}% complete</span>
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--surface)' }} role="progressbar" aria-label={`${course.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                      <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min(100, progress)}%`, backgroundColor: 'var(--blue)' }} />
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                </button>
              );
            })}
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}
