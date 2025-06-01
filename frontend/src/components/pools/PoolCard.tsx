/**
 * Pool card component for displaying pool information
 */

'use client';

import { useState } from 'react';
import { formatEther, parseEther } from 'viem';
import { Pool, getPoolStatus, getPoolProgress, formatPoolDeadline, getTimeRemaining, PoolStatus } from '@/lib/contracts';
import { useContributeToPool, useUserContribution, usePoolActions } from '@/hooks/useNanoPool';
import { useAuthStore } from '@/store/auth';
import { defaultChainId } from '@/lib/viem';

interface PoolCardProps {
  pool: Pool;
  onUpdate?: () => void;
}

export function PoolCard({ pool, onUpdate }: PoolCardProps) {
  const [contributionAmount, setContributionAmount] = useState('');
  const [showContributeForm, setShowContributeForm] = useState(false);
  
  const { contribute, loading: contributing } = useContributeToPool(defaultChainId);
  const { contribution: userContribution } = useUserContribution(pool.id, defaultChainId);
  const { disburseFunds, claimRefund, loading: actionLoading } = usePoolActions(defaultChainId);
  const { walletAddress, isAuthenticated } = useAuthStore();

  const status = getPoolStatus(pool);
  const progress = getPoolProgress(pool);
  const timeRemaining = getTimeRemaining(pool.deadlineTimestamp);

  // Status styling
  const getStatusColor = (status: PoolStatus) => {
    switch (status) {
      case PoolStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case PoolStatus.GOAL_ACHIEVED:
        return 'bg-blue-100 text-blue-800';
      case PoolStatus.EXPIRED:
        return 'bg-red-100 text-red-800';
      case PoolStatus.DISBURSED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleContribute = async () => {
    if (!contributionAmount || !isAuthenticated) return;

    try {
      const amount = parseEther(contributionAmount);
      await contribute({ poolId: pool.id, amount });
      setContributionAmount('');
      setShowContributeForm(false);
      onUpdate?.();
    } catch (err) {
      console.error('Contribution failed:', err);
    }
  };

  const handleDisburse = async () => {
    try {
      await disburseFunds(pool.id);
      onUpdate?.();
    } catch (err) {
      console.error('Disbursement failed:', err);
    }
  };

  const handleRefund = async () => {
    try {
      await claimRefund(pool.id);
      onUpdate?.();
    } catch (err) {
      console.error('Refund failed:', err);
    }
  };

  const canContribute = status === PoolStatus.ACTIVE && isAuthenticated;
  const canDisburse = status === PoolStatus.GOAL_ACHIEVED && 
                     isAuthenticated && 
                     walletAddress?.toLowerCase() === pool.initiator.toLowerCase();
  const canRefund = status === PoolStatus.EXPIRED && 
                   userContribution > 0n && 
                   !pool.fundsDisbursed;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Pool #{pool.id}
          </h3>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <div className="text-right text-sm text-gray-500">
          <div>Deadline: {formatPoolDeadline(pool.deadlineTimestamp)}</div>
          <div className="font-medium">{timeRemaining}</div>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-700 mb-4 line-clamp-3">{pool.description}</p>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-1">
          <span>{formatEther(pool.currentAmount)} ETH raised</span>
          <span>{formatEther(pool.goalAmount)} ETH goal</span>
        </div>
      </div>

      {/* Contributors */}
      <div className="mb-4 text-sm text-gray-600">
        <span>{pool.contributors?.length || 0} contributors</span>
        {userContribution > 0n && (
          <span className="ml-4 text-blue-600 font-medium">
            Your contribution: {formatEther(userContribution)} ETH
          </span>
        )}
      </div>

      {/* Beneficiary */}
      <div className="mb-4 text-sm text-gray-600">
        <span>Beneficiary: </span>
        <span className="font-mono text-xs">
          {pool.beneficiary.slice(0, 6)}...{pool.beneficiary.slice(-4)}
        </span>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Contribute */}
        {canContribute && (
          <div>
            {!showContributeForm ? (
              <button
                onClick={() => setShowContributeForm(true)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Contribute to Pool
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    placeholder="Amount in ETH"
                    step="0.001"
                    min="0"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleContribute}
                    disabled={contributing || !contributionAmount}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {contributing ? 'Contributing...' : 'Contribute'}
                  </button>
                </div>
                <button
                  onClick={() => setShowContributeForm(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Disburse Funds */}
        {canDisburse && (
          <button
            onClick={handleDisburse}
            disabled={actionLoading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {actionLoading ? 'Disbursing...' : 'Disburse Funds'}
          </button>
        )}

        {/* Claim Refund */}
        {canRefund && (
          <button
            onClick={handleRefund}
            disabled={actionLoading}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          >
            {actionLoading ? 'Claiming...' : 'Claim Refund'}
          </button>
        )}

        {/* Connect Wallet Message */}
        {!isAuthenticated && status === PoolStatus.ACTIVE && (
          <div className="text-center text-sm text-gray-500 py-2">
            Connect your wallet to contribute
          </div>
        )}
      </div>
    </div>
  );
}
