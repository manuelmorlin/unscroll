import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

// Firebase REST API for authentication
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export async function POST() {
  try {
    const demoEmail = process.env.DEMO_USER_EMAIL || 'demo@unscroll.app';
    const demoPassword = process.env.DEMO_USER_PASSWORD;

    if (!demoPassword) {
      return NextResponse.json(
        { error: 'Demo mode is not configured' },
        { status: 500 }
      );
    }

    if (!FIREBASE_API_KEY) {
      return NextResponse.json(
        { error: 'Firebase not configured' },
        { status: 500 }
      );
    }

    // Try to sign in using Firebase REST API
    let idToken: string;
    let localId: string;

    try {
      const signInResponse = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: demoEmail,
            password: demoPassword,
            returnSecureToken: true,
          }),
        }
      );

      const signInData = await signInResponse.json();

      if (signInData.error) {
        // User doesn't exist or credentials are invalid
        if (signInData.error.message === 'EMAIL_NOT_FOUND' || 
            signInData.error.message === 'INVALID_LOGIN_CREDENTIALS') {
          
          // Check if user exists but has wrong password
          let existingUser = null;
          try {
            existingUser = await adminAuth.getUserByEmail(demoEmail);
          } catch {
            // User doesn't exist, we'll create it
          }

          if (existingUser) {
            // User exists but password is wrong - update password
            await adminAuth.updateUser(existingUser.uid, {
              password: demoPassword,
            });
          } else {
            // Create user with Admin SDK
            const newUser = await adminAuth.createUser({
              email: demoEmail,
              password: demoPassword,
              displayName: 'demo',
              emailVerified: true,
            });

            // Create user profile in Firestore
            await adminDb.collection('users').doc(newUser.uid).set({
              id: newUser.uid,
              email: demoEmail,
              username: 'demo',
              isDemo: true,
              createdAt: new Date().toISOString(),
            });
          }

          // Sign in the user (newly created or password updated)
          const newSignInResponse = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: demoEmail,
                password: demoPassword,
                returnSecureToken: true,
              }),
            }
          );

          const newSignInData = await newSignInResponse.json();
          if (newSignInData.error) {
            throw new Error(newSignInData.error.message);
          }

          idToken = newSignInData.idToken;
          localId = newSignInData.localId;
        } else {
          throw new Error(signInData.error.message);
        }
      } else {
        idToken = signInData.idToken;
        localId = signInData.localId;
      }
    } catch (authError) {
      console.error('Demo auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Create session cookie
    const cookieStore = await cookies();
    const expiresIn = 60 * 60 * 24 * 5; // 5 days

    cookieStore.set('session', idToken, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    cookieStore.set('userId', localId, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    // Create a custom token for client-side Firebase auth
    const customToken = await adminAuth.createCustomToken(localId);

    return NextResponse.json({ success: true, customToken });
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json(
      { error: 'Demo login failed' },
      { status: 500 }
    );
  }
}
