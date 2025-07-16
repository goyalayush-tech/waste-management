#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying dependency alignment across services...\n');

// Read package.json files
const frontendPkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
const blockchainPkg = JSON.parse(fs.readFileSync('blockchain/package.json', 'utf8'));
const backendReqs = fs.readFileSync('backend/requirements.txt', 'utf8');

// Critical dependencies to check
const criticalDeps = {
  ethers: { frontend: frontendPkg.dependencies.ethers, blockchain: blockchainPkg.devDependencies.ethers },
  web3: { frontend: frontendPkg.dependencies.web3, blockchain: blockchainPkg.dependencies.web3 },
  axios: { frontend: frontendPkg.dependencies.axios, blockchain: blockchainPkg.dependencies.axios },
  'ipfs-http-client': { frontend: frontendPkg.dependencies['ipfs-http-client'], blockchain: blockchainPkg.dependencies['ipfs-http-client'] }
};

let allGood = true;

console.log('📦 Critical Dependency Alignment Check:');
console.log('=====================================');

Object.entries(criticalDeps).forEach(([dep, versions]) => {
  const versionSet = new Set(Object.values(versions).filter(Boolean));
  const isAligned = versionSet.size <= 1;
  
  console.log(`${isAligned ? '✅' : '❌'} ${dep}:`);
  Object.entries(versions).forEach(([service, version]) => {
    if (version) {
      console.log(`   ${service}: ${version}`);
    }
  });
  
  if (!isAligned) {
    allGood = false;
    console.log('   ⚠️  Version mismatch detected!');
  }
  console.log('');
});

// Check backend web3 version
const backendWeb3Match = backendReqs.match(/web3==([0-9.]+)/);
if (backendWeb3Match) {
  const backendWeb3Version = backendWeb3Match[1];
  const frontendWeb3Version = frontendPkg.dependencies.web3.replace('^', '');
  
  console.log('🐍 Backend Web3 Alignment:');
  console.log(`   Backend: ${backendWeb3Version}`);
  console.log(`   Frontend: ${frontendWeb3Version}`);
  
  if (backendWeb3Version.split('.')[0] === frontendWeb3Version.split('.')[0]) {
    console.log('   ✅ Major versions aligned\n');
  } else {
    console.log('   ❌ Major version mismatch!\n');
    allGood = false;
  }
}

// Check for deprecated packages
console.log('🔄 Deprecated Package Check:');
console.log('============================');

const deprecatedChecks = [
  {
    name: 'react-query',
    current: frontendPkg.dependencies['react-query'],
    replacement: frontendPkg.dependencies['@tanstack/react-query'],
    status: !frontendPkg.dependencies['react-query'] && frontendPkg.dependencies['@tanstack/react-query']
  },
  {
    name: '@nomiclabs/hardhat-ethers',
    current: blockchainPkg.devDependencies['@nomiclabs/hardhat-ethers'],
    replacement: blockchainPkg.devDependencies['@nomicfoundation/hardhat-ethers'],
    status: !blockchainPkg.devDependencies['@nomiclabs/hardhat-ethers'] && blockchainPkg.devDependencies['@nomicfoundation/hardhat-ethers']
  }
];

deprecatedChecks.forEach(check => {
  if (check.status) {
    console.log(`✅ ${check.name} → Updated to modern alternative`);
  } else if (check.current) {
    console.log(`❌ ${check.name} → Still using deprecated package`);
    allGood = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('🎉 All dependencies are properly aligned!');
  console.log('✨ Ready for development and deployment.');
} else {
  console.log('⚠️  Some dependency issues found.');
  console.log('🔧 Please review and fix the mismatched versions.');
  process.exit(1);
}

console.log('\n📋 Next Steps:');
console.log('1. Run: npm run install:all');
console.log('2. Test: npm run test:frontend && npm run test:blockchain');
console.log('3. Build: npm run build:frontend && npm run compile:blockchain');