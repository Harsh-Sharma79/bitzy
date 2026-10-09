import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoggedIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoggedIn) {
    navigate('/app/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setIsSubmitting(true);
    const { error: loginError } = await login(email, password);
    if (loginError) {
      setError(loginError);
      setIsSubmitting(false);
      return;
    }
    navigate('/app/dashboard', { replace: true });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <div className="w-full max-w-md">
        <Link to="/" className="mx-auto mb-7 flex w-fit items-center gap-2 rounded-xl focus-visible:outline-none" aria-label="Bitzy home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--blue)' }}><img src="/mascot.png" alt="" className="h-8 w-8 object-contain" /></span>
          <span className="font-display text-xl font-extrabold" style={{ color: 'var(--blue)' }}>Bitzy</span>
        </Link>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
          <div className="mb-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--blue)' }}>Your learning space</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Welcome back</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Sign in to continue learning.</p>
          </div>
          <section className="d-card p-5 sm:p-6" aria-label="Sign in">
            {error && <div id="login-error" role="alert" className="mb-4 rounded-xl border px-3 py-2.5 text-sm font-semibold" style={{ color: '#B42318', backgroundColor: 'rgba(217,75,75,.08)', borderColor: 'rgba(217,75,75,.24)' }}>{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4" aria-busy={isSubmitting}>
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-sm font-bold">Email address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                  <input id="login-email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="d-input pl-10" aria-invalid={!!error} aria-describedby={error ? 'login-error' : undefined} />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label htmlFor="login-password" className="text-sm font-bold">Password</label>
                  <button type="button" onClick={() => navigate('/forgot-password')} className="rounded text-sm font-bold focus-visible:outline-none" style={{ color: 'var(--blue)' }}>Forgot password?</button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                  <input id="login-password" name="password" type={showPw ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="d-input pl-10 pr-12" aria-invalid={!!error} aria-describedby={error ? 'login-error' : undefined} />
                  <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg focus-visible:outline-none" style={{ color: 'var(--text-muted)' }}>
                    {showPw ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="d-btn d-btn-md d-btn-blue w-full" aria-live="polite">
                {isSubmitting ? 'Signing in…' : <>Sign in <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
              </button>
            </form>
            <div className="my-5 flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}><span className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />NEW TO BITZY<span className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} /></div>
            <button type="button" onClick={() => navigate('/register')} className="d-btn d-btn-md d-btn-white w-full">
              <Sparkles className="h-4 w-4" aria-hidden="true" /> Create your account
            </button>
          </section>
          <p className="mt-5 text-center text-sm" style={{ color: 'var(--text-muted)' }}><Link to="/" className="rounded font-semibold focus-visible:outline-none" style={{ color: 'var(--blue)' }}>Back to Bitzy home</Link></p>
        </motion.div>
      </div>
    </main>
  );
}
