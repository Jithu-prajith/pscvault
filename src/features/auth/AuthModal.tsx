import React, { useState } from 'react';
import { Award, Lock, Mail, User as UserIcon, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const AuthModal: React.FC = () => {
  const isOpen = useAuthStore((s) => s.authModalOpen);
  const close = useAuthStore((s) => s.setAuthModalOpen);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email || !password) {
          alert('Please enter your email and password.');
          return;
        }
        await login(email, password);
      } else {
        if (!name || !email || !password) {
          alert('Please fill in all required fields.');
          return;
        }
        if (password !== confirmPassword) {
          alert('Passwords do not match.');
          return;
        }
        await register(name, email, password);
      }
      close(false);
    } catch (err) {
      console.warn('Auth error:', err);
      alert('Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-brand-600/10 text-brand-500 border border-brand-500/20 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                PSCVault <span className="text-brand-500">Account</span>
              </h2>
              <p className="text-[11px] text-slate-400">Cloud Sync & Multi-Device Login</p>
            </div>
          </div>
          <button onClick={() => close(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl mb-6 text-xs font-semibold">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'login' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'signup' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative flex items-center">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="aspirant@upsc.org"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="••••••••••••"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Log In to PSCVault' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
