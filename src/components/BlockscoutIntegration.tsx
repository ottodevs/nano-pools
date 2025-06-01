/**
 * Blockscout Integration Component
 * Provides real-time transaction feedback, explorer links, and Merits integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { BlockscoutService, TransactionInfo, AddressInfo, MeritsBalance } from '../services/BlockscoutService';

interface BlockscoutIntegrationProps {
  address?: string;
  transactionHash?: string;
  networkKey?: string;
  userId?: string;
  apiKey?: string;
  onTransactionConfirmed?: (txInfo: TransactionInfo) => void;
  onMeritsAwarded?: (amount: number) => void;
}

export const BlockscoutIntegration: React.FC<BlockscoutIntegrationProps> = ({
  address,
  transactionHash,
  networkKey = 'flowEvmTestnet',
  userId,
  apiKey,
  onTransactionConfirmed,
  onMeritsAwarded,
}) => {
  const [blockscoutService] = useState(() => new BlockscoutService());
  const [addressInfo, setAddressInfo] = useState<AddressInfo | null>(null);
  const [transactionInfo, setTransactionInfo] = useState<TransactionInfo | null>(null);
  const [meritsBalance, setMeritsBalance] = useState<MeritsBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize network
  useEffect(() => {
    blockscoutService.setNetwork(networkKey);
  }, [blockscoutService, networkKey]);

  // Fetch address information
  const fetchAddressInfo = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const info = await blockscoutService.getAddressInfo(address);
      setAddressInfo(info);
    } catch (err) {
      setError('Failed to fetch address information');
      console.error('Error fetching address info:', err);
    } finally {
      setIsLoading(false);
    }
  }, [address, blockscoutService]);

  // Fetch transaction information
  const fetchTransactionInfo = useCallback(async () => {
    if (!transactionHash) return;

    setIsLoading(true);
    setError(null);

    try {
      const info = await blockscoutService.getTransaction(transactionHash);
      setTransactionInfo(info);

      // Check if transaction is confirmed and trigger callback
      if (info && (info.status === 'ok' || info.status === 'success') && onTransactionConfirmed) {
        onTransactionConfirmed(info);
      }
    } catch (err) {
      setError('Failed to fetch transaction information');
      console.error('Error fetching transaction info:', err);
    } finally {
      setIsLoading(false);
    }
  }, [transactionHash, blockscoutService, onTransactionConfirmed]);

  // Fetch Merits balance
  const fetchMeritsBalance = useCallback(async () => {
    if (!userId) return;

    try {
      const balance = await blockscoutService.getMeritsBalance(userId);
      setMeritsBalance(balance);
    } catch (err) {
      console.error('Error fetching Merits balance:', err);
    }
  }, [userId, blockscoutService]);

  // Award Merits for completing actions
  const awardMerits = useCallback(async (amount: number, description: string, metadata?: any) => {
    if (!userId) return false;

    try {
      const transaction = await blockscoutService.awardMerits(userId, amount, description, metadata);
      if (transaction) {
        // Refresh balance
        await fetchMeritsBalance();
        if (onMeritsAwarded) {
          onMeritsAwarded(amount);
        }
        return true;
      }
    } catch (err) {
      console.error('Error awarding Merits:', err);
    }
    return false;
  }, [userId, blockscoutService, fetchMeritsBalance, onMeritsAwarded]);

  // Create address tag
  const createAddressTag = useCallback(async (tagName: string) => {
    if (!address || !apiKey) return false;

    try {
      return await blockscoutService.createAddressTag(address, tagName, apiKey);
    } catch (err) {
      console.error('Error creating address tag:', err);
      return false;
    }
  }, [address, apiKey, blockscoutService]);

  // Create transaction tag
  const createTransactionTag = useCallback(async (tagName: string) => {
    if (!transactionHash || !apiKey) return false;

    try {
      return await blockscoutService.createTransactionTag(transactionHash, tagName, apiKey);
    } catch (err) {
      console.error('Error creating transaction tag:', err);
      return false;
    }
  }, [transactionHash, apiKey, blockscoutService]);

  // Add to watchlist
  const addToWatchlist = useCallback(async (name: string) => {
    if (!address || !apiKey) return false;

    const notificationSettings = {
      native: { incoming: true, outcoming: true },
      'ERC-20': { incoming: true, outcoming: true },
      'ERC-721': { incoming: true, outcoming: false },
    };

    try {
      return await blockscoutService.addToWatchlist(address, name, notificationSettings, apiKey);
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      return false;
    }
  }, [address, apiKey, blockscoutService]);

  // Get explorer URLs
  const getExplorerUrls = useCallback(() => {
    const urls: Record<string, string> = {};

    if (address) {
      urls.address = blockscoutService.getExplorerUrl('address', address);
    }

    if (transactionHash) {
      urls.transaction = blockscoutService.getExplorerUrl('tx', transactionHash);
    }

    return urls;
  }, [address, transactionHash, blockscoutService]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchAddressInfo();
  }, [fetchAddressInfo]);

  useEffect(() => {
    fetchTransactionInfo();
  }, [fetchTransactionInfo]);

  useEffect(() => {
    fetchMeritsBalance();
  }, [fetchMeritsBalance]);

  const explorerUrls = getExplorerUrls();
  const currentNetwork = blockscoutService.getCurrentNetwork();

  return (
    <div className="blockscout-integration">
      <div className="network-info">
        <h3>🔍 Blockscout Integration</h3>
        <p>Network: <strong>{currentNetwork.name}</strong></p>
        <p>Explorer: <a href={currentNetwork.explorerUrl} target="_blank" rel="noopener noreferrer">
          {currentNetwork.explorerUrl}
        </a></p>
      </div>

      {isLoading && (
        <div className="loading">
          <p>Loading blockchain data...</p>
        </div>
      )}

      {error && (
        <div className="error">
          <p style={{ color: 'red' }}>Error: {error}</p>
        </div>
      )}

      {/* Address Information */}
      {address && (
        <div className="address-section">
          <h4>📍 Address Information</h4>
          <p>Address: <code>{address}</code></p>
          {explorerUrls.address && (
            <p>
              <a href={explorerUrls.address} target="_blank" rel="noopener noreferrer">
                View on Blockscout →
              </a>
            </p>
          )}
          
          {addressInfo && (
            <div className="address-details">
              <p>Balance: {addressInfo.balance} ETH</p>
              <p>Transaction Count: {addressInfo.transaction_count}</p>
              <p>Contract: {addressInfo.is_contract ? 'Yes' : 'No'}</p>
              {addressInfo.is_verified && <p>✅ Verified Contract</p>}
              {addressInfo.public_tags.length > 0 && (
                <p>Tags: {addressInfo.public_tags.join(', ')}</p>
              )}
            </div>
          )}

          <div className="address-actions">
            <button onClick={() => createAddressTag('Pool Contract')}>
              🏷️ Tag Address
            </button>
            <button onClick={() => addToWatchlist('Pool Monitoring')}>
              👁️ Add to Watchlist
            </button>
          </div>
        </div>
      )}

      {/* Transaction Information */}
      {transactionHash && (
        <div className="transaction-section">
          <h4>📄 Transaction Information</h4>
          <p>Hash: <code>{transactionHash}</code></p>
          {explorerUrls.transaction && (
            <p>
              <a href={explorerUrls.transaction} target="_blank" rel="noopener noreferrer">
                View on Blockscout →
              </a>
            </p>
          )}

          {transactionInfo && (
            <div className="transaction-details">
              <p>Status: <span className={`status ${transactionInfo.status}`}>
                {transactionInfo.status === 'ok' || transactionInfo.status === 'success' ? '✅ Confirmed' : '⏳ Pending'}
              </span></p>
              <p>Block: {transactionInfo.block_number}</p>
              <p>From: <code>{transactionInfo.from}</code></p>
              <p>To: <code>{transactionInfo.to}</code></p>
              <p>Value: {transactionInfo.value} ETH</p>
              <p>Gas Used: {transactionInfo.gas_used}</p>
            </div>
          )}

          <div className="transaction-actions">
            <button onClick={() => createTransactionTag('Pool Transaction')}>
              🏷️ Tag Transaction
            </button>
          </div>
        </div>
      )}

      {/* Merits Information */}
      {userId && (
        <div className="merits-section">
          <h4>🏆 Blockscout Merits</h4>
          {meritsBalance && (
            <div className="merits-info">
              <p>Current Balance: <strong>{meritsBalance.balance} Merits</strong></p>
              <p>Total Earned: {meritsBalance.total_earned} Merits</p>
              <p>Last Updated: {new Date(meritsBalance.last_updated).toLocaleString()}</p>
            </div>
          )}

          <div className="merits-actions">
            <button onClick={() => awardMerits(10, 'Pool Creation', { action: 'create_pool' })}>
              🎁 Award 10 Merits (Pool Creation)
            </button>
            <button onClick={() => awardMerits(5, 'Pool Contribution', { action: 'contribute' })}>
              🎁 Award 5 Merits (Contribution)
            </button>
            <button onClick={() => awardMerits(15, 'Pool Completion', { action: 'complete_pool' })}>
              🎁 Award 15 Merits (Pool Completion)
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .blockscout-integration {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          background: #f9f9f9;
        }

        .network-info h3 {
          margin-top: 0;
          color: #2c3e50;
        }

        .address-section, .transaction-section, .merits-section {
          margin: 20px 0;
          padding: 15px;
          background: white;
          border-radius: 6px;
          border-left: 4px solid #3498db;
        }

        .address-details, .transaction-details, .merits-info {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
        }

        .address-actions, .transaction-actions, .merits-actions {
          margin-top: 15px;
        }

        .address-actions button, .transaction-actions button, .merits-actions button {
          margin-right: 10px;
          margin-bottom: 5px;
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          background: #3498db;
          color: white;
          cursor: pointer;
          font-size: 14px;
        }

        .address-actions button:hover, .transaction-actions button:hover, .merits-actions button:hover {
          background: #2980b9;
        }

        .status.ok, .status.success {
          color: #27ae60;
          font-weight: bold;
        }

        .loading, .error {
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
        }

        .loading {
          background: #e8f4f8;
          color: #2c3e50;
        }

        .error {
          background: #fdf2f2;
          border: 1px solid #e74c3c;
        }

        code {
          background: #f1f2f6;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 12px;
        }

        a {
          color: #3498db;
          text-decoration: none;
        }

        a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default BlockscoutIntegration;
