'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { z } from 'zod';

// ==============================================
// VALIDATION SCHEMAS
// ==============================================

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = authSchema.extend({
  username: z.string().min(3, 'Username must be at least 3 characters'),
});

// ==============================================
// TYPES
// ==============================================

export interface AuthActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

// ==============================================
// HELPER: Create session cookie
// ==============================================

async function createSessionCookie(idToken: string) {
  // Verify the ID token first
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  
  // Store token info in a simple cookie (not a Firebase session cookie)
  // This is simpler and doesn't require special project setup
  const cookieStore = await cookies();
  const expiresIn = 60 * 60 * 24 * 5; // 5 days in seconds
  
  cookieStore.set('session', idToken, {
    maxAge: expiresIn,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });
  
  // Store user ID separately for quick access
  cookieStore.set('userId', decodedToken.uid, {
    maxAge: expiresIn,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });
}

// ==============================================
// GET CURRENT USER (Server-side)
// ==============================================

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const userId = cookieStore.get('userId')?.value;

  if (!sessionToken || !userId) {
    return null;
  }

  try {
    // Verify the token is still valid
    const decodedToken = await adminAuth.verifyIdToken(sessionToken);
    return {
      id: decodedToken.uid,
      email: decodedToken.email,
      username: decodedToken.name || decodedToken.email?.split('@')[0],
      isDemo: decodedToken.email === process.env.DEMO_USER_EMAIL,
    };
  } catch {
    // Token expired or invalid - return null (don't try to modify cookies here)
    return null;
  }
}

// ==============================================
// LOGIN ACTION
// ==============================================

export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const validationResult = authSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.issues[0].message,
    };
  }

  const idToken = formData.get('idToken') as string;

  if (!idToken) {
    return {
      success: false,
      error: 'Authentication failed. Please try again.',
    };
  }

  try {
    await createSessionCookie(idToken);
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Failed to create session. Please try again.',
    };
  }

  revalidatePath('/', 'layout');
  redirect('/app');
}

// ==============================================
// REGISTER ACTION
// ==============================================

export async function registerAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const validationResult = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    username: formData.get('username'),
  });

  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.issues[0].message,
    };
  }

  const { email, username } = validationResult.data;
  const idToken = formData.get('idToken') as string;

  if (!idToken) {
    return {
      success: false,
      error: 'Authentication failed. Please try again.',
    };
  }

  try {
    // Verify the token and get the user
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Update user profile with username
    await adminAuth.updateUser(decodedToken.uid, {
      displayName: username,
    });

    // Create user document in Firestore
    await adminDb.collection('users').doc(decodedToken.uid).set({
      email,
      username,
      isDemo: false,
      createdAt: new Date().toISOString(),
    });

    await createSessionCookie(idToken);
  } catch (error) {
    console.error('Register error:', error);
    return {
      success: false,
      error: 'Failed to complete registration. Please try again.',
    };
  }

  revalidatePath('/', 'layout');
  redirect('/app');
}

// ==============================================
// DEMO LOGIN ACTION
// ==============================================

export async function demoLoginAction(): Promise<AuthActionResult> {
  const demoEmail = process.env.DEMO_USER_EMAIL;
  const demoPassword = process.env.DEMO_USER_PASSWORD;

  if (!demoEmail || !demoPassword) {
    return {
      success: false,
      error: 'Demo mode is not configured. Please contact support.',
    };
  }

  // Demo login is handled client-side, this is just a placeholder
  // The actual Firebase auth happens in the client component
  return {
    success: true,
    message: 'Demo login initiated',
  };
}

// ==============================================
// LOGOUT ACTION
// ==============================================

export async function logoutAction(): Promise<AuthActionResult> {
  const cookieStore = await cookies();
  
  // Clear the session cookie
  cookieStore.delete('session');

  revalidatePath('/', 'layout');
  redirect('/auth');
}

// ==============================================
// SET SESSION (called from client after Firebase auth)
// ==============================================

export async function setSessionAction(idToken: string): Promise<AuthActionResult> {
  try {
    await createSessionCookie(idToken);
    return { success: true };
  } catch (error) {
    console.error('Set session error:', error);
    return {
      success: false,
      error: 'Failed to create session',
    };
  }
}
