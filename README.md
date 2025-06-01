# NanoPools 💧

NanoPools enables transparent, on-chain micro-pools for collective funding across EVM-compatible chains.

## Overview

NanoPools is an omnichain platform facilitating transparent, on-chain micro-pools for collective funding. Users can effortlessly create, contribute to, and manage pools with built-in escrow logic. Optional World ID verification adds a layer of trust, while seamless integration across multiple EVM-compatible chains ensures broad accessibility.

## Key Features

- **On-Chain Escrow Logic**: Ensures funds are securely held until predefined goals are met
- **Multi-Chain Deployment**: Operates across Base, Flow EVM, and World Chain
- **World ID Integration**: Optional identity verification enhances participant trust
- **Blockscout Integration**: Provides real-time transparency on pool activities and transactions
- **User-Friendly Interface**: Designed for ease of use, encouraging adoption among non-technical users

## Technical Architecture

### Smart Contract Layer

- `NanoPool.sol`: Core escrow contract with role-based permissions
- Deployable across all EVM-compatible chains
- OpenZeppelin security patterns for reentrancy protection
- Gas-optimized for micro-transactions

### Frontend Layer

- Next.js application with Worldcoin MiniKit SDK integration
- Chain-agnostic interface with dynamic provider switching
- Real-time updates via WebSocket connections to chain data
- PWA capabilities for offline pool browsing

### Integration Layer

- Blockscout SDK for advanced blockchain data
- World ID integration for human verification
- Social platform APIs for sharing mechanics
- Multi-chain RPC management and failover

## Development Roadmap

### Phase 1: Core Smart Contract & Single Chain MVP
- Functional NanoPool contract on Base testnet with basic frontend

### Phase 2: Multi-Chain Expansion & World ID Integration
- Deploy to Flow EVM and World Chain, integrate Worldcoin MiniKit

### Phase 3: Advanced Features & Ecosystem Integration
- Blockscout integration, social features, enhanced governance

### Phase 4: AI Agent Integration & Advanced Automation
- AI-powered pool management and creation

## Getting Started

```bash
# Clone the repository
git clone https://github.com/ottodevs/nano-pools.git
cd nano-pools

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Run development server
npm run dev
```

## How It's Made

NanoPools was built using a combination of modern web3 technologies:

- **Smart Contracts**: Written in Solidity, handling pool creation, contributions, disbursements, and refunds
- **Development Framework**: Utilized Hardhat for contract development, testing, and deployment
- **Frontend**: Developed with Next.js, providing a responsive and intuitive user interface
- **World ID Integration**: Incorporated World IDKit for optional user verification, enhancing trustworthiness
- **Blockscout Integration**: Leveraged Blockscout's SDK to display real-time pool activity and transaction statuses
- **Multi-Chain Deployment**: Deployed contracts on Base, Flow EVM, and World Chain networks, demonstrating interoperability

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## ETHGlobal Prague 2025

This project was developed from scratch during ETHGlobal Prague 2025, adhering strictly to all event rules and guidelines.