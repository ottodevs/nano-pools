// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {NanoPool} from "./NanoPool.sol";
import {Test} from "forge-std/Test.sol";

contract NanoPoolTest is Test {
    NanoPool nanoPool;
    address initiator;
    address beneficiary;
    address contributor1;
    address contributor2;

    // Set up the test environment
    function setUp() public {
        nanoPool = new NanoPool();
        initiator = address(1);
        beneficiary = address(2);
        contributor1 = address(3);
        contributor2 = address(4);

        // Give some ETH to the contributors
        vm.deal(contributor1, 5 ether);
        vm.deal(contributor2, 5 ether);
    }

    // Test pool creation
    function test_CreatePool() public {
        vm.startPrank(initiator);

        uint256 goalAmount = 1 ether;
        uint256 deadline = block.timestamp + 1 days;
        uint256 poolId = nanoPool.createPool(
            beneficiary,
            "Test Pool",
            goalAmount,
            deadline
        );

        (
            address poolInitiator,
            address poolBeneficiary,
            string memory description,
            uint256 poolGoalAmount,
            uint256 currentAmount,
            uint256 deadlineTimestamp,
            bool goalAchieved,
            bool fundsDisbursed
        ) = nanoPool.getPoolDetails(poolId);

        assertEq(poolInitiator, initiator, "Initiator should match");
        assertEq(poolBeneficiary, beneficiary, "Beneficiary should match");
        assertEq(
            keccak256(bytes(description)),
            keccak256(bytes("Test Pool")),
            "Description should match"
        );
        assertEq(poolGoalAmount, goalAmount, "Goal amount should match");
        assertEq(currentAmount, 0, "Initial current amount should be 0");
        assertEq(deadlineTimestamp, deadline, "Deadline should match");
        assertEq(goalAchieved, false, "Goal should not be achieved initially");
        assertEq(
            fundsDisbursed,
            false,
            "Funds should not be disbursed initially"
        );

        vm.stopPrank();
    }

    // Test making contributions
    function test_Contribute() public {
        vm.startPrank(initiator);

        uint256 goalAmount = 1 ether;
        uint256 deadline = block.timestamp + 1 days;
        uint256 poolId = nanoPool.createPool(
            beneficiary,
            "Test Pool",
            goalAmount,
            deadline
        );

        vm.stopPrank();

        // First contribution
        vm.startPrank(contributor1);
        nanoPool.contribute{value: 0.5 ether}(poolId);
        vm.stopPrank();

        // Check contribution was recorded
        (, , , , uint256 currentAmount, , bool goalAchieved, ) = nanoPool
            .getPoolDetails(poolId);
        assertEq(
            currentAmount,
            0.5 ether,
            "Current amount should be 0.5 ether"
        );
        assertEq(goalAchieved, false, "Goal should not be achieved yet");
        assertEq(
            nanoPool.getContribution(poolId, contributor1),
            0.5 ether,
            "Contribution amount should be recorded"
        );

        // Second contribution that achieves the goal
        vm.startPrank(contributor2);
        nanoPool.contribute{value: 0.6 ether}(poolId);
        vm.stopPrank();

        // Check goal was achieved
        (, , , , currentAmount, , goalAchieved, ) = nanoPool.getPoolDetails(
            poolId
        );
        assertEq(
            currentAmount,
            1.1 ether,
            "Current amount should be 1.1 ether"
        );
        assertEq(goalAchieved, true, "Goal should be achieved");
        assertEq(
            nanoPool.getContribution(poolId, contributor2),
            0.6 ether,
            "Contribution amount should be recorded"
        );

        // Check contributors list
        address[] memory contributors = nanoPool.getContributors(poolId);
        assertEq(contributors.length, 2, "Should have 2 contributors");
        assertEq(
            contributors[0],
            contributor1,
            "First contributor should be contributor1"
        );
        assertEq(
            contributors[1],
            contributor2,
            "Second contributor should be contributor2"
        );
    }

    // Test disbursing funds
    function test_DisburseFunds() public {
        vm.startPrank(initiator);

        uint256 goalAmount = 1 ether;
        uint256 deadline = block.timestamp + 1 days;
        uint256 poolId = nanoPool.createPool(
            beneficiary,
            "Test Pool",
            goalAmount,
            deadline
        );

        vm.stopPrank();

        // Make contributions to achieve the goal
        vm.startPrank(contributor1);
        nanoPool.contribute{value: 1 ether}(poolId);
        vm.stopPrank();

        // Try to disburse before deadline (should fail)
        vm.startPrank(initiator);
        vm.expectRevert("Pool deadline not yet passed");
        nanoPool.disburseFunds(poolId);
        vm.stopPrank();

        // Fast forward past the deadline
        vm.warp(block.timestamp + 2 days);

        // Record beneficiary's balance before disbursement
        uint256 beneficiaryBalanceBefore = address(beneficiary).balance;

        // Disburse funds
        vm.startPrank(initiator);
        nanoPool.disburseFunds(poolId);
        vm.stopPrank();

        // Check funds were disbursed
        uint256 beneficiaryBalanceAfter = address(beneficiary).balance;
        assertEq(
            beneficiaryBalanceAfter - beneficiaryBalanceBefore,
            1 ether,
            "Beneficiary should receive 1 ether"
        );

        // Check pool state was updated
        (, , , , , , , bool fundsDisbursed) = nanoPool.getPoolDetails(poolId);
        assertEq(fundsDisbursed, true, "Funds should be marked as disbursed");

        // Try to disburse again (should fail)
        vm.startPrank(initiator);
        vm.expectRevert("Funds already disbursed");
        nanoPool.disburseFunds(poolId);
        vm.stopPrank();
    }

    // Test claiming refunds
    function test_ClaimRefund() public {
        vm.startPrank(initiator);

        uint256 goalAmount = 1 ether;
        uint256 deadline = block.timestamp + 1 days;
        uint256 poolId = nanoPool.createPool(
            beneficiary,
            "Test Pool",
            goalAmount,
            deadline
        );

        vm.stopPrank();

        // Make a contribution that doesn't meet the goal
        vm.startPrank(contributor1);
        nanoPool.contribute{value: 0.5 ether}(poolId);
        vm.stopPrank();

        // Try to claim refund before deadline (should fail)
        vm.startPrank(contributor1);
        vm.expectRevert("Pool deadline not yet passed");
        nanoPool.claimRefund(poolId);
        vm.stopPrank();

        // Fast forward past the deadline
        vm.warp(block.timestamp + 2 days);

        // Record contributor's balance before refund
        uint256 contributorBalanceBefore = address(contributor1).balance;

        // Claim refund
        vm.startPrank(contributor1);
        nanoPool.claimRefund(poolId);
        vm.stopPrank();

        // Check refund was processed
        uint256 contributorBalanceAfter = address(contributor1).balance;
        assertEq(
            contributorBalanceAfter - contributorBalanceBefore,
            0.5 ether,
            "Contributor should receive 0.5 ether refund"
        );

        // Check contribution was reset
        uint256 contribution = nanoPool.getContribution(poolId, contributor1);
        assertEq(contribution, 0, "Contribution should be reset to 0");

        // Try to claim refund again (should fail)
        vm.startPrank(contributor1);
        vm.expectRevert("No contribution found");
        nanoPool.claimRefund(poolId);
        vm.stopPrank();
    }

    // Test that refund fails if goal was achieved
    function test_RefundFailsIfGoalAchieved() public {
        vm.startPrank(initiator);

        uint256 goalAmount = 1 ether;
        uint256 deadline = block.timestamp + 1 days;
        uint256 poolId = nanoPool.createPool(
            beneficiary,
            "Test Pool",
            goalAmount,
            deadline
        );

        vm.stopPrank();

        // Make contributions to achieve the goal
        vm.startPrank(contributor1);
        nanoPool.contribute{value: 0.5 ether}(poolId);
        vm.stopPrank();

        vm.startPrank(contributor2);
        nanoPool.contribute{value: 0.5 ether}(poolId);
        vm.stopPrank();

        // Fast forward past the deadline
        vm.warp(block.timestamp + 2 days);

        // Try to claim refund (should fail because goal was achieved)
        vm.startPrank(contributor1);
        vm.expectRevert("Pool goal was achieved, no refunds available");
        nanoPool.claimRefund(poolId);
        vm.stopPrank();
    }
}
