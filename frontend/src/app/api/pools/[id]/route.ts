/**
 * API route for fetching pool data (demo implementation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from '@/lib/contracts';

// Mock pool data for demonstration
const mockPools: Record<number, Pool> = {
  1: {
    id: 1,
    initiator: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    beneficiary: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    description: 'Flow EVM Testnet Pool - Help fund development of decentralized applications on Flow EVM',
    goalAmount: BigInt('10000000000000000'), // 0.01 ETH
    currentAmount: BigInt('7500000000000000'), // 0.0075 ETH
    deadlineTimestamp: BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60), // 7 days from now
    goalAchieved: false,
    fundsDisbursed: false,
    contributors: ['0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', '0x90F79bf6EB2c4f870365E785982E1f101E93b906'],
    isActive: true,
  },
  2: {
    id: 2,
    initiator: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    beneficiary: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    description: 'Community Garden Project - Creating a sustainable community garden for local food production',
    goalAmount: BigInt('50000000000000000'), // 0.05 ETH
    currentAmount: BigInt('52000000000000000'), // 0.052 ETH
    deadlineTimestamp: BigInt(Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60), // 3 days from now
    goalAchieved: true,
    fundsDisbursed: false,
    contributors: [
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      '0xcd3B766CCDd6AE721141F452C550Ca635964ce71',
    ],
    isActive: false,
  },
  3: {
    id: 3,
    initiator: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    beneficiary: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    description: 'Open Source Library Development - Building tools for the Web3 developer community',
    goalAmount: BigInt('100000000000000000'), // 0.1 ETH
    currentAmount: BigInt('25000000000000000'), // 0.025 ETH
    deadlineTimestamp: BigInt(Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60), // 14 days from now
    goalAchieved: false,
    fundsDisbursed: false,
    contributors: ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8'],
    isActive: true,
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const poolId = parseInt(params.id);
    
    if (isNaN(poolId)) {
      return NextResponse.json(
        { error: 'Invalid pool ID' },
        { status: 400 }
      );
    }

    const pool = mockPools[poolId];
    
    if (!pool) {
      return NextResponse.json(
        { error: 'Pool not found' },
        { status: 404 }
      );
    }

    // Convert BigInt to string for JSON serialization
    const serializedPool = {
      ...pool,
      goalAmount: pool.goalAmount.toString(),
      currentAmount: pool.currentAmount.toString(),
      deadlineTimestamp: pool.deadlineTimestamp.toString(),
    };

    return NextResponse.json(serializedPool);
  } catch (error) {
    console.error('Error fetching pool:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
