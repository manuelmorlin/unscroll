'use client';

import { useActionState, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import {
  loginAction,
  registerAction,
  demoLoginAction,
  type AuthActionResult,
} from '@/lib/actions/auth';

type AuthMode = 'login' | 'register';

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  // Form actions
  const [loginState, loginFormAction, isLoginPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(loginAction, null);

  const [registerState, registerFormAction, isRegisterPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(registerAction, null);

  const isPending = isLoginPending || isRegisterPending;
  const state = mode === 'login' ? loginState : registerState;
  const formAction = mode === 'login' ? loginFormAction : registerFormAction;

  // Handle demo login
  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    await demoLoginAction();
    setIsDemoLoading(false);
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
        {state?.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <p className="text-red-400 text-sm">{state.error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <form action={formAction} className="space-y-4">
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
          disabled={isPending}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isPending ? (
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
