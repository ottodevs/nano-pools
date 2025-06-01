/**
 * API endpoint for completing SIWE authentication
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { MiniAppWalletAuthSuccessPayload, verifySiweMessage } from '@worldcoin/minikit-js';

interface RequestPayload {
  payload: MiniAppWalletAuthSuccessPayload;
  nonce: string;
}

export async function POST(req: NextRequest) {
  try {
    const { payload, nonce } = (await req.json()) as RequestPayload;
    
    // Verify the nonce matches what we stored
    const cookieStore = await cookies();
    const storedNonce = cookieStore.get('siwe-nonce')?.value;
    
    if (!storedNonce || nonce !== storedNonce) {
      return NextResponse.json({
        status: 'error',
        isValid: false,
        message: 'Invalid nonce'
      }, { status: 400 });
    }
    
    // Clear the nonce cookie after use
    cookieStore.delete('siwe-nonce');
    
    // Verify the SIWE message signature
    const validMessage = await verifySiweMessage(payload, nonce);
    
    if (!validMessage.isValid) {
      return NextResponse.json({
        status: 'error',
        isValid: false,
        message: 'Invalid signature'
      }, { status: 400 });
    }
    
    // Optional: Store authentication session
    // You can implement session management here
    
    return NextResponse.json({
      status: 'success',
      isValid: true,
      address: payload.address
    });
    
  } catch (error) {
    console.error('Error verifying SIWE message:', error);
    return NextResponse.json({
      status: 'error',
      isValid: false,
      message: error instanceof Error ? error.message : 'Verification failed'
    }, { status: 500 });
  }
}
