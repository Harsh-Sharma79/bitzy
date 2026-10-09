import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Globe } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import LanguagePicker from '@/components/LanguagePicker';
import { applyTranslation } from '@/lib/googleTranslate';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, updateProfile, isLoggedIn } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'language'>('form');
  const [lang, setLang] = useState('en');

  if (isLoggedIn && step !== 'language') {
    navigate('/app/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setIsSubmitting(true);
    const { error: regError } = await register(username, email, password);
    setIsSubmitting(false);
    if (regError) {
      setError(regError);
      return;
    }
    setStep('language');
  };

  const confirmLanguage = async () => {
    await updateProfile({ preferred_language: lang });
    if (lang === 'en') {
      navigate('/app/dashboard', { replace: true });
    } else {
      applyTranslation(lang);
    }
  };

  if (step === 'language') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <div className="w-full max-w-md">
          <Link to="/" className="mx-auto mb-7 flex w-fit items-center gap-2 rounded-xl focus-visible:outline-none" aria-label="Bitzy home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--blue)' }}><img src="/mascot.png" alt="" className="h-8 w-8 object-contain" /></span>
            <span className="font-display text-xl font-extrabold" style={{ color: 'var(--blue)' }}>Bitzy</span>
          </Link>
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="d-card p-5 sm:p-6" aria-labelledby="language-heading">
            <div className="mb-5 text-center">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(43,127,255,.10)', color: 'var(--blue)' }}><Globe className="h-6 w-6" aria-hidden="true" /></span>
              <h1 id="language-heading" className="font-display text-2xl font-extrabold tracking-tight">Choose your language</h1>
              <p className="mt-1 text-sm leading-6" style={{ color: 'var(--text-muted)' }}>Choose the language you are most comfortable learning in. You can change this later in Settings.</p>
            </div>
            <LanguagePicker selected={lang} onSelect={setLang} />
            <button type="button" onClick={confirmLanguage} className="d-btn d-btn-md d-btn-blue mt-5 w-full">Continue <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          </motion.section>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      <div className="w-full max-w-md">
        <Link to="/" className="mx-auto mb-7 flex w-fit items-center gap-2 rounded-xl focus-visible:outline-none" aria-label="Bitzy home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--blue)' }}><img src="/mascot.png" alt="" className="h-8 w-8 object-contain" /></span>
          <span className="font-display text-xl font-extrabold" style={{ color: 'var(--blue)' }}>Bitzy</span>
        </Link>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
          <div className="mb-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--blue)' }}>Start your learning journey</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Create your account</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Learn new skills, one step at a time.</p>
          </div>
          <section className="d-card p-5 sm:p-6" aria-label="Create account">
            {error && <div id="register-error" role="alert" className="mb-4 rounded-xl border px-3 py-2.5 text-sm font-semibold" style={{ backgroundColor: 'rgba(217,75,75,.08)', color: '#B42318', borderColor: 'rgba(217,75,75,.24)' }}>{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4" aria-busy={isSubmitting}>
              <div>
                <label htmlFor="register-name" className="mb-1.5 block text-sm font-bold">Username</label>
                <div className="relative"><User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} aria-hidden="true" /><input id="register-name" name="username" type="text" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username" className="d-input pl-10" aria-invalid={!!error} aria-describedby={error ? 'register-error' : undefined} /></div>
              </div>
              <div>
                <label htmlFor="register-email" className="mb-1.5 block text-sm font-bold">Email address</label>
                <div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} aria-hidden="true" /><input id="register-email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="d-input pl-10" aria-invalid={!!error} aria-describedby={error ? 'register-error' : undefined} /></div>
              </div>
              <div>
                <label htmlFor="register-password" className="mb-1.5 block text-sm font-bold">Password</label>
                <div className="relative"><Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} aria-hidden="true" /><input id="register-password" name="new-password" type={showPw ? 'text' : 'password'} autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="d-input pl-10 pr-12" aria-invalid={!!error} aria-describedby={error ? 'register-error' : 'password-hint'} /><button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg focus-visible:outline-none" style={{ color: 'var(--text-muted)' }}>{showPw ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}</button></div>
                <p id="password-hint" className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>Use at least 6 characters.</p>
              </div>
              <button type="submit" disabled={isSubmitting} className="d-btn d-btn-md d-btn-blue w-full" aria-live="polite">{isSubmitting ? 'Creating account…' : <>Create account <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}</button>
            </form>
          </section>
          <p className="mt-5 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Already have an account? <button type="button" onClick={() => navigate('/login')} className="rounded font-bold focus-visible:outline-none" style={{ color: 'var(--blue)' }}>Sign in</button></p>
        </motion.div>
      </div>
    </main>
  );
}
