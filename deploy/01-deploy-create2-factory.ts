/**
 * Deploy CREATE2 Factory for deterministic deployments
 * This script deploys the same factory to both Flow EVM testnet and World Chain Sepolia
 */

import hre from "hardhat";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { formatEther, parseEther } from "viem";

interface DeploymentRecord {
  network: string;
  chainId: number;
  factoryAddress: string;
  deploymentTx: string;
  blockNumber: number;
  timestamp: number;
}

async function main() {
  const publicClient = await hre.viem.getPublicClient();
  const [deployer] = await hre.viem.getWalletClients();

  console.log("Deploying CREATE2 Factory...");
  console.log("Network:", publicClient.chain?.name || "Unknown");
  console.log("Chain ID:", publicClient.chain?.id.toString() || "Unknown");
  console.log("Deployer:", deployer.account.address);

  const balance = await publicClient.getBalance({
    address: deployer.account.address,
  });
  console.log("Balance:", formatEther(balance), "ETH");

  // Deploy CREATE2 Factory
  const factory = await hre.viem.deployContract("Create2Factory");

  console.log("CREATE2 Factory deployed to:", factory.address);
  console.log("Deployment transaction:", factory.transactionHash);

  // Get deployment details
  const receipt = await publicClient.getTransactionReceipt({
    hash: factory.transactionHash,
  });
  const block = await publicClient.getBlock({
    blockNumber: receipt.blockNumber,
  });

  // Save deployment record
  const deploymentRecord: DeploymentRecord = {
    network: publicClient.chain?.name || "Unknown",
    chainId: publicClient.chain?.id || 0,
    factoryAddress: factory.address,
    deploymentTx: factory.transactionHash,
    blockNumber: Number(receipt.blockNumber),
    timestamp: Number(block.timestamp),
  };

  // Load existing deployments or create new array
  const deploymentsFile = join(
    process.cwd(),
    "deployments",
    "create2-factory.json"
  );
  let deployments: DeploymentRecord[] = [];

  if (existsSync(deploymentsFile)) {
    try {
      const existing = readFileSync(deploymentsFile, "utf8");
      deployments = JSON.parse(existing);
    } catch (error) {
      console.log("Creating new deployments file");
    }
  }

  // Add or update deployment for this network
  const existingIndex = deployments.findIndex(
    d => d.chainId === (publicClient.chain?.id || 0)
  );
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
  writeFileSync(deploymentsFile, JSON.stringify(deployments, null, 2));

  console.log("Deployment record saved to:", deploymentsFile);

  // Verify the deployment
  console.log("\nVerifying deployment...");
  const code = await publicClient.getCode({ address: factory.address });
  console.log("Contract code length:", code?.length || 0);
  console.log("Deployment successful:", (code?.length || 0) > 2);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
