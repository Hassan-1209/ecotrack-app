import { useState } from 'react';
import { Leaf, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (mode === 'signup') {
      setError('Account created! Check your email or sign in to continue.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-forest-50 via-forest-100 to-sage-100 dark:from-forest-950 dark:via-forest-900 dark:to-sage-900">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center shadow-lg shadow-forest-500/30 mb-4">
            <Leaf className="w-9 h-9 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-forest-700 dark:text-forest-50">EcoTrack</h1>
          <p className="text-forest-500 dark:text-forest-200 text-sm mt-1 text-center">
            AI-powered sustainability & health tracking
          </p>
        </div>

        <div className="card p-8 card-hover">
          <div className="flex gap-2 mb-6 p-1 bg-forest-50 dark:bg-forest-700/60 rounded-xl">
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-white dark:bg-forest-600 text-forest-700 dark:text-forest-50 shadow-sm'
                  : 'text-forest-500 dark:text-forest-300'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'signin'
                  ? 'bg-white dark:bg-forest-600 text-forest-700 dark:text-forest-50 shadow-sm'
                  : 'text-forest-500 dark:text-forest-300'
              }`}
            >
              Sign In
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-forest-700 dark:text-forest-200 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-base pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-forest-700 dark:text-forest-200 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="input-base pl-10"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-earth-700 dark:text-earth-300 bg-earth-50 dark:bg-earth-900/30 rounded-lg p-3 animate-fade-in">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Please wait...
                </>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <p className="text-xs text-forest-400 dark:text-forest-400 text-center mt-6">
            Your data is private and secured with row-level security.
          </p>
        </div>
      </div>
    </div>
  );
}
