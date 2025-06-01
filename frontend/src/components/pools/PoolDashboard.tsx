/**
 * Pool dashboard component for managing and viewing pools
 */

"use client";

import { useState, useEffect } from "react";
import { Pool, PoolStatus, getPoolStatus } from "@/lib/contracts";
import { usePool } from "@/hooks/useNanoPool";
import { PoolCard } from "./PoolCard";
import { CreatePoolForm } from "./CreatePoolForm";
import { defaultChainId } from "@/lib/viem";

interface PoolDashboardProps {
  initialPoolIds?: number[];
}

export function PoolDashboard({
  initialPoolIds = [1, 2, 3],
}: PoolDashboardProps) {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState<"all" | PoolStatus>("all");
  const [poolIds, setPoolIds] = useState<number[]>(initialPoolIds);

  // Load pools data
  useEffect(() => {
    const loadPools = async () => {
      setLoading(true);
      const poolPromises = poolIds.map(async id => {
        try {
          const response = await fetch(`/api/pools/${id}`);
          if (response.ok) {
            const poolData = await response.json();
            // Convert string values back to BigInt
            return {
              ...poolData,
              goalAmount: BigInt(poolData.goalAmount),
              currentAmount: BigInt(poolData.currentAmount),
              deadlineTimestamp: BigInt(poolData.deadlineTimestamp),
            } as Pool;
          }
          return null;
        } catch (error) {
          console.error(`Failed to load pool ${id}:`, error);
          return null;
        }
      });

      const poolResults = await Promise.all(poolPromises);
      const validPools = poolResults.filter(Boolean) as Pool[];
      setPools(validPools);
      setLoading(false);
    };

    loadPools();
  }, [poolIds]);

  // Filter pools based on status
  const filteredPools = pools.filter(pool => {
    if (filter === "all") return true;
    return getPoolStatus(pool) === filter;
  });

  // Handle successful pool creation
  const handlePoolCreated = (poolId: number) => {
    setPoolIds(prev => [...prev, poolId]);
    setShowCreateForm(false);
  };

  // Handle pool updates
  const handlePoolUpdate = () => {
    // Trigger a refresh of pool data
    setPoolIds(prev => [...prev]);
  };

  // Get filter counts
  const getFilterCount = (status: PoolStatus | "all") => {
    if (status === "all") return pools.length;
    return pools.filter(pool => getPoolStatus(pool) === status).length;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading pools...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pool Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage and contribute to funding pools
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create New Pool
        </button>
      </div>

      {/* Create Pool Modal/Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <CreatePoolForm
                onSuccess={handlePoolCreated}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({getFilterCount("all")})
          </button>
          <button
            onClick={() => setFilter(PoolStatus.ACTIVE)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === PoolStatus.ACTIVE
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Active ({getFilterCount(PoolStatus.ACTIVE)})
          </button>
          <button
            onClick={() => setFilter(PoolStatus.GOAL_ACHIEVED)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === PoolStatus.GOAL_ACHIEVED
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Goal Achieved ({getFilterCount(PoolStatus.GOAL_ACHIEVED)})
          </button>
          <button
            onClick={() => setFilter(PoolStatus.EXPIRED)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === PoolStatus.EXPIRED
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Expired ({getFilterCount(PoolStatus.EXPIRED)})
          </button>
          <button
            onClick={() => setFilter(PoolStatus.DISBURSED)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === PoolStatus.DISBURSED
                ? "bg-gray-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Disbursed ({getFilterCount(PoolStatus.DISBURSED)})
          </button>
        </div>
      </div>

      {/* Pool Grid */}
      {filteredPools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPools.map(pool => (
            <PoolCard key={pool.id} pool={pool} onUpdate={handlePoolUpdate} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === "all"
              ? "No pools found"
              : `No ${filter.replace("_", " ")} pools`}
          </h3>
          <p className="text-gray-500 mb-4">
            {filter === "all"
              ? "Get started by creating your first pool."
              : "Try adjusting your filter or create a new pool."}
          </p>
          {filter === "all" && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create Your First Pool
            </button>
          )}
        </div>
      )}

      {/* Stats Summary */}
      {pools.length > 0 && (
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {pools.length}
              </div>
              <div className="text-sm text-gray-600">Total Pools</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {getFilterCount(PoolStatus.ACTIVE)}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {getFilterCount(PoolStatus.GOAL_ACHIEVED)}
              </div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {pools.reduce(
                  (sum, pool) => sum + Number(pool.contributors?.length || 0),
                  0
                )}
              </div>
              <div className="text-sm text-gray-600">Total Contributors</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
