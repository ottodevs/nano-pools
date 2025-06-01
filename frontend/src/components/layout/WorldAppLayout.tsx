/**
 * Layout component optimized for World App webview
 */

'use client';

import { useEffect, useState } from 'react';
import { getEnvironmentInfo } from '@/lib/environment';
import { ConnectButton } from '@/components/auth/ConnectButton';

interface WorldAppLayoutProps {
  children: React.ReactNode;
}

export function WorldAppLayout({ children }: WorldAppLayoutProps) {
  const [envInfo, setEnvInfo] = useState<{
    isWorldApp: boolean;
    isMiniKitAvailable: boolean;
    platform: 'world-app' | 'browser' | 'unknown';
  }>({
    isWorldApp: false,
    isMiniKitAvailable: false,
    platform: 'unknown'
  });

  useEffect(() => {
    const info = getEnvironmentInfo();
    setEnvInfo(info);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header optimized for World App */}
      <header className={`
        bg-white shadow-sm border-b border-gray-200
        ${envInfo.isWorldApp ? 'pt-safe-top' : 'pt-4'}
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Pool Payments
              </h1>
              {envInfo.isWorldApp && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  World App
                </span>
              )}
            </div>

            <ConnectButton size="sm" />
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className={`
        flex-1
        ${envInfo.isWorldApp ? 'pb-safe-bottom' : 'pb-4'}
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* World App specific footer */}
      {envInfo.isWorldApp && (
        <footer className="bg-white border-t border-gray-200 pb-safe-bottom">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="text-center text-sm text-gray-500">
              Running in World App
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
