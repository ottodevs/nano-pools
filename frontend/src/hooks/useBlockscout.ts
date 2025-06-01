/**
 * Blockscout integration hook for transaction monitoring and Merit rewards
 */

import { useState, useCallback } from 'react';
import { getChainConfig } from '@/lib/viem';

// Merit rewards configuration
const MERIT_REWARDS = {
  create: 20,
  contribute: 5,
  withdraw: 2,
  complete: 15,
} as const;

export type TransactionType = keyof typeof MERIT_REWARDS;

interface BlockscoutTransaction {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  explorerUrl: string;
}

interface MeritReward {
  type: TransactionType;
  amount: number;
  transactionHash: string;
  timestamp: number;
}

export function useBlockscout(chainId: number) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [merits, setMerits] = useState<MeritReward[]>([]);

  const chainConfig = getChainConfig(chainId);

  // Monitor transaction and award merits
  const monitorTransaction = useCallback(async (
    transactionHash: string,
    type: TransactionType,
    amount?: string,
    poolId?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Get transaction details from Blockscout API
      const response = await fetch(
        `${chainConfig.blockscoutApiUrl}/transactions/${transactionHash}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transaction details');
      }

      const transactionData = await response.json();

      const blockscoutTx: BlockscoutTransaction = {
        hash: transactionHash,
        status: transactionData.status === '1' ? 'success' : 
                transactionData.status === '0' ? 'failed' : 'pending',
        blockNumber: transactionData.block_number ? parseInt(transactionData.block_number) : undefined,
        gasUsed: transactionData.gas_used,
        explorerUrl: `${chainConfig.explorerUrl}/tx/${transactionHash}`,
      };

      // Award merits for successful transactions
      if (blockscoutTx.status === 'success') {
        const meritReward: MeritReward = {
          type,
          amount: MERIT_REWARDS[type],
          transactionHash,
          timestamp: Date.now(),
        };

        setMerits(prev => [...prev, meritReward]);

        // Log merit award (in a real app, this would be sent to a backend)
        console.log(`🏆 Merit Reward Awarded: ${meritReward.amount} points for ${type}`, {
          transactionHash,
          poolId,
          amount,
          explorerUrl: blockscoutTx.explorerUrl,
        });
      }

      return blockscoutTx;
    } catch (err) {
      console.error('Error monitoring transaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to monitor transaction');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [chainConfig]);

  // Get transaction status
  const getTransactionStatus = useCallback(async (transactionHash: string) => {
    try {
      const response = await fetch(
        `${chainConfig.blockscoutApiUrl}/transactions/${transactionHash}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transaction status');
      }

      const data = await response.json();
      return {
        hash: transactionHash,
        status: data.status === '1' ? 'success' : 
                data.status === '0' ? 'failed' : 'pending',
        blockNumber: data.block_number ? parseInt(data.block_number) : undefined,
        explorerUrl: `${chainConfig.explorerUrl}/tx/${transactionHash}`,
      };
    } catch (err) {
      console.error('Error fetching transaction status:', err);
      throw err;
    }
  }, [chainConfig]);

  // Get address information
  const getAddressInfo = useCallback(async (address: string) => {
    try {
      const response = await fetch(
        `${chainConfig.blockscoutApiUrl}/addresses/${address}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch address information');
      }

      const data = await response.json();
      return {
        address,
        balance: data.coin_balance,
        transactionCount: data.transactions_count,
        explorerUrl: `${chainConfig.explorerUrl}/address/${address}`,
      };
    } catch (err) {
      console.error('Error fetching address info:', err);
      throw err;
    }
  }, [chainConfig]);

  // Get contract information
  const getContractInfo = useCallback(async (contractAddress: string) => {
    try {
      const response = await fetch(
        `${chainConfig.blockscoutApiUrl}/smart-contracts/${contractAddress}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch contract information');
      }

      const data = await response.json();
      return {
        address: contractAddress,
        name: data.name,
        verified: data.is_verified,
        explorerUrl: `${chainConfig.explorerUrl}/address/${contractAddress}`,
      };
    } catch (err) {
      console.error('Error fetching contract info:', err);
      throw err;
    }
  }, [chainConfig]);

  // Get total merits earned
  const getTotalMerits = useCallback(() => {
    return merits.reduce((total, merit) => total + merit.amount, 0);
  }, [merits]);

  // Get merits by type
  const getMeritsByType = useCallback((type: TransactionType) => {
    return merits.filter(merit => merit.type === type);
  }, [merits]);

  // Clear merits (for testing or reset)
  const clearMerits = useCallback(() => {
    setMerits([]);
  }, []);

  return {
    // State
    loading,
    error,
    merits,

    // Actions
    monitorTransaction,
    getTransactionStatus,
    getAddressInfo,
    getContractInfo,

    // Merit utilities
    getTotalMerits,
    getMeritsByType,
    clearMerits,

    // Constants
    MERIT_REWARDS,
  };
}

// Hook for real-time transaction monitoring
export function useTransactionMonitor(chainId: number) {
  const [transactions, setTransactions] = useState<Map<string, BlockscoutTransaction>>(new Map());
  const { getTransactionStatus } = useBlockscout(chainId);

  const addTransaction = useCallback((hash: string) => {
    setTransactions(prev => new Map(prev.set(hash, {
      hash,
      status: 'pending',
      explorerUrl: `${getChainConfig(chainId).explorerUrl}/tx/${hash}`,
    })));

    // Start monitoring
    const checkStatus = async () => {
      try {
        const status = await getTransactionStatus(hash);
        setTransactions(prev => new Map(prev.set(hash, status)));

        // Continue monitoring if still pending
        if (status.status === 'pending') {
          setTimeout(checkStatus, 5000); // Check every 5 seconds
        }
      } catch (error) {
        console.error('Error checking transaction status:', error);
      }
    };

    checkStatus();
  }, [getTransactionStatus, chainId]);

  const removeTransaction = useCallback((hash: string) => {
    setTransactions(prev => {
      const newMap = new Map(prev);
      newMap.delete(hash);
      return newMap;
    });
  }, []);

  const getTransaction = useCallback((hash: string) => {
    return transactions.get(hash);
  }, [transactions]);

  return {
    transactions: Array.from(transactions.values()),
    addTransaction,
    removeTransaction,
    getTransaction,
  };
}
