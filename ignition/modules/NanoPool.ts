import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("NanoPoolModule", (m) => {
  // Deploy the NanoPool contract
  const nanoPool = m.contract("NanoPool");

  // Set up parameters for a sample pool
  const beneficiaryAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Sample address (adjust as needed)
  const description = "Sample Pool for Testing";
  const goalAmount = 10000000000000000n; // 0.01 ETH
  const oneWeekFromNow = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60); // 1 week from now

  // Create a sample pool
  m.call(
    nanoPool,
    "createPool",
    [beneficiaryAddress, description, goalAmount, oneWeekFromNow]
  );

  // Return contract for reference
  return { nanoPool };
});