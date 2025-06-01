/**
 * Environment detection utilities for World App and MiniKit integration
 */

export interface EnvironmentInfo {
  isWorldApp: boolean;
  isMiniKitAvailable: boolean;
  userAgent: string;
  platform: 'world-app' | 'browser' | 'unknown';
}

/**
 * Detects if the app is running inside World App webview
 */
export function isWorldApp(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent.toLowerCase();

  // Check for World App specific user agent patterns
  const worldAppPatterns = [
    'worldapp',
    'world app',
    'minikit',
    'worldcoin'
  ];

  return worldAppPatterns.some(pattern => userAgent.includes(pattern));
}

/**
 * Checks if MiniKit is available in the current environment
 */
export function isMiniKitAvailable(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if MiniKit is available on the window object
  return !!(window as unknown as { MiniKit?: unknown }).MiniKit || !!(window as unknown as { WorldApp?: unknown }).WorldApp;
}

/**
 * Gets comprehensive environment information
 */
export function getEnvironmentInfo(): EnvironmentInfo {
  if (typeof window === 'undefined') {
    return {
      isWorldApp: false,
      isMiniKitAvailable: false,
      userAgent: '',
      platform: 'unknown'
    };
  }

  const userAgent = window.navigator.userAgent;
  const isWorldAppEnv = isWorldApp();
  const isMiniKitAvail = isMiniKitAvailable();

  let platform: 'world-app' | 'browser' | 'unknown' = 'unknown';

  if (isWorldAppEnv || isMiniKitAvail) {
    platform = 'world-app';
  } else if (typeof window !== 'undefined') {
    platform = 'browser';
  }

  return {
    isWorldApp: isWorldAppEnv,
    isMiniKitAvailable: isMiniKitAvail,
    userAgent,
    platform
  };
}

/**
 * Waits for MiniKit to become available (useful for initialization)
 */
export function waitForMiniKit(timeout: number = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isMiniKitAvailable()) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isMiniKitAvailable()) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 100);
  });
}

/**
 * Debug function to log environment information
 */
export function logEnvironmentInfo(): void {
  if (typeof window === 'undefined') return;

  const info = getEnvironmentInfo();
  console.log('Environment Info:', {
    ...info,
    windowMiniKit: !!(window as unknown as { MiniKit?: unknown }).MiniKit,
    windowWorldApp: !!(window as unknown as { WorldApp?: unknown }).WorldApp,
    href: window.location.href
  });
}
