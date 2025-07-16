# Dependency Management

## Standardized Versions Across Services

This document tracks the standardized dependency versions across all services to prevent conflicts and ensure compatibility.

## Critical Dependencies

### Blockchain Libraries
- **ethers**: `^6.8.0` (Frontend, Blockchain)
- **web3**: `^6.9.0` (Frontend, Blockchain, Backend)
- **@openzeppelin/contracts**: `^5.0.0` (Blockchain)
- **@openzeppelin/contracts-upgradeable**: `^5.0.0` (Blockchain)

### HTTP Clients
- **axios**: `^1.6.0` (Frontend, Blockchain)
- **requests**: `2.31.0` (Backend - Python equivalent)

### Storage
- **ipfs-http-client**: `^60.0.1` (Frontend, Blockchain)
- **ipfs-api**: `0.2.3` (Backend - Python equivalent)

### Real-time Communication
- **socket.io-client**: `^4.7.4` (Frontend)
- **Flask-SocketIO**: `5.3.4` (Backend)
- **python-socketio**: `5.9.0` (Backend)

### State Management & Data Fetching
- **@tanstack/react-query**: `^4.36.1` (Frontend - updated from react-query)
- **@reduxjs/toolkit**: `^1.9.7` (Frontend)
- **react-redux**: `^8.1.3` (Frontend)

## Fixed Issues

### 1. Ethers.js Version Conflict ✅
- **Before**: Frontend used v5.7.2, Blockchain used v6.8.0
- **After**: Both use v6.8.0
- **Impact**: Eliminates API incompatibility issues

### 2. Web3 Version Alignment ✅
- **Before**: Frontend used v4.2.2, Backend used v6.9.0
- **After**: All services use v6.9.0
- **Impact**: Consistent blockchain interaction APIs

### 3. React Query Migration ✅
- **Before**: Used deprecated `react-query` v3.39.3
- **After**: Updated to `@tanstack/react-query` v4.36.1
- **Impact**: Better performance and modern API

### 4. OpenZeppelin Upgrade ✅
- **Before**: Used v4.9.0
- **After**: Updated to v5.0.0
- **Impact**: Latest security features and gas optimizations

### 5. Hardhat Ethers Plugin Update ✅
- **Before**: Used deprecated `@nomiclabs/hardhat-ethers`
- **After**: Updated to `@nomicfoundation/hardhat-ethers`
- **Impact**: Better ethers v6 compatibility

## Workspace Management

### Root Package.json
- Manages workspace dependencies
- Provides unified scripts for all services
- Ensures consistent Node.js/npm versions

### Installation Commands
```bash
# Install all dependencies
npm run install:all

# Install specific service
npm run install:frontend
npm run install:blockchain
npm run install:backend
```

### Development Commands
```bash
# Start frontend development server
npm run dev:frontend

# Start blockchain local node
npm run dev:blockchain

# Run all tests
npm run test:frontend
npm run test:blockchain
npm run test:backend
```

## Version Compatibility Matrix

| Service | Node.js | Python | Solidity |
|---------|---------|--------|----------|
| Frontend | >=18.0.0 | - | - |
| Blockchain | >=18.0.0 | - | ^0.8.19 |
| Backend | - | >=3.9 | - |
| AI Services | - | >=3.9 | - |

## Breaking Changes to Watch

### Ethers v6 Migration
- Constructor changes for providers and signers
- Different method signatures for contract interactions
- Updated event filtering syntax

### Web3 v6 Migration
- New provider initialization
- Updated transaction signing
- Modified contract deployment patterns

### OpenZeppelin v5 Migration
- Access control changes
- Updated initialization patterns
- New security features

## Future Considerations

1. **Monorepo Tools**: Consider adding Lerna or Nx for better workspace management
2. **Dependency Updates**: Regular security updates for all packages
3. **Version Pinning**: Consider exact versions for production deployments
4. **Cross-Chain Libraries**: Standardize bridge and multi-chain libraries
5. **Testing Libraries**: Align testing frameworks across services

## Maintenance Schedule

- **Weekly**: Check for security updates
- **Monthly**: Review and update non-breaking versions
- **Quarterly**: Plan major version upgrades
- **Before Releases**: Full dependency audit and testing