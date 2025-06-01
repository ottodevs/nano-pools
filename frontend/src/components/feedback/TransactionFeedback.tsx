/**
 * Transaction feedback component with Blockscout integration
 */

"use client";

import { useState, useEffect } from "react";
import { useTransactionMonitor, useBlockscout } from "@/hooks/useBlockscout";
import { defaultChainId } from "@/lib/viem";

interface TransactionFeedbackProps {
  transactionHash?: string;
  onClose?: () => void;
}

export function TransactionFeedback({
  transactionHash,
  onClose,
}: TransactionFeedbackProps) {
  const { transactions, addTransaction } =
    useTransactionMonitor(defaultChainId);
  const { merits, getTotalMerits } = useBlockscout(defaultChainId);
  const [showMerits, setShowMerits] = useState(false);

  useEffect(() => {
    if (transactionHash) {
      addTransaction(transactionHash);
    }
  }, [transactionHash, addTransaction]);

  const pendingTransactions = transactions.filter(
    tx => tx.status === "pending"
  );
  const recentTransactions = transactions.slice(-3); // Show last 3 transactions

  if (transactions.length === 0 && merits.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {/* Transaction Status */}
      {pendingTransactions.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">
              Transaction Status
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {pendingTransactions.map(tx => (
            <div key={tx.hash} className="flex items-center gap-3 py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <div className="flex-1">
                <div className="text-xs text-gray-600">
                  {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                </div>
                <div className="text-xs text-blue-600">Confirming...</div>
              </div>
              <a
                href={tx.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-xs"
              >
                View
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Recent Transactions */}
      {recentTransactions.some(tx => tx.status !== "pending") && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Recent Transactions
          </h3>

          {recentTransactions
            .filter(tx => tx.status !== "pending")
            .map(tx => (
              <div key={tx.hash} className="flex items-center gap-3 py-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    tx.status === "success" ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <div className="flex-1">
                  <div className="text-xs text-gray-600">
                    {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                  </div>
                  <div
                    className={`text-xs ${
                      tx.status === "success"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {tx.status === "success" ? "Confirmed" : "Failed"}
                  </div>
                </div>
                <a
                  href={tx.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs"
                >
                  View
                </a>
              </div>
            ))}
        </div>
      )}

      {/* Merit Rewards */}
      {merits.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-lg p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <h3 className="text-sm font-semibold">Merit Rewards</h3>
            </div>
            <button
              onClick={() => setShowMerits(!showMerits)}
              className="text-white/80 hover:text-white text-xs"
            >
              {showMerits ? "Hide" : "Show"}
            </button>
          </div>

          <div className="text-lg font-bold mb-1">
            {getTotalMerits()} Points
          </div>

          {showMerits && (
            <div className="space-y-1">
              {merits.slice(-3).map((merit, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="capitalize">
                    {merit.type.replace("_", " ")}
                  </span>
                  <span>+{merit.amount}</span>
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-white/80 mt-2">
            Earned from pool interactions
          </div>
        </div>
      )}
    </div>
  );
}

// Hook to use transaction feedback globally
export function useTransactionFeedback() {
  const [currentTransaction, setCurrentTransaction] = useState<
    string | undefined
  >();
  const [isVisible, setIsVisible] = useState(false);

  const showTransaction = (hash: string) => {
    setCurrentTransaction(hash);
    setIsVisible(true);
  };

  const hideTransaction = () => {
    setIsVisible(false);
    setTimeout(() => setCurrentTransaction(undefined), 300);
  };

  return {
    currentTransaction,
    isVisible,
    showTransaction,
    hideTransaction,
  };
}
