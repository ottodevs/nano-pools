/**
 * MiniKit configuration and initialization
 */

import { MiniKit } from '@worldcoin/minikit-js';
import { getEnvironmentInfo, waitForMiniKit } from './environment';

export interface MiniKitState {
  isInitialized: boolean;
  isInstalled: boolean;
  walletAddress?: string;
  username?: string;
  error?: string;
}

/**
 * MiniKit configuration
 */
export const miniKitConfig = {
  app_id: process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID || 'app_staging_default',
  // Add other configuration options as needed
};

/**
 * Initialize MiniKit with proper error handling
 */
export async function initializeMiniKit(): Promise<MiniKitState> {
  try {
    const envInfo = getEnvironmentInfo();

    // If not in World App environment, return early
    if (!envInfo.isWorldApp && !envInfo.isMiniKitAvailable) {
      return {
        isInitialized: false,
        isInstalled: false,
        error: 'Not running in World App environment'
      };
    }

    // Wait for MiniKit to be available
    const miniKitAvailable = await waitForMiniKit(5000);

    if (!miniKitAvailable) {
      return {
        isInitialized: false,
        isInstalled: false,
        error: 'MiniKit not available after timeout'
      };
    }

    // Check if MiniKit is installed
    const isInstalled = MiniKit.isInstalled();

    if (!isInstalled) {
      return {
        isInitialized: false,
        isInstalled: false,
        error: 'MiniKit not installed'
      };
    }

    // Initialize MiniKit
    // Note: MiniKit initialization is typically automatic, but we can add custom logic here

    return {
      isInitialized: true,
      isInstalled: true,
      // Note: walletAddress and username are available after authentication
      walletAddress: undefined,
      username: undefined
    };

  } catch (error) {
    console.error('Failed to initialize MiniKit:', error);
    return {
      isInitialized: false,
      isInstalled: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check MiniKit installation status
 */
export function checkMiniKitInstallation(): boolean {
  try {
    return MiniKit.isInstalled();
  } catch (error) {
    console.error('Error checking MiniKit installation:', error);
    return false;
  }
}

/**
 * Get current wallet address from MiniKit
 */
export function getMiniKitWalletAddress(): string | undefined {
  try {
    // Note: walletAddress is available after successful authentication
    return (MiniKit as unknown as { walletAddress?: string }).walletAddress;
  } catch (error) {
    console.error('Error getting wallet address:', error);
    return undefined;
  }
}

/**
 * Get current username from MiniKit
 */
export function getMiniKitUsername(): string | undefined {
  try {
    // Note: user info is available after successful authentication
    return (MiniKit as unknown as { user?: { username?: string } }).user?.username;
  } catch (error) {
    console.error('Error getting username:', error);
    return undefined;
  }
}
