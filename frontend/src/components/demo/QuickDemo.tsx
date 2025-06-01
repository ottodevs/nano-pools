/**
 * Quick demo component showcasing key features
 */

"use client";

import { useState } from "react";
import { useBlockscout } from "@/hooks/useBlockscout";
import { defaultChainId } from "@/lib/viem";

export function QuickDemo() {
  const [demoStep, setDemoStep] = useState(0);
  const { monitorTransaction, merits, getTotalMerits } =
    useBlockscout(defaultChainId);

  const demoSteps = [
    {
      title: "🎯 Create Pool",
      description: "Create a new funding pool with goals and deadlines",
      action: "Simulate Pool Creation",
      meritType: "create" as const,
    },
    {
      title: "💰 Contribute",
      description: "Contribute ETH to help reach the funding goal",
      action: "Simulate Contribution",
      meritType: "contribute" as const,
    },
    {
      title: "✅ Complete",
      description: "Complete the pool when goal is achieved",
      action: "Simulate Completion",
      meritType: "complete" as const,
    },
  ];

  const simulateTransaction = async (step: number) => {
    const currentStep = demoSteps[step];
    if (!currentStep) return;

    // Generate a mock transaction hash
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

    try {
      // Simulate transaction monitoring
      await monitorTransaction(
        mockTxHash,
        currentStep.meritType,
        "0.1",
        "demo-pool"
      );

      setDemoStep(step + 1);
    } catch (error) {
      console.error("Demo transaction failed:", error);
    }
  };

  const resetDemo = () => {
    setDemoStep(0);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">🚀 Quick Demo</h3>
        <p className="text-gray-600">
          Experience the Pool Payments Protocol in action
        </p>
      </div>

      {/* Demo Progress */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          {demoSteps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${
                  index < demoStep
                    ? "bg-green-500 text-white"
                    : index === demoStep
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-500"
                }
              `}
              >
                {index < demoStep ? "✓" : index + 1}
              </div>
              {index < demoSteps.length - 1 && (
                <div
                  className={`
                  w-12 h-1 mx-2
                  ${index < demoStep ? "bg-green-500" : "bg-gray-200"}
                `}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step */}
      {demoStep < demoSteps.length && (
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <div className="text-center">
            <div className="text-3xl mb-3">
              {demoSteps[demoStep].title.split(" ")[0]}
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              {demoSteps[demoStep].title.substring(2)}
            </h4>
            <p className="text-gray-600 mb-4">
              {demoSteps[demoStep].description}
            </p>
            <button
              onClick={() => simulateTransaction(demoStep)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              {demoSteps[demoStep].action}
            </button>
          </div>
        </div>
      )}

      {/* Demo Complete */}
      {demoStep >= demoSteps.length && (
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h4 className="text-xl font-semibold text-gray-900 mb-2">
            Demo Complete!
          </h4>
          <p className="text-gray-600 mb-4">
            You&apos;ve experienced the full pool lifecycle
          </p>
          <button
            onClick={resetDemo}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          >
            Run Demo Again
          </button>
        </div>
      )}

      {/* Merit Summary */}
      {merits.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🏆</span>
                <span className="font-semibold">Merit Rewards Earned</span>
              </div>
              <div className="text-2xl font-bold">
                {getTotalMerits()} Points
              </div>
            </div>
            <div className="text-right text-sm">
              <div>Pool Creation: +20</div>
              <div>Contribution: +5</div>
              <div>Completion: +15</div>
            </div>
          </div>
        </div>
      )}

      {/* Features Highlight */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/50 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">🌍</div>
          <div className="font-medium text-gray-900">Multi-Chain</div>
          <div className="text-sm text-gray-600">Flow EVM & World Chain</div>
        </div>
        <div className="bg-white/50 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">🔗</div>
          <div className="font-medium text-gray-900">Blockscout</div>
          <div className="text-sm text-gray-600">Real-time monitoring</div>
        </div>
        <div className="bg-white/50 rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">📱</div>
          <div className="font-medium text-gray-900">World App</div>
          <div className="text-sm text-gray-600">MiniKit integration</div>
        </div>
      </div>
    </div>
  );
}
