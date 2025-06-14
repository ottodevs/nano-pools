import { HardhatUserConfig, configVariable } from "hardhat/config";

import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-ignition";

// Import additional plugins for Hardhat 2.x compatibility
// Note: Some plugins may not be compatible with Hardhat 3.0 yet
// import "@nomicfoundation/hardhat-verify";
// import "hardhat-gas-reporter";
// import "hardhat-contract-sizer";
// import "@openzeppelin/hardhat-upgrades";
// import "hardhat-deploy";

const config: HardhatUserConfig = {
  /*
   * In Hardhat 3, plugins are defined as part of the Hardhat config instead of
   * being based on the side-effect of imports.
   *
   * Note: A `hardhat-toolbox` like plugin for Hardhat 3 hasn't been defined yet,
   * so this list is larger than what you would normally have.
   */
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    /*
     * Hardhat 3 supports different build profiles, allowing you to configure
     * different versions of `solc` and its settings for various use cases.
     *
     * Note: Using profiles is optional, and any Hardhat 2 `solidity` config
     * is still valid in Hardhat 3.
     */
    profiles: {
      /*
       * The default profile is used when no profile is defined or specified
       * in the CLI or by the tasks you are running.
       */
      default: {
        version: "0.8.28",
      },
      /*
       * The production profile is meant to be used for deployments, providing
       * more control over settings for production builds and taking some extra
       * steps to simplify the process of verifying your contracts.
       */
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
    /*
     * Hardhat 3 natively supports remappings and makes extensive use of them
     * internally to fully support npm resolution rules (i.e., it supports
     * transitive dependencies, multiple versions of the same package,
     * monorepos, etc.).
     */
    remappings: [
      /*
       * This remapping is added to the example because most people import
       * forge-std/Test.sol, not forge-std/src/Test.sol.
       *
       * Note: The config currently leaks internal IDs, but this will be fixed
       * in the future.
       */
      "forge-std/=npm/forge-std@1.9.4/src/",
    ],
  },
  /*
   * The `networks` configuration is mostly compatible with Hardhat 2.
   * The key differences right now are:
   *
   * - You must set a `type` for each network, which is either `edr` or `http`,
   *   allowing you to have multiple simulated networks.
   *
   * - You can set a `chainType` for each network, which is either `generic`,
   *   `l1`, or `optimism`. This has two uses. It ensures that you always
   *   connect to the network with the right Chain Type. And, on `edr`
   *   networks, it makes sure that the simulated chain behaves exactly like the
   *   real one. More information about this can be found in the test files.
   *
   * - The `accounts` field of `http` networks can also receive Configuration
   *   Variables, which are values that only get loaded when needed. This allows
   *   Hardhat to still run despite some of its config not being available
   *   (e.g., a missing private key or API key). More info about this can be
   *   found in the "Sending a Transaction to Optimism Sepolia" of the README.
   */
  networks: {
    // Local development networks
    hardhat: {
      type: "edr",
      chainType: "l1",
    },

    // Flow EVM testnet (chainId: 545)
    flowEvmTestnet: {
      type: "http",
      chainType: "generic",
      url: configVariable("FLOW_EVM_TESTNET_RPC_URL"),
      accounts: [configVariable("FLOW_EVM_PRIVATE_KEY")],
      gasPrice: 1000000000, // 1 gwei
      timeout: 60000,
    },

    // World Chain Sepolia testnet (chainId: 4801)
    worldChainSepolia: {
      type: "http",
      chainType: "generic",
      url: configVariable("WORLD_CHAIN_SEPOLIA_RPC_URL"),
      accounts: [configVariable("WORLD_CHAIN_PRIVATE_KEY")],
      gasPrice: 1000000000, // 1 gwei
      timeout: 60000,
    },
  },

  // Configure ignition module deployment
  ignition: {
    // Ignition configuration goes here
  },

  // Etherscan verification configuration (commented out due to Hardhat 3.0 compatibility)
  // etherscan: {
  //   apiKey: {
  //     // Base networks
  //     base: process.env.BASESCAN_API_KEY || "",
  //     baseSepolia: process.env.BASESCAN_API_KEY || "",
  //     // Flow EVM networks
  //     flowEvmMainnet: process.env.FLOWSCAN_API_KEY || "",
  //     flowEvmTestnet: process.env.FLOWSCAN_API_KEY || "",
  //     // World Chain networks
  //     worldChainMainnet: process.env.WORLDCHAIN_API_KEY || "",
  //     worldChainSepolia: process.env.WORLDCHAIN_API_KEY || "",
  //   },
  //   customChains: [
  //     {
  //       network: "baseSepolia",
  //       chainId: 84532,
  //       urls: {
  //         apiURL: "https://api-sepolia.basescan.org/api",
  //         browserURL: "https://sepolia.basescan.org",
  //       },
  //     },
  //     {
  //       network: "flowEvmTestnet",
  //       chainId: 545,
  //       urls: {
  //         apiURL: "https://evm-testnet.flowscan.org/api",
  //         browserURL: "https://evm-testnet.flowscan.org",
  //       },
  //     },
  //     {
  //       network: "flowEvmMainnet",
  //       chainId: 747,
  //       urls: {
  //         apiURL: "https://evm.flowscan.org/api",
  //         browserURL: "https://evm.flowscan.org",
  //       },
  //     },
  //     {
  //       network: "worldChainSepolia",
  //       chainId: 4801,
  //       urls: {
  //         apiURL: "https://worldchain-sepolia.explorer.alchemy.com/api",
  //         browserURL: "https://worldchain-sepolia.explorer.alchemy.com",
  //       },
  //     },
  //     {
  //       network: "worldChainMainnet",
  //       chainId: 480,
  //       urls: {
  //         apiURL: "https://worldchain-mainnet.explorer.alchemy.com/api",
  //         browserURL: "https://worldchain-mainnet.explorer.alchemy.com",
  //       },
  //     },
  //   ],
  // },

  // Gas reporter configuration (commented out due to Hardhat 3.0 compatibility)
  // gasReporter: {
  //   enabled: process.env.REPORT_GAS !== undefined,
  //   currency: "USD",
  //   gasPrice: 21,
  //   coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
  //   excludeContracts: ["contracts/mocks/", "contracts/test/"],
  // },

  // Contract size checker configuration (commented out due to Hardhat 3.0 compatibility)
  // contractSizer: {
  //   alphaSort: true,
  //   disambiguatePaths: false,
  //   runOnCompile: true,
  //   strict: true,
  //   only: [],
  // },

  // Hardhat Deploy configuration (commented out due to Hardhat 3.0 compatibility)
  // namedAccounts: {
  //   deployer: {
  //     default: 0, // First account as deployer
  //     baseSepolia: 0,
  //     flowEvmTestnet: 0,
  //     worldChainSepolia: 0,
  //   },
  //   admin: {
  //     default: 1, // Second account as admin
  //     baseSepolia: 1,
  //     flowEvmTestnet: 1,
  //     worldChainSepolia: 1,
  //   },
  // },

  // Deployment paths (commented out due to Hardhat 3.0 compatibility)
  // paths: {
  //   deploy: "deploy",
  //   deployments: "deployments",
  //   imports: "imports",
  // },
};

export default config;
