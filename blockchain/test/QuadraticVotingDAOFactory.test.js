const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("QuadraticVotingDAOFactory", function () {
  let QuadraticVotingDAOFactory;
  let QuadraticVotingDAO;
  let WasteGovernanceToken;
  let daoFactory;
  
  let owner;
  let deployer;
  let user;
  
  const TOKEN_NAME = "Waste Governance Token";
  const TOKEN_SYMBOL = "WGT";
  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1 million tokens
  const MAX_SUPPLY = ethers.parseEther("10000000"); // 10 million tokens
  
  const VOTING_PERIOD = 60 * 60 * 24 * 3; // 3 days
  const PROPOSAL_THRESHOLD = ethers.parseEther("10000"); // 10,000 tokens
  const MIN_QUORUM_PERCENT = 10; // 10% of total supply
  
  beforeEach(async function () {
    // Get signers
    [owner, deployer, user] = await ethers.getSigners();
    
    // Deploy DAO implementation
    QuadraticVotingDAO = await ethers.getContractFactory("QuadraticVotingDAO");
    const daoImplementation = await QuadraticVotingDAO.deploy();
    
    // Deploy DAO factory
    QuadraticVotingDAOFactory = await ethers.getContractFactory("QuadraticVotingDAOFactory");
    daoFactory = await QuadraticVotingDAOFactory.deploy();
    
    // Grant deployer role to the deployer
    await daoFactory.grantDeployerRole(deployer.address);
  });
  
  describe("Deployment", function () {
    it("Should set the correct roles", async function () {
      const deployerRole = await daoFactory.DEPLOYER_ROLE();
      
      expect(await daoFactory.hasRole(deployerRole, owner.address)).to.be.true;
      expect(await daoFactory.hasRole(deployerRole, deployer.address)).to.be.true;
      expect(await daoFactory.hasRole(deployerRole, user.address)).to.be.false;
    });
  });
  
  describe("DAO Creation", function () {
    it("Should deploy a new DAO with governance token", async function () {
      const daoId = "test-dao";
      const daoName = "Test DAO";
      const daoDescription = "A test DAO for quadratic voting";
      
      const tx = await daoFactory.connect(deployer).deployDAO(
        daoId,
        daoName,
        daoDescription,
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
      
      expect(event).to.not.be.undefined;
      
      const daoAddress = event.args[1];
      const tokenAddress = event.args[2];
      
      // Check that contracts were deployed
      expect(daoAddress).to.not.equal(ethers.ZeroAddress);
      expect(tokenAddress).to.not.equal(ethers.ZeroAddress);
      
      // Check that DAO was registered in factory
      expect(await daoFactory.getDAOContract(daoId)).to.equal(daoAddress);
      expect(await daoFactory.getGovernanceToken(daoId)).to.equal(tokenAddress);
      
      // Check DAO info
      const daoInfo = await daoFactory.getDAOInfo(daoId);
      expect(daoInfo.name).to.equal(daoName);
      expect(daoInfo.description).to.equal(daoDescription);
      expect(daoInfo.governanceToken).to.equal(tokenAddress);
      expect(daoInfo.isActive).to.be.true;
    });
    
    it("Should reject duplicate DAO IDs", async function () {
      const daoId = "test-dao";
      
      // First deployment should succeed
      await daoFactory.connect(deployer).deployDAO(
        daoId,
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
      
      // Second deployment with same ID should fail
      await expect(
        daoFactory.connect(deployer).deployDAO(
          daoId,
          "Another DAO",
          "Another test DAO",
          "Another Token",
          "AT",
          INITIAL_SUPPLY,
          MAX_SUPPLY,
          VOTING_PERIOD,
          PROPOSAL_THRESHOLD,
          MIN_QUORUM_PERCENT
        )
      ).to.be.revertedWith("DAO already exists with this ID");
    });
    
    it("Should reject deployment from non-deployers", async function () {
      await expect(
        daoFactory.connect(user).deployDAO(
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
        )
      ).to.be.revertedWith(/AccessControl: account .* is missing role/);
    });
  });
  
  describe("DAO Management", function () {
    let daoId;
    let daoAddress;
    let dao;
    
    beforeEach(async function () {
      daoId = "test-dao";
      
      const tx = await daoFactory.deployDAO(
        daoId,
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
      
      daoAddress = event.args[1];
      dao = await ethers.getContractAt("QuadraticVotingDAO", daoAddress);
    });
    
    it("Should allow setting DAO status", async function () {
      // Initially active
      expect((await daoFactory.getDAOInfo(daoId)).isActive).to.be.true;
      
      // Set to inactive
      await expect(daoFactory.setDAOStatus(daoId, false))
        .to.emit(daoFactory, "DAOStatusChanged")
        .withArgs(daoId, false);
      
      expect((await daoFactory.getDAOInfo(daoId)).isActive).to.be.false;
      
      // Set back to active
      await daoFactory.setDAOStatus(daoId, true);
      expect((await daoFactory.getDAOInfo(daoId)).isActive).to.be.true;
    });
    
    it("Should reject setting status for non-existent DAOs", async function () {
      await expect(
        daoFactory.setDAOStatus("non-existent-dao", false)
      ).to.be.revertedWith("DAO does not exist");
    });
    
    it("Should track all deployed DAOs", async function () {
      // Deploy another DAO
      await daoFactory.deployDAO(
        "second-dao",
        "Second DAO",
        "Another test DAO",
        "Second Token",
        "ST",
        INITIAL_SUPPLY,
        MAX_SUPPLY,
        VOTING_PERIOD,
        PROPOSAL_THRESHOLD,
        MIN_QUORUM_PERCENT
      );
      
      // Check count
      expect(await daoFactory.getDAOCount()).to.equal(2);
      
      // Check list
      const daos = await daoFactory.getAllDAOs();
      expect(daos.length).to.equal(2);
      expect(daos[0]).to.equal(daoAddress);
    });
  });
  
  describe("Role Management", function () {
    it("Should allow granting deployer role", async function () {
      const deployerRole = await daoFactory.DEPLOYER_ROLE();
      
      // Initially user doesn't have the role
      expect(await daoFactory.hasRole(deployerRole, user.address)).to.be.false;
      
      // Grant role
      await daoFactory.grantDeployerRole(user.address);
      
      // Now user should have the role
      expect(await daoFactory.hasRole(deployerRole, user.address)).to.be.true;
    });
    
    it("Should allow revoking deployer role", async function () {
      const deployerRole = await daoFactory.DEPLOYER_ROLE();
      
      // Initially deployer has the role
      expect(await daoFactory.hasRole(deployerRole, deployer.address)).to.be.true;
      
      // Revoke role
      await daoFactory.revokeDeployerRole(deployer.address);
      
      // Now deployer shouldn't have the role
      expect(await daoFactory.hasRole(deployerRole, deployer.address)).to.be.false;
    });
    
    it("Should reject role management from non-admins", async function () {
      await expect(
        daoFactory.connect(user).grantDeployerRole(user.address)
      ).to.be.revertedWith(/AccessControl: account .* is missing role/);
      
      await expect(
        daoFactory.connect(user).revokeDeployerRole(deployer.address)
      ).to.be.revertedWith(/AccessControl: account .* is missing role/);
    });
  });
});