const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Automated Proposal Execution System contracts...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Get balance using provider
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Get the DAO address
  // In a real deployment, this would be the address of an existing DAO
  // For this example, we'll deploy a new DAO
  const deployDAOScript = require("./deploy-dao");
  const daoDeployment = await deployDAOScript();
  
  const daoAddress = daoDeployment.dao;
  console.log("\nUsing DAO at address:", daoAddress);
  
  // Deploy the AutomatedProposalExecutor
  console.log("\nDeploying AutomatedProposalExecutor...");
  const AutomatedProposalExecutor = await ethers.getContractFactory("AutomatedProposalExecutor");
  const executor = await AutomatedProposalExecutor.deploy();
  await executor.waitForDeployment();
  
  const executorAddress = await executor.getAddress();
  console.log("AutomatedProposalExecutor deployed to:", executorAddress);
  
  // Initialize the executor
  const EXECUTION_DELAY = 60 * 60 * 24; // 1 day
  const MAX_GAS_FOR_EXECUTION = 3000000; // 3 million gas
  
  await executor.initialize(daoAddress, EXECUTION_DELAY, MAX_GAS_FOR_EXECUTION);
  console.log("AutomatedProposalExecutor initialized with execution delay:", EXECUTION_DELAY, "seconds");
  
  // Deploy the ParameterChangeRegistry
  console.log("\nDeploying ParameterChangeRegistry...");
  const ParameterChangeRegistry = await ethers.getContractFactory("ParameterChangeRegistry");
  const parameterRegistry = await ParameterChangeRegistry.deploy(executorAddress);
  await parameterRegistry.waitForDeployment();
  
  const parameterRegistryAddress = await parameterRegistry.getAddress();
  console.log("ParameterChangeRegistry deployed to:", parameterRegistryAddress);
  
  // Deploy the TreasuryManager
  console.log("\nDeploying TreasuryManager...");
  const TreasuryManager = await ethers.getContractFactory("TreasuryManager");
  const treasuryManager = await TreasuryManager.deploy(executorAddress);
  await treasuryManager.waitForDeployment();
  
  const treasuryManagerAddress = await treasuryManager.getAddress();
  console.log("TreasuryManager deployed to:", treasuryManagerAddress);
  
  // Set up category budgets
  const SpendingCategory = {
    Operations: 0,
    Development: 1,
    Marketing: 2,
    Community: 3,
    Research: 4,
    Other: 5
  };
  
  await treasuryManager.updateCategoryBudget(SpendingCategory.Operations, ethers.parseEther("100000"));
  await treasuryManager.updateCategoryBudget(SpendingCategory.Development, ethers.parseEther("200000"));
  await treasuryManager.updateCategoryBudget(SpendingCategory.Marketing, ethers.parseEther("50000"));
  await treasuryManager.updateCategoryBudget(SpendingCategory.Community, ethers.parseEther("30000"));
  await treasuryManager.updateCategoryBudget(SpendingCategory.Research, ethers.parseEther("100000"));
  await treasuryManager.updateCategoryBudget(SpendingCategory.Other, ethers.parseEther("20000"));
  
  console.log("TreasuryManager category budgets set up");
  
  // Get the DAO contract
  const QuadraticVotingDAO = await ethers.getContractFactory("QuadraticVotingDAO");
  const dao = QuadraticVotingDAO.attach(daoAddress);
  
  // Grant roles to the executor
  const ADMIN_ROLE = await dao.ADMIN_ROLE();
  await dao.grantRole(ADMIN_ROLE, executorAddress);
  console.log("Admin role granted to executor");
  
  // Fund the executor contract for treasury allocations
  await deployer.sendTransaction({
    to: executorAddress,
    value: ethers.parseEther("100")
  });
  console.log("Executor funded with 100 ETH for treasury allocations");
  
  // Create a sample parameter change proposal
  console.log("\nCreating sample parameter change proposal...");
  
  // Get the governance token
  const governanceTokenAddress = daoDeployment.governanceToken;
  const WasteGovernanceToken = await ethers.getContractFactory("WasteGovernanceToken");
  const governanceToken = WasteGovernanceToken.attach(governanceTokenAddress);
  
  // Get current parameters
  const currentVotingPeriod = await dao.votingPeriod();
  const currentProposalThreshold = await dao.proposalThreshold();
  const currentMinQuorumPercent = await dao.minQuorumPercent();
  
  // New parameters
  const newVotingPeriod = 60 * 60 * 24 * 7; // 7 days
  const newProposalThreshold = ethers.parseEther("5000"); // 5,000 tokens
  const newMinQuorumPercent = 5; // 5% of total supply
  
  // Create parameter change calldata
  const calldata = await parameterRegistry.createParameterChangeCalldata(
    newVotingPeriod,
    newProposalThreshold,
    newMinQuorumPercent,
    true,
    EXECUTION_DELAY,
    MAX_GAS_FOR_EXECUTION
  );
  
  console.log("Parameter change calldata created");
  
  console.log("\nDeployment completed successfully!");
  
  return {
    dao: daoAddress,
    executor: executorAddress,
    parameterRegistry: parameterRegistryAddress,
    treasuryManager: treasuryManagerAddress
  };
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;