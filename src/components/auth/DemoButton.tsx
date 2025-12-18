'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signInWithCustomToken, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

interface DemoButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function DemoButton({ className, children }: DemoButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Handle demo login via server API (password never exposed to client)
  const handleDemoLogin = async () => {
    setIsLoading(true);

    try {
      // Sign out any existing user first
      await signOut(auth);

      const response = await fetch('/api/auth/demo', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Demo login failed');
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
