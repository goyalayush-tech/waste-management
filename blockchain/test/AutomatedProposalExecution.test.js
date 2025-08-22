const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Automated Proposal Execution", function () {
  let WasteGovernanceToken;
  let QuadraticVotingDAO;
  let QuadraticVotingDAOFactory;
  let AutomatedProposalExecutor;
  let AutomatedTreasuryExecutor;
  let ParameterChangeRegistry;
  let TreasuryManager;
  
  let governanceToken;
  let dao;
  let daoFactory;
  let executor;
  let treasuryExecutor;
  let parameterRegistry;
  let treasuryManager;
  
  let owner;
  let proposer;
  let voter1;
  let voter2;
  let voter3;
  let voter4;
  let voter5;
  let recipient;
  
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const TOKEN_NAME = "Waste Governance Token";
  const TOKEN_SYMBOL = "WGT";
  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1 million tokens
  const MAX_SUPPLY = ethers.parseEther("10000000"); // 10 million tokens
  
  const VOTING_PERIOD = 60 * 60 * 24 * 3; // 3 days
  const PROPOSAL_THRESHOLD = ethers.parseEther("10000"); // 10,000 tokens
  const MIN_QUORUM_PERCENT = 10; // 10% of total supply
  
  const EXECUTION_DELAY = 60 * 60 * 24; // 1 day
  const MAX_GAS_FOR_EXECUTION = 3000000; // 3 million gas
  
  const VoteType = {
    For: 0,
    Against: 1,
    Abstain: 2
  };
  
  const SpendingCategory = {
    Operations: 0,
    Development: 1,
    Marketing: 2,
    Community: 3,
    Research: 4,
    Other: 5
  };
  
  beforeEach(async function () {
    // Get signers
    [owner, proposer, voter1, voter2, voter3, voter4, voter5, recipient] = await ethers.getSigners();
    
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
    
    // Deploy automated proposal executor
    AutomatedProposalExecutor = await ethers.getContractFactory("AutomatedProposalExecutor");
    executor = await AutomatedProposalExecutor.deploy();
    await executor.initialize(daoAddress, EXECUTION_DELAY, MAX_GAS_FOR_EXECUTION);
    
    // Deploy parameter change registry
    ParameterChangeRegistry = await ethers.getContractFactory("ParameterChangeRegistry");
    parameterRegistry = await ParameterChangeRegistry.deploy(executor.target);
    
    // Deploy treasury manager
    TreasuryManager = await ethers.getContractFactory("TreasuryManager");
    treasuryManager = await TreasuryManager.deploy(executor.target);
    
    // Deploy automated treasury executor
    AutomatedTreasuryExecutor = await ethers.getContractFactory("AutomatedTreasuryExecutor");
    treasuryExecutor = await AutomatedTreasuryExecutor.deploy(executor.target, treasuryManager.target);
    
    // Set up category budgets
    await treasuryManager.updateCategoryBudget(SpendingCategory.Operations, ethers.parseEther("100000"));
    await treasuryManager.updateCategoryBudget(SpendingCategory.Development, ethers.parseEther("200000"));
    await treasuryManager.updateCategoryBudget(SpendingCategory.Marketing, ethers.parseEther("50000"));
    await treasuryManager.updateCategoryBudget(SpendingCategory.Community, ethers.parseEther("30000"));
    await treasuryManager.updateCategoryBudget(SpendingCategory.Research, ethers.parseEther("100000"));
    await treasuryManager.updateCategoryBudget(SpendingCategory.Other, ethers.parseEther("20000"));
    
    // Distribute tokens for testing
    await governanceToken.transfer(proposer.address, ethers.parseEther("100000"));
    await governanceToken.transfer(voter1.address, ethers.parseEther("100000"));
    await governanceToken.transfer(voter2.address, ethers.parseEther("50000"));
    await governanceToken.transfer(voter3.address, ethers.parseEther("25000"));
    await governanceToken.transfer(voter4.address, ethers.parseEther("10000"));
    await governanceToken.transfer(voter5.address, ethers.parseEther("1000"));
    
    // Grant proposer role to the proposer
    await dao.grantProposerRole(proposer.address);
    
    // Grant executor role to the executor contract
    await dao.grantRole(await dao.ADMIN_ROLE(), executor.target);
    
    // Fund the executor contract for treasury allocations
    await owner.sendTransaction({
      to: executor.target,
      value: ethers.parseEther("500")
    });
  });
  
  describe("Parameter Change Automation", function () {
    it("Should automatically execute parameter changes when proposal passes", async function () {
      // Create parameter change proposal
      const newVotingPeriod = 60 * 60 * 24 * 7; // 7 days
      const newProposalThreshold = ethers.parseEther("5000"); // 5,000 tokens
      const newMinQuorumPercent = 5; // 5% of total supply
      
      const calldata = await parameterRegistry.createParameterChangeCalldata(
        newVotingPeriod,
        newProposalThreshold,
        newMinQuorumPercent,
        true,
        EXECUTION_DELAY,
        MAX_GAS_FOR_EXECUTION
      );
      
      // Create proposal
      const tx = await dao.connect(proposer).createProposal(
        "Update Voting Parameters",
        "Change voting period, proposal threshold, and quorum",
        calldata,
        executor.target
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "ProposalCreated"
      );
      
      const proposalId = event.args[0];
      
      // Approve tokens for voting
      await governanceToken.connect(voter1).approve(dao.target, ethers.parseEther("100000"));
      await governanceToken.connect(voter2).approve(dao.target, ethers.parseEther("50000"));
      
      // Vote on proposal
      await dao.connect(voter1).castVote(proposalId, VoteType.For, ethers.parseEther("100000"));
      await dao.connect(voter2).castVote(proposalId, VoteType.For, ethers.parseEther("50000"));
      
      // Advance time past voting period
      await time.increase(VOTING_PERIOD + 1);
      
      // Execute proposal
      await dao.executeProposal(proposalId);
      
      // Queue for automated execution
      await executor.queueProposal(proposalId);
      
      // Advance time past execution delay
      await time.increase(EXECUTION_DELAY + 1);
      
      // Process queue
      await executor.processQueue(10);
      
      // Check that parameters were updated
      const systemParams = await executor.systemParameters();
      expect(systemParams.votingPeriod).to.equal(newVotingPeriod);
      expect(systemParams.proposalThreshold).to.equal(newProposalThreshold);
      expect(systemParams.minQuorumPercent).to.equal(newMinQuorumPercent);
      
      // Check that DAO parameters were updated
      expect(await dao.votingPeriod()).to.equal(newVotingPeriod);
      expect(await dao.proposalThreshold()).to.equal(newProposalThreshold);
      expect(await dao.minQuorumPercent()).to.equal(newMinQuorumPercent);
    });
  });
  
  describe("Treasury Fund Allocation", function () {
    it("Should automatically execute fund allocations when proposal passes", async function () {
      // Create fund allocation proposal
      const allocationAmount = ethers.parseEther("10");
      const purpose = "Development funding";
      
      const calldata = await treasuryManager.createFundAllocationCalldata(
        recipient.address,
        allocationAmount,
        purpose,
        SpendingCategory.Development
      );
      
      // Create proposal
      const tx = await dao.connect(proposer).createProposal(
        "Fund Development",
        "Allocate funds for development team",
        calldata,
        executor.target
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "ProposalCreated"
      );
      
      const proposalId = event.args[0];
      
      // Approve tokens for voting
      await governanceToken.connect(voter1).approve(dao.target, ethers.parseEther("100000"));
      await governanceToken.connect(voter2).approve(dao.target, ethers.parseEther("50000"));
      
      // Vote on proposal
      await dao.connect(voter1).castVote(proposalId, VoteType.For, ethers.parseEther("100000"));
      await dao.connect(voter2).castVote(proposalId, VoteType.For, ethers.parseEther("50000"));
      
      // Advance time past voting period
      await time.increase(VOTING_PERIOD + 1);
      
      // Execute proposal
      await dao.executeProposal(proposalId);
      
      // Queue for automated execution
      await executor.queueProposal(proposalId);
      
      // Advance time past execution delay
      await time.increase(EXECUTION_DELAY + 1);
      
      // Get recipient balance before execution
      const balanceBefore = await ethers.provider.getBalance(recipient.address);
      
      // Process queue
      await executor.processQueue(10);
      
      // Check that treasury allocation was created
      const allocation = await executor.treasuryAllocations(proposalId);
      expect(allocation.recipient).to.equal(recipient.address);
      expect(allocation.amount).to.equal(allocationAmount);
      expect(allocation.purpose).to.equal(purpose);
      
      // Execute treasury allocation
      await executor.executeTreasuryAllocation(proposalId);
      
      // Check that recipient received funds
      const balanceAfter = await ethers.provider.getBalance(recipient.address);
      expect(balanceAfter - balanceBefore).to.equal(allocationAmount);
    });
  });
  
  describe("Automated Execution Queue", function () {
    it("Should process multiple proposals in the queue", async function () {
      // Create two proposals
      
      // Proposal 1: Parameter change
      const newVotingPeriod = 60 * 60 * 24 * 7; // 7 days
      const calldata1 = await parameterRegistry.createParameterChangeCalldata(
        newVotingPeriod,
        PROPOSAL_THRESHOLD,
        MIN_QUORUM_PERCENT,
        true,
        EXECUTION_DELAY,
        MAX_GAS_FOR_EXECUTION
      );
      
      // Proposal 2: Fund allocation
      const allocationAmount = ethers.parseEther("5");
      const calldata2 = await treasuryManager.createFundAllocationCalldata(
        recipient.address,
        allocationAmount,
        "Marketing campaign",
        SpendingCategory.Marketing
      );
      
      // Create proposals
      const tx1 = await dao.connect(proposer).createProposal(
        "Update Voting Period",
        "Change voting period to 7 days",
        calldata1,
        executor.target
      );
      
      const tx2 = await dao.connect(proposer).createProposal(
        "Fund Marketing",
        "Allocate funds for marketing campaign",
        calldata2,
        executor.target
      );
      
      const receipt1 = await tx1.wait();
      const receipt2 = await tx2.wait();
      
      const event1 = receipt1.logs.find(
        log => log.fragment && log.fragment.name === "ProposalCreated"
      );
      
      const event2 = receipt2.logs.find(
        log => log.fragment && log.fragment.name === "ProposalCreated"
      );
      
      const proposalId1 = event1.args[0];
      const proposalId2 = event2.args[0];
      
      // Approve tokens for voting
      await governanceToken.connect(voter1).approve(dao.target, ethers.parseEther("100000"));
      
      // Vote on proposals
      await dao.connect(voter1).castVote(proposalId1, VoteType.For, ethers.parseEther("50000"));
      await dao.connect(voter1).castVote(proposalId2, VoteType.For, ethers.parseEther("50000"));
      
      // Advance time past voting period
      await time.increase(VOTING_PERIOD + 1);
      
      // Execute proposals
      await dao.executeProposal(proposalId1);
      await dao.executeProposal(proposalId2);
      
      // Queue for automated execution
      await executor.queueProposal(proposalId1);
      await executor.queueProposal(proposalId2);
      
      // Advance time past execution delay
      await time.increase(EXECUTION_DELAY + 1);
      
      // Get pending proposals
      const pendingBefore = await executor.getPendingProposals();
      expect(pendingBefore.length).to.equal(2);
      
      // Process queue
      await executor.processQueue(10);
      
      // Get pending proposals after processing
      const pendingAfter = await executor.getPendingProposals();
      expect(pendingAfter.length).to.equal(0);
      
      // Check that both proposals were executed
      expect(await dao.votingPeriod()).to.equal(newVotingPeriod);
      
      // Execute treasury allocation
      await executor.executeTreasuryAllocation(proposalId2);
      
      // Check that recipient received funds
      const balance = await ethers.provider.getBalance(recipient.address);
      expect(balance).to.be.gt(ethers.parseEther("10000")); // Initial balance + allocation
    });
  });

  describe("AutomatedTreasuryExecutor Integration", function () {
    it("Should schedule and execute treasury operations automatically", async function () {
      // Grant executor role to treasury executor
      await treasuryExecutor.grantExecutorRole(owner.address);
      
      // Schedule a treasury operation
      const operationType = 0; // Fund allocation
      const amount = ethers.parseEther("15");
      const calldata = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "string"],
        [recipient.address, amount, "Automated treasury operation"]
      );
      
      await treasuryExecutor.scheduleTreasuryOperation(
        1, // proposalId
        operationType,
        amount,
        recipient.address,
        calldata
      );
      
      // Check that operation was scheduled
      const operation = await treasuryExecutor.getTreasuryOperation(0);
      expect(operation.proposalId).to.equal(1);
      expect(operation.operationType).to.equal(operationType);
      expect(operation.amount).to.equal(amount);
      expect(operation.target).to.equal(recipient.address);
      expect(operation.executed).to.be.false;
      
      // Fund the treasury executor
      await owner.sendTransaction({
        to: treasuryExecutor.target,
        value: ethers.parseEther("100")
      });
      
      // Get recipient balance before execution
      const balanceBefore = await ethers.provider.getBalance(recipient.address);
      
      // Execute the treasury operation
      await treasuryExecutor.executeTreasuryOperation(0);
      
      // Check that operation was executed
      const executedOperation = await treasuryExecutor.getTreasuryOperation(0);
      expect(executedOperation.executed).to.be.true;
      expect(executedOperation.success).to.be.true;
      
      // Check that recipient received funds
      const balanceAfter = await ethers.provider.getBalance(recipient.address);
      expect(balanceAfter - balanceBefore).to.equal(amount);
    });

    it("Should execute multiple pending treasury operations in batch", async function () {
      // Grant executor role to treasury executor
      await treasuryExecutor.grantExecutorRole(owner.address);
      
      // Schedule multiple treasury operations
      const operations = [
        { proposalId: 1, amount: ethers.parseEther("5"), recipient: voter1.address },
        { proposalId: 2, amount: ethers.parseEther("3"), recipient: voter2.address },
        { proposalId: 3, amount: ethers.parseEther("7"), recipient: voter3.address }
      ];
      
      for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        const calldata = ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "uint256", "string"],
          [op.recipient, op.amount, `Operation ${i + 1}`]
        );
        
        await treasuryExecutor.scheduleTreasuryOperation(
          op.proposalId,
          0, // Fund allocation
          op.amount,
          op.recipient,
          calldata
        );
      }
      
      // Fund the treasury executor
      await owner.sendTransaction({
        to: treasuryExecutor.target,
        value: ethers.parseEther("100")
      });
      
      // Get balances before execution
      const balancesBefore = await Promise.all([
        ethers.provider.getBalance(voter1.address),
        ethers.provider.getBalance(voter2.address),
        ethers.provider.getBalance(voter3.address)
      ]);
      
      // Check pending operations
      const pendingBefore = await treasuryExecutor.getPendingTreasuryOperations();
      expect(pendingBefore.length).to.equal(3);
      
      // Execute all pending operations
      await treasuryExecutor.executeAllPendingOperations(10);
      
      // Check that all operations were executed
      const pendingAfter = await treasuryExecutor.getPendingTreasuryOperations();
      expect(pendingAfter.length).to.equal(0);
      
      // Check that recipients received funds
      const balancesAfter = await Promise.all([
        ethers.provider.getBalance(voter1.address),
        ethers.provider.getBalance(voter2.address),
        ethers.provider.getBalance(voter3.address)
      ]);
      
      expect(balancesAfter[0] - balancesBefore[0]).to.equal(operations[0].amount);
      expect(balancesAfter[1] - balancesBefore[1]).to.equal(operations[1].amount);
      expect(balancesAfter[2] - balancesBefore[2]).to.equal(operations[2].amount);
    });
  });

  describe("End-to-End Automated Proposal Execution", function () {
    it("Should execute complete workflow from proposal creation to treasury execution", async function () {
      // Grant necessary roles
      await treasuryExecutor.grantExecutorRole(executor.target);
      await treasuryManager.grantExecutorRole(treasuryExecutor.target);
      
      // Create a comprehensive proposal that includes both parameter changes and fund allocation
      const newVotingPeriod = 60 * 60 * 24 * 5; // 5 days
      const allocationAmount = ethers.parseEther("20");
      
      // Create parameter change proposal
      const parameterCalldata = await parameterRegistry.createParameterChangeCalldata(
        newVotingPeriod,
        PROPOSAL_THRESHOLD,
        MIN_QUORUM_PERCENT,
        true,
        EXECUTION_DELAY,
        MAX_GAS_FOR_EXECUTION
      );
      
      // Create fund allocation proposal
      const fundCalldata = await treasuryManager.createFundAllocationCalldata(
        recipient.address,
        allocationAmount,
        "End-to-end test funding",
        SpendingCategory.Research
      );
      
      // Create both proposals
      const tx1 = await dao.connect(proposer).createProposal(
        "Update System Parameters",
        "Update voting period for better governance",
        parameterCalldata,
        executor.target
      );
      
      const tx2 = await dao.connect(proposer).createProposal(
        "Fund Research Initiative",
        "Allocate funds for research and development",
        fundCalldata,
        executor.target
      );
      
      const receipt1 = await tx1.wait();
      const receipt2 = await tx2.wait();
      
      const event1 = receipt1.logs.find(
        log => log.fragment && log.fragment.name === "ProposalCreated"
      );
      const event2 = receipt2.logs.find(
        log => log.fragment && log.fragment.name === "ProposalCreated"
      );
      
      const proposalId1 = event1.args[0];
      const proposalId2 = event2.args[0];
      
      // Approve tokens for voting
      await governanceToken.connect(voter1).approve(dao.target, ethers.parseEther("100000"));
      await governanceToken.connect(voter2).approve(dao.target, ethers.parseEther("50000"));
      await governanceToken.connect(voter3).approve(dao.target, ethers.parseEther("25000"));
      
      // Vote on both proposals
      await dao.connect(voter1).castVote(proposalId1, VoteType.For, ethers.parseEther("50000"));
      await dao.connect(voter1).castVote(proposalId2, VoteType.For, ethers.parseEther("50000"));
      await dao.connect(voter2).castVote(proposalId1, VoteType.For, ethers.parseEther("50000"));
      await dao.connect(voter2).castVote(proposalId2, VoteType.For, ethers.parseEther("50000"));
      
      // Advance time past voting period
      await time.increase(VOTING_PERIOD + 1);
      
      // Execute proposals in DAO
      await dao.executeProposal(proposalId1);
      await dao.executeProposal(proposalId2);
      
      // Auto-queue proposals for execution
      await executor.autoQueueProposal(proposalId1);
      await executor.autoQueueProposal(proposalId2);
      
      // Advance time past execution delay
      await time.increase(EXECUTION_DELAY + 1);
      
      // Get recipient balance before execution
      const balanceBefore = await ethers.provider.getBalance(recipient.address);
      
      // Process execution queue
      await executor.processQueue(10);
      
      // Check that parameter changes were applied
      const systemParams = await executor.systemParameters();
      expect(systemParams.votingPeriod).to.equal(newVotingPeriod);
      expect(await dao.votingPeriod()).to.equal(newVotingPeriod);
      
      // Check that treasury allocation was created
      const allocation = await executor.treasuryAllocations(proposalId2);
      expect(allocation.recipient).to.equal(recipient.address);
      expect(allocation.amount).to.equal(allocationAmount);
      expect(allocation.executed).to.be.false;
      
      // Execute treasury allocation
      await executor.executeTreasuryAllocation(proposalId2);
      
      // Check that recipient received funds
      const balanceAfter = await ethers.provider.getBalance(recipient.address);
      expect(balanceAfter - balanceBefore).to.equal(allocationAmount);
      
      // Verify allocation is marked as executed
      const executedAllocation = await executor.treasuryAllocations(proposalId2);
      expect(executedAllocation.executed).to.be.true;
    });

    it("Should handle proposal execution failures gracefully", async function () {
      // Create a proposal with invalid execution data that will fail
      const invalidCalldata = "0x1234567890"; // Invalid function selector
      
      const tx = await dao.connect(proposer).createProposal(
        "Invalid Proposal",
        "This proposal should fail execution",
        invalidCalldata,
        executor.target
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "ProposalCreated"
      );
      
      const proposalId = event.args[0];
      
      // Vote on proposal
      await governanceToken.connect(voter1).approve(dao.target, ethers.parseEther("100000"));
      await dao.connect(voter1).castVote(proposalId, VoteType.For, ethers.parseEther("100000"));
      
      // Advance time and execute
      await time.increase(VOTING_PERIOD + 1);
      await dao.executeProposal(proposalId);
      
      // Queue for execution
      await executor.queueProposal(proposalId);
      await time.increase(EXECUTION_DELAY + 1);
      
      // Process queue - should handle failure gracefully
      await expect(executor.processQueue(10)).to.not.be.reverted;
      
      // Check that the proposal was marked as executed even though it failed
      const queueItem = await executor.executionQueue(0);
      expect(queueItem.executed).to.be.true;
    });

    it("Should respect execution delay and not execute proposals prematurely", async function () {
      // Create a simple parameter change proposal
      const calldata = await parameterRegistry.createParameterChangeCalldata(
        VOTING_PERIOD,
        PROPOSAL_THRESHOLD,
        MIN_QUORUM_PERCENT,
        true,
        EXECUTION_DELAY,
        MAX_GAS_FOR_EXECUTION
      );
      
      const tx = await dao.connect(proposer).createProposal(
        "Test Delay",
        "Test execution delay",
        calldata,
        executor.target
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "ProposalCreated"
      );
      
      const proposalId = event.args[0];
      
      // Vote and execute in DAO
      await governanceToken.connect(voter1).approve(dao.target, ethers.parseEther("100000"));
      await dao.connect(voter1).castVote(proposalId, VoteType.For, ethers.parseEther("100000"));
      
      await time.increase(VOTING_PERIOD + 1);
      await dao.executeProposal(proposalId);
      
      // Queue for execution
      await executor.queueProposal(proposalId);
      
      // Try to execute immediately (should not work)
      await expect(executor.executeProposal(0)).to.be.revertedWith("Execution delay not passed");
      
      // Advance time but not enough
      await time.increase(EXECUTION_DELAY - 100);
      await expect(executor.executeProposal(0)).to.be.revertedWith("Execution delay not passed");
      
      // Advance time past delay
      await time.increase(200);
      
      // Now execution should work
      await expect(executor.executeProposal(0)).to.not.be.reverted;
      
      // Check that proposal was executed
      const queueItem = await executor.executionQueue(0);
      expect(queueItem.executed).to.be.true;
    });
  });
});