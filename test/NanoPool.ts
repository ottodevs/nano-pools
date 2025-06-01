import { describe, it } from "node:test";
import { network } from "hardhat";
import assert from "node:assert/strict";

describe("NanoPool", function () {
  it("Should deploy the NanoPool contract", async function () {
    // Connect to the network
    const { viem } = await network.connect();
    
    // Deploy NanoPool contract
    const nanoPool = await viem.deployContract("NanoPool");
    
    // Verify the contract was deployed
    const address = nanoPool.address;
    assert.ok(address.startsWith("0x"), "Contract should be deployed with a valid address");
  });
  
  it("Should create a pool with valid parameters", async function () {
    // Connect to the network
    const { viem } = await network.connect();
    
    // Deploy NanoPool contract
    const nanoPool = await viem.deployContract("NanoPool");
    
    // Get wallet clients
    const testAccounts = await viem.getWalletClients();
    const initiator = testAccounts[0].account.address;
    const beneficiary = testAccounts[1].account.address;
    
    // Create a pool
    const oneEther = 1000000000000000000n; // 1 ether in wei
    const now = BigInt(Math.floor(Date.now() / 1000));
    const deadline = now + 86400n; // 1 day from now
    
    // Create pool
    await nanoPool.write.createPool([
      beneficiary,
      "Test Pool",
      oneEther,
      deadline
    ]);
    
    // Assume pool ID is 1 for the first pool
    const poolId = 1n;
    
    try {
      // Get pool details
      const result = await nanoPool.read.getPoolDetails([poolId]);
      const poolDetails = result as unknown as [
        `0x${string}`, // initiator
        `0x${string}`, // beneficiary
        string,        // description
        bigint,        // goalAmount
        bigint,        // currentAmount
        bigint,        // deadlineTimestamp
        boolean,       // goalAchieved
        boolean        // fundsDisbursed
      ];
      
      // Assertions
      assert.equal(poolDetails[0], initiator, "Initiator should match");
      assert.equal(poolDetails[1], beneficiary, "Beneficiary should match");
      assert.equal(poolDetails[2], "Test Pool", "Description should match");
      assert.equal(poolDetails[3], oneEther, "Goal amount should match");
      assert.equal(poolDetails[4], 0n, "Initial current amount should be 0");
      assert.equal(poolDetails[5], deadline, "Deadline should match");
      assert.equal(poolDetails[6], false, "Goal should not be achieved initially");
      assert.equal(poolDetails[7], false, "Funds should not be disbursed initially");
    } catch (error) {
      assert.fail(`Failed to get pool details: ${error}`);
    }
  });
  
  it("Should allow contributions to a pool", async function () {
    // Connect to the network
    const { viem } = await network.connect();
    
    // Deploy NanoPool contract
    const nanoPool = await viem.deployContract("NanoPool");
    
    // Get wallet clients
    const testAccounts = await viem.getWalletClients();
    const initiator = testAccounts[0].account.address;
    const beneficiary = testAccounts[1].account.address;
    const contributor = testAccounts[2].account.address;
    
    // Create a pool
    const oneEther = 1000000000000000000n; // 1 ether in wei
    const now = BigInt(Math.floor(Date.now() / 1000));
    const deadline = now + 86400n; // 1 day from now
    
    await nanoPool.write.createPool([
      beneficiary,
      "Test Pool",
      oneEther,
      deadline
    ]);
    
    // Assume pool ID is 1 for the first pool
    const poolId = 1n;
    
    // Make a contribution
    const halfEther = oneEther / 2n;
    const contributorClient = await viem.getWalletClient(contributor);
    
    await contributorClient.writeContract({
      address: nanoPool.address,
      abi: nanoPool.abi,
      functionName: "contribute",
      args: [poolId],
      value: halfEther,
    });
    
    try {
      // Verify contribution was recorded
      const contributionAmount = await nanoPool.read.getContribution([poolId, contributor]) as unknown as bigint;
      assert.equal(contributionAmount, halfEther, "Contribution amount should be recorded correctly");
      
      // Get updated pool details
      const result = await nanoPool.read.getPoolDetails([poolId]);
      const poolDetails = result as unknown as [
        `0x${string}`, // initiator
        `0x${string}`, // beneficiary
        string,        // description
        bigint,        // goalAmount
        bigint,        // currentAmount
        bigint,        // deadlineTimestamp
        boolean,       // goalAchieved
        boolean        // fundsDisbursed
      ];
      assert.equal(poolDetails[4], halfEther, "Current amount should be updated");
      
      // Get contributors list
      const contributorsResult = await nanoPool.read.getContributors([poolId]);
      const contributors = contributorsResult as unknown as `0x${string}`[];
      assert.equal(contributors.length, 1, "Should have 1 contributor");
      assert.equal(contributors[0], contributor, "Contributor should be in the list");
    } catch (error) {
      assert.fail(`Test failed: ${error}`);
    }
  });
});