/**
 * Deploy Pool Payments Protocol with Blockscout Integration
 * Automatically verifies contracts and sets up monitoring
 */

import { ethers } from "hardhat";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { BlockscoutService, BLOCKSCOUT_NETWORKS } from "../src/services/BlockscoutService";

interface BlockscoutDeployment {
  network: string;
  chainId: number;
  contractAddress: string;
  deploymentTx: string;
  blockNumber: number;
  verified: boolean;
  blockscoutUrl: string;
  meritsEnabled: boolean;
  timestamp: number;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("🚀 Deploying Pool Payments Protocol with Blockscout Integration...");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Initialize Blockscout service
  const blockscoutService = new BlockscoutService();
  
  // Determine network key for Blockscout
  let networkKey: string;
  if (network.chainId === 545n) {
    networkKey = 'flowEvmTestnet';
  } else if (network.chainId === 4801n) {
    networkKey = 'worldChainSepolia';
  } else {
    throw new Error(`Unsupported network for Blockscout integration: ${network.chainId}`);
  }

  blockscoutService.setNetwork(networkKey);
  const blockscoutNetwork = BLOCKSCOUT_NETWORKS[networkKey];
  
  console.log("🔍 Blockscout Explorer:", blockscoutNetwork.explorerUrl);

  // Deploy CREATE2 Factory first if not exists
  console.log("\n1. Checking CREATE2 Factory...");
  const deploymentsFile = join(process.cwd(), "deployments", "create2-factory.json");
  let factoryAddress: string;
  
  if (existsSync(deploymentsFile)) {
    const factoryDeployments = JSON.parse(readFileSync(deploymentsFile, "utf8"));
    const factoryDeployment = factoryDeployments.find((d: any) => d.chainId === Number(network.chainId));
    
    if (factoryDeployment) {
      factoryAddress = factoryDeployment.factoryAddress;
      console.log("✅ Using existing CREATE2 Factory:", factoryAddress);
    } else {
      throw new Error("CREATE2 Factory not deployed for this network. Run deploy/01-deploy-create2-factory.ts first");
    }
  } else {
    throw new Error("CREATE2 Factory deployments file not found. Run deploy/01-deploy-create2-factory.ts first");
  }

  // Deploy Pool Payments Contract using CREATE2
  console.log("\n2. Deploying Pool Payments Contract...");
  
  // For this example, we'll deploy a simple Lock contract
  // In a real implementation, this would be your Pool Payments contract
  const contractName = "Lock";
  const unlockTime = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year from now
  const constructorArgs = [unlockTime];

  const ContractFactory = await ethers.getContractFactory(contractName);
  const deploymentData = ContractFactory.getDeployTransaction(...constructorArgs);
  const bytecode = deploymentData.data;

  if (!bytecode) {
    throw new Error("Failed to get contract bytecode");
  }

  // Use CREATE2 for deterministic deployment
  const factory = await ethers.getContractAt("Create2Factory", factoryAddress);
  const salt = ethers.keccak256(ethers.toUtf8Bytes("pool-payments-v1"));
  
  // Compute the address
  const computedAddress = await factory.computeAddress(bytecode, salt);
  console.log("Computed contract address:", computedAddress);

  // Check if already deployed
  const existingCode = await ethers.provider.getCode(computedAddress);
  let deploymentTx: any;
  let receipt: any;
  
  if (existingCode !== "0x") {
    console.log("✅ Contract already deployed at:", computedAddress);
    // Get deployment transaction from previous deployment
    deploymentTx = { hash: "existing" };
    receipt = { blockNumber: 0 };
  } else {
    // Deploy using CREATE2
    console.log("📦 Deploying contract...");
    deploymentTx = await factory.deploy(bytecode, salt);
    receipt = await deploymentTx.wait();
    console.log("✅ Contract deployed at:", computedAddress);
    console.log("📄 Deployment transaction:", deploymentTx.hash);
  }

  // 3. Verify contract on Blockscout
  console.log("\n3. Verifying contract on Blockscout...");
  let verified = false;
  
  try {
    // Get contract source code (simplified for demo)
    const sourceCode = `
      // SPDX-License-Identifier: UNLICENSED
      pragma solidity ^0.8.24;
      
      contract Lock {
          uint public unlockTime;
          address payable public owner;
          
          constructor(uint _unlockTime) payable {
              require(block.timestamp < _unlockTime, "Unlock time should be in the future");
              unlockTime = _unlockTime;
              owner = payable(msg.sender);
          }
      }
    `;

    verified = await blockscoutService.verifyContract(
      computedAddress,
      sourceCode,
      contractName,
      "0.8.28",
      true
    );

    if (verified) {
      console.log("✅ Contract verified on Blockscout");
    } else {
      console.log("⚠️ Contract verification failed (may already be verified)");
    }
  } catch (error) {
    console.log("⚠️ Contract verification error:", error);
  }

