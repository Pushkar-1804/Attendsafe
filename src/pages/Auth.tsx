import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
}

export function AuthPage({ initialMode = 'login' }: AuthPageProps) {
  const { loginWithEmail, signUpWithEmail, loginWithGoogle, loginAsGuest, resetPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [college, setCollege] = useState('');
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (mode === 'forgot') {
      if (!email.trim()) {
        setError('Please enter your email.');
        return;
      }
      setLoading(true);
      try {
        await resetPassword(email);
        setInfoMessage('Password reset link sent to your email.');
      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to send reset link');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'signup') {
      if (!displayName.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setLoading(true);
      try {
        await signUpWithEmail(email, password, displayName, college, semester);
      } catch (err: unknown) {
        const errorObj = err as { code?: string; message?: string };
        if (errorObj?.code === 'auth/email-already-in-use') {
          setError('An account with this email already exists.');
        } else if (errorObj?.code === 'auth/operation-not-allowed') {
          setError('Email/password signup is restricted. Use Continue with Google or Guest mode below.');
        } else {
          setError(errorObj?.message || 'Failed to register.');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // Login mode
    setLoading(true);
    try {
      await loginWithEmail(email, password);
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      if (errorObj?.code === 'auth/invalid-credential' || errorObj?.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (errorObj?.code === 'auth/operation-not-allowed') {
        setError('Email/password login is restricted. Use Continue with Google or Guest mode below.');
      } else {
        setError(errorObj?.message || 'Failed to sign in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      setError((err as Error).message || 'Google sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginAsGuest();
    } catch (err: unknown) {
      setError((err as Error).message || 'Guest sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#121214] flex flex-col justify-center py-12 px-4 sm:px-6 text-gray-900 dark:text-gray-100 text-xs font-sans relative">
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#18181b] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h1 className="text-xl font-bold tracking-tight text-center text-gray-900 dark:text-gray-100">
          Attendance Tracker
        </h1>
        <p className="mt-1 text-center text-gray-500 text-xs">
          {mode === 'signup'
            ? 'Create a new student account'
            : mode === 'forgot'
            ? 'Reset your password'
            : 'Login to your account'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-md p-6">
          {error && (
            <div className="mb-4 p-2 rounded border border-red-200 bg-red-50 text-red-700 text-xs">
              {error}
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-2 rounded border border-green-200 bg-green-50 text-green-700 text-xs">
              {infoMessage}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
                />
              </div>
            )}

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="student@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-[11px]"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
                />
              </div>
            )}

            {mode === 'signup' && (
              <>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-gray-500 mb-1 text-[11px]">College</label>
                    <input
                      type="text"
                      placeholder="e.g. State Univ"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1 text-[11px]">Semester</label>
                    <input
                      type="text"
                      placeholder="e.g. 4th"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-3 rounded bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-medium text-xs disabled:opacity-50"
            >
              {loading
                ? 'Processing...'
                : mode === 'signup'
                ? 'Create Account'
                : mode === 'forgot'
                ? 'Send Reset Link'
                : 'Login'}
            </button>
          </form>

          {/* Alternative Auth */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-1.5 px-3 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium text-xs flex items-center justify-center gap-2"
            >
              Sign in with Google
            </button>

            <button
              type="button"
              onClick={handleGuestSignIn}
              disabled={loading}
              className="w-full py-1.5 px-3 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs"
            >
              Continue as Guest
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 text-center text-[11px] text-gray-500">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className="text-gray-900 dark:text-gray-100 font-medium underline"
                >
                  Create account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="text-gray-900 dark:text-gray-100 font-medium underline"
                >
                  Login
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
