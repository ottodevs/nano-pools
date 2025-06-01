import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("NanoPoolWithCreate2Module", (m) => {
  // First, get the CREATE2 Factory (assuming it's already deployed)
  const create2Factory = m.contractAt("Create2Factory", "0x20aD2b34860A7A44E548D4C740845A18C6753ba0");

  // Deploy the NanoPool contract using CREATE2 for deterministic address
  const salt = "0x" + Buffer.from("nano-pool-v1", "utf8").toString("hex").padEnd(64, "0");
  
  // Deploy NanoPool using CREATE2
  const nanoPool = m.contract("NanoPool");

  // Set up parameters for a sample pool
  const beneficiaryAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Sample address
  const description = "Flow EVM Testnet Pool";
  const goalAmount = 10000000000000000n; // 0.01 ETH
  const oneWeekFromNow = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60); // 1 week from now

  // Create a sample pool
  m.call(
    nanoPool,
    "createPool",
    [beneficiaryAddress, description, goalAmount, oneWeekFromNow]
  );

  // Return contracts for reference
  return { create2Factory, nanoPool };
});