  // 4. Set up Blockscout monitoring
  console.log("\n4. Setting up Blockscout monitoring...");
  
  try {
    // Create address tag (requires API key in production)
    const apiKey = process.env.BLOCKSCOUT_API_KEY;
    if (apiKey) {
      await blockscoutService.createAddressTag(
        computedAddress,
        "Pool Payments Protocol",
        apiKey
      );
      console.log("✅ Address tagged on Blockscout");

      // Add to watchlist
      const notificationSettings = {
        native: { incoming: true, outcoming: true },
        'ERC-20': { incoming: true, outcoming: true },
        'ERC-721': { incoming: false, outcoming: false },
      };

      await blockscoutService.addToWatchlist(
        computedAddress,
        "Pool Payments Contract",
        notificationSettings,
        apiKey
      );
      console.log("✅ Contract added to Blockscout watchlist");
    } else {
      console.log("⚠️ No API key provided, skipping tagging and watchlist");
    }
  } catch (error) {
    console.log("⚠️ Monitoring setup error:", error);
  }

  // 5. Test Merits integration
  console.log("\n5. Testing Merits integration...");
  
  try {
    const userId = process.env.BLOCKSCOUT_USER_ID || "demo-user";
    
    // Award Merits for successful deployment
    const meritsTransaction = await blockscoutService.awardMerits(
      userId,
      25,
      "Pool Payments Contract Deployment",
      {
        contractAddress: computedAddress,
        network: networkKey,
        deploymentTx: deploymentTx.hash,
        timestamp: new Date().toISOString(),
      }
    );

    if (meritsTransaction) {
      console.log("🏆 Awarded 25 Merits for contract deployment");
    } else {
      console.log("⚠️ Merits award failed (API may not be available)");
    }

    // Get Merits balance
    const meritsBalance = await blockscoutService.getMeritsBalance(userId);
    if (meritsBalance) {
      console.log(`💰 Current Merits balance: ${meritsBalance.balance}`);
    }
  } catch (error) {
    console.log("⚠️ Merits integration error:", error);
  }

  // 6. Save deployment record
  console.log("\n6. Saving deployment record...");
  
  const deploymentRecord: BlockscoutDeployment = {
    network: network.name,
    chainId: Number(network.chainId),
    contractAddress: computedAddress,
    deploymentTx: deploymentTx.hash,
    blockNumber: receipt?.blockNumber || 0,
    verified,
    blockscoutUrl: blockscoutService.getExplorerUrl('address', computedAddress),
    meritsEnabled: !!blockscoutNetwork.meritsApiUrl,
    timestamp: Date.now(),
  };

  // Load existing deployments
  const blockscoutDeploymentsFile = join(process.cwd(), "deployments", "blockscout-deployments.json");
  let deployments: BlockscoutDeployment[] = [];
  
  if (existsSync(blockscoutDeploymentsFile)) {
    try {
      const existing = readFileSync(blockscoutDeploymentsFile, "utf8");
      deployments = JSON.parse(existing);
    } catch (error) {
      console.log("Creating new Blockscout deployments file");
    }
  }

  // Add or update deployment for this network
  const existingIndex = deployments.findIndex(d => d.chainId === Number(network.chainId));
  if (existingIndex >= 0) {
    deployments[existingIndex] = deploymentRecord;
  } else {
    deployments.push(deploymentRecord);
  }

  // Ensure deployments directory exists
  const deploymentsDir = join(process.cwd(), "deployments");
  if (!existsSync(deploymentsDir)) {
    require("fs").mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save updated deployments
  writeFileSync(blockscoutDeploymentsFile, JSON.stringify(deployments, null, 2));
  
  console.log("📁 Deployment record saved to:", blockscoutDeploymentsFile);

  // 7. Display summary
  console.log("\n🎉 Blockscout Integration Complete!");
  console.log("=====================================");
  console.log(`📍 Contract Address: ${computedAddress}`);
  console.log(`🔍 Blockscout URL: ${deploymentRecord.blockscoutUrl}`);
  console.log(`✅ Verified: ${verified ? 'Yes' : 'No'}`);
  console.log(`🏆 Merits Enabled: ${deploymentRecord.meritsEnabled ? 'Yes' : 'No'}`);
  console.log(`🌐 Network: ${blockscoutNetwork.name}`);
  
  console.log("\n📋 Next Steps:");
  console.log("1. Visit the Blockscout URL to view your contract");
  console.log("2. Set up frontend integration using BlockscoutIntegration component");
  console.log("3. Configure user authentication for Merits rewards");
  console.log("4. Monitor transactions using the usePoolPaymentsBlockscout hook");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
