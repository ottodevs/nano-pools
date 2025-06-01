/**
 * Authentication state management using Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MiniKit, WalletAuthInput, MiniAppWalletAuthSuccessPayload } from '@worldcoin/minikit-js';
import { getEnvironmentInfo } from '@/lib/environment';
import { initializeMiniKit, MiniKitState, getMiniKitWalletAddress, getMiniKitUsername } from '@/lib/minikit';

export interface AuthState {
  // Authentication status
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // User information
  walletAddress: string | null;
  username: string | null;

  // MiniKit state
  miniKitState: MiniKitState | null;

  // Environment info
  isWorldApp: boolean;
  isMiniKitAvailable: boolean;

  // Actions
  initializeAuth: () => Promise<void>;
  authenticateWithMiniKit: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      isLoading: false,
      error: null,
      walletAddress: null,
      username: null,
      miniKitState: null,
      isWorldApp: false,
      isMiniKitAvailable: false,

      // Initialize authentication system
      initializeAuth: async () => {
        set({ isLoading: true, error: null });

        try {
          // Get environment information
          const envInfo = getEnvironmentInfo();

          // Initialize MiniKit if in World App
          let miniKitState: MiniKitState | null = null;
          if (envInfo.isWorldApp || envInfo.isMiniKitAvailable) {
            miniKitState = await initializeMiniKit();
          }

          set({
            isWorldApp: envInfo.isWorldApp,
            isMiniKitAvailable: envInfo.isMiniKitAvailable,
            miniKitState,
            isLoading: false
          });

          // Check if already authenticated in MiniKit
          const currentWalletAddress = getMiniKitWalletAddress();
          const currentUsername = getMiniKitUsername();

          if (currentWalletAddress) {
            set({
              isAuthenticated: true,
              walletAddress: currentWalletAddress,
              username: currentUsername || null
            });
          }

        } catch (error) {
          console.error('Failed to initialize auth:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to initialize authentication',
            isLoading: false
          });
        }
      },

      // Authenticate using MiniKit wallet auth
      authenticateWithMiniKit: async () => {
        const { miniKitState, isWorldApp, isMiniKitAvailable } = get();

        if (!isWorldApp && !isMiniKitAvailable) {
          set({ error: 'MiniKit not available in this environment' });
          return;
        }

        if (!miniKitState?.isInstalled) {
          set({ error: 'MiniKit not installed' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Generate nonce from backend
          const nonceResponse = await fetch('/api/nonce');
          if (!nonceResponse.ok) {
            throw new Error('Failed to generate nonce');
          }
          const { nonce } = await nonceResponse.json();

          // Prepare wallet auth input
          const walletAuthInput: WalletAuthInput = {
            nonce,
            requestId: crypto.randomUUID(),
            expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            statement: 'Sign in to Pool Payments Protocol'
          };

          // Execute wallet authentication
          const { finalPayload } = await MiniKit.commandsAsync.walletAuth(walletAuthInput);

          if (finalPayload.status === 'error') {
            throw new Error('Authentication failed');
          }

          // Verify the authentication on the backend
          const verifyResponse = await fetch('/api/complete-siwe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              payload: finalPayload,
              nonce
            })
          });

          if (!verifyResponse.ok) {
            throw new Error('Failed to verify authentication');
          }

          const verifyResult = await verifyResponse.json();

          if (!verifyResult.isValid) {
            throw new Error('Invalid authentication signature');
          }

          // Update state with successful authentication
          const successPayload = finalPayload as MiniAppWalletAuthSuccessPayload;
          set({
            isAuthenticated: true,
            walletAddress: successPayload.address,
            username: getMiniKitUsername() || null,
            isLoading: false,
            error: null
          });

        } catch (error) {
          console.error('MiniKit authentication failed:', error);
          set({
            error: error instanceof Error ? error.message : 'Authentication failed',
            isLoading: false
          });
        }
      },

      // Logout user
      logout: () => {
        set({
          isAuthenticated: false,
          walletAddress: null,
          username: null,
          error: null
        });
      },

      // Clear error state
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        walletAddress: state.walletAddress,
        username: state.username
      })
    }
  )
);
