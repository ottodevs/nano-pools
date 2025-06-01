/**
 * Connect button component with environment-aware authentication
 */

'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

interface ConnectButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export function ConnectButton({ 
  className, 
  variant = 'primary', 
  size = 'md' 
}: ConnectButtonProps) {
  const {
    isAuthenticated,
    isLoading,
    error,
    walletAddress,
    username,
    isWorldApp,
    isMiniKitAvailable,
    initializeAuth,
    authenticateWithMiniKit,
    logout,
    clearError
  } = useAuthStore();

  // Initialize authentication on component mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Handle authentication
  const handleConnect = async () => {
    clearError();
    
    if (isWorldApp || isMiniKitAvailable) {
      await authenticateWithMiniKit();
    } else {
      // Fallback for non-World App environments
      // You can implement other wallet connection methods here
      console.log('Fallback authentication not implemented yet');
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    logout();
  };

  // Button size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Button variant classes
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900'
  };

  // Format wallet address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isAuthenticated && walletAddress) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-end">
          {username && (
            <span className="text-sm font-medium text-gray-900">
              {username}
            </span>
          )}
          <span className="text-xs text-gray-500">
            {formatAddress(walletAddress)}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className={cn(
            'rounded-lg font-medium transition-colors',
            'bg-red-600 hover:bg-red-700 text-white',
            sizeClasses[size],
            className
          )}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className={cn(
          'rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Connecting...
          </span>
        ) : isWorldApp || isMiniKitAvailable ? (
          'Connect with World App'
        ) : (
          'Connect Wallet'
        )}
      </button>
      
      {error && (
        <div className="text-sm text-red-600 max-w-xs text-center">
          {error}
        </div>
      )}
      
      {/* Environment indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 text-center">
          {isWorldApp ? '🌍 World App' : isMiniKitAvailable ? '🔧 MiniKit Available' : '🌐 Browser'}
        </div>
      )}
    </div>
  );
}
