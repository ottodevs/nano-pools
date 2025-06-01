import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import assert from "node:assert/strict";
import { parseEther, formatEther } from "viem";

describe("NanoPool - Comprehensive Test Suite", function () {
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
    initiator = testAccounts[0].account.address;
    beneficiary = testAccounts[1].account.address;
    contributor1 = testAccounts[2].account.address;
    contributor2 = testAccounts[3].account.address;
    maliciousUser = testAccounts[4].account.address;
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
      assert.equal(owner, initiator, "Owner should be the deployer");
    });
  });

  describe("Pool Creation", function () {
    it("Should create a pool with valid parameters", async function () {
      const goalAmount = parseEther("1");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400); // 1 day from now

      // Create pool and capture events
      const hash = await nanoPool.write.createPool([
        beneficiary,
        "Test Pool",
        goalAmount,
        deadline,
      ]);

      // Get pool details
      const poolDetails = await nanoPool.read.getPoolDetails([1n]);

      assert.equal(poolDetails[0], initiator, "Initiator should match");
      assert.equal(poolDetails[1], beneficiary, "Beneficiary should match");
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

    it("Should reject pool creation with zero address beneficiary", async function () {
      const goalAmount = parseEther("1");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);

      try {
        await nanoPool.write.createPool([
          "0x0000000000000000000000000000000000000000",
          "Test Pool",
          goalAmount,
          deadline,
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
          deadline,
        ]);
        assert.fail("Should have reverted with zero goal amount");
      } catch (error: any) {
        assert.ok(
          error.message.includes("Goal amount must be greater than zero")
        );
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
          pastDeadline,
        ]);
        assert.fail("Should have reverted with past deadline");
      } catch (error: any) {
        assert.ok(error.message.includes("Deadline must be in the future"));
      }
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

  describe("Pool Contributions", function () {
    beforeEach(async function () {
      // Create a test pool for contribution tests
      const goalAmount = parseEther("1");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);

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
        contributors[0],
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
      assert.ok(
        contributors.includes(contributor1),
        "Should include first contributor"
      );
      assert.ok(
        contributors.includes(contributor2),
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
        assert.ok(
          error.message.includes(
            "Contribution amount must be greater than zero"
          )
        );
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

    it("Should reject contributions after deadline", async function () {
      // Create pool with very short deadline
      const goalAmount = parseEther("1");
      const shortDeadline = BigInt(Math.floor(Date.now() / 1000) + 1); // 1 second from now

      await nanoPool.write.createPool([
        beneficiary,
        "Short Deadline Pool",
        goalAmount,
        shortDeadline,
      ]);

      // Wait for deadline to pass
      await new Promise(resolve => setTimeout(resolve, 2000));

      const contributor1Client = await viem.getWalletClient(contributor1);

      try {
        await contributor1Client.writeContract({
          address: nanoPool.address,
          abi: nanoPool.abi,
          functionName: "contribute",
          args: [2n], // Second pool with expired deadline
          value: parseEther("0.1"),
        });
        assert.fail("Should have reverted for expired deadline");
      } catch (error: any) {
        assert.ok(error.message.includes("Pool deadline has passed"));
      }
    });

    it("Should reject contributions to already achieved goal", async function () {
      const goalAmount = parseEther("1");
      const contributor1Client = await viem.getWalletClient(contributor1);
      const contributor2Client = await viem.getWalletClient(contributor2);

      // First contribution achieves goal
      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: goalAmount,
      });

      // Verify goal is achieved
      const poolDetails = await nanoPool.read.getPoolDetails([1n]);
      assert.equal(poolDetails[6], true, "Goal should be achieved");

      // Try to contribute after goal is achieved
      try {
        await contributor2Client.writeContract({
          address: nanoPool.address,
          abi: nanoPool.abi,
          functionName: "contribute",
          args: [1n],
          value: parseEther("0.1"),
        });
        assert.fail("Should have reverted for already achieved goal");
      } catch (error: any) {
        assert.ok(error.message.includes("Pool goal already achieved"));
      }
    });
  });

  describe("Fund Disbursement", function () {
    beforeEach(async function () {
      // Create and fund a pool for disbursement tests
      const goalAmount = parseEther("1");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 2); // 2 seconds from now

      await nanoPool.write.createPool([
        beneficiary,
        "Test Pool",
        goalAmount,
        deadline,
      ]);

      // Contribute to achieve goal
      const contributor1Client = await viem.getWalletClient(contributor1);
      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: goalAmount,
      });

      // Wait for deadline to pass
      await new Promise(resolve => setTimeout(resolve, 3000));
    });

    it("Should allow initiator to disburse funds after deadline and goal achievement", async function () {
      // Get beneficiary balance before disbursement
      const balanceBefore = await viem.getBalance({ address: beneficiary });

      // Disburse funds as initiator
      await nanoPool.write.disburseFunds([1n]);

      // Verify funds were disbursed
      const poolDetails = await nanoPool.read.getPoolDetails([1n]);
      assert.equal(poolDetails[7], true, "Funds should be marked as disbursed");

      // Verify beneficiary received funds
      const balanceAfter = await viem.getBalance({ address: beneficiary });
      assert.ok(
        balanceAfter > balanceBefore,
        "Beneficiary should have received funds"
      );
    });

    it("Should reject disbursement before deadline", async function () {
      // Create new pool with future deadline
      const goalAmount = parseEther("1");
      const futureDeadline = BigInt(Math.floor(Date.now() / 1000) + 86400); // 1 day from now

      await nanoPool.write.createPool([
        beneficiary,
        "Future Pool",
        goalAmount,
        futureDeadline,
      ]);

      // Contribute to achieve goal
      const contributor1Client = await viem.getWalletClient(contributor1);
      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [2n],
        value: goalAmount,
      });

      try {
        await nanoPool.write.disburseFunds([2n]);
        assert.fail("Should have reverted before deadline");
      } catch (error: any) {
        assert.ok(error.message.includes("Pool deadline not yet passed"));
      }
    });

    it("Should reject disbursement if goal not achieved", async function () {
      // Create new pool and don't fund it completely
      const goalAmount = parseEther("1");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1);

      await nanoPool.write.createPool([
        beneficiary,
        "Unfunded Pool",
        goalAmount,
        deadline,
      ]);

      // Partial contribution (goal not achieved)
      const contributor1Client = await viem.getWalletClient(contributor1);
      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [2n],
        value: parseEther("0.5"), // Less than goal
      });

      // Wait for deadline
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        await nanoPool.write.disburseFunds([2n]);
        assert.fail("Should have reverted for unachieved goal");
      } catch (error: any) {
        assert.ok(error.message.includes("Pool goal not achieved"));
      }
    });

    it("Should reject disbursement by unauthorized user", async function () {
      const maliciousClient = await viem.getWalletClient(maliciousUser);

      try {
        await maliciousClient.writeContract({
          address: nanoPool.address,
          abi: nanoPool.abi,
          functionName: "disburseFunds",
          args: [1n],
        });
        assert.fail("Should have reverted for unauthorized user");
      } catch (error: any) {
        assert.ok(
          error.message.includes(
            "Only pool initiator or contract owner can disburse funds"
          )
        );
      }
    });

    it("Should reject double disbursement", async function () {
      // First disbursement
      await nanoPool.write.disburseFunds([1n]);

      try {
        // Second disbursement attempt
        await nanoPool.write.disburseFunds([1n]);
        assert.fail("Should have reverted for double disbursement");
      } catch (error: any) {
        assert.ok(error.message.includes("Funds already disbursed"));
      }
    });
  });

  describe("Refund Mechanism", function () {
    beforeEach(async function () {
      // Create a pool that will fail to reach its goal
      const goalAmount = parseEther("2"); // High goal
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 2); // 2 seconds from now

      await nanoPool.write.createPool([
        beneficiary,
        "Failed Pool",
        goalAmount,
        deadline,
      ]);

      // Make partial contributions
      const contributor1Client = await viem.getWalletClient(contributor1);
      const contributor2Client = await viem.getWalletClient(contributor2);

      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: parseEther("0.5"),
      });

      await contributor2Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: parseEther("0.3"),
      });

      // Wait for deadline to pass
      await new Promise(resolve => setTimeout(resolve, 3000));
    });

    it("Should allow contributors to claim refunds after failed pool", async function () {
      const contributor1Client = await viem.getWalletClient(contributor1);

      // Get balance before refund
      const balanceBefore = await viem.getBalance({ address: contributor1 });

      // Claim refund
      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "claimRefund",
        args: [1n],
      });

      // Verify balance increased
      const balanceAfter = await viem.getBalance({ address: contributor1 });
      assert.ok(
        balanceAfter > balanceBefore,
        "Contributor should have received refund"
      );

      // Verify contribution is reset
      const contribution = await nanoPool.read.getContribution([
        1n,
        contributor1,
      ]);
      assert.equal(contribution, 0n, "Contribution should be reset to 0");
    });

    it("Should reject refund claims before deadline", async function () {
      // Create new pool with future deadline
      const goalAmount = parseEther("2");
      const futureDeadline = BigInt(Math.floor(Date.now() / 1000) + 86400);

      await nanoPool.write.createPool([
        beneficiary,
        "Future Pool",
        goalAmount,
        futureDeadline,
      ]);

      // Make contribution
      const contributor1Client = await viem.getWalletClient(contributor1);
      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [2n],
        value: parseEther("0.5"),
      });

      try {
        await contributor1Client.writeContract({
          address: nanoPool.address,
          abi: nanoPool.abi,
          functionName: "claimRefund",
          args: [2n],
        });
        assert.fail("Should have reverted before deadline");
      } catch (error: any) {
        assert.ok(error.message.includes("Pool deadline not yet passed"));
      }
    });

    it("Should reject refund claims if goal was achieved", async function () {
      // Create and fully fund a pool
      const goalAmount = parseEther("1");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1);

      await nanoPool.write.createPool([
        beneficiary,
        "Successful Pool",
        goalAmount,
        deadline,
      ]);

      const contributor1Client = await viem.getWalletClient(contributor1);
      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [2n],
        value: goalAmount, // Achieve goal
      });

      // Wait for deadline
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        await contributor1Client.writeContract({
          address: nanoPool.address,
          abi: nanoPool.abi,
          functionName: "claimRefund",
          args: [2n],
        });
        assert.fail("Should have reverted for achieved goal");
      } catch (error: any) {
        assert.ok(
          error.message.includes("Pool goal was achieved, no refunds available")
        );
      }
    });

    it("Should reject refund claims from non-contributors", async function () {
      const maliciousClient = await viem.getWalletClient(maliciousUser);

      try {
        await maliciousClient.writeContract({
          address: nanoPool.address,
          abi: nanoPool.abi,
          functionName: "claimRefund",
          args: [1n],
        });
        assert.fail("Should have reverted for non-contributor");
      } catch (error: any) {
        assert.ok(error.message.includes("No contribution found"));
      }
    });

    it("Should reject double refund claims", async function () {
      const contributor1Client = await viem.getWalletClient(contributor1);

      // First refund claim
      await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "claimRefund",
        args: [1n],
      });

      try {
        // Second refund claim
        await contributor1Client.writeContract({
          address: nanoPool.address,
          abi: nanoPool.abi,
          functionName: "claimRefund",
          args: [1n],
        });
        assert.fail("Should have reverted for double refund");
      } catch (error: any) {
        assert.ok(error.message.includes("No contribution found"));
      }
    });
  });

  describe("Gas Usage Analysis", function () {
    it("Should track gas usage for pool creation", async function () {
      const goalAmount = parseEther("1");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);

      // Create pool and get transaction receipt
      const hash = await nanoPool.write.createPool([
        beneficiary,
        "Gas Test Pool",
        goalAmount,
        deadline,
      ]);

      const receipt = await viem.getTransactionReceipt({ hash });
      const gasUsed = receipt.gasUsed;

      console.log(`Pool creation gas used: ${gasUsed}`);

      // Assert reasonable gas usage (should be less than 200k gas)
      assert.ok(
        gasUsed < 200000n,
        `Pool creation should use less than 200k gas, used: ${gasUsed}`
      );
    });

    it("Should track gas usage for contributions", async function () {
      // Create pool first
      const goalAmount = parseEther("1");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);

      await nanoPool.write.createPool([
        beneficiary,
        "Gas Test Pool",
        goalAmount,
        deadline,
      ]);

      const contributor1Client = await viem.getWalletClient(contributor1);

      // Make contribution and track gas
      const hash = await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: parseEther("0.5"),
      });

      const receipt = await viem.getTransactionReceipt({ hash });
      const gasUsed = receipt.gasUsed;

      console.log(`Contribution gas used: ${gasUsed}`);

      // Assert reasonable gas usage (should be less than 100k gas)
      assert.ok(
        gasUsed < 100000n,
        `Contribution should use less than 100k gas, used: ${gasUsed}`
      );
    });
  });

  describe("Event Emission", function () {
    it("Should emit PoolCreated event on pool creation", async function () {
      const goalAmount = parseEther("1");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);

      const hash = await nanoPool.write.createPool([
        beneficiary,
        "Event Test Pool",
        goalAmount,
        deadline,
      ]);

      const receipt = await viem.getTransactionReceipt({ hash });

      // Check that events were emitted
      assert.ok(receipt.logs.length > 0, "Should emit events");

      // Note: In a full implementation, we would decode and verify specific event data
      console.log(`Pool creation emitted ${receipt.logs.length} events`);
    });

    it("Should emit ContributionMade and potentially GoalAchieved events", async function () {
      // Create pool
      const goalAmount = parseEther("1");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400);

      await nanoPool.write.createPool([
        beneficiary,
        "Event Test Pool",
        goalAmount,
        deadline,
      ]);

      const contributor1Client = await viem.getWalletClient(contributor1);

      // Make contribution that achieves goal
      const hash = await contributor1Client.writeContract({
        address: nanoPool.address,
        abi: nanoPool.abi,
        functionName: "contribute",
        args: [1n],
        value: goalAmount, // Achieve goal
      });

      const receipt = await viem.getTransactionReceipt({ hash });

      // Should emit both ContributionMade and GoalAchieved events
      assert.ok(
        receipt.logs.length >= 2,
        "Should emit multiple events for goal achievement"
      );

      console.log(
        `Goal-achieving contribution emitted ${receipt.logs.length} events`
      );
    });
  });
});
