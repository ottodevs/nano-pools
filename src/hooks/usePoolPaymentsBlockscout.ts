/**
 * Pool Payments Blockscout Integration Hook
 * Combines pool contract interactions with Blockscout monitoring and Merits rewards
 */

import { useState, useEffect, useCallback } from 'react';
import { BlockscoutService, TransactionInfo } from '../services/BlockscoutService';

interface PoolPaymentsBlockscoutConfig {
  networkKey: string;
  userId?: string;
  apiKey?: string;
  contractAddress?: string;
}

interface PoolTransaction {
  hash: string;
  type: 'create' | 'contribute' | 'withdraw' | 'complete';
  amount?: string;
  poolId?: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockscoutInfo?: TransactionInfo;
  meritsAwarded?: number;
}

interface PoolStats {
  totalPools: number;
  totalContributions: number;
  totalValue: string;
  userMerits: number;
}

export const usePoolPaymentsBlockscout = (config: PoolPaymentsBlockscoutConfig) => {
  const [blockscoutService] = useState(() => new BlockscoutService());
  const [transactions, setTransactions] = useState<PoolTransaction[]>([]);
  const [poolStats, setPoolStats] = useState<PoolStats>({
    totalPools: 0,
    totalContributions: 0,
    totalValue: '0',
    userMerits: 0,
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Blockscout service
  useEffect(() => {
    blockscoutService.setNetwork(config.networkKey);
  }, [blockscoutService, config.networkKey]);

  // Monitor transaction status and award Merits
  const monitorTransaction = useCallback(async (
    txHash: string,
    type: PoolTransaction['type'],
    amount?: string,
    poolId?: string
  ) => {
    const newTransaction: PoolTransaction = {
      hash: txHash,
      type,
      amount,
      poolId,
      status: 'pending',
    };

    setTransactions(prev => [...prev, newTransaction]);

    try {
      // Wait for transaction confirmation
      const confirmedTx = await blockscoutService.waitForTransactionConfirmation(txHash);
      
      if (confirmedTx) {
        // Update transaction status
        setTransactions(prev => 
          prev.map(tx => 
            tx.hash === txHash 
              ? { ...tx, status: 'confirmed', blockscoutInfo: confirmedTx }
              : tx
          )
        );

        // Award Merits based on transaction type
        if (config.userId) {
          const meritsReward = await awardMeritsForAction(type, amount, poolId);
          if (meritsReward > 0) {
            setTransactions(prev => 
              prev.map(tx => 
                tx.hash === txHash 
                  ? { ...tx, meritsAwarded: meritsReward }
                  : tx
              )
            );
          }
        }

        // Create transaction tag
        if (config.apiKey) {
          await blockscoutService.createTransactionTag(
            txHash,
            `Pool ${type} - ${poolId || 'Unknown'}`,
            config.apiKey
          );
        }

        // Update stats
        await updatePoolStats();

        return confirmedTx;
      } else {
        // Transaction failed
        setTransactions(prev => 
          prev.map(tx => 
            tx.hash === txHash 
              ? { ...tx, status: 'failed' }
              : tx
          )
        );
        return null;
      }
    } catch (err) {
      console.error('Error monitoring transaction:', err);
      setError(`Failed to monitor transaction ${txHash}`);
      
      setTransactions(prev => 
        prev.map(tx => 
          tx.hash === txHash 
            ? { ...tx, status: 'failed' }
            : tx
        )
      );
      return null;
    }
  }, [blockscoutService, config.userId, config.apiKey]);

  // Award Merits based on action type
  const awardMeritsForAction = useCallback(async (
    type: PoolTransaction['type'],
    amount?: string,
    poolId?: string
  ): Promise<number> => {
    if (!config.userId) return 0;

    const meritsConfig = {
      create: { amount: 20, description: 'Pool Creation' },
      contribute: { amount: 5, description: 'Pool Contribution' },
      withdraw: { amount: 2, description: 'Pool Withdrawal' },
      complete: { amount: 15, description: 'Pool Completion' },
    };

    const reward = meritsConfig[type];
    if (!reward) return 0;

    try {
      const transaction = await blockscoutService.awardMerits(
        config.userId,
        reward.amount,
        reward.description,
        {
          action: type,
          amount,
          poolId,
          timestamp: new Date().toISOString(),
        }
      );

      if (transaction) {
        console.log(`Awarded ${reward.amount} Merits for ${reward.description}`);
        return reward.amount;
      }
    } catch (err) {
      console.error('Error awarding Merits:', err);
    }

    return 0;
  }, [blockscoutService, config.userId]);

  // Update pool statistics
  const updatePoolStats = useCallback(async () => {
    try {
      // Get contract transactions if contract address is provided
      if (config.contractAddress) {
        const contractTransactions = await blockscoutService.getAddressTransactions(
          config.contractAddress,
          { limit: 100 }
        );

        // Analyze transactions to extract pool stats
        const poolCreations = contractTransactions.filter(tx => 
          tx.to === config.contractAddress && parseInt(tx.value) === 0
        );
        
        const contributions = contractTransactions.filter(tx => 
          tx.to === config.contractAddress && parseInt(tx.value) > 0
        );

        const totalValue = contributions.reduce((sum, tx) => 
          sum + parseFloat(tx.value), 0
        ).toString();

        setPoolStats(prev => ({
          ...prev,
          totalPools: poolCreations.length,
          totalContributions: contributions.length,
          totalValue,
        }));
      }

      // Get user's Merits balance
      if (config.userId) {
        const meritsBalance = await blockscoutService.getMeritsBalance(config.userId);
        if (meritsBalance) {
          setPoolStats(prev => ({
            ...prev,
            userMerits: meritsBalance.balance,
          }));
        }
      }
    } catch (err) {
      console.error('Error updating pool stats:', err);
    }
  }, [blockscoutService, config.contractAddress, config.userId]);

  // Start monitoring pool contract
  const startMonitoring = useCallback(async () => {
    if (!config.contractAddress) {
      setError('Contract address required for monitoring');
      return;
    }

    setIsMonitoring(true);
    setError(null);

    try {
      // Add contract to watchlist
      if (config.apiKey) {
        const notificationSettings = {
          native: { incoming: true, outcoming: true },
          'ERC-20': { incoming: true, outcoming: true },
          'ERC-721': { incoming: false, outcoming: false },
        };

        await blockscoutService.addToWatchlist(
          config.contractAddress,
          'Pool Payments Contract',
          notificationSettings,
          config.apiKey
        );
      }

      // Create contract tag
      if (config.apiKey) {
        await blockscoutService.createAddressTag(
          config.contractAddress,
          'Pool Payments Protocol',
          config.apiKey
        );
      }

      // Initial stats update
      await updatePoolStats();

      console.log('Started monitoring Pool Payments contract on Blockscout');
    } catch (err) {
      console.error('Error starting monitoring:', err);
      setError('Failed to start monitoring');
      setIsMonitoring(false);
    }
  }, [blockscoutService, config.contractAddress, config.apiKey, updatePoolStats]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    console.log('Stopped monitoring Pool Payments contract');
  }, []);

  // Get Blockscout explorer URLs
  const getExplorerUrls = useCallback(() => {
    const urls: Record<string, string> = {};

    if (config.contractAddress) {
      urls.contract = blockscoutService.getExplorerUrl('address', config.contractAddress);
    }

    transactions.forEach(tx => {
      urls[tx.hash] = blockscoutService.getExplorerUrl('tx', tx.hash);
    });

    return urls;
  }, [blockscoutService, config.contractAddress, transactions]);

  // Get transaction by hash
  const getTransaction = useCallback((hash: string) => {
    return transactions.find(tx => tx.hash === hash);
  }, [transactions]);

  // Get transactions by type
  const getTransactionsByType = useCallback((type: PoolTransaction['type']) => {
    return transactions.filter(tx => tx.type === type);
  }, [transactions]);

  // Get confirmed transactions
  const getConfirmedTransactions = useCallback(() => {
    return transactions.filter(tx => tx.status === 'confirmed');
  }, [transactions]);

  // Get pending transactions
  const getPendingTransactions = useCallback(() => {
    return transactions.filter(tx => tx.status === 'pending');
  }, [transactions]);

  // Get total Merits earned
  const getTotalMeritsEarned = useCallback(() => {
    return transactions.reduce((total, tx) => total + (tx.meritsAwarded || 0), 0);
  }, [transactions]);

  // Initialize monitoring on mount
  useEffect(() => {
    if (config.contractAddress) {
      updatePoolStats();
    }
  }, [config.contractAddress, updatePoolStats]);

  return {
    // State
    transactions,
    poolStats,
    isMonitoring,
    error,
    
    // Actions
    monitorTransaction,
    startMonitoring,
    stopMonitoring,
    updatePoolStats,
    
    // Getters
    getExplorerUrls,
    getTransaction,
    getTransactionsByType,
    getConfirmedTransactions,
    getPendingTransactions,
    getTotalMeritsEarned,
    
    // Blockscout service
    blockscoutService,
  };
};
