/**
 * Viem client configuration for multi-chain support
 * Supports Flow EVM Testnet and World Chain Sepolia
 */

import { createPublicClient, createWalletClient, http, custom } from "viem";
import { defineChain } from "viem";

// Flow EVM Testnet Chain Definition
export const flowEvmTestnet = defineChain({
  id: 545,
  name: "Flow EVM Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Flow",
    symbol: "FLOW",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.evm.nodes.onflow.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Flow EVM Testnet Explorer",
      url: "https://evm-testnet.flowscan.org",
    },
  },
  testnet: true,
});

// World Chain Sepolia Chain Definition
export const worldChainSepolia = defineChain({
  id: 4801,
  name: "World Chain Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://worldchain-sepolia.g.alchemy.com/v2/demo"],
    },
  },
  blockExplorers: {
    default: {
      name: "World Chain Sepolia Explorer",
      url: "https://worldchain-sepolia.explorer.alchemy.com",
    },
  },
  testnet: true,
});

// Supported chains
export const supportedChains = [flowEvmTestnet, worldChainSepolia] as const;

// Chain configuration mapping
export const chainConfig = {
  [flowEvmTestnet.id]: {
    chain: flowEvmTestnet,
    rpcUrl: "https://testnet.evm.nodes.onflow.org",
    explorerUrl: "https://evm-testnet.flowscan.org",
    blockscoutApiUrl: "https://evm-testnet.flowscan.org/api",
  },
  [worldChainSepolia.id]: {
    chain: worldChainSepolia,
    rpcUrl: "https://worldchain-sepolia.g.alchemy.com/v2/demo",
    explorerUrl: "https://worldchain-sepolia.explorer.alchemy.com",
    blockscoutApiUrl: "https://worldchain-sepolia.explorer.alchemy.com/api",
  },
} as const;

// Contract addresses from deployment
export const contractAddresses = {
  [flowEvmTestnet.id]: {
    nanoPool: "0xacAdfFE7D479c416C25509Cea6D36Bb797E34f29",
    create2Factory: "0x20aD2b34860A7A44E548D4C740845A18C6753ba0",
  },
  [worldChainSepolia.id]: {
    // TODO: Add World Chain addresses after deployment
    nanoPool: "0x0000000000000000000000000000000000000000",
    create2Factory: "0x0000000000000000000000000000000000000000",
  },
} as const;

// Create public clients for each chain
export const publicClients = {
  [flowEvmTestnet.id]: createPublicClient({
    chain: flowEvmTestnet,
    transport: http(),
  }),
  [worldChainSepolia.id]: createPublicClient({
    chain: worldChainSepolia,
    transport: http(),
  }),
} as const;

// Create wallet client factory
export function createWalletClientForChain(chainId: number) {
  const config = chainConfig[chainId as keyof typeof chainConfig];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  // Check if we're in a browser environment with window.ethereum
  if (typeof window !== "undefined" && window.ethereum) {
    return createWalletClient({
      chain: config.chain,
      transport: custom(window.ethereum),
    });
  }

  // Fallback to HTTP transport (for server-side or testing)
  return createWalletClient({
    chain: config.chain,
    transport: http(),
  });
}

// Get public client for a specific chain
export function getPublicClient(chainId: number) {
  const client = publicClients[chainId as keyof typeof publicClients];
  if (!client) {
    throw new Error(`No public client configured for chain ID: ${chainId}`);
  }
  return client;
}

// Get contract address for a specific chain and contract
export function getContractAddress(
  chainId: number,
  contract: "nanoPool" | "create2Factory"
) {
  const addresses =
    contractAddresses[chainId as keyof typeof contractAddresses];
  if (!addresses) {
    throw new Error(
      `No contract addresses configured for chain ID: ${chainId}`
    );
  }
  return addresses[contract];
}

// Get chain configuration
export function getChainConfig(chainId: number) {
  const config = chainConfig[chainId as keyof typeof chainConfig];
  if (!config) {
    throw new Error(`No configuration found for chain ID: ${chainId}`);
  }
  return config;
}

// Helper to check if a chain is supported
export function isSupportedChain(chainId: number): boolean {
  return chainId in chainConfig;
}

// Default chain (Flow EVM Testnet)
export const defaultChain = flowEvmTestnet;
export const defaultChainId = flowEvmTestnet.id;
