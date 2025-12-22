'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, Check, X } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithCustomToken,
  signOut,
  sendEmailVerification,
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
  const [password, setPassword] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const router = useRouter();

  // Handle resending verification email
  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    
    setIsResendingVerification(true);
    setError(null);
    
    try {
      const formElement = document.querySelector('form') as HTMLFormElement;
      const passwordInput = formElement?.querySelector('input[name="password"]') as HTMLInputElement;
      const passwordValue = passwordInput?.value;
      
      if (!passwordValue) {
        setError('Please enter your password to resend verification email.');
        setIsResendingVerification(false);
        return;
      }
      
      // Sign in temporarily to resend verification
      const userCredential = await signInWithEmailAndPassword(auth, unverifiedEmail, passwordValue);
      await sendEmailVerification(userCredential.user);
      await auth.signOut();
      
      setSuccessMessage('Verification email sent! Please check your inbox.');
      setUnverifiedEmail(null);
    } catch (err) {
      console.error('Resend verification error:', err);
      setError('Failed to resend verification email. Please check your password and try again.');
    } finally {
      setIsResendingVerification(false);
    }
  };

  // Password validation
  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  // Email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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
        setSuccessMessage('✉️ If an account exists with this email, a password reset link will be sent. Check your inbox (and spam folder).');
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
    setUnverifiedEmail(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const passwordValue = formData.get('password') as string;
    const username = formData.get('username') as string;

    // Validate email format
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    // Validate password requirements for registration
    if (mode === 'register' && !isPasswordValid) {
      setError('Password does not meet the requirements');
      setIsLoading(false);
      return;
    }

    try {
      let userCredential;

      if (mode === 'register') {
        // Create new user
        userCredential = await createUserWithEmailAndPassword(auth, email, passwordValue);
        
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
        
        // Send email verification
        await sendEmailVerification(userCredential.user);
        
        // Sign out after registration (user needs to verify email first)
        await auth.signOut();
        
        // Show success message and switch to login mode
        setSuccessMessage('Account created! Please check your email to verify your account before signing in.');
        setMode('login');
        setPassword(''); // Reset password field
        setIsLoading(false);
        return;
      } else {
        // Sign in existing user
        userCredential = await signInWithEmailAndPassword(auth, email, passwordValue);
        
        // Check if email is verified
        if (!userCredential.user.emailVerified) {
          await auth.signOut();
          setUnverifiedEmail(email);
          setError('Please verify your email before signing in.');
          setIsLoading(false);
          return;
        }
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
      } else if (
        errorCode === 'auth/user-not-found' || 
        errorCode === 'auth/wrong-password' ||
        errorCode === 'auth/invalid-credential'
      ) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (errorCode === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in.');
        setMode('login'); // Switch to login mode
      } else if (errorCode === 'auth/weak-password') {
        setError('Password must be at least 6 characters');
      } else if (errorCode === 'auth/invalid-email') {
        setError('Please enter a valid email address');
      } else if (errorCode === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later or reset your password.');
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
      // Sign out any existing user first
      await signOut(auth);

      const response = await fetch('/api/auth/demo', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Demo login failed');
      }

      const data = await response.json();
      
      // Sign in with custom token on client-side Firebase
      if (data.customToken) {
        await signInWithCustomToken(auth, data.customToken);
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
      {/* Back to Home - Glass style */}
      <Link 
        href="/"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-400 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      {/* Logo & Title - Ethereal */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)] border border-red-500/30"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-10 h-10 text-amber-400"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
        </motion.div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
          <span className="gold-shimmer">Unscroll</span>
        </h1>
        <p className="text-zinc-400 font-light">
          🍿 Your cinema experience awaits
        </p>
      </div>

      {/* Demo Button - Glass style */}
      {mode !== 'forgot' && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleDemoLogin}
          disabled={isDemoLoading}
          className="w-full mb-6 py-4 bg-gradient-to-b from-violet-500 to-purple-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_25px_rgba(139,92,246,0.25)]"
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

      {/* Divider - Subtle */}
      {mode !== 'forgot' && (
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.06]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-transparent text-zinc-600">or continue with email</span>
          </div>
        </div>
      )}

      {/* Mode Toggle - Glass style */}
      {mode !== 'forgot' && (
        <div className="flex glass rounded-xl p-1 mb-6">
          {(['login', 'register'] as const).map((m) => (
            <motion.button
              key={m}
              onClick={() => setMode(m)}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                mode === m
                  ? 'bg-gradient-to-b from-red-500 to-red-700 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {m === 'login' ? '🎬 Sign In' : '🎟️ Create Account'}
            </motion.button>
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

      {/* Success Message - Ethereal */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
          >
            <p className="text-emerald-400 text-sm">{successMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message - Ethereal */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
          >
            <p className="text-red-400 text-sm">{error}</p>
            {/* Resend Verification Button */}
            {unverifiedEmail && (
              <motion.button
                type="button"
                onClick={handleResendVerification}
                disabled={isResendingVerification}
                whileTap={{ scale: 0.98 }}
                className="mt-3 w-full py-2.5 px-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isResendingVerification ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send verification email again
                  </>
                )}
              </motion.button>
            )}
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
              className="input-ethereal w-full pl-12 pr-4 py-3.5 text-white placeholder:text-zinc-600"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-b from-red-500 to-red-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(239,68,68,0.2)] glow-red"
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
            className="w-full text-center text-sm text-zinc-500 hover:text-amber-400 transition-colors mt-4"
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
                    className="input-ethereal w-full pl-12 pr-4 py-3.5 text-white placeholder:text-zinc-600"
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
            className="input-ethereal w-full pl-12 pr-4 py-3.5 text-white placeholder:text-zinc-600"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            minLength={mode === 'register' ? 8 : 6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-ethereal w-full pl-12 pr-4 py-3.5 text-white placeholder:text-zinc-600"
          />
        </div>

        {/* Password Requirements - Glass style */}
        {mode === 'register' && password.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 gap-2 text-xs glass rounded-xl p-3"
          >
            <div className={`flex items-center gap-1.5 ${passwordRequirements.minLength ? 'text-emerald-400' : 'text-zinc-600'}`}>
              {passwordRequirements.minLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              8+ characters
            </div>
            <div className={`flex items-center gap-1.5 ${passwordRequirements.hasUppercase ? 'text-emerald-400' : 'text-zinc-600'}`}>
              {passwordRequirements.hasUppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              Uppercase letter
            </div>
            <div className={`flex items-center gap-1.5 ${passwordRequirements.hasLowercase ? 'text-emerald-400' : 'text-zinc-600'}`}>
              {passwordRequirements.hasLowercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              Lowercase letter
            </div>
            <div className={`flex items-center gap-1.5 ${passwordRequirements.hasNumber ? 'text-emerald-400' : 'text-zinc-600'}`}>
              {passwordRequirements.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              Number
            </div>
          </motion.div>
        )}

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
              className="text-sm text-zinc-500 hover:text-amber-400 transition-colors"
            >
              Forgot password?
            </button>
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-gradient-to-b from-red-500 to-red-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(239,68,68,0.2)] glow-red"
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
