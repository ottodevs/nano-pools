/**
 * Deploy contracts using CREATE2 for identical addresses across chains
 */

import { ethers } from "hardhat";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

interface Create2Deployment {
  contractName: string;
  salt: string;
  computedAddress: string;
  actualAddress: string;
  network: string;
  chainId: number;
  deploymentTx: string;
  blockNumber: number;
  constructorArgs: any[];
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("Deploying contracts with CREATE2...");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  console.log("Deployer:", deployer.address);

  // Load CREATE2 Factory address
  const deploymentsFile = join(process.cwd(), "deployments", "create2-factory.json");
  if (!existsSync(deploymentsFile)) {
    throw new Error("CREATE2 Factory not deployed. Run 01-deploy-create2-factory.ts first");
  }

  const factoryDeployments = JSON.parse(readFileSync(deploymentsFile, "utf8"));
  const factoryDeployment = factoryDeployments.find((d: any) => d.chainId === Number(network.chainId));
  
  if (!factoryDeployment) {
    throw new Error(`CREATE2 Factory not found for chain ID ${network.chainId}`);
  }

  console.log("Using CREATE2 Factory at:", factoryDeployment.factoryAddress);

  // Get factory contract instance
  const factory = await ethers.getContractAt("Create2Factory", factoryDeployment.factoryAddress);

  // Example: Deploy a simple contract using CREATE2
  // You can replace this with your actual contract deployment
  
  // For demonstration, let's deploy the Lock contract from the sample
  const contractName = "Lock";
  const salt = ethers.keccak256(ethers.toUtf8Bytes("pool-payments-v1")); // Use consistent salt
  const unlockTime = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // 1 year from now
  const constructorArgs = [unlockTime];

  // Get contract factory and prepare bytecode
  const ContractFactory = await ethers.getContractFactory(contractName);
  const deploymentData = ContractFactory.getDeployTransaction(...constructorArgs);
  const bytecode = deploymentData.data;

  if (!bytecode) {
    throw new Error("Failed to get contract bytecode");
  }

  // Compute the address that will be used
  const computedAddress = await factory.computeAddress(bytecode, salt);
  console.log("Computed address:", computedAddress);

  // Check if already deployed
  const existingCode = await ethers.provider.getCode(computedAddress);
  if (existingCode !== "0x") {
    console.log("Contract already deployed at:", computedAddress);
    return;
  }

  // Deploy using CREATE2
  console.log("Deploying contract...");
  const deployTx = await factory.deploy(bytecode, salt);
  const receipt = await deployTx.wait();
  
  console.log("Deployment transaction:", deployTx.hash);
  console.log("Gas used:", receipt?.gasUsed.toString());

  // Verify the deployment
  const deployedCode = await ethers.provider.getCode(computedAddress);
  if (deployedCode === "0x") {
    throw new Error("Deployment failed - no code at computed address");
  }

  console.log("Contract successfully deployed at:", computedAddress);

  // Save deployment record
  const deployment: Create2Deployment = {
    contractName,
    salt,
    computedAddress,
    actualAddress: computedAddress,
    network: network.name,
    chainId: Number(network.chainId),
    deploymentTx: deployTx.hash,
    blockNumber: receipt?.blockNumber || 0,
    constructorArgs,
  };

  // Load existing CREATE2 deployments
  const create2DeploymentsFile = join(process.cwd(), "deployments", "create2-deployments.json");
  let deployments: Create2Deployment[] = [];
  
  if (existsSync(create2DeploymentsFile)) {
    try {
      const existing = readFileSync(create2DeploymentsFile, "utf8");
      deployments = JSON.parse(existing);
    } catch (error) {
      console.log("Creating new CREATE2 deployments file");
    }
  }

  // Add deployment record
  deployments.push(deployment);

  // Save updated deployments
  writeFileSync(create2DeploymentsFile, JSON.stringify(deployments, null, 2));
  
  console.log("CREATE2 deployment record saved to:", create2DeploymentsFile);
  
  // Verify addresses match across networks
  const sameContractDeployments = deployments.filter(d => 
    d.contractName === contractName && d.salt === salt
  );
  
  if (sameContractDeployments.length > 1) {
    console.log("\nAddress verification across networks:");
    const addresses = [...new Set(sameContractDeployments.map(d => d.actualAddress))];
    if (addresses.length === 1) {
      console.log("✅ All deployments have identical addresses:", addresses[0]);
    } else {
      console.log("❌ Address mismatch detected:");
      sameContractDeployments.forEach(d => {
        console.log(`  ${d.network} (${d.chainId}): ${d.actualAddress}`);
      });
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
