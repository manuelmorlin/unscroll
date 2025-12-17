'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { setSessionAction } from '@/lib/actions/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot';

interface AuthFormProps {
  initialMode?: AuthMode;
}

export function AuthForm({ initialMode = 'login' }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode === 'forgot' ? 'forgot' : initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const router = useRouter();

  // Handle password reset
  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('✉️ Password reset email sent! Check your inbox (and spam folder).');
        setResetEmail('');
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = formData.get('username') as string;

    try {
      let userCredential;

      if (mode === 'register') {
        // Create new user
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update the user's display name on the client side
        await updateProfile(userCredential.user, {
          displayName: username,
        });
        
        // Get ID token
        const idToken = await userCredential.user.getIdToken();
        
        // The server action will create the user document
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, username, idToken }),
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) {
          const data = await response.json();
          if (data.error === 'username_taken') {
            // Delete the Firebase user since username is taken
            await userCredential.user.delete();
            throw new Error('username_taken');
          } else if (data.error === 'email_exists') {
            await userCredential.user.delete();
            throw new Error('email_exists');
          }
          throw new Error('Failed to complete registration');
        }
        
        // Sign out after registration (user needs to login)
        await auth.signOut();
        
        // Show success message and switch to login mode
        setSuccessMessage('Account created successfully! Please sign in.');
        setMode('login');
        setIsLoading(false);
        return;
      } else {
        // Sign in existing user
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      // Get ID token and create server session (only for login)
      const idToken = await userCredential.user.getIdToken();
      await setSessionAction(idToken);

      router.push('/app');
      router.refresh();
    } catch (err: unknown) {
      console.error('Auth error:', err);
      
      // Handle Firebase errors
      const firebaseError = err as { code?: string; message?: string };
      const errorCode = firebaseError?.code || '';
      const errorMessage = firebaseError?.message || '';
      
      if (errorMessage === 'username_taken') {
        setError('This username is already taken. Please choose another.');
      } else if (errorMessage === 'email_exists') {
        setError('An account with this email already exists. Please sign in.');
        setMode('login'); // Switch to login mode
      } else if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (errorCode === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in.');
        setMode('login'); // Switch to login mode
      } else if (errorCode === 'auth/weak-password') {
        setError('Password must be at least 6 characters');
      } else if (errorCode === 'auth/invalid-email') {
        setError('Please enter a valid email address');
      } else {
        setError(firebaseError?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle demo login via server API (password never exposed to client)
  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/demo', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Demo login failed');
      }

      router.push('/app');
      router.refresh();
    } catch (err: unknown) {
      console.error('Demo login error:', err);
      setError('Demo mode is currently unavailable. Please try again.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative z-10">
      {/* Back to Home */}
      <Link 
        href="/"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-yellow-400 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      {/* Logo & Title */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-700 to-red-600 rounded-2xl mb-6 shadow-xl shadow-red-900/30 border border-red-500/30"
        >
          <span className="text-4xl">🎬</span>
        </motion.div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
          <span className="gold-shimmer">Unscroll</span>
        </h1>
        <p className="text-zinc-400 font-light">
          🍿 Your cinema experience awaits
        </p>
      </div>

      {/* Demo Button - For Recruiters */}
      {mode !== 'forgot' && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleDemoLogin}
          disabled={isDemoLoading}
          className="w-full mb-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-violet-900/30"
        >
          {isDemoLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span className="text-lg">🎟️</span>
              <span>Try Demo</span>
              <span className="text-violet-200 text-sm ml-1">(No ticket needed)</span>
            </>
          )}
        </motion.button>
      )}

      {/* Divider */}
      {mode !== 'forgot' && (
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-red-900/30" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-transparent text-zinc-500">or continue with email</span>
          </div>
        </div>
      )}

      {/* Mode Toggle */}
      {mode !== 'forgot' && (
        <div className="flex bg-zinc-900/80 border border-red-900/30 rounded-xl p-1 mb-6">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                mode === m
                  ? 'bg-red-700 text-white shadow-lg'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {m === 'login' ? '🎬 Sign In' : '🎟️ Create Account'}
            </button>
          ))}
        </div>
      )}

      {/* Forgot Password Header */}
      {mode === 'forgot' && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">🔑 Reset Password</h2>
          <p className="text-sm text-zinc-400">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </div>
      )}

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
          >
            <p className="text-green-400 text-sm">{successMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      {mode === 'forgot' ? (
        /* Forgot Password Form */
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/80 border border-red-900/30 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-red-900/30 border border-red-500/30"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>📧 Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>

          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
              setSuccessMessage(null);
            }}
            className="w-full text-center text-sm text-zinc-400 hover:text-yellow-400 transition-colors mt-4"
          >
            ← Back to Sign In
          </button>
        </form>
      ) : (
        /* Login/Register Form */
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div
                key="username"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    required={mode === 'register'}
                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/80 border border-red-900/30 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="email"
              name="email"
            placeholder="Email address"
            required
            className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/80 border border-red-900/30 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            minLength={6}
            className="w-full pl-12 pr-4 py-3.5 bg-zinc-900/80 border border-red-900/30 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all"
          />
        </div>

        {/* Forgot Password Link */}
        {mode === 'login' && (
          <div className="text-right -mt-2">
            <button
              type="button"
              onClick={() => {
                setMode('forgot');
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-sm text-zinc-400 hover:text-yellow-400 transition-colors"
            >
              Forgot password?
            </button>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-red-900/30 border border-red-500/30"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>{mode === 'login' ? '🎬 Enter Cinema' : '🎟️ Get Your Ticket'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
        </form>
      )}
    </div>
  );
}
