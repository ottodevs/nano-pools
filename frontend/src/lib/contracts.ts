/**
 * Contract ABIs and interaction utilities
 */

// NanoPool Contract ABI (extracted from the Solidity contract)
export const nanoPoolAbi = [
  // Events
  {
    type: 'event',
    name: 'PoolCreated',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true },
      { name: 'initiator', type: 'address', indexed: true },
      { name: 'beneficiary', type: 'address', indexed: true },
      { name: 'description', type: 'string', indexed: false },
      { name: 'goalAmount', type: 'uint256', indexed: false },
      { name: 'deadlineTimestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ContributionMade',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true },
      { name: 'contributor', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'newTotal', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'GoalAchieved',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true },
      { name: 'totalAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'FundsDisbursed',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true },
      { name: 'beneficiary', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RefundClaimed',
    inputs: [
      { name: 'poolId', type: 'uint256', indexed: true },
      { name: 'contributor', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },

  // Read Functions
  {
    type: 'function',
    name: 'pools',
    stateMutability: 'view',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [
      { name: 'initiator', type: 'address' },
      { name: 'beneficiary', type: 'address' },
      { name: 'description', type: 'string' },
      { name: 'goalAmount', type: 'uint256' },
      { name: 'currentAmount', type: 'uint256' },
      { name: 'deadlineTimestamp', type: 'uint256' },
      { name: 'goalAchieved', type: 'bool' },
      { name: 'fundsDisbursed', type: 'bool' },
    ],
  },
  {
    type: 'function',
    name: 'getPoolContribution',
    stateMutability: 'view',
    inputs: [
      { name: 'poolId', type: 'uint256' },
      { name: 'contributor', type: 'address' },
    ],
    outputs: [{ name: 'amount', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getPoolContributors',
    stateMutability: 'view',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [{ name: 'contributors', type: 'address[]' }],
  },
  {
    type: 'function',
    name: 'isPoolActive',
    stateMutability: 'view',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [{ name: 'active', type: 'bool' }],
  },

  // Write Functions
  {
    type: 'function',
    name: 'createPool',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_beneficiary', type: 'address' },
      { name: '_description', type: 'string' },
      { name: '_goalAmount', type: 'uint256' },
      { name: '_deadlineTimestamp', type: 'uint256' },
    ],
    outputs: [{ name: 'poolId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'contributeToPool',
    stateMutability: 'payable',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'disburseFunds',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'claimRefund',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [],
  },
] as const;

// Pool data structure
export interface Pool {
  id: number;
  initiator: string;
  beneficiary: string;
  description: string;
  goalAmount: bigint;
  currentAmount: bigint;
  deadlineTimestamp: bigint;
  goalAchieved: boolean;
  fundsDisbursed: boolean;
  contributors?: string[];
  isActive?: boolean;
}

// Pool creation parameters
export interface CreatePoolParams {
  beneficiary: string;
  description: string;
  goalAmount: bigint;
  deadlineTimestamp: bigint;
}

// Contribution parameters
export interface ContributeParams {
  poolId: number;
  amount: bigint;
}

// Pool status enum
export enum PoolStatus {
  ACTIVE = 'active',
  GOAL_ACHIEVED = 'goal_achieved',
  EXPIRED = 'expired',
  DISBURSED = 'disbursed',
}

// Helper function to determine pool status
export function getPoolStatus(pool: Pool): PoolStatus {
  const now = BigInt(Math.floor(Date.now() / 1000));
  
  if (pool.fundsDisbursed) {
    return PoolStatus.DISBURSED;
  }
  
  if (pool.goalAchieved) {
    return PoolStatus.GOAL_ACHIEVED;
  }
  
  if (pool.deadlineTimestamp < now) {
    return PoolStatus.EXPIRED;
  }
  
  return PoolStatus.ACTIVE;
}

// Helper function to calculate progress percentage
export function getPoolProgress(pool: Pool): number {
  if (pool.goalAmount === 0n) return 0;
  return Number((pool.currentAmount * 100n) / pool.goalAmount);
}

// Helper function to format pool deadline
export function formatPoolDeadline(deadlineTimestamp: bigint): string {
  const deadline = new Date(Number(deadlineTimestamp) * 1000);
  return deadline.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Helper function to check if pool is expired
export function isPoolExpired(deadlineTimestamp: bigint): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return deadlineTimestamp < now;
}

// Helper function to get time remaining
export function getTimeRemaining(deadlineTimestamp: bigint): string {
  const now = Math.floor(Date.now() / 1000);
  const deadline = Number(deadlineTimestamp);
  const remaining = deadline - now;
  
  if (remaining <= 0) {
    return 'Expired';
  }
  
  const days = Math.floor(remaining / (24 * 60 * 60));
  const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((remaining % (60 * 60)) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}
