/**
 * Complete Blockscout Integration Example
 * Demonstrates all Blockscout features: APIs, SDK, Merits, and Explorer integration
 */

import React, { useState, useEffect } from 'react';
import { BlockscoutIntegration } from '../components/BlockscoutIntegration';
import { usePoolPaymentsBlockscout } from '../hooks/usePoolPaymentsBlockscout';

// Example contract addresses (replace with actual deployed addresses)
const EXAMPLE_ADDRESSES = {
  flowEvmTestnet: '0x1234567890123456789012345678901234567890',
  worldChainSepolia: '0x0987654321098765432109876543210987654321',
};

const EXAMPLE_TRANSACTIONS = {
  flowEvmTestnet: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  worldChainSepolia: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
};

export const BlockscoutIntegrationExample: React.FC = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<'flowEvmTestnet' | 'worldChainSepolia'>('flowEvmTestnet');
  const [userId, setUserId] = useState('demo-user-123');
  const [apiKey, setApiKey] = useState('');
  const [contractAddress, setContractAddress] = useState(EXAMPLE_ADDRESSES.flowEvmTestnet);
  const [transactionHash, setTransactionHash] = useState(EXAMPLE_TRANSACTIONS.flowEvmTestnet);

  // Pool Payments Blockscout integration
  const poolBlockscout = usePoolPaymentsBlockscout({
    networkKey: selectedNetwork,
    userId,
    apiKey: apiKey || undefined,
    contractAddress,
  });

  // Update addresses when network changes
  useEffect(() => {
    setContractAddress(EXAMPLE_ADDRESSES[selectedNetwork]);
    setTransactionHash(EXAMPLE_TRANSACTIONS[selectedNetwork]);
  }, [selectedNetwork]);

  // Example functions to demonstrate functionality
  const handleCreatePool = async () => {
    // Simulate pool creation transaction
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    console.log('Creating pool with transaction:', mockTxHash);
    
    // Monitor the transaction and award Merits
    await poolBlockscout.monitorTransaction(
      mockTxHash,
      'create',
      '0.1',
      'pool-001'
    );
  };

  const handleContributeToPool = async () => {
    // Simulate pool contribution transaction
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    console.log('Contributing to pool with transaction:', mockTxHash);
    
    // Monitor the transaction and award Merits
    await poolBlockscout.monitorTransaction(
      mockTxHash,
      'contribute',
      '0.05',
      'pool-001'
    );
  };

  const handleCompletePool = async () => {
    // Simulate pool completion transaction
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    console.log('Completing pool with transaction:', mockTxHash);
    
    // Monitor the transaction and award Merits
    await poolBlockscout.monitorTransaction(
      mockTxHash,
      'complete',
      '1.0',
      'pool-001'
    );
  };

  const explorerUrls = poolBlockscout.getExplorerUrls();
  const confirmedTransactions = poolBlockscout.getConfirmedTransactions();
  const pendingTransactions = poolBlockscout.getPendingTransactions();
  const totalMeritsEarned = poolBlockscout.getTotalMeritsEarned();

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🔍 Blockscout Integration Demo</h1>
      <p>Complete demonstration of Blockscout APIs, SDK, Merits, and Explorer integration</p>

      {/* Network Selection */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>🌐 Network Configuration</h3>
        <div style={{ marginBottom: '10px' }}>
          <label>
            <strong>Network: </strong>
            <select 
              value={selectedNetwork} 
              onChange={(e) => setSelectedNetwork(e.target.value as any)}
              style={{ marginLeft: '10px', padding: '5px' }}
            >
              <option value="flowEvmTestnet">Flow EVM Testnet</option>
              <option value="worldChainSepolia">World Chain Sepolia</option>
            </select>
          </label>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>
            <strong>User ID: </strong>
            <input 
              type="text" 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID for Merits"
              style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
            />
          </label>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>
            <strong>API Key: </strong>
            <input 
              type="password" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Optional: Blockscout API key"
              style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>
            <strong>Contract Address: </strong>
            <input 
              type="text" 
              value={contractAddress} 
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="Contract address to monitor"
              style={{ marginLeft: '10px', padding: '5px', width: '400px' }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>
            <strong>Transaction Hash: </strong>
            <input 
              type="text" 
              value={transactionHash} 
              onChange={(e) => setTransactionHash(e.target.value)}
              placeholder="Transaction hash to analyze"
              style={{ marginLeft: '10px', padding: '5px', width: '400px' }}
            />
          </label>
        </div>
      </div>

      {/* Pool Actions Demo */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>🏊 Pool Actions Demo</h3>
        <p>Simulate pool operations with automatic Blockscout monitoring and Merits rewards</p>
        
        <div style={{ marginBottom: '15px' }}>
          <button 
            onClick={handleCreatePool}
            style={{ 
              marginRight: '10px', 
              padding: '10px 15px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🎯 Create Pool (+20 Merits)
          </button>
          
          <button 
            onClick={handleContributeToPool}
            style={{ 
              marginRight: '10px', 
              padding: '10px 15px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            💰 Contribute to Pool (+5 Merits)
          </button>
          
          <button 
            onClick={handleCompletePool}
            style={{ 
              marginRight: '10px', 
              padding: '10px 15px', 
              backgroundColor: '#ffc107', 
              color: 'black', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            ✅ Complete Pool (+15 Merits)
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button 
            onClick={poolBlockscout.startMonitoring}
            disabled={poolBlockscout.isMonitoring}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: poolBlockscout.isMonitoring ? '#6c757d' : '#17a2b8', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: poolBlockscout.isMonitoring ? 'not-allowed' : 'pointer'
            }}
          >
            {poolBlockscout.isMonitoring ? '👁️ Monitoring...' : '👁️ Start Monitoring'}
          </button>
          
          <button 
            onClick={poolBlockscout.stopMonitoring}
            disabled={!poolBlockscout.isMonitoring}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: !poolBlockscout.isMonitoring ? '#6c757d' : '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: !poolBlockscout.isMonitoring ? 'not-allowed' : 'pointer'
            }}
          >
            🛑 Stop Monitoring
          </button>
        </div>

        {poolBlockscout.error && (
          <div style={{ color: 'red', marginBottom: '10px' }}>
            ❌ Error: {poolBlockscout.error}
          </div>
        )}
      </div>

      {/* Pool Statistics */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>📊 Pool Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <strong>Total Pools:</strong> {poolBlockscout.poolStats.totalPools}
          </div>
          <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <strong>Total Contributions:</strong> {poolBlockscout.poolStats.totalContributions}
          </div>
          <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <strong>Total Value:</strong> {poolBlockscout.poolStats.totalValue} ETH
          </div>
          <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <strong>User Merits:</strong> {poolBlockscout.poolStats.userMerits}
          </div>
          <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <strong>Merits Earned:</strong> {totalMeritsEarned}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>📄 Transaction History</h3>
        
        {pendingTransactions.length > 0 && (
          <div style={{ marginBottom: '15px' }}>
            <h4>⏳ Pending Transactions</h4>
            {pendingTransactions.map((tx) => (
              <div key={tx.hash} style={{ padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px', marginBottom: '5px' }}>
                <strong>{tx.type}</strong> - {tx.hash.substring(0, 10)}... 
                {explorerUrls[tx.hash] && (
                  <a href={explorerUrls[tx.hash]} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '10px' }}>
                    View on Blockscout →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {confirmedTransactions.length > 0 && (
          <div>
            <h4>✅ Confirmed Transactions</h4>
            {confirmedTransactions.map((tx) => (
              <div key={tx.hash} style={{ padding: '8px', backgroundColor: '#d4edda', borderRadius: '4px', marginBottom: '5px' }}>
                <strong>{tx.type}</strong> - {tx.hash.substring(0, 10)}... 
                {tx.meritsAwarded && <span style={{ color: '#28a745' }}> (+{tx.meritsAwarded} Merits)</span>}
                {explorerUrls[tx.hash] && (
                  <a href={explorerUrls[tx.hash]} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '10px' }}>
                    View on Blockscout →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {poolBlockscout.transactions.length === 0 && (
          <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
            No transactions yet. Try creating a pool or contributing to see transaction monitoring in action.
          </p>
        )}
      </div>

      {/* Blockscout Integration Component */}
      <BlockscoutIntegration
        address={contractAddress}
        transactionHash={transactionHash}
        networkKey={selectedNetwork}
        userId={userId}
        apiKey={apiKey || undefined}
        onTransactionConfirmed={(txInfo) => {
          console.log('Transaction confirmed:', txInfo);
        }}
        onMeritsAwarded={(amount) => {
          console.log('Merits awarded:', amount);
        }}
      />

      {/* Explorer Links */}
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>🔗 Explorer Links</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {explorerUrls.contract && (
            <a href={explorerUrls.contract} target="_blank" rel="noopener noreferrer">
              📍 View Contract on Blockscout →
            </a>
          )}
          {Object.entries(explorerUrls).map(([key, url]) => {
            if (key !== 'contract') {
              return (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer">
                  📄 View Transaction {key.substring(0, 10)}... on Blockscout →
                </a>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* Integration Guide */}
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #e9ecef', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
        <h3>📚 Integration Guide</h3>
        <p>This demo showcases all Blockscout bounty categories:</p>
        <ul>
          <li><strong>🏆 Best use of Blockscout ($6,000):</strong> Complete API integration with real-time data</li>
          <li><strong>📱 Best Blockscout SDK Integration ($3,000):</strong> React components with instant feedback</li>
          <li><strong>🎁 Best Blockscout Merits Use Case ($1,000):</strong> Gamified rewards for pool actions</li>
          <li><strong>💧 Big Blockscout Explorer Pool Prize ($10,000):</strong> Primary explorer integration</li>
        </ul>
        
        <h4>🔧 Technical Features:</h4>
        <ul>
          <li>✅ REST and JSON-RPC API integration</li>
          <li>✅ Real-time transaction monitoring</li>
          <li>✅ Automatic contract verification</li>
          <li>✅ Address tagging and watchlists</li>
          <li>✅ Merits rewards system</li>
          <li>✅ Multi-chain support (Flow EVM + World Chain)</li>
          <li>✅ Explorer links as primary blockchain explorer</li>
        </ul>
      </div>
    </div>
  );
};

export default BlockscoutIntegrationExample;
