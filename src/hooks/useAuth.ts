'use client';

import { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isDemo: boolean;
  signOut: () => Promise<void>;
}

/**
 * Custom hook for authentication state
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if current user is demo
  const isDemo = user?.email === process.env.NEXT_PUBLIC_DEMO_EMAIL;

  // Sign out
  const handleSignOut = useCallback(async () => {
    await signOut(auth);
    // Also clear the server session
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    isLoading,
    isDemo,
    signOut: handleSignOut,
  };
}
