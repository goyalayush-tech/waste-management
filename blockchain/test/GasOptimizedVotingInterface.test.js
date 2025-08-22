const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GasOptimizedVotingInterface", function () {
  let QuadraticVotingDAO;
  let WasteGovernanceToken;
  let GasOptimizedVotingInterface;
  let dao;
  let governanceToken;
  let votingInterface;
  
  let owner;
  let operator;
  let voter1;
  let voter2;
  let voter3;
  let relayer;
  
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
    [owner, operator, voter1, voter2, voter3, relayer] = await ethers.getSigners();
    
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
    dao = await QuadraticVotingDAO.deploy();
    await dao.initialize(
      governanceToken.target,
      VOTING_PERIOD,
      PROPOSAL_THRESHOLD,
      MIN_QUORUM_PERCENT
    );
    
    // Deploy voting interface
    GasOptimizedVotingInterface = await ethers.getContractFactory("GasOptimizedVotingInterface");
    votingInterface = await GasOptimizedVotingInterface.deploy(dao.target);
    
    // Grant operator role
    await votingInterface.grantOperatorRole(operator.address);
    
    // Distribute tokens
    await governanceToken.transfer(voter1.address, ethers.parseEther("50000"));
    await governanceToken.transfer(voter2.address, ethers.parseEther("30000"));
    await governanceToken.transfer(voter3.address, ethers.parseEther("20000"));
    
    // Grant proposer role to owner
    await dao.grantProposerRole(owner.address);
  });
  
  describe("Deployment", function () {
    it("Should set the correct DAO address", async function () {
      expect(await votingInterface.dao()).to.equal(dao.target);
    });
    
    it("Should set the correct roles", async function () {
      const operatorRole = await votingInterface.OPERATOR_ROLE();
      
      expect(await votingInterface.hasRole(operatorRole, owner.address)).to.be.true;
      expect(await votingInterface.hasRole(operatorRole, operator.address)).to.be.true;
      expect(await votingInterface.hasRole(operatorRole, voter1.address)).to.be.false;
    });
  });
  
  describe("Batch Voting", function () {
    let proposalId;
    
    beforeEach(async function () {
      // Create a proposal
      const tx = await dao.createProposal(
        "Test Proposal",
        "This is a test proposal",
        "0x",
        ethers.ZeroAddress
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "ProposalCreated"
      );
      
      proposalId = event.args[0];
      
      // Approve tokens for voting
      await governanceToken.connect(voter1).approve(dao.target, ethers.parseEther("10000"));
      await governanceToken.connect(voter2).approve(dao.target, ethers.parseEther("10000"));
      await governanceToken.connect(voter3).approve(dao.target, ethers.parseEther("10000"));
    });
    
    it("Should allow batch voting by operator", async function () {
      const voters = [voter1.address, voter2.address, voter3.address];
      const supports = [VoteType.For, VoteType.Against, VoteType.Abstain];
      const tokenAmounts = [
        ethers.parseEther("10000"),
        ethers.parseEther("10000"),
        ethers.parseEther("10000")
      ];
      
      await expect(
        votingInterface.connect(operator).batchVote(
          proposalId,
          voters,
          supports,
          tokenAmounts
        )
      ).to.emit(votingInterface, "BatchVoteSubmitted")
        .withArgs(operator.address, proposalId, 3);
    });
    
    it("Should reject batch voting from non-operators", async function () {
      const voters = [voter1.address, voter2.address, voter3.address];
      const supports = [VoteType.For, VoteType.Against, VoteType.Abstain];
      const tokenAmounts = [
        ethers.parseEther("10000"),
        ethers.parseEther("10000"),
        ethers.parseEther("10000")
      ];
      
      await expect(
        votingInterface.connect(voter1).batchVote(
          proposalId,
          voters,
          supports,
          tokenAmounts
        )
      ).to.be.revertedWith(/AccessControl: account .* is missing role/);
    });
    
    it("Should reject batch voting with mismatched array lengths", async function () {
      const voters = [voter1.address, voter2.address, voter3.address];
      const supports = [VoteType.For, VoteType.Against]; // One missing
      const tokenAmounts = [
        ethers.parseEther("10000"),
        ethers.parseEther("10000"),
        ethers.parseEther("10000")
      ];
      
      await expect(
        votingInterface.connect(operator).batchVote(
          proposalId,
          voters,
          supports,
          tokenAmounts
        )
      ).to.be.revertedWith("Array lengths must match");
    });
  });
  
  describe("Meta-Transactions", function () {
    // This would test the meta-transaction functionality, but it's complex to test
    // due to the need for EIP-712 signatures. In a real implementation, we would
    // include comprehensive tests for this feature.
    
    it("Should track nonces correctly", async function () {
      expect(await votingInterface.getNonce(voter1.address)).to.equal(0);
      
      // After a meta-transaction, the nonce would increment
      // This is a placeholder for actual meta-transaction testing
    });
  });
  
  describe("Admin Functions", function () {
    it("Should allow setting DAO contract", async function () {
      // Deploy a new DAO
      const newDao = await QuadraticVotingDAO.deploy();
      await newDao.initialize(
        governanceToken.target,
        VOTING_PERIOD,
        PROPOSAL_THRESHOLD,
        MIN_QUORUM_PERCENT
      );
      
      // Set new DAO
      await votingInterface.setDAOContract(newDao.target);
      
      // Check that DAO was updated
      expect(await votingInterface.dao()).to.equal(newDao.target);
    });
    
    it("Should allow granting operator role", async function () {
      const operatorRole = await votingInterface.OPERATOR_ROLE();
      
      // Initially voter1 doesn't have the role
      expect(await votingInterface.hasRole(operatorRole, voter1.address)).to.be.false;
      
      // Grant role
      await votingInterface.grantOperatorRole(voter1.address);
      
      // Now voter1 should have the role
      expect(await votingInterface.hasRole(operatorRole, voter1.address)).to.be.true;
    });
    
    it("Should allow revoking operator role", async function () {
      const operatorRole = await votingInterface.OPERATOR_ROLE();
      
      // Initially operator has the role
      expect(await votingInterface.hasRole(operatorRole, operator.address)).to.be.true;
      
      // Revoke role
      await votingInterface.revokeOperatorRole(operator.address);
      
      // Now operator shouldn't have the role
      expect(await votingInterface.hasRole(operatorRole, operator.address)).to.be.false;
    });
    
    it("Should reject admin functions from non-admins", async function () {
      await expect(
        votingInterface.connect(voter1).setDAOContract(ethers.ZeroAddress)
      ).to.be.revertedWith(/AccessControl: account .* is missing role/);
      
      await expect(
        votingInterface.connect(voter1).grantOperatorRole(voter2.address)
      ).to.be.revertedWith(/AccessControl: account .* is missing role/);
      
      await expect(
        votingInterface.connect(voter1).revokeOperatorRole(operator.address)
      ).to.be.revertedWith(/AccessControl: account .* is missing role/);
    });
  });
});