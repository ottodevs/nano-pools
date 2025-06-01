/**
 * Deploy CREATE2 Factory for deterministic deployments
 * This script deploys the same factory to both Flow EVM testnet and World Chain Sepolia
 */

import { ethers } from "hardhat";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

interface DeploymentRecord {
  network: string;
  chainId: number;
  factoryAddress: string;
  deploymentTx: string;
  blockNumber: number;
  timestamp: number;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("Deploying CREATE2 Factory...");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Deploy CREATE2 Factory
  const Create2Factory = await ethers.getContractFactory("Create2Factory");
  const factory = await Create2Factory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  const deploymentTx = factory.deploymentTransaction();
  
  console.log("CREATE2 Factory deployed to:", factoryAddress);
  console.log("Deployment transaction:", deploymentTx?.hash);
  
  // Get deployment details
  const receipt = await deploymentTx?.wait();
  const block = await ethers.provider.getBlock(receipt?.blockNumber || 0);
  
  // Save deployment record
  const deploymentRecord: DeploymentRecord = {
    network: network.name,
    chainId: Number(network.chainId),
    factoryAddress,
    deploymentTx: deploymentTx?.hash || "",
    blockNumber: receipt?.blockNumber || 0,
    timestamp: block?.timestamp || 0,
  };

  // Load existing deployments or create new array
  const deploymentsFile = join(process.cwd(), "deployments", "create2-factory.json");
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
  writeFileSync(deploymentsFile, JSON.stringify(deployments, null, 2));
  
  console.log("Deployment record saved to:", deploymentsFile);
  
  // Verify the deployment
  console.log("\nVerifying deployment...");
  const code = await ethers.provider.getCode(factoryAddress);
  console.log("Contract code length:", code.length);
  console.log("Deployment successful:", code.length > 2);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
