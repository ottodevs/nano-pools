/**
 * React hooks for NanoPool contract interactions
 */

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/auth";
import {
  getPublicClient,
  createWalletClientForChain,
  getContractAddress,
  defaultChainId,
} from "@/lib/viem";
import {
  nanoPoolAbi,
  Pool,
  CreatePoolParams,
  ContributeParams,
} from "@/lib/contracts";

// Hook for reading pool data
export function usePool(poolId: number, chainId: number = defaultChainId) {
  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPool = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const publicClient = getPublicClient(chainId);
      const contractAddress = getContractAddress(chainId, "nanoPool");

      // Read pool data
      const poolData = await publicClient.readContract({
        address: contractAddress,
        abi: nanoPoolAbi,
        functionName: "pools",
        args: [BigInt(poolId)],
      });

      // Check if pool is active
      const isActive = await publicClient.readContract({
        address: contractAddress,
        abi: nanoPoolAbi,
        functionName: "isPoolActive",
        args: [BigInt(poolId)],
      });

      // Get contributors
      const contributors = await publicClient.readContract({
        address: contractAddress,
        abi: nanoPoolAbi,
        functionName: "getPoolContributors",
        args: [BigInt(poolId)],
      });

      const poolInfo: Pool = {
        id: poolId,
        initiator: poolData[0],
        beneficiary: poolData[1],
        description: poolData[2],
        goalAmount: poolData[3],
        currentAmount: poolData[4],
        deadlineTimestamp: poolData[5],
        goalAchieved: poolData[6],
        fundsDisbursed: poolData[7],
        contributors: contributors as string[],
        isActive: isActive as boolean,
      };

      setPool(poolInfo);
    } catch (err) {
      console.error("Error fetching pool:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch pool");
    } finally {
      setLoading(false);
    }
  }, [poolId, chainId]);

  useEffect(() => {
    fetchPool();
  }, [fetchPool]);

  return { pool, loading, error, refetch: fetchPool };
}

// Hook for creating pools
export function useCreatePool(chainId: number = defaultChainId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { walletAddress } = useAuthStore();

  const createPool = useCallback(
    async (params: CreatePoolParams) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }

      try {
        setLoading(true);
        setError(null);

        const walletClient = createWalletClientForChain(chainId);
        const contractAddress = getContractAddress(chainId, "nanoPool");

        // Get account from wallet client
        const [account] = await walletClient.getAddresses();

        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: nanoPoolAbi,
          functionName: "createPool",
          args: [
            params.beneficiary,
            params.description,
            params.goalAmount,
            params.deadlineTimestamp,
          ],
          account,
        });

        // Wait for transaction confirmation
        const publicClient = getPublicClient(chainId);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        // Extract pool ID from logs
        const poolCreatedLog = receipt.logs.find(
          log => log.topics[0] === "0x..." // PoolCreated event signature
        );

        return {
          hash,
          receipt,
          poolId: poolCreatedLog ? Number(poolCreatedLog.topics[1]) : null,
        };
      } catch (err) {
        console.error("Error creating pool:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create pool";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [walletAddress, chainId]
  );

  return { createPool, loading, error };
}

// Hook for contributing to pools
export function useContributeToPool(chainId: number = defaultChainId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { walletAddress } = useAuthStore();

  const contribute = useCallback(
    async (params: ContributeParams) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }

      try {
        setLoading(true);
        setError(null);

        const walletClient = createWalletClientForChain(chainId);
        const contractAddress = getContractAddress(chainId, "nanoPool");

        // Get account from wallet client
        const [account] = await walletClient.getAddresses();

        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: nanoPoolAbi,
          functionName: "contributeToPool",
          args: [BigInt(params.poolId)],
          value: params.amount,
          account,
        });

        // Wait for transaction confirmation
        const publicClient = getPublicClient(chainId);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        return { hash, receipt };
      } catch (err) {
        console.error("Error contributing to pool:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to contribute to pool";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [walletAddress, chainId]
  );

  return { contribute, loading, error };
}

// Hook for getting user's contribution to a pool
export function useUserContribution(
  poolId: number,
  chainId: number = defaultChainId
) {
  const [contribution, setContribution] = useState<bigint>(0n);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { walletAddress } = useAuthStore();

  const fetchContribution = useCallback(async () => {
    if (!walletAddress) {
      setContribution(0n);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const publicClient = getPublicClient(chainId);
      const contractAddress = getContractAddress(chainId, "nanoPool");

      const amount = await publicClient.readContract({
        address: contractAddress,
        abi: nanoPoolAbi,
        functionName: "getPoolContribution",
        args: [BigInt(poolId), walletAddress as `0x${string}`],
      });

      setContribution(amount as bigint);
    } catch (err) {
      console.error("Error fetching contribution:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch contribution"
      );
    } finally {
      setLoading(false);
    }
  }, [poolId, walletAddress, chainId]);

  useEffect(() => {
    fetchContribution();
  }, [fetchContribution]);

  return { contribution, loading, error, refetch: fetchContribution };
}

// Hook for pool management actions (disburse, refund)
export function usePoolActions(chainId: number = defaultChainId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { walletAddress } = useAuthStore();

  const disburseFunds = useCallback(
    async (poolId: number) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }

      try {
        setLoading(true);
        setError(null);

        const walletClient = createWalletClientForChain(chainId);
        const contractAddress = getContractAddress(chainId, "nanoPool");
        const [account] = await walletClient.getAddresses();

        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: nanoPoolAbi,
          functionName: "disburseFunds",
          args: [BigInt(poolId)],
          account,
        });

        const publicClient = getPublicClient(chainId);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        return { hash, receipt };
      } catch (err) {
        console.error("Error disbursing funds:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to disburse funds";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [walletAddress, chainId]
  );

  const claimRefund = useCallback(
    async (poolId: number) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }

      try {
        setLoading(true);
        setError(null);

        const walletClient = createWalletClientForChain(chainId);
        const contractAddress = getContractAddress(chainId, "nanoPool");
        const [account] = await walletClient.getAddresses();

        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: nanoPoolAbi,
          functionName: "claimRefund",
          args: [BigInt(poolId)],
          account,
        });

        const publicClient = getPublicClient(chainId);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        return { hash, receipt };
      } catch (err) {
        console.error("Error claiming refund:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to claim refund";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [walletAddress, chainId]
  );

  return { disburseFunds, claimRefund, loading, error };
}
