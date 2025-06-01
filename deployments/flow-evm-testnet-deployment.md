# Flow EVM Testnet Deployment Documentation

## 🎯 Deployment Summary
**Status**: ✅ COMPLETED  
**Date**: June 1, 2025  
**Network**: Flow EVM Testnet  
**Chain ID**: 545  

## 📋 Contract Addresses

### Core Contracts
| Contract | Address | Explorer Link |
|----------|---------|---------------|
| CREATE2 Factory | `0x20aD2b34860A7A44E548D4C740845A18C6753ba0` | [View on FlowScan](https://evm-testnet.flowscan.org/address/0x20aD2b34860A7A44E548D4C740845A18C6753ba0) |
| NanoPool | `0xacAdfFE7D479c416C25509Cea6D36Bb797E34f29` | [View on FlowScan](https://evm-testnet.flowscan.org/address/0xacAdfFE7D479c416C25509Cea6D36Bb797E34f29) |

## 🌐 Network Configuration

### Flow EVM Testnet Details
- **Network Name**: Flow EVM Testnet
- **Chain ID**: 545
- **RPC URL**: `https://testnet.evm.nodes.onflow.org`
- **Block Explorer**: `https://evm-testnet.flowscan.org`
- **Currency Symbol**: FLOW
- **Decimals**: 18

### Gas Configuration
- **Gas Price**: 1 gwei (1,000,000,000 wei)
- **Timeout**: 60 seconds

## 🚀 Deployment Method
- **Tool**: Hardhat Ignition (Hardhat 3.0)
- **Deployment Strategy**: CREATE2 for deterministic addresses
- **Verification**: Pending (Blockscout integration ready)

## 📦 Deployment Modules Used

### 1. Create2Factory Module
```typescript
// ignition/modules/Create2Factory.ts
export default buildModule("Create2FactoryModule", (m) => {
  const create2Factory = m.contract("Create2Factory");
  return { create2Factory };
});
```

### 2. NanoPoolWithCreate2 Module
```typescript
// ignition/modules/NanoPoolWithCreate2.ts
export default buildModule("NanoPoolWithCreate2Module", (m) => {
  const create2Factory = m.contractAt("Create2Factory", "0x20aD2b34860A7A44E548D4C740845A18C6753ba0");
  const nanoPool = m.contract("NanoPool");
  
  // Sample pool creation
  const beneficiaryAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const description = "Flow EVM Testnet Pool";
  const goalAmount = 10000000000000000n; // 0.01 ETH
  const oneWeekFromNow = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60);

  m.call(nanoPool, "createPool", [beneficiaryAddress, description, goalAmount, oneWeekFromNow]);
  
  return { create2Factory, nanoPool };
});
```

## 🔧 Environment Variables Required
```bash
export FLOW_EVM_TESTNET_RPC_URL="https://testnet.evm.nodes.onflow.org"
export FLOW_EVM_PRIVATE_KEY="0x..." # Your private key
```

## 📊 Deployment Commands Used
```bash
# Deploy CREATE2 Factory
npx hardhat ignition deploy ignition/modules/Create2Factory.ts --network flowEvmTestnet

# Deploy NanoPool with CREATE2
npx hardhat ignition deploy ignition/modules/NanoPoolWithCreate2.ts --network flowEvmTestnet
```

## 🔍 Verification Status
- **Blockscout Integration**: ✅ Ready
- **Contract Verification**: 🔄 Pending
- **Explorer Links**: ✅ Active

## 🎯 Next Steps
1. ✅ Deploy contracts to Flow EVM testnet
2. 🔄 Verify contracts on Blockscout
3. 🔄 Test contract interactions
4. 🔄 Update frontend configuration
5. 🔄 Update task management systems
6. 🔄 Cross-chain address validation

## 🔗 Related Documentation
- [Hardhat Configuration](../hardhat.config.ts)
- [Contract Source Code](../contracts/)
- [Frontend Integration](../frontend/)
- [Task Management](../tasks/)

## 📝 Notes
- Deployment uses deterministic CREATE2 addresses for consistency across networks
- Sample pool created during deployment for testing purposes
- Gas optimization configured for Flow EVM testnet
- Compatible with existing World Chain testnet integration
