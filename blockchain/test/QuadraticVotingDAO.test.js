const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Quadratic Voting DAO System", function () {
  let WasteGovernanceToken;
  let QuadraticVotingDAO;
  let QuadraticVotingDAOFactory;
  let GasOptimizedVotingInterface;
  let VoteWeightCalculator;
  
  let governanceToken;
  let dao;
  let daoFactory;
  let votingInterface;
  let voteCalculator;
  
  let owner;
  let proposer;
  let voter1;
  let voter2;
  let voter3;
  let voter4;
  let voter5;
  
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const TOKEN_NAME = "Waste Governance Token";
  const TOKEN_SYMBOL = "WGT";
  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1 million tokens
  const MAX_SUPPLY = ethers.parseEther("10000000"); // 10 million tokens
  
  const VOTING_PERIOD = 60 * 60 * 24 * 3; // 3 days
  const PROPOSAL_THRESHOLD = ethers.parseEther("10000"); // 10,000 tokens
  const MIN_QUORUM_PERCENT = 10; // 10% of total supply
  
  const VoteType = {
    For: 0,
    Against: 1,
    Abstain: 2
  };
  
  beforeEach(async function () {
    // Get signers
    [owner, proposer, voter1, voter2, voter3, voter4, voter5] = await ethers.getSigners();
    
    // Deploy governance token
    WasteGovernanceToken = await ethers.getContractFactory("WasteGovernanceToken");
    governanceToken = await WasteGovernanceToken.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      INITIAL_SUPPLY,
      MAX_SUPPLY
    );
    
    // Deploy DAO
    QuadraticVotingDAO = await ethers.getContractFactory("QuadraticVotingDAO");
    const daoImplementation = await QuadraticVotingDAO.deploy();
    
    // Deploy DAO factory
    QuadraticVotingDAOFactory = await ethers.getContractFactory("QuadraticVotingDAOFactory");
    daoFactory = await QuadraticVotingDAOFactory.deploy();
    
    // Deploy a DAO instance through the factory
    const tx = await daoFactory.deployDAO(
      "test-dao",
      "Test DAO",
      "A test DAO for quadratic voting",
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
    
    // Connect to deployed contracts
    dao = await ethers.getContractAt("QuadraticVotingDAO", daoAddress);
    governanceToken = await ethers.getContractAt("WasteGovernanceToken", tokenAddress);
    
    // Deploy voting interface
    GasOptimizedVotingInterface = await ethers.getContractFactory("GasOptimizedVotingInterface");
    votingInterface = await GasOptimizedVotingInterface.deploy(daoAddress);
    
    // Deploy vote calculator
    VoteWeightCalculator = await ethers.getContractFactory("VoteWeightCalculator");
    voteCalculator = await VoteWeightCalculator.deploy(tokenAddress);
    
    // Distribute tokens for testing
    await governanceToken.transfer(proposer.address, ethers.parseEther("100000"));
    await governanceToken.transfer(voter1.address, ethers.parseEther("100000"));
    await governanceToken.transfer(voter2.address, ethers.parseEther("50000"));
    await governanceToken.transfer(voter3.address, ethers.parseEther("25000"));
    await governanceToken.transfer(voter4.address, ethers.parseEther("10000"));
    await governanceToken.transfer(voter5.address, ethers.parseEther("1000"));
    
    // Grant proposer role to the proposer
    await dao.grantProposerRole(proposer.address);
    
    // Grant operator role to the owner in the voting interface
    await votingInterface.grantOperatorRole(owner.address);
  });
  
  describe("Deployment", function () {
    it("Should set the correct governance token", async function () {
      expect(await dao.governanceToken()).to.equal(governanceToken.target);
    });
    
    it("Should set the correct voting parameters", async function () {
      expect(await dao.votingPeriod()).to.equal(VOTING_PERIOD);
      expect(await dao.proposalThreshold()).to.equal(PROPOSAL_THRESHOLD);
      expect(await dao.minQuorumPercent()).to.equal(MIN_QUORUM_PERCENT);
    });
    
    it("Should assign the admin role to the deployer", async function () {
      const adminRole = await dao.ADMIN_ROLE();
      expect(await dao.hasRole(adminRole, owner.address)).to.be.true;
    });
  });
  
  describe("Proposal Creation", function () {
    it("Should allow a proposer to create a proposal", async function () {
      const title = "Test Proposal";
      const description = "This is a test proposal";
      const executionData = "0x";
      const targetContract = ZERO_ADDRESS;
      
      await expect(
        dao.connect(proposer).createProposal(
          title,
          description,
          executionData,
          targetContract
        )
      ).to.emit(dao, "ProposalCreated")
        .withArgs(1, proposer.address, title, await dao.votingPeriod() + await time.latest());
    });
    
    it("Should reject proposals from non-proposers without enough tokens", async function () {
      const title = "Test Proposal";
      const description = "This is a test proposal";
      const executionData = "0x";
      const targetContract = ZERO_ADDRESS;
      
      await expect(
        dao.connect(voter5).createProposal(
          title,
          description,
          executionData,
          targetContract
        )
      ).to.be.revertedWith("Insufficient tokens to create proposal");
    });
  });
  
  describe("Quadratic Voting", function () {
    let proposalId;
    
    beforeEach(async function () {
      // Create a proposal
      const tx = await dao.connect(proposer).createProposal(
        "Test Proposal",
        "This is a test proposal",
        "0x",
        ZERO_ADDRESS
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "ProposalCreated"
      );
      
      proposalId = event.args[0];
      
      // Approve tokens for voting
      await governanceToken.connect(voter1).approve(dao.target, ethers.parseEther("100000"));
      await governanceToken.connect(voter2).approve(dao.target, ethers.parseEther("50000"));
      await governanceToken.connect(voter3).approve(dao.target, ethers.parseEther("25000"));
      await governanceToken.connect(voter4).approve(dao.target, ethers.parseEther("10000"));
      await governanceToken.connect(voter5).approve(dao.target, ethers.parseEther("1000"));
    });
    
    it("Should calculate vote weight using quadratic formula", async function () {
      // Voter with 10,000 tokens should have sqrt(10000) = 100 voting power
      const voteWeight = await voteCalculator.calculateVoteWeight(
        voter4.address,
        ethers.parseEther("10000")
      );
      
      // Convert to number for easier comparison (this is simplified for testing)
      const voteWeightNumber = Number(ethers.formatEther(voteWeight)) * 1e18;
      expect(voteWeightNumber).to.be.closeTo(100, 1); // Allow small rounding error
    });
    
    it("Should allow voting with quadratic weight", async function () {
      // Voter1 votes with 10,000 tokens
      const tokenAmount = ethers.parseEther("10000");
      
      await expect(
        dao.connect(voter1).castVote(proposalId, VoteType.For, tokenAmount)
      ).to.emit(dao, "VoteCast")
        .withArgs(proposalId, voter1.address, VoteType.For, expect.any(Number), tokenAmount);
      
      // Check vote was recorded
      const [power, support, hasVoted, tokensUsed] = await dao.getVote(proposalId, voter1.address);
      expect(hasVoted).to.be.true;
      expect(support).to.be.true;
      expect(tokensUsed).to.equal(tokenAmount);
      
      // Vote power should be sqrt(10000) = 100
      const powerNumber = Number(ethers.formatEther(power)) * 1e18;
      expect(powerNumber).to.be.closeTo(100, 1);
    });
    
    it("Should prevent whale dominance with quadratic voting", async function () {
      // Voter1 has 100,000 tokens and votes with all of them
      await dao.connect(voter1).castVote(
        proposalId,
        VoteType.For,
        ethers.parseEther("100000")
      );
      
      // Voter2 has 50,000 tokens and votes with all of them
      await dao.connect(voter2).castVote(
        proposalId,
        VoteType.For,
        ethers.parseEther("50000")
      );
      
      // Voter3, Voter4, and Voter5 vote against with their tokens
      await dao.connect(voter3).castVote(
        proposalId,
        VoteType.Against,
        ethers.parseEther("25000")
      );
      
      await dao.connect(voter4).castVote(
        proposalId,
        VoteType.Against,
        ethers.parseEther("10000")
      );
      
      await dao.connect(voter5).castVote(
        proposalId,
        VoteType.Against,
        ethers.parseEther("1000")
      );
      
      // Get proposal details
      const proposal = await dao.getProposal(proposalId);
      
      // Calculate expected vote powers
      // Voter1: sqrt(100000) ≈ 316.22
      // Voter2: sqrt(50000) ≈ 223.61
      // For votes: ≈ 539.83
      
      // Voter3: sqrt(25000) ≈ 158.11
      // Voter4: sqrt(10000) = 100
      // Voter5: sqrt(1000) ≈ 31.62
      // Against votes: ≈ 289.73
      
      // Despite Voter1 having 10x more tokens than Voter5, their voting power is only about 10x
      // not 100x, which prevents complete dominance
      
      // Check that For votes > Against votes (as expected with quadratic voting)
      expect(proposal.forVotes).to.be.gt(proposal.againstVotes);
      
      // But the difference should be much less extreme than the token difference
      const forVotesNumber = Number(ethers.formatEther(proposal.forVotes)) * 1e18;
      const againstVotesNumber = Number(ethers.formatEther(proposal.againstVotes)) * 1e18;
      
      // The ratio should be around 539.83 / 289.73 ≈ 1.86
      // Much less than the 150,000 / 36,000 ≈ 4.17 ratio of tokens
      const voteRatio = forVotesNumber / againstVotesNumber;
      expect(voteRatio).to.be.closeTo(1.86, 0.1);
    });
  });
  
  describe("Gas Optimization", function () {
    let proposalId;
    
    beforeEach(async function () {
      // Create a proposal
      const tx = await dao.connect(proposer).createProposal(
        "Test Proposal",
        "This is a test proposal",
        "0x",
        ZERO_ADDRESS
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "ProposalCreated"
      );
      
      proposalId = event.args[0];
      
      // Approve tokens for voting
      await governanceToken.connect(voter1).approve(dao.target, ethers.parseEther("1000"));
      await governanceToken.connect(voter2).approve(dao.target, ethers.parseEther("1000"));
      await governanceToken.connect(voter3).approve(dao.target, ethers.parseEther("1000"));
    });
    
    it("Should allow batch voting to save gas", async function () {
      // This test would ideally measure gas usage, but we'll just check functionality
      const voters = [voter1.address, voter2.address, voter3.address];
      const supports = [VoteType.For, VoteType.Against, VoteType.Abstain];
      const tokenAmounts = [
        ethers.parseEther("1000"),
        ethers.parseEther("1000"),
        ethers.parseEther("1000")
      ];
      
      await expect(
        votingInterface.batchVote(proposalId, voters, supports, tokenAmounts)
      ).to.emit(votingInterface, "BatchVoteSubmitted")
        .withArgs(owner.address, proposalId, 3);
      
      // Check that votes were recorded
      const [power1, support1, hasVoted1] = await dao.getVote(proposalId, voter1.address);
      const [power2, support2, hasVoted2] = await dao.getVote(proposalId, voter2.address);
      const [power3, support3, hasVoted3] = await dao.getVote(proposalId, voter3.address);
      
      expect(hasVoted1).to.be.true;
      expect(hasVoted2).to.be.true;
      expect(hasVoted3).to.be.true;
      
      expect(support1).to.equal(true); // For
      expect(support2).to.equal(false); // Against
      // Abstain is more complex to check
    });
  });
  
  describe("Security and Fairness", function () {
    let proposalId;
    
    beforeEach(async function () {
      // Create a proposal
      const tx = await dao.connect(proposer).createProposal(
        "Test Proposal",
        "This is a test proposal",
        "0x",
        ZERO_ADDRESS
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "ProposalCreated"
      );
      
      proposalId = event.args[0];
    });
    
    it("Should prevent double voting", async function () {
      // Approve tokens for voting
      await governanceToken.connect(voter1).approve(dao.target, ethers.parseEther("10000"));
      
      // First vote should succeed
      await dao.connect(voter1).castVote(
        proposalId,
        VoteType.For,
        ethers.parseEther("5000")
      );
      
      // Second vote should fail
      await expect(
        dao.connect(voter1).castVote(
          proposalId,
          VoteType.For,
          ethers.parseEther("5000")
        )
      ).to.be.revertedWith("Already voted");
    });
    
    it("Should require sufficient tokens for voting", async function () {
      // Approve tokens for voting
      await governanceToken.connect(voter5).approve(dao.target, ethers.parseEther("2000"));
      
      // Try to vote with more tokens than owned
      await expect(
        dao.connect(voter5).castVote(
          proposalId,
          VoteType.For,
          ethers.parseEther("2000") // Voter5 only has 1000 tokens
        )
      ).to.be.revertedWith("Insufficient token balance");
    });
  });
});