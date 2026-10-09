import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Gamepad2, Swords, Trophy, LayoutDashboard, CheckCircle2, Flame, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const features = [
  { icon: BookOpen, label: 'Structured courses' },
  { icon: Gamepad2, label: 'Practice through play' },
  { icon: Swords, label: 'Coding challenges' },
  { icon: Trophy, label: 'Progress you can see' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <header className="w-full border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--white)' }}>
        <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" aria-label="Bitzy home" className="flex items-center gap-2.5 rounded-xl focus-visible:outline-none">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--blue)' }}>
              <img src="/mascot.png" alt="" className="h-8 w-8 object-contain" />
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight" style={{ color: 'var(--blue)' }}>Bitzy</span>
          </Link>
          {isLoggedIn ? (
            <button type="button" onClick={() => navigate('/app/dashboard')} className="d-btn d-btn-sm d-btn-green">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Dashboard
            </button>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <button type="button" onClick={() => navigate('/login')} className="d-btn d-btn-sm d-btn-ghost">Sign in</button>
              <button type="button" onClick={() => navigate('/register')} className="d-btn d-btn-sm d-btn-blue">Get started</button>
            </div>
          )}
        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_.9fr] lg:gap-16">
        <section className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold" style={{ color: 'var(--blue)', borderColor: 'var(--border)', backgroundColor: 'var(--white)' }}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--green)' }} aria-hidden="true" /> A more engaging way to learn code
          </div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-[3.5rem]" style={{ color: 'var(--text)' }}>
            Learn to code.<br />
            <span style={{ color: 'var(--blue)' }}>Make progress every day.</span>
          </motion.h1>
          <p className="mt-5 max-w-xl text-base leading-7 sm:text-lg" style={{ color: 'var(--text-muted)' }}>
            Build practical coding skills with guided courses, interactive practice, and challenges that turn learning into a habit.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {isLoggedIn ? (
              <button type="button" onClick={() => navigate('/app/dashboard')} className="d-btn d-btn-lg d-btn-blue">
                <LayoutDashboard className="h-5 w-5" aria-hidden="true" /> Go to your dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <>
                <button type="button" onClick={() => navigate('/register')} className="d-btn d-btn-lg d-btn-blue">
                  Start learning free <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => navigate('/login')} className="d-btn d-btn-lg d-btn-white">I already have an account</button>
              </>
            )}
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            {['Learn at your pace', 'Practice what you learn', 'Track your progress'].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--green)' }} aria-hidden="true" /> {item}
              </span>
            ))}
          </div>
        </section>

        <motion.aside initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }} aria-label="How Bitzy helps you learn" className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] opacity-50" style={{ background: 'radial-gradient(ellipse at center, rgba(43,127,255,.12), transparent 70%)' }} />
          <div className="d-card overflow-hidden p-0">
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--white)' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Your learning loop</p>
                <p className="mt-1 text-sm font-extrabold" style={{ color: 'var(--text)' }}>Learn · Practice · Grow</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ color: 'var(--blue)', backgroundColor: 'rgba(43,127,255,.10)' }}>
                <BookOpen className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <div className="px-5 py-5 sm:px-6">
              <div className="flex justify-center py-2">
                <img src="/mascot.png" alt="Bitzy mascot" className="h-36 w-36 object-contain sm:h-44 sm:w-44" />
              </div>
              <div className="space-y-3">
                {[
                  { icon: BookOpen, title: 'Follow a guided course', detail: 'Learn one concept at a time', tone: 'var(--blue)' },
                  { icon: Zap, title: 'Practice with purpose', detail: 'Build confidence through repetition', tone: 'var(--green)' },
                  { icon: Flame, title: 'Keep your momentum', detail: 'See your effort turn into progress', tone: '#B06A00' },
                ].map(({ icon: Icon, title, detail, tone }) => (
                  <div key={title} className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ color: tone, backgroundColor: 'var(--surface)' }}><Icon className="h-4 w-4" aria-hidden="true" /></span>
                    <span><span className="block text-sm font-bold" style={{ color: 'var(--text)' }}>{title}</span><span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{detail}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.aside>

        <section aria-label="Bitzy learning features" className="grid grid-cols-2 gap-3 lg:col-span-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--white)' }}>
              <Icon className="h-5 w-5 shrink-0" style={{ color: 'var(--blue)' }} aria-hidden="true" />
              <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{label}</span>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t px-4 py-5 text-center" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        <Link to="/privacy" className="rounded px-1 text-sm font-semibold hover:underline focus-visible:outline-none">Privacy policy</Link>
        <p className="mt-2 text-xs">Bitzy · Learn, practice, and grow as a developer.</p>
      </footer>
    </div>
  );
}
