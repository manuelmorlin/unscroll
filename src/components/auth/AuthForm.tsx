'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { setSessionAction } from '@/lib/actions/auth';
import { useRouter } from 'next/navigation';

type AuthMode = 'login' | 'register';

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

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
      } else {
        // Sign in existing user
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      // Get ID token and create server session
      const idToken = await userCredential.user.getIdToken();
      
      // For registration, include extra data
      if (mode === 'register') {
        // The server action will create the user document
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, username, idToken }),
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) {
          throw new Error('Failed to complete registration');
        }
      } else {
        // Just set the session for login
        await setSessionAction(idToken);
      }

      router.push('/app');
      router.refresh();
    } catch (err: unknown) {
      console.error('Auth error:', err);
      
      // Handle Firebase errors
      const firebaseError = err as { code?: string; message?: string };
      const errorCode = firebaseError?.code || '';
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (errorCode === 'auth/email-already-in-use') {
        setError('An account with this email already exists');
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

  // Handle demo login
  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    setError(null);

    const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL || 'demo@unscroll.app';
    const demoPassword = 'demo-password-123';

    try {
      let userCredential;

      try {
        // Try to sign in
        userCredential = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      } catch (signInError: unknown) {
        // If user doesn't exist, create it
        const fbError = signInError as { code?: string };
        if (fbError.code === 'auth/user-not-found' || fbError.code === 'auth/invalid-credential') {
          userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
        } else {
          throw signInError;
        }
      }

      // Get ID token and create server session
      const idToken = await userCredential.user.getIdToken();
      await setSessionAction(idToken);

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
    <div className="w-full max-w-md mx-auto">
      {/* Logo & Title */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl mb-6"
        >
          <Sparkles className="w-8 h-8 text-black" />
        </motion.div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
          Unscroll
        </h1>
        <p className="text-zinc-400 font-light">
          End the endless scrolling. Let fate decide.
        </p>
      </div>

      {/* Demo Button - For Recruiters */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleDemoLogin}
        disabled={isDemoLoading}
        className="w-full mb-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isDemoLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Try Demo</span>
            <span className="text-violet-200 text-sm ml-1">(No sign-up required)</span>
          </>
        )}
      </motion.button>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-zinc-950 text-zinc-500">or continue with email</span>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-zinc-900 rounded-xl p-1 mb-6">
        {(['login', 'register'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              mode === m
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {m === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        ))}
      </div>

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
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
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
            className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
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
            className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>

      {/* Footer */}
      <p className="text-center text-zinc-500 text-sm mt-8">
        By continuing, you agree to our{' '}
        <a href="#" className="text-amber-500 hover:underline">
          Terms
        </a>{' '}
        and{' '}
        <a href="#" className="text-amber-500 hover:underline">
          Privacy Policy
        </a>
      </p>
    </div>
  );
}
