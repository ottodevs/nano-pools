<div align="center">
  <img src="frontend/public/logo.png" alt="Pool Payments Protocol Logo" width="200" style="margin-bottom: 20px" />
  <h1>Pool Payments Protocol</h1>
  <p><strong>A multi-chain nanopooling protocol for small-scale payments and crowdfunding</strong></p>
  <p>
    <a href="#features">Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#blockscout-integration">Blockscout</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#networks">Networks</a> •
    <a href="#development">Development</a>
  </p>
  
  <img src="frontend/public/banner.png" alt="Pool Payments Protocol Banner" width="800" style="margin: 20px 0" />

  <p>
    <em>Created for ETHGlobal Prague 2025 Hackathon</em>
  </p>
</div>

<hr />

## 🚀 Introduction

The Pool Payments Protocol enables users to create and participate in small-scale payment pools across multiple blockchains with minimal gas fees. It provides a secure, transparent way to pool funds for various purposes, from group purchases to crowdfunding projects.

<details>
<summary><b>🏆 ETHGlobal Prague 2025 Bounties Targeted</b></summary>

- **⭐️ Best use of Blockscout**
- **📚 Best Blockscout SDK Integration**
- **🐹 Best Blockscout Merits Use Case**
- **💧 Big Blockscout Explorer Pool Prize**

</details>

<div align="center">
  <img src="https://img.shields.io/badge/Flow%20EVM-Testnet-blue" alt="Flow EVM Testnet" />
  <img src="https://img.shields.io/badge/World%20Chain-Sepolia-purple" alt="World Chain Sepolia" />
  <img src="https://img.shields.io/badge/Blockscout-Integrated-green" alt="Blockscout Integrated" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License MIT" />
</div>

<br />

## ✨ Features

### 🌍 Multi-Chain Support
Deploy and interact with pools across Flow EVM, World Chain, and other EVM-compatible networks

### 💰 Nano Pooling
Create and participate in small-scale payment pools with minimal gas fees and transparent tracking

### 🔄 CREATE2 Deployment
Consistent contract addresses across chains for seamless multi-chain experience

### 🔍 Blockscout Explorer
Complete integration with Blockscout APIs, SDK, and Merits reward system

### 🔐 Secure Authentication
Sign in with Ethereum (SIWE) protocol via MiniKit for secure, decentralized auth

### 🎮 Gamified Experience
Earn Merits by creating pools, contributing, and completing funding goals

<br />

## 🏗️ Architecture

The Pool Payments Protocol consists of several key components:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Smart Contracts│      │  Frontend App   │      │   Blockscout    │
│                 │      │                 │      │   Integration   │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│    NanoPool     │◄────►│   Next.js UI    │◄────►│  REST/JSON-RPC  │
│                 │      │                 │      │      APIs       │
└─────────────────┘      └─────────────────┘      └─────────────────┘
         ▲                        ▲                        ▲
         │                        │                        │
         │                        │                        │
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│ Create2Factory  │      │   World App     │      │  Merit Rewards  │
│                 │      │   Integration   │      │     System      │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### Core Components

1. **NanoPool Contract**: Secure Solidity contract for creating and managing funding pools
2. **CREATE2Factory**: Ensures consistent contract addresses across different chains
3. **Frontend App**: Next.js application with World App integration
4. **Blockscout Integration**: Complete explorer and Merit rewards system

<br />

## 🔍 Blockscout Integration

<details open>
<summary><b>🏆 Blockscout Features</b></summary>

### REST and JSON-RPC APIs
- Real-time transaction monitoring
- Contract data and verification
- Address tagging and watchlists

### React SDK Components
- Interactive UI with instant explorer feedback
- Real-time transaction status and confirmation
- TypeScript integration with full type safety

### Merit Rewards System
- Pool Creation: 20 Merits
- Pool Contribution: 5 Merits 
- Pool Withdrawal: 2 Merits
- Pool Completion: 15 Merits

### Multi-Network Support
- Flow EVM Testnet (Chain ID: 545)
- World Chain Sepolia (Chain ID: 4801)

</details>

<br />

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or Yarn
- MetaMask or World App wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/ottodevs/nano-pools
cd nano-pools

# Install dependencies
npm install
npm run frontend:install

# Set environment variables
# Create a .env file with your RPC URLs and private keys

# Start the development server
npm run dev
```

### Deployment

```bash
# Deploy to Flow EVM testnet with Blockscout integration
npm run deploy:blockscout:flow

# Deploy to World Chain Sepolia with Blockscout integration
npm run deploy:blockscout:world

# Verify CREATE2 addresses match across chains
npm run verify:addresses
```

<br />

## 🌐 Networks

| Network | Chain ID | Explorer | API | Merits |
|---------|----------|----------|-----|--------|
| Flow EVM Testnet | 545 | [Explorer](https://evm-testnet.flowscan.org) | [API](https://evm-testnet.flowscan.org/api) | ✅ |
| World Chain Sepolia | 4801 | [Explorer](https://worldchain-sepolia.explorer.alchemy.com) | [API](https://worldchain-sepolia.explorer.alchemy.com/api) | ✅ |

<br />

## 💻 Development

### Project Structure

```
├── contracts/                # Solidity smart contracts
│   ├── Create2Factory.sol    # Factory for consistent addresses
│   └── NanoPool.sol          # Main pool protocol contract
├── deploy/                   # Deployment scripts
├── docs/                     # Documentation
├── frontend/                 # Next.js frontend application
│   ├── public/               # Static assets
│   └── src/                  # React components and hooks
└── src/                      # Shared TypeScript code
    ├── components/           # React components
    ├── hooks/                # React hooks
    └── services/             # API services
```

### Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Start development server
npm run dev

# Build for production
npm run build
```

<br />

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

<div align="center">
  <sub>Built with ❤️ for ETHGlobal Prague 2025</sub>
</div>

<!-- GitHub doesn't support style tags in markdown, so animations are applied through HTML/CSS in image tags -->
<div align="center">
  <img src="https://img.shields.io/badge/ETHGlobal-Prague%202025-blue" alt="ETHGlobal Prague 2025" />
</div>
