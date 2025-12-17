import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { email, username, idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Check if username is already taken
    const usernameSnapshot = await adminDb.collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();
    
    if (!usernameSnapshot.empty) {
      return NextResponse.json(
        { error: 'username_taken', message: 'Questo username è già in uso' },
        { status: 400 }
      );
    }

    // Check if email is already registered (in users collection)
    const emailSnapshot = await adminDb.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (!emailSnapshot.empty) {
      return NextResponse.json(
        { error: 'email_exists', message: 'È già presente un account con quest\'email, effettua il login' },
        { status: 400 }
      );
    }

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

    // Create session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { error: 'Failed to complete registration' },
      { status: 500 }
    );
  }
}
