// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NanoPool
 * @dev A contract for creating small-scale funding pools
 * with escrow functionality for crowdfunding projects.
 */
contract NanoPool is ReentrancyGuard, Ownable {
    // Pool counter for generating unique IDs
    uint256 private _poolIdCounter;

    // Structure to store pool information
    struct Pool {
        address initiator;
        address beneficiary;
        string description;
        uint256 goalAmount;
        uint256 currentAmount;
        uint256 deadlineTimestamp;
        bool goalAchieved;
        bool fundsDisbursed;
        mapping(address => uint256) contributions;
        address[] contributors;
    }

    // Mapping from pool ID to Pool struct
    mapping(uint256 => Pool) public pools;

    // Events
    event PoolCreated(
        uint256 indexed poolId,
        address indexed initiator,
        address indexed beneficiary,
        string description,
        uint256 goalAmount,
        uint256 deadlineTimestamp
    );

    event ContributionMade(
        uint256 indexed poolId,
        address indexed contributor,
        uint256 amount,
        uint256 newTotal
    );

    event GoalAchieved(uint256 indexed poolId, uint256 totalAmount);

    event FundsDisbursed(
        uint256 indexed poolId,
        address indexed beneficiary,
        uint256 amount
    );

    event RefundClaimed(
        uint256 indexed poolId,
        address indexed contributor,
        uint256 amount
    );

    /**
     * @dev Constructor to initialize the contract
     */
    constructor() Ownable() {
        _poolIdCounter = 1; // Start pool IDs at 1
    }

    /**
     * @dev Creates a new funding pool
     * @param _beneficiary The address that will receive the funds if the goal is met
     * @param _description A description of the pool's purpose
     * @param _goalAmount The funding goal in wei
     * @param _deadlineTimestamp The timestamp when the pool will close
     * @return poolId The ID of the newly created pool
     */
    function createPool(
        address _beneficiary,
        string calldata _description,
        uint256 _goalAmount,
        uint256 _deadlineTimestamp
    ) external returns (uint256 poolId) {
        // Input validation
        require(
            _beneficiary != address(0),
            "Beneficiary cannot be zero address"
        );
        require(_goalAmount > 0, "Goal amount must be greater than zero");
        require(
            _deadlineTimestamp > block.timestamp,
            "Deadline must be in the future"
        );

        // Generate a new pool ID
        poolId = _poolIdCounter++;

        // Initialize the pool
        Pool storage newPool = pools[poolId];
        newPool.initiator = msg.sender;
        newPool.beneficiary = _beneficiary;
        newPool.description = _description;
        newPool.goalAmount = _goalAmount;
        newPool.currentAmount = 0;
        newPool.deadlineTimestamp = _deadlineTimestamp;
        newPool.goalAchieved = false;
        newPool.fundsDisbursed = false;
        newPool.contributors = new address[](0);

        emit PoolCreated(
            poolId,
            msg.sender,
            _beneficiary,
            _description,
            _goalAmount,
            _deadlineTimestamp
        );

        return poolId;
    }

    /**
     * @dev Allows users to contribute to a pool
     * @param _poolId The ID of the pool to contribute to
     */
    function contribute(uint256 _poolId) external payable nonReentrant {
        Pool storage pool = pools[_poolId];

        // Validate the pool
        require(pool.initiator != address(0), "Pool does not exist");
        require(
            block.timestamp < pool.deadlineTimestamp,
            "Pool deadline has passed"
        );
        require(!pool.goalAchieved, "Pool goal already achieved");
        require(msg.value > 0, "Contribution amount must be greater than zero");

        // Check if this is a new contributor
        if (pool.contributions[msg.sender] == 0) {
            pool.contributors.push(msg.sender);
        }

        // Update the contribution
        pool.contributions[msg.sender] += msg.value;
        pool.currentAmount += msg.value;

        emit ContributionMade(
            _poolId,
            msg.sender,
            msg.value,
            pool.currentAmount
        );

        // Check if goal is achieved
        if (pool.currentAmount >= pool.goalAmount && !pool.goalAchieved) {
            pool.goalAchieved = true;
            emit GoalAchieved(_poolId, pool.currentAmount);
        }
    }

    /**
     * @dev Disburses funds to the beneficiary if the goal is achieved
     * @param _poolId The ID of the pool to disburse funds from
     */
    function disburseFunds(uint256 _poolId) external nonReentrant {
        Pool storage pool = pools[_poolId];

        // Validate the pool
        require(pool.initiator != address(0), "Pool does not exist");
        require(
            msg.sender == pool.initiator || msg.sender == owner(),
            "Only pool initiator or contract owner can disburse funds"
        );
        require(pool.goalAchieved, "Pool goal not achieved");
        require(!pool.fundsDisbursed, "Funds already disbursed");
        require(
            block.timestamp >= pool.deadlineTimestamp,
            "Pool deadline not yet passed"
        );

        // Mark as disbursed before transfer to prevent reentrancy
        pool.fundsDisbursed = true;

        // Transfer funds to beneficiary
        (bool success, ) = pool.beneficiary.call{value: pool.currentAmount}("");
        require(success, "Transfer to beneficiary failed");

        emit FundsDisbursed(_poolId, pool.beneficiary, pool.currentAmount);
    }

    /**
     * @dev Allows contributors to claim refunds if the goal was not met and deadline has passed
     * @param _poolId The ID of the pool to claim a refund from
     */
    function claimRefund(uint256 _poolId) external nonReentrant {
        Pool storage pool = pools[_poolId];

        // Validate the pool
        require(pool.initiator != address(0), "Pool does not exist");
        require(
            block.timestamp >= pool.deadlineTimestamp,
            "Pool deadline not yet passed"
        );
        require(
            !pool.goalAchieved,
            "Pool goal was achieved, no refunds available"
        );

        uint256 contributionAmount = pool.contributions[msg.sender];
        require(contributionAmount > 0, "No contribution found");

        // Reset contribution before transfer to prevent reentrancy
        pool.contributions[msg.sender] = 0;

        // Transfer refund to contributor
        (bool success, ) = msg.sender.call{value: contributionAmount}("");
        require(success, "Refund transfer failed");

        emit RefundClaimed(_poolId, msg.sender, contributionAmount);
    }

    /**
     * @dev Returns pool details
     * @param _poolId The ID of the pool
     * @return initiator The address that created the pool
     * @return beneficiary The address that will receive the funds
     * @return description The pool description
     * @return goalAmount The funding goal
     * @return currentAmount The current amount raised
     * @return deadlineTimestamp The deadline for contributions
     * @return goalAchieved Whether the goal has been achieved
     * @return fundsDisbursed Whether the funds have been disbursed
     */
    function getPoolDetails(
        uint256 _poolId
    )
        external
        view
        returns (
            address initiator,
            address beneficiary,
            string memory description,
            uint256 goalAmount,
            uint256 currentAmount,
            uint256 deadlineTimestamp,
            bool goalAchieved,
            bool fundsDisbursed
        )
    {
        Pool storage pool = pools[_poolId];
        require(pool.initiator != address(0), "Pool does not exist");

        return (
            pool.initiator,
            pool.beneficiary,
            pool.description,
            pool.goalAmount,
            pool.currentAmount,
            pool.deadlineTimestamp,
            pool.goalAchieved,
            pool.fundsDisbursed
        );
    }

    /**
     * @dev Returns the contribution of a specific address to a pool
     * @param _poolId The ID of the pool
     * @param _contributor The address of the contributor
     * @return contribution The amount contributed
     */
    function getContribution(
        uint256 _poolId,
        address _contributor
    ) external view returns (uint256 contribution) {
        Pool storage pool = pools[_poolId];
        require(pool.initiator != address(0), "Pool does not exist");

        return pool.contributions[_contributor];
    }

    /**
     * @dev Returns all contributors to a pool
     * @param _poolId The ID of the pool
     * @return List of contributor addresses
     */
    function getContributors(
        uint256 _poolId
    ) external view returns (address[] memory) {
        Pool storage pool = pools[_poolId];
        require(pool.initiator != address(0), "Pool does not exist");

        return pool.contributors;
    }
}
