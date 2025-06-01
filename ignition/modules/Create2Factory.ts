import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Create2FactoryModule", (m) => {
  // Deploy the CREATE2 Factory contract
  const create2Factory = m.contract("Create2Factory");

  // Return contract for reference
  return { create2Factory };
});
