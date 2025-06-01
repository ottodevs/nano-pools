/**
 * Blockscout Integration Service
 * Provides comprehensive integration with Blockscout APIs, SDK, and Merits system
 * Supports Flow EVM testnet and World Chain Sepolia testnet
 */

import axios, { AxiosInstance } from "axios";

// Network configurations for Blockscout instances
export interface BlockscoutNetwork {
  name: string;
  chainId: number;
  explorerUrl: string;
  apiUrl: string;
  meritsApiUrl?: string;
}

export const BLOCKSCOUT_NETWORKS: Record<string, BlockscoutNetwork> = {
  flowEvmTestnet: {
    name: "Flow EVM Testnet",
    chainId: 545,
    explorerUrl: "https://evm-testnet.flowscan.org",
    apiUrl: "https://evm-testnet.flowscan.org/api",
    meritsApiUrl: "https://evm-testnet.flowscan.org/api/account/v1/merits",
  },
  worldChainSepolia: {
    name: "World Chain Sepolia",
    chainId: 4801,
    explorerUrl: "https://worldchain-sepolia.explorer.alchemy.com",
    apiUrl: "https://worldchain-sepolia.explorer.alchemy.com/api",
    meritsApiUrl:
      "https://worldchain-sepolia.explorer.alchemy.com/api/account/v1/merits",
  },
};

// API Response Types
export interface TransactionInfo {
  hash: string;
  status: string;
  block_number: number;
  from: string;
  to: string;
  value: string;
  gas_used: string;
  gas_price: string;
  timestamp: string;
}

export interface AddressInfo {
  hash: string;
  balance: string;
  transaction_count: number;
  is_contract: boolean;
  is_verified?: boolean;
  name?: string;
  public_tags: string[];
  private_tags: string[];
}

export interface ContractInfo {
  address: string;
  name?: string;
  abi?: any[];
  source_code?: string;
  is_verified: boolean;
  verification_status: string;
}

export interface MeritsBalance {
  user_id: string;
  balance: number;
  total_earned: number;
  last_updated: string;
}

export interface MeritsTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: "earned" | "spent";
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Blockscout Service Class
 * Handles all interactions with Blockscout APIs and services
 */
export class BlockscoutService {
  private apiClients: Map<string, AxiosInstance> = new Map();
  private currentNetwork: string = "flowEvmTestnet";

  constructor() {
    this.initializeApiClients();
  }

  /**
   * Initialize API clients for all supported networks
   */
  private initializeApiClients(): void {
    Object.entries(BLOCKSCOUT_NETWORKS).forEach(([networkKey, network]) => {
      const client = axios.create({
        baseURL: network.apiUrl,
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      // Add request interceptor for logging
      client.interceptors.request.use(
        config => {
          console.log(
            `[Blockscout API] ${config.method?.toUpperCase()} ${config.url}`
          );
          return config;
        },
        error => Promise.reject(error)
      );

      // Add response interceptor for error handling
      client.interceptors.response.use(
        response => response,
        error => {
          console.error(`[Blockscout API Error] ${error.message}`);
          return Promise.reject(error);
        }
      );

      this.apiClients.set(networkKey, client);
    });
  }

  /**
   * Set the current network for API calls
   */
  setNetwork(networkKey: string): void {
    if (!BLOCKSCOUT_NETWORKS[networkKey]) {
      throw new Error(`Unsupported network: ${networkKey}`);
    }
    this.currentNetwork = networkKey;
  }

  /**
   * Get the current API client
   */
  private getApiClient(): AxiosInstance {
    const client = this.apiClients.get(this.currentNetwork);
    if (!client) {
      throw new Error(
        `API client not found for network: ${this.currentNetwork}`
      );
    }
    return client;
  }

  /**
   * Get the current network configuration
   */
  getCurrentNetwork(): BlockscoutNetwork {
    return BLOCKSCOUT_NETWORKS[this.currentNetwork];
  }

  /**
   * Generate Blockscout explorer URL for various entities
   */
  getExplorerUrl(
    type: "tx" | "address" | "block" | "token",
    identifier: string
  ): string {
    const network = this.getCurrentNetwork();
    const baseUrl = network.explorerUrl;

    switch (type) {
      case "tx":
        return `${baseUrl}/tx/${identifier}`;
      case "address":
        return `${baseUrl}/address/${identifier}`;
      case "block":
        return `${baseUrl}/block/${identifier}`;
      case "token":
        return `${baseUrl}/token/${identifier}`;
      default:
        return baseUrl;
    }
  }

  // Transaction Methods
  /**
   * Get transaction information by hash
   */
  async getTransaction(hash: string): Promise<TransactionInfo | null> {
    try {
      const client = this.getApiClient();
      const response = await client.get(`/v2/transactions/${hash}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching transaction:", error);
      return null;
    }
  }

  /**
   * Get transactions for an address
   */
  async getAddressTransactions(
    address: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<TransactionInfo[]> {
    try {
      const client = this.getApiClient();
      const params = {
        page: options.page || 1,
        limit: options.limit || 50,
      };

      const response = await client.get(
        `/v2/addresses/${address}/transactions`,
        { params }
      );
      return response.data.items || [];
    } catch (error) {
      console.error("Error fetching address transactions:", error);
      return [];
    }
  }

  // Address Methods
  /**
   * Get address information
   */
  async getAddressInfo(address: string): Promise<AddressInfo | null> {
    try {
      const client = this.getApiClient();
      const response = await client.get(`/v2/addresses/${address}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching address info:", error);
      return null;
    }
  }

  /**
   * Get address balance
   */
  async getAddressBalance(address: string): Promise<string | null> {
    try {
      const addressInfo = await this.getAddressInfo(address);
      return addressInfo?.balance || null;
    } catch (error) {
      console.error("Error fetching address balance:", error);
      return null;
    }
  }

  // Contract Methods
  /**
   * Get contract information
   */
  async getContractInfo(address: string): Promise<ContractInfo | null> {
    try {
      const client = this.getApiClient();
      const response = await client.get(`/v2/smart-contracts/${address}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching contract info:", error);
      return null;
    }
  }

  /**
   * Verify contract on Blockscout
   */
  async verifyContract(
    address: string,
    sourceCode: string,
    contractName: string,
    compilerVersion: string,
    optimizationEnabled: boolean = true
  ): Promise<boolean> {
    try {
      const client = this.getApiClient();
      const response = await client.post(
        "/v2/smart-contracts/verification/via-sourcify",
        {
          address,
          source_code: sourceCode,
          contract_name: contractName,
          compiler_version: compilerVersion,
          optimization_enabled: optimizationEnabled,
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error("Error verifying contract:", error);
      return false;
    }
  }

  // Merits API Methods
  /**
   * Get user's Merits balance
   */
  async getMeritsBalance(userId: string): Promise<MeritsBalance | null> {
    try {
      const network = this.getCurrentNetwork();
      if (!network.meritsApiUrl) {
        console.warn("Merits API not available for current network");
        return null;
      }

      const response = await axios.get(
        `${network.meritsApiUrl}/balance/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching Merits balance:", error);
      return null;
    }
  }

  /**
   * Award Merits to a user
   */
  async awardMerits(
    userId: string,
    amount: number,
    description: string,
    metadata?: Record<string, any>
  ): Promise<MeritsTransaction | null> {
    try {
      const network = this.getCurrentNetwork();
      if (!network.meritsApiUrl) {
        console.warn("Merits API not available for current network");
        return null;
      }

      const response = await axios.post(`${network.meritsApiUrl}/award`, {
        user_id: userId,
        amount,
        description,
        metadata,
      });

      return response.data;
    } catch (error) {
      console.error("Error awarding Merits:", error);
      return null;
    }
  }

  /**
   * Get user's Merits transaction history
   */
  async getMeritsHistory(
    userId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<MeritsTransaction[]> {
    try {
      const network = this.getCurrentNetwork();
      if (!network.meritsApiUrl) {
        console.warn("Merits API not available for current network");
        return [];
      }

      const params = {
        page: options.page || 1,
        limit: options.limit || 50,
      };

      const response = await axios.get(
        `${network.meritsApiUrl}/history/${userId}`,
        { params }
      );
      return response.data.items || [];
    } catch (error) {
      console.error("Error fetching Merits history:", error);
      return [];
    }
  }

  // Address Tagging Methods
  /**
   * Create private address tag
   */
  async createAddressTag(
    address: string,
    name: string,
    apiKey: string
  ): Promise<boolean> {
    try {
      const client = this.getApiClient();
      const response = await client.post(
        "/api/account/v1/user/tags/address",
        {
          address_hash: address,
          name,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error("Error creating address tag:", error);
      return false;
    }
  }

  /**
   * Create private transaction tag
   */
  async createTransactionTag(
    txHash: string,
    name: string,
    apiKey: string
  ): Promise<boolean> {
    try {
      const client = this.getApiClient();
      const response = await client.post(
        "/api/account/v1/user/tags/transaction",
        {
          transaction_hash: txHash,
          name,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error("Error creating transaction tag:", error);
      return false;
    }
  }

  /**
   * Add address to watchlist
   */
  async addToWatchlist(
    address: string,
    name: string,
    notificationSettings: any,
    apiKey: string
  ): Promise<boolean> {
    try {
      const client = this.getApiClient();
      const response = await client.post(
        "/api/account/v1/user/watchlist",
        {
          address_hash: address,
          name,
          notification_settings: notificationSettings,
          notification_methods: {
            email: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      return response.status === 200;
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      return false;
    }
  }

  // Utility Methods
  /**
   * Check if transaction is confirmed
   */
  async isTransactionConfirmed(txHash: string): Promise<boolean> {
    try {
      const txInfo = await this.getTransaction(txHash);
      return txInfo?.status === "ok" || txInfo?.status === "success";
    } catch (error) {
      console.error("Error checking transaction confirmation:", error);
      return false;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransactionConfirmation(
    txHash: string,
    maxAttempts: number = 30,
    intervalMs: number = 2000
  ): Promise<TransactionInfo | null> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const txInfo = await this.getTransaction(txHash);
        if (txInfo && (txInfo.status === "ok" || txInfo.status === "success")) {
          return txInfo;
        }

        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
      } catch (error) {
        console.error(
          `Error checking transaction ${txHash} (attempt ${attempt + 1}):`,
          error
        );
      }
    }

    return null;
  }

  /**
   * Get network statistics
   */
  async getNetworkStats(): Promise<any> {
    try {
      const client = this.getApiClient();
      const response = await client.get("/v2/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching network stats:", error);
      return null;
    }
  }
}
