import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import assert from "node:assert/strict";
import { parseEther, formatEther, getAddress } from "viem";

describe("NanoPool - Fixed Test Suite", function () {
  let nanoPool: any;
  let testAccounts: any[];
  let initiator: `0x${string}`;
  let beneficiary: `0x${string}`;
  let contributor1: `0x${string}`;
  let contributor2: `0x${string}`;
  let maliciousUser: `0x${string}`;
  let viem: any;
  let publicClient: any;

  beforeEach(async function () {
    // Connect to the network and deploy fresh contract for each test
    const networkConnection = await network.connect();
    viem = networkConnection.viem;
    publicClient = viem.getPublicClient();

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

  describe("Contract Deployment", function () {
    it("Should deploy with correct initial state", async function () {
      // Verify contract deployment
      assert.ok(
        nanoPool.address.startsWith("0x"),
        "Contract should have valid address"
      );

      // Verify owner is set correctly (first account)
      const owner = await nanoPool.read.owner();
      assert.equal(
        getAddress(owner),
        initiator,
        "Owner should be the deployer"
      );
    });
  });

  describe("Pool Creation - Normal Lifecycle", function () {
    it("Should create a pool with valid parameters", async function () {
      const goalAmount = parseEther("1");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400); // 1 day from now

      // Create pool
      const hash = await nanoPool.write.createPool([
        beneficiary,
        "Test Pool",
        goalAmount,
        deadline,
      ]);

      // Get pool details
      const poolDetails = await nanoPool.read.getPoolDetails([1n]);

      assert.equal(
        getAddress(poolDetails[0]),
        initiator,
        "Initiator should match"
      );
      assert.equal(
        getAddress(poolDetails[1]),
        beneficiary,
        "Beneficiary should match"
      );
      assert.equal(poolDetails[2], "Test Pool", "Description should match");
      assert.equal(poolDetails[3], goalAmount, "Goal amount should match");
      assert.equal(poolDetails[4], 0n, "Initial current amount should be 0");
      assert.equal(poolDetails[5], deadline, "Deadline should match");
      assert.equal(
        poolDetails[6],
        false,
        "Goal should not be achieved initially"
      );
      assert.equal(
        poolDetails[7],
        false,
        "Funds should not be disbursed initially"
      );
    });

    it("Should increment pool ID for multiple pools", async function () {
      const goalAmount = parseEther("1");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);

      // Create first pool
      await nanoPool.write.createPool([
        beneficiary,
        "First Pool",
        goalAmount,
        deadline,
      ]);

      // Create second pool
      await nanoPool.write.createPool([
        beneficiary,
        "Second Pool",
        goalAmount,
        deadline,
      ]);

      // Verify both pools exist with correct IDs
      const pool1 = await nanoPool.read.getPoolDetails([1n]);
      const pool2 = await nanoPool.read.getPoolDetails([2n]);

      assert.equal(
        pool1[2],
        "First Pool",
        "First pool should have correct description"
      );
      assert.equal(
        pool2[2],
        "Second Pool",
        "Second pool should have correct description"
      );
    });
  });

  describe("Pool Contributions - Normal Lifecycle", function () {
    beforeEach(async function () {
      // Create a test pool for contribution tests
      const goalAmount = parseEther("1");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400); // 1 day from now

      await nanoPool.write.createPool([
        beneficiary,
        "Test Pool",
        goalAmount,
        deadline,
      ]);
    });

    it("Should accept valid contributions", async function () {
      const contributionAmount = parseEther("0.5");
      const contributor1Client = await viem.getWalletClient(contributor1);

      // Make contribution
      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: contributionAmount,
      });

      // Verify contribution was recorded
      const recordedContribution = await nanoPool.read.getContribution([
        1n,
        contributor1,
      ]);
      assert.equal(
        recordedContribution,
        contributionAmount,
        "Contribution should be recorded"
      );

      // Verify pool current amount updated
      const poolDetails = await nanoPool.read.getPoolDetails([1n]);
      assert.equal(
        poolDetails[4],
        contributionAmount,
        "Pool current amount should be updated"
      );

      // Verify contributor is in the list
      const contributors = await nanoPool.read.getContributors([1n]);
      assert.equal(contributors.length, 1, "Should have 1 contributor");
      assert.equal(
        getAddress(contributors[0]),
        contributor1,
        "Contributor should be in the list"
      );
    });

    it("Should handle multiple contributions from same user", async function () {
      const firstContribution = parseEther("0.3");
      const secondContribution = parseEther("0.2");
      const contributor1Client = await viem.getWalletClient(contributor1);

      // First contribution
      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: firstContribution,
      });

      // Second contribution
      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: secondContribution,
      });

      // Verify total contribution
      const totalContribution = await nanoPool.read.getContribution([
        1n,
        contributor1,
      ]);
      assert.equal(
        totalContribution,
        firstContribution + secondContribution,
        "Total contribution should be sum of both"
      );

      // Verify contributor appears only once in list
      const contributors = await nanoPool.read.getContributors([1n]);
      assert.equal(
        contributors.length,
        1,
        "Should still have only 1 contributor"
      );
    });

    it("Should handle multiple different contributors", async function () {
      const contribution1 = parseEther("0.3");
      const contribution2 = parseEther("0.4");

      const contributor1Client = await viem.getWalletClient(contributor1);
      const contributor2Client = await viem.getWalletClient(contributor2);

      // Contributions from different users
      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: contribution1,
      });

      await contributor2Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: contribution2,
      });

      // Verify individual contributions
      const recorded1 = await nanoPool.read.getContribution([1n, contributor1]);
      const recorded2 = await nanoPool.read.getContribution([1n, contributor2]);
      assert.equal(
        recorded1,
        contribution1,
        "First contribution should be recorded"
      );
      assert.equal(
        recorded2,
        contribution2,
        "Second contribution should be recorded"
      );

      // Verify total pool amount
      const poolDetails = await nanoPool.read.getPoolDetails([1n]);
      assert.equal(
        poolDetails[4],
        contribution1 + contribution2,
        "Pool total should be sum of contributions"
      );

      // Verify contributors list
      const contributors = await nanoPool.read.getContributors([1n]);
      assert.equal(contributors.length, 2, "Should have 2 contributors");

      const normalizedContributors = contributors.map((addr: string) =>
        getAddress(addr)
      );
      assert.ok(
        normalizedContributors.includes(contributor1),
        "Should include first contributor"
      );
      assert.ok(
        normalizedContributors.includes(contributor2),
        "Should include second contributor"
      );
    });

    it("Should achieve goal when contributions reach target", async function () {
      const goalAmount = parseEther("1");
      const contributionAmount = parseEther("1.1"); // Slightly over goal

      const contributor1Client = await viem.getWalletClient(contributor1);

      // Make contribution that exceeds goal
      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: contributionAmount,
      });

      // Verify goal is achieved
      const poolDetails = await nanoPool.read.getPoolDetails([1n]);
      assert.equal(poolDetails[6], true, "Goal should be achieved");
      assert.equal(
        poolDetails[4],
        contributionAmount,
        "Current amount should be the contribution"
      );
    });
  });

  describe("Complete Pool Lifecycle", function () {
    it("Should complete full successful pool lifecycle", async function () {
      const goalAmount = parseEther("1");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 5); // 5 seconds from now

      // 1. Create pool
      await nanoPool.write.createPool([
        beneficiary,
        "Lifecycle Test Pool",
        goalAmount,
        deadline,
      ]);

      // 2. Make contributions to achieve goal
      const contributor1Client = await viem.getWalletClient(contributor1);
      const contributor2Client = await viem.getWalletClient(contributor2);

      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: parseEther("0.6"),
      });

      await contributor2Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: parseEther("0.5"),
      });

      // 3. Verify goal is achieved
      let poolDetails = await nanoPool.read.getPoolDetails([1n]);
      assert.equal(poolDetails[6], true, "Goal should be achieved");

      // 4. Wait for deadline to pass
      await new Promise(resolve => setTimeout(resolve, 6000));

      // 5. Disburse funds
      await nanoPool.write.disburseFunds([1n]);

      // 6. Verify disbursement
      poolDetails = await nanoPool.read.getPoolDetails([1n]);
      assert.equal(poolDetails[7], true, "Funds should be disbursed");
    });
  });

  describe("Basic Functionality Verification", function () {
    it("Should verify pool state transitions", async function () {
      const goalAmount = parseEther("1");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);

      // Create pool
      await nanoPool.write.createPool([
        beneficiary,
        "State Test Pool",
        goalAmount,
        deadline,
      ]);

      // Initial state
      let poolDetails = await nanoPool.read.getPoolDetails([1n]);
      assert.equal(
        poolDetails[6],
        false,
        "Goal should not be achieved initially"
      );
      assert.equal(
        poolDetails[7],
        false,
        "Funds should not be disbursed initially"
      );

      // Contribute to achieve goal
      const contributor1Client = await viem.getWalletClient(contributor1);
      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: goalAmount,
      });

      // Goal achieved state
      poolDetails = await nanoPool.read.getPoolDetails([1n]);
      assert.equal(
        poolDetails[6],
        true,
        "Goal should be achieved after contribution"
      );
      assert.equal(poolDetails[7], false, "Funds should not be disbursed yet");
    });
  });
});
