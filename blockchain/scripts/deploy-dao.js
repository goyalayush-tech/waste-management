const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Quadratic Voting DAO System contracts...");

  // Get the deployer account
  const [deployer, proposer, voter1, voter2, voter3] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Get balance using provider
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy the DAO Factory contract
  console.log("\nDeploying QuadraticVotingDAOFactory...");
  const QuadraticVotingDAOFactory = await ethers.getContractFactory("QuadraticVotingDAOFactory");
  const daoFactory = await QuadraticVotingDAOFactory.deploy();
  await daoFactory.waitForDeployment();

  const daoFactoryAddress = await daoFactory.getAddress();
  console.log("QuadraticVotingDAOFactory deployed to:", daoFactoryAddress);
  console.log("DAO implementation deployed to:", await daoFactory.daoImplementation());

  // Set up roles for testing
  if (proposer) {
    console.log("\nSetting up roles for testing...");
    
    // Define role constants
    const DEPLOYER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DEPLOYER_ROLE"));
    
    // Grant roles
    await daoFactory.grantRole(DEPLOYER_ROLE, proposer.address);
    
    console.log("Deployer role granted to:", proposer.address);
  }

  // Deploy a sample DAO for testing
  console.log("\nDeploying sample DAO...");
  
  const TOKEN_NAME = "Waste Governance Token";
  const TOKEN_SYMBOL = "WGT";
  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1 million tokens
  const MAX_SUPPLY = ethers.parseEther("10000000"); // 10 million tokens
  
  const VOTING_PERIOD = 60 * 60 * 24 * 3; // 3 days
  const PROPOSAL_THRESHOLD = ethers.parseEther("10000"); // 10,000 tokens
  const MIN_QUORUM_PERCENT = 10; // 10% of total supply
  
  const tx = await daoFactory.deployDAO(
    "waste-governance-dao",
    "Waste Management Governance DAO",
    "A DAO for governing the waste management ecosystem with quadratic voting",
    TOKEN_NAME,
    TOKEN_SYMBOL,
    INITIAL_SUPPLY,
    MAX_SUPPLY,
    VOTING_PERIOD,
    PROPOSAL_THRESHOLD,
    MIN_QUORUM_PERCENT
  );
  
  const receipt = await tx.wait();
  const event = receipt.logs.find(
    log => log.fragment && log.fragment.name === "DAODeployed"
  );
  
  const daoAddress = event.args[1];
  const tokenAddress = event.args[2];
  
  console.log("Sample DAO deployed to:", daoAddress);
  console.log("Governance token deployed to:", tokenAddress);

  // Get DAO info
  const daoInfo = await daoFactory.getDAOInfo("waste-governance-dao");
  console.log("DAO info:", {
    name: daoInfo.name,
    description: daoInfo.description,
    governanceToken: daoInfo.governanceToken,
    isActive: daoInfo.isActive,
    createdAt: new Date(daoInfo.createdAt * 1000).toISOString()
  });

  // Get the DAO and token contract instances
  const QuadraticVotingDAO = await ethers.getContractFactory("QuadraticVotingDAO");
  const dao = QuadraticVotingDAO.attach(daoAddress);
  
  const WasteGovernanceToken = await ethers.getContractFactory("WasteGovernanceToken");
  const governanceToken = WasteGovernanceToken.attach(tokenAddress);
  
  console.log("Governance token name:", await governanceToken.name());
  console.log("Governance token symbol:", await governanceToken.symbol());
  console.log("Governance token total supply:", ethers.formatEther(await governanceToken.totalSupply()));
  
  // Deploy the VoteWeightCalculator
  console.log("\nDeploying VoteWeightCalculator...");
  const VoteWeightCalculator = await ethers.getContractFactory("VoteWeightCalculator");
  const voteCalculator = await VoteWeightCalculator.deploy(tokenAddress);
  await voteCalculator.waitForDeployment();
  
  const voteCalculatorAddress = await voteCalculator.getAddress();
  console.log("VoteWeightCalculator deployed to:", voteCalculatorAddress);
  
  // Deploy the GasOptimizedVotingInterface
  console.log("\nDeploying GasOptimizedVotingInterface...");
  const GasOptimizedVotingInterface = await ethers.getContractFactory("GasOptimizedVotingInterface");
  const votingInterface = await GasOptimizedVotingInterface.deploy(daoAddress);
  await votingInterface.waitForDeployment();
  
  const votingInterfaceAddress = await votingInterface.getAddress();
  console.log("GasOptimizedVotingInterface deployed to:", votingInterfaceAddress);
  
  // Distribute tokens for testing
  if (proposer && voter1 && voter2 && voter3) {
    console.log("\nDistributing tokens for testing...");
    
    await governanceToken.transfer(proposer.address, ethers.parseEther("100000"));
    await governanceToken.transfer(voter1.address, ethers.parseEther("50000"));
    await governanceToken.transfer(voter2.address, ethers.parseEther("25000"));
    await governanceToken.transfer(voter3.address, ethers.parseEther("10000"));
    
    console.log("Tokens distributed to test accounts");
    
    // Grant proposer role
    const PROPOSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PROPOSER_ROLE"));
    await dao.grantRole(PROPOSER_ROLE, proposer.address);
    console.log("Proposer role granted to:", proposer.address);
    
    // Create a sample proposal
    console.log("\nCreating sample proposal...");
    
    // Approve tokens for proposal creation
    await governanceToken.connect(proposer).approve(dao.target, ethers.parseEther("100000"));
    
    const proposalTx = await dao.connect(proposer).createProposal(
      "Implement Waste Sorting Incentives",
      "This proposal aims to implement a token-based incentive system for proper waste sorting at source",
      "0x", // Execution data would be actual function call data in production
      ethers.ZeroAddress // Target contract would be actual contract in production
    );
    
    const proposalReceipt = await proposalTx.wait();
    const proposalEvent = proposalReceipt.logs.find(
      log => log.fragment && log.fragment.name === "ProposalCreated"
    );
    
    const proposalId = proposalEvent.args[0];
    console.log("Sample proposal created with ID:", proposalId);
    
    // Cast some votes
    console.log("\nCasting sample votes...");
    
    // Approve tokens for voting
    await governanceToken.connect(voter1).approve(dao.target, ethers.parseEther("10000"));
    await governanceToken.connect(voter2).approve(dao.target, ethers.parseEther("10000"));
    
    // Vote types
    const VoteType = {
      For: 0,
      Against: 1,
      Abstain: 2
    };
    
    // Cast votes
    await dao.connect(voter1).castVote(proposalId, VoteType.For, ethers.parseEther("10000"));
    await dao.connect(voter2).castVote(proposalId, VoteType.Against, ethers.parseEther("10000"));
    
    console.log("Sample votes cast");
    
    // Get proposal details
    const proposal = await dao.getProposal(proposalId);
    console.log("Proposal details:", {
      id: proposal.id.toString(),
      proposer: proposal.proposer,
      title: proposal.title,
      description: proposal.description,
      createdAt: new Date(proposal.createdAt * 1000).toISOString(),
      votingEndsAt: new Date(proposal.votingEndsAt * 1000).toISOString(),
      forVotes: ethers.formatEther(proposal.forVotes),
      againstVotes: ethers.formatEther(proposal.againstVotes),
      abstainVotes: ethers.formatEther(proposal.abstainVotes),
      status: proposal.status
    });
  }

  console.log("\nDeployment completed successfully!");
  
  return {
    daoFactory: daoFactoryAddress,
    dao: daoAddress,
    governanceToken: tokenAddress,
    voteCalculator: voteCalculatorAddress,
    votingInterface: votingInterfaceAddress
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