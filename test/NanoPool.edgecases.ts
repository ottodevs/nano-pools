import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import assert from "node:assert/strict";
import { parseEther, formatEther, getAddress } from "viem";

describe("NanoPool - Edge Cases and Boundary Conditions", function () {
  let nanoPool: any;
  let testAccounts: any[];
  let initiator: `0x${string}`;
  let beneficiary: `0x${string}`;
  let contributor1: `0x${string}`;
  let contributor2: `0x${string}`;
  let maliciousUser: `0x${string}`;
  let viem: any;

  beforeEach(async function () {
    // Connect to the network and deploy fresh contract for each test
    const networkConnection = await network.connect();
    viem = networkConnection.viem;
    
    // Deploy NanoPool contract
    nanoPool = await viem.deployContract("NanoPool");
    
    // Get test accounts
    testAccounts = await viem.getWalletClients();
    initiator = getAddress(testAccounts[0].account.address);
    beneficiary = getAddress(testAccounts[1].account.address);
    contributor1 = getAddress(testAccounts[2].account.address);
    contributor2 = getAddress(testAccounts[3].account.address);
    maliciousUser = getAddress(testAccounts[4].account.address);
  });

  describe("Pool Creation Edge Cases", function () {
    it("Should reject pool creation with zero address beneficiary", async function () {
      const goalAmount = parseEther("1");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);
      
      try {
        await nanoPool.write.createPool([
          "0x0000000000000000000000000000000000000000",
          "Test Pool",
          goalAmount,
          deadline
        ]);
        assert.fail("Should have reverted with zero address");
      } catch (error: any) {
        assert.ok(error.message.includes("Beneficiary cannot be zero address"));
      }
    });

    it("Should reject pool creation with zero goal amount", async function () {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);
      
      try {
        await nanoPool.write.createPool([
          beneficiary,
          "Test Pool",
          0n,
          deadline
        ]);
        assert.fail("Should have reverted with zero goal amount");
      } catch (error: any) {
        assert.ok(error.message.includes("Goal amount must be greater than zero"));
      }
    });

    it("Should reject pool creation with past deadline", async function () {
      const goalAmount = parseEther("1");
      const pastDeadline = BigInt(Math.floor(Date.now() / 1000) - 3600); // 1 hour ago
      
      try {
        await nanoPool.write.createPool([
          beneficiary,
          "Test Pool",
          goalAmount,
          pastDeadline
        ]);
        assert.fail("Should have reverted with past deadline");
      } catch (error: any) {
        assert.ok(error.message.includes("Deadline must be in the future"));
      }
    });

    it("Should handle very large goal amounts", async function () {
      const veryLargeGoal = parseEther("1000000"); // 1 million ETH
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);
      
      // Should not revert for large but valid amounts
      await nanoPool.write.createPool([
        beneficiary,
        "Large Goal Pool",
        veryLargeGoal,
        deadline
      ]);
      
      const poolDetails = await nanoPool.read.getPoolDetails([1n]);
      assert.equal(poolDetails[3], veryLargeGoal, "Large goal amount should be stored correctly");
    });

    it("Should handle very small goal amounts", async function () {
      const verySmallGoal = 1n; // 1 wei
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);
      
      await nanoPool.write.createPool([
        beneficiary,
        "Small Goal Pool",
        verySmallGoal,
        deadline
      ]);
      
      const poolDetails = await nanoPool.read.getPoolDetails([1n]);
      assert.equal(poolDetails[3], verySmallGoal, "Small goal amount should be stored correctly");
    });

    it("Should handle empty description", async function () {
      const goalAmount = parseEther("1");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);
      
      await nanoPool.write.createPool([
        beneficiary,
        "", // Empty description
        goalAmount,
        deadline
      ]);
      
      const poolDetails = await nanoPool.read.getPoolDetails([1n]);
      assert.equal(poolDetails[2], "", "Empty description should be allowed");
    });

    it("Should handle very long description", async function () {
      const goalAmount = parseEther("1");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);
      const longDescription = "A".repeat(1000); // 1000 character description
      
      await nanoPool.write.createPool([
        beneficiary,
        longDescription,
        goalAmount,
        deadline
      ]);
      
      const poolDetails = await nanoPool.read.getPoolDetails([1n]);
      assert.equal(poolDetails[2], longDescription, "Long description should be stored correctly");
    });

    it("Should handle deadline at exact current timestamp", async function () {
      const goalAmount = parseEther("1");
      const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
      
      try {
        await nanoPool.write.createPool([
          beneficiary,
          "Current Time Pool",
          goalAmount,
          currentTimestamp
        ]);
        assert.fail("Should have reverted for current timestamp deadline");
      } catch (error: any) {
        assert.ok(error.message.includes("Deadline must be in the future"));
      }
    });

    it("Should handle very far future deadline", async function () {
      const goalAmount = parseEther("1");
      const farFutureDeadline = BigInt(Math.floor(Date.now() / 1000) + 31536000); // 1 year from now
      
      await nanoPool.write.createPool([
        beneficiary,
        "Far Future Pool",
        goalAmount,
        farFutureDeadline
      ]);
      
      const poolDetails = await nanoPool.read.getPoolDetails([1n]);
      assert.equal(poolDetails[5], farFutureDeadline, "Far future deadline should be stored correctly");
    });
  });

  describe("Contribution Edge Cases", function () {
    beforeEach(async function () {
      // Create a test pool for contribution tests
      const goalAmount = parseEther("1");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);
      
      await nanoPool.write.createPool([
        beneficiary,
        "Test Pool",
        goalAmount,
        deadline
      ]);
    });

    it("Should reject zero value contributions", async function () {
      const contributor1Client = await viem.getWalletClient(contributor1);
      
      try {
        await contributor1Client.writeContract({
          address: nanoPool.address,
          abi: nanoPool.abi,
          functionName: "contribute",
          args: [1n],
          value: 0n,
        });
        assert.fail("Should have reverted with zero contribution");
      } catch (error: any) {
        assert.ok(error.message.includes("Contribution amount must be greater than zero"));
      }
    });

    it("Should reject contributions to non-existent pool", async function () {
      const contributor1Client = await viem.getWalletClient(contributor1);
      
      try {
        await contributor1Client.writeContract({
          address: nanoPool.address,
          abi: nanoPool.abi,
          functionName: "contribute",
          args: [999n], // Non-existent pool
          value: parseEther("0.1"),
        });
        assert.fail("Should have reverted for non-existent pool");
      } catch (error: any) {
        assert.ok(error.message.includes("Pool does not exist"));
      }
    });

    it("Should handle very small contributions", async function () {
      const verySmallContribution = 1n; // 1 wei
      const contributor1Client = await viem.getWalletClient(contributor1);
      
      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: verySmallContribution,
      });
      
      const recordedContribution = await nanoPool.read.getContribution([1n, contributor1]);
      assert.equal(recordedContribution, verySmallContribution, "Very small contribution should be recorded");
    });

    it("Should handle very large contributions", async function () {
      const veryLargeContribution = parseEther("100"); // 100 ETH
      const contributor1Client = await viem.getWalletClient(contributor1);
      
      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: veryLargeContribution,
      });
      
      const recordedContribution = await nanoPool.read.getContribution([1n, contributor1]);
      assert.equal(recordedContribution, veryLargeContribution, "Very large contribution should be recorded");
    });

    it("Should handle contribution that exactly meets goal", async function () {
      const goalAmount = parseEther("1");
      const contributor1Client = await viem.getWalletClient(contributor1);
      
      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: goalAmount, // Exact goal amount
      });
      
      const poolDetails = await nanoPool.read.getPoolDetails([1n]);
      assert.equal(poolDetails[6], true, "Goal should be achieved with exact contribution");
      assert.equal(poolDetails[4], goalAmount, "Current amount should equal goal");
    });

    it("Should handle contribution that exceeds goal by 1 wei", async function () {
      const goalAmount = parseEther("1");
      const excessContribution = goalAmount + 1n; // 1 wei over goal
      const contributor1Client = await viem.getWalletClient(contributor1);
      
      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: excessContribution,
      });
      
      const poolDetails = await nanoPool.read.getPoolDetails([1n]);
      assert.equal(poolDetails[6], true, "Goal should be achieved with excess contribution");
      assert.equal(poolDetails[4], excessContribution, "Current amount should include excess");
    });

    it("Should handle multiple contributions that accumulate to goal", async function () {
      const goalAmount = parseEther("1");
      const contribution1 = parseEther("0.3");
      const contribution2 = parseEther("0.3");
      const contribution3 = parseEther("0.4"); // Total = 1.0 ETH
      
      const contributor1Client = await viem.getWalletClient(contributor1);
      const contributor2Client = await viem.getWalletClient(contributor2);
      
      // First contribution
      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: contribution1,
      });
      
      let poolDetails = await nanoPool.read.getPoolDetails([1n]);
      assert.equal(poolDetails[6], false, "Goal should not be achieved yet");
      
      // Second contribution
      await contributor2Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: contribution2,
      });
      
      poolDetails = await nanoPool.read.getPoolDetails([1n]);
      assert.equal(poolDetails[6], false, "Goal should still not be achieved");
      
      // Third contribution that achieves goal
      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: contribution3,
      });
      
      poolDetails = await nanoPool.read.getPoolDetails([1n]);
      assert.equal(poolDetails[6], true, "Goal should be achieved after third contribution");
      assert.equal(poolDetails[4], goalAmount, "Current amount should equal goal");
    });
  });
});
