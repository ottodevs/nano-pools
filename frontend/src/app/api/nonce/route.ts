/**
 * API endpoint for generating authentication nonces
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Generate a secure nonce (at least 8 alphanumeric characters)
    const nonce = crypto.randomUUID().replace(/-/g, '');

    // Store the nonce in a secure cookie
    // The nonce should be stored somewhere that is not tamperable by the client
    const cookieStore = await cookies();
    cookieStore.set('siwe-nonce', nonce, {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 60 * 10 // 10 minutes
    });

    return NextResponse.json({ nonce });

  } catch (error) {
    console.error('Error generating nonce:', error);
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    );
  }
}
