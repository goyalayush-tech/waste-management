const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VoteWeightCalculator", function () {
  let WasteGovernanceToken;
  let VoteWeightCalculator;
  let governanceToken;
  let voteCalculator;
  
  let owner;
  let voter1;
  let voter2;
  let voter3;
  
  const TOKEN_NAME = "Waste Governance Token";
  const TOKEN_SYMBOL = "WGT";
  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1 million tokens
  const MAX_SUPPLY = ethers.parseEther("10000000"); // 10 million tokens
  
  beforeEach(async function () {
    // Get signers
    [owner, voter1, voter2, voter3] = await ethers.getSigners();
    
    // Deploy governance token
    WasteGovernanceToken = await ethers.getContractFactory("WasteGovernanceToken");
    governanceToken = await WasteGovernanceToken.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      INITIAL_SUPPLY,
      MAX_SUPPLY
    );
    
    // Deploy vote calculator
    VoteWeightCalculator = await ethers.getContractFactory("VoteWeightCalculator");
    voteCalculator = await VoteWeightCalculator.deploy(governanceToken.target);
    
    // Distribute tokens for testing
    await governanceToken.transfer(voter1.address, ethers.parseEther("100000"));
    await governanceToken.transfer(voter2.address, ethers.parseEther("10000"));
    await governanceToken.transfer(voter3.address, ethers.parseEther("1000"));
  });
  
  describe("Basic Vote Weight Calculation", function () {
    it("Should calculate square root of token amount", async function () {
      // Test with different token amounts
      const tests = [
        { tokens: "100", expected: 10 },
        { tokens: "10000", expected: 100 },
        { tokens: "1000000", expected: 1000 }
      ];
      
      for (const test of tests) {
        const weight = await voteCalculator.calculateVoteWeight(
          voter1.address,
          ethers.parseEther(test.tokens)
        );
        
        // Convert to number for easier comparison
        const weightNumber = Number(ethers.formatEther(weight)) * 1e18;
        expect(weightNumber).to.be.closeTo(test.expected, 1); // Allow small rounding error
      }
    });
    
    it("Should return 0 for 0 tokens", async function () {
      const weight = await voteCalculator.calculateVoteWeight(
        voter1.address,
        ethers.parseEther("0")
      );
      
      expect(weight).to.equal(0);
    });
  });
  
  describe("Participation Bonus", function () {
    beforeEach(async function () {
      // Set participation scores
      await voteCalculator.updateParticipationScore(voter1.address, 100); // 5% bonus
      await voteCalculator.updateParticipationScore(voter2.address, 500); // 25% bonus
      await voteCalculator.updateParticipationScore(voter3.address, 2000); // Max 50% bonus
    });
    
    it("Should apply participation bonus correctly", async function () {
      // Voter1: 100 participation points = 5% bonus
      // Base weight for 10000 tokens = 100
      // Bonus = 100 * 5% = 5
      // Total weight = 105
      const weight1 = await voteCalculator.calculateVoteWeight(
        voter1.address,
        ethers.parseEther("10000")
      );
      
      const weight1Number = Number(ethers.formatEther(weight1)) * 1e18;
      expect(weight1Number).to.be.closeTo(105, 1);
      
      // Voter2: 500 participation points = 25% bonus
      // Base weight for 10000 tokens = 100
      // Bonus = 100 * 25% = 25
      // Total weight = 125
      const weight2 = await voteCalculator.calculateVoteWeight(
        voter2.address,
        ethers.parseEther("10000")
      );
      
      const weight2Number = Number(ethers.formatEther(weight2)) * 1e18;
      expect(weight2Number).to.be.closeTo(125, 1);
      
      // Voter3: 2000 participation points = 50% bonus (capped)
      // Base weight for 10000 tokens = 100
      // Bonus = 100 * 50% = 50
      // Total weight = 150
      const weight3 = await voteCalculator.calculateVoteWeight(
        voter3.address,
        ethers.parseEther("10000")
      );
      
      const weight3Number = Number(ethers.formatEther(weight3)) * 1e18;
      expect(weight3Number).to.be.closeTo(150, 1);
    });
    
    it("Should increment participation score", async function () {
      await voteCalculator.incrementParticipationScore(voter1.address, 50);
      
      const score = await voteCalculator.participationScore(voter1.address);
      expect(score).to.equal(150); // 100 + 50
    });
    
    it("Should update participation bonus parameters", async function () {
      await voteCalculator.updateParticipationBonus(800, 8000); // 8% per 100 points, max 80%
      
      const bonus = await voteCalculator.participationBonus();
      const maxBonus = await voteCalculator.maxParticipationBonus();
      
      expect(bonus).to.equal(800);
      expect(maxBonus).to.equal(8000);
    });
    
    it("Should reject invalid participation bonus parameters", async function () {
      await expect(
        voteCalculator.updateParticipationBonus(1100, 8000) // 11% per 100 points (too high)
      ).to.be.revertedWith("Bonus too high");
      
      await expect(
        voteCalculator.updateParticipationBonus(800, 11000) // 110% max bonus (too high)
      ).to.be.revertedWith("Max bonus too high");
    });
  });
  
  describe("Access Control", function () {
    it("Should only allow owner to update participation score", async function () {
      await expect(
        voteCalculator.connect(voter1).updateParticipationScore(voter1.address, 200)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("Should only allow owner to increment participation score", async function () {
      await expect(
        voteCalculator.connect(voter1).incrementParticipationScore(voter1.address, 50)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("Should only allow owner to update participation bonus", async function () {
      await expect(
        voteCalculator.connect(voter1).updateParticipationBonus(800, 8000)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    
    it("Should only allow owner to set governance token", async function () {
      await expect(
        voteCalculator.connect(voter1).setGovernanceToken(voter1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});