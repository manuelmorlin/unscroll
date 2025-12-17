'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { setSessionAction } from '@/lib/actions/auth';
import { useRouter } from 'next/navigation';

interface DemoButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function DemoButton({ className, children }: DemoButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDemoLogin = async () => {
    setIsLoading(true);

    const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL || 'demo@unscroll.app';
    const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD || '';

    try {
      let userCredential;

      try {
        // Try to sign in
        userCredential = await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
        // Ensure displayName is 'demo' for existing demo accounts
        if (userCredential.user.displayName !== 'demo') {
          await updateProfile(userCredential.user, { displayName: 'demo' });
        }
      } catch (signInError: unknown) {
        // If user doesn't exist, create it
        const fbError = signInError as { code?: string };
        if (fbError.code === 'auth/user-not-found' || fbError.code === 'auth/invalid-credential') {
          userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
          // Set displayName to 'demo' for new demo accounts
          await updateProfile(userCredential.user, {
            displayName: 'demo',
          });
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
      // Redirect to auth page on error
      router.push('/auth?mode=login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDemoLogin}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        children || <span>🎬 Watch Demo</span>
      )}
    </button>
  );
}
