// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Create2Factory
 * @dev Factory contract for deterministic deployment using CREATE2
 * Ensures identical contract addresses across different chains
 */
contract Create2Factory {
    event ContractDeployed(address indexed deployedAddress, bytes32 indexed salt);

    /**
     * @dev Deploys a contract using CREATE2
     * @param bytecode The contract bytecode to deploy
     * @param salt The salt for deterministic address generation
     * @return deployedAddress The address of the deployed contract
     */
    function deploy(bytes memory bytecode, bytes32 salt) external returns (address deployedAddress) {
        assembly {
            deployedAddress := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        
        require(deployedAddress != address(0), "Create2Factory: deployment failed");
        
        emit ContractDeployed(deployedAddress, salt);
    }

    /**
     * @dev Computes the address of a contract deployed with CREATE2
     * @param bytecode The contract bytecode
     * @param salt The salt for deterministic address generation
     * @return computedAddress The computed address
     */
    function computeAddress(bytes memory bytecode, bytes32 salt) external view returns (address computedAddress) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(bytecode)
            )
        );
        
        computedAddress = address(uint160(uint256(hash)));
    }

    /**
     * @dev Computes the address using bytecode hash
     * @param bytecodeHash The hash of the contract bytecode
     * @param salt The salt for deterministic address generation
     * @return computedAddress The computed address
     */
    function computeAddressFromHash(bytes32 bytecodeHash, bytes32 salt) external view returns (address computedAddress) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                bytecodeHash
            )
        );
        
        computedAddress = address(uint160(uint256(hash)));
    }
}
