import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSetup: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onOpenSetup,
  onShowToast,
}) => {
  const { signInWithEmail, signUpWithEmail, enableDemoMode, isConfigured } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setInfoMessage(null);

    if (!email.trim() || !password) {
      setFormError('Please fill out all required fields.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await signInWithEmail(email, password);
        if (!res.success) {
          setFormError(res.error || 'Invalid email or password.');
        } else {
          onShowToast('Welcome back', `Signed in as ${email}`, 'success');
          onClose();
        }
      } else {
        const res = await signUpWithEmail(email, password);
        if (!res.success) {
          setFormError(res.error || 'Failed to create account.');
        } else {
          if (res.message) {
            setInfoMessage(res.message);
            onShowToast('Account Created', res.message, 'success');
          } else {
            onShowToast('Account Created', 'Successfully signed in!', 'success');
            onClose();
          }
        }
      }
    } catch (err: any) {
      setFormError(err?.message || 'Authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    enableDemoMode();
    onShowToast('Sandbox Mode Active', 'Browsing in local demo preview.', 'info');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden text-stone-200">
        {/* Top Decorative Header */}
        <div className="p-6 pb-4 border-b border-stone-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-400 font-medium">Lumina Vault</span>
              <h2 className="text-xl font-bold tracking-tight text-stone-100 mt-1">
                {mode === 'signin' ? 'Sign In to Your Gallery' : 'Create Free Vault Account'}
              </h2>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-stone-400">
            {mode === 'signin'
              ? 'Enter your credentials to access your private encrypted photos.'
              : 'Sign up to upload and manage private photos with Supabase RLS.'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1.5 mx-6 mt-4 bg-stone-950 rounded-xl border border-stone-800/80 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setFormError(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-stone-800 text-stone-100 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setFormError(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-stone-800 text-stone-100 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="photographer@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder:text-stone-600 text-xs focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder:text-stone-600 text-xs focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 text-xs font-semibold tracking-wide transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
            ) : mode === 'signin' ? (
              <>
                <LogIn className="w-4 h-4" />
                Sign In
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Account
              </>
            )}
          </button>

          <div className="relative py-2 flex items-center justify-center">
            <div className="w-full border-t border-stone-800" />
            <span className="absolute bg-stone-900 px-3 text-[11px] text-stone-500 uppercase tracking-wider">
              or try demo
            </span>
          </div>

          <button
            type="button"
            onClick={handleDemoSignIn}
            className="w-full py-2.5 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-stone-200 text-xs font-medium border border-stone-700/60 transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Explore in Sandbox Demo Mode
          </button>
        </form>

        {/* Footer info */}
        <div className="p-4 bg-stone-950 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-500">
          <span>
            {isConfigured ? 'Connected to Supabase' : 'Supabase not yet configured'}
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSetup();
            }}
            className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
          >
            Configure Supabase Keys
          </button>
        </div>
      </div>
    </div>
  );
};
