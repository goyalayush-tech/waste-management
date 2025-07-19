const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WasteCertificateNFT", function () {
  let WasteCertificateNFT;
  let wasteCertificate;
  let owner;
  let processor;
  let verifier;
  let updater;
  let recipient;
  let unauthorized;
  
  // Role constants
  const PROCESSOR_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PROCESSOR_ROLE"));
  const VERIFIER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("VERIFIER_ROLE"));
  const UPDATER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("UPDATER_ROLE"));
  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

  beforeEach(async function () {
    [owner, processor, verifier, updater, recipient, unauthorized] = await ethers.getSigners();

    WasteCertificateNFT = await ethers.getContractFactory("WasteCertificateNFT");
    wasteCertificate = await WasteCertificateNFT.deploy();
    await wasteCertificate.initialize("Waste Certificate", "WCERT");
    
    // Grant roles
    await wasteCertificate.grantRole(PROCESSOR_ROLE, processor.address);
    await wasteCertificate.grantRole(VERIFIER_ROLE, verifier.address);
    await wasteCertificate.grantRole(UPDATER_ROLE, updater.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await wasteCertificate.owner()).to.equal(owner.address);
    });

    it("Should set the correct name and symbol", async function () {
      expect(await wasteCertificate.name()).to.equal("Waste Certificate");
      expect(await wasteCertificate.symbol()).to.equal("WCERT");
    });

    it("Should start with token ID counter at 1", async function () {
      expect(await wasteCertificate.totalSupply()).to.equal(0);
    });
    
    it("Should set up roles correctly", async function () {
      expect(await wasteCertificate.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await wasteCertificate.hasRole(PROCESSOR_ROLE, processor.address)).to.be.true;
      expect(await wasteCertificate.hasRole(VERIFIER_ROLE, verifier.address)).to.be.true;
      expect(await wasteCertificate.hasRole(UPDATER_ROLE, updater.address)).to.be.true;
    });
  });

  describe("Role Management", function () {
    it("Should allow admin to grant roles", async function () {
      await wasteCertificate.grantRole(PROCESSOR_ROLE, unauthorized.address);
      expect(await wasteCertificate.hasRole(PROCESSOR_ROLE, unauthorized.address)).to.be.true;
    });

    it("Should allow admin to revoke roles", async function () {
      await wasteCertificate.revokeRole(PROCESSOR_ROLE, processor.address);
      expect(await wasteCertificate.hasRole(PROCESSOR_ROLE, processor.address)).to.be.false;
    });

    it("Should not allow non-admin to grant roles", async function () {
      await expect(
        wasteCertificate.connect(unauthorized).grantRole(PROCESSOR_ROLE, unauthorized.address)
      ).to.be.revertedWith("AccessControl: account " + unauthorized.address.toLowerCase() + " is missing role " + DEFAULT_ADMIN_ROLE);
    });
  });

  describe("Certificate Minting", function () {
    const certificateData = {
      wasteOrigin: "Delhi Facility A",
      processingMethod: "Advanced Recycling",
      carbonCredits: 100,
      recyclingEfficiency: 95,
      environmentalImpact: 85,
      ipfsHash: "QmTest123",
      digitalTwinId: "DT12345"
    };

    it("Should mint certificate successfully", async function () {
      const tx = await wasteCertificate.connect(processor).mintCertificate(
        recipient.address,
        certificateData.wasteOrigin,
        certificateData.processingMethod,
        certificateData.carbonCredits,
        certificateData.recyclingEfficiency,
        certificateData.environmentalImpact,
        certificateData.ipfsHash,
        certificateData.digitalTwinId
      );

      await expect(tx)
        .to.emit(wasteCertificate, "CertificateMinted")
        .withArgs(1, recipient.address, certificateData.wasteOrigin, certificateData.ipfsHash, certificateData.digitalTwinId);

      expect(await wasteCertificate.ownerOf(1)).to.equal(recipient.address);
      expect(await wasteCertificate.totalSupply()).to.equal(1);
    });

    it("Should store certificate data correctly", async function () {
      await wasteCertificate.connect(processor).mintCertificate(
        recipient.address,
        certificateData.wasteOrigin,
        certificateData.processingMethod,
        certificateData.carbonCredits,
        certificateData.recyclingEfficiency,
        certificateData.environmentalImpact,
        certificateData.ipfsHash,
        certificateData.digitalTwinId
      );

      const certificate = await wasteCertificate.getCertificate(1);
      expect(certificate.wasteOrigin).to.equal(certificateData.wasteOrigin);
      expect(certificate.processingMethod).to.equal(certificateData.processingMethod);
      expect(certificate.carbonCredits).to.equal(certificateData.carbonCredits);
      expect(certificate.recyclingEfficiency).to.equal(certificateData.recyclingEfficiency);
      expect(certificate.environmentalImpact).to.equal(certificateData.environmentalImpact);
      expect(certificate.ipfsHash).to.equal(certificateData.ipfsHash);
      expect(certificate.digitalTwinId).to.equal(certificateData.digitalTwinId);
      expect(certificate.processor).to.equal(processor.address);
      expect(certificate.isVerified).to.be.false;
      
      // Check processing stages
      const stages = await wasteCertificate.getProcessingStages(1);
      expect(stages.length).to.equal(1);
      expect(stages[0].stageName).to.equal("Initial Processing");
      expect(stages[0].stageType).to.equal("creation");
    });

    it("Should not allow unauthorized minting", async function () {
      await expect(
        wasteCertificate.connect(unauthorized).mintCertificate(
          recipient.address,
          certificateData.wasteOrigin,
          certificateData.processingMethod,
          certificateData.carbonCredits,
          certificateData.recyclingEfficiency,
          certificateData.environmentalImpact,
          certificateData.ipfsHash,
          certificateData.digitalTwinId
        )
      ).to.be.revertedWith("AccessControl: account " + unauthorized.address.toLowerCase() + " is missing role " + PROCESSOR_ROLE);
    });

    it("Should allow owner with processor role to mint", async function () {
      await wasteCertificate.grantRole(PROCESSOR_ROLE, owner.address);
      await wasteCertificate.connect(owner).mintCertificate(
        recipient.address,
        certificateData.wasteOrigin,
        certificateData.processingMethod,
        certificateData.carbonCredits,
        certificateData.recyclingEfficiency,
        certificateData.environmentalImpact,
        certificateData.ipfsHash,
        certificateData.digitalTwinId
      );

      expect(await wasteCertificate.totalSupply()).to.equal(1);
    });
    
    it("Should link digital twin to certificate", async function () {
      await wasteCertificate.connect(processor).mintCertificate(
        recipient.address,
        certificateData.wasteOrigin,
        certificateData.processingMethod,
        certificateData.carbonCredits,
        certificateData.recyclingEfficiency,
        certificateData.environmentalImpact,
        certificateData.ipfsHash,
        certificateData.digitalTwinId
      );
      
      const [tokenId, certificate] = await wasteCertificate.getCertificateByDigitalTwin(certificateData.digitalTwinId);
      expect(tokenId).to.equal(1);
      expect(certificate.wasteOrigin).to.equal(certificateData.wasteOrigin);
    });
    
    it("Should not allow duplicate digital twin IDs", async function () {
      await wasteCertificate.connect(processor).mintCertificate(
        recipient.address,
        certificateData.wasteOrigin,
        certificateData.processingMethod,
        certificateData.carbonCredits,
        certificateData.recyclingEfficiency,
        certificateData.environmentalImpact,
        certificateData.ipfsHash,
        certificateData.digitalTwinId
      );
      
      await expect(
        wasteCertificate.connect(processor).mintCertificate(
          recipient.address,
          "Another Origin",
          "Another Method",
          200,
          90,
          80,
          "QmTest456",
          certificateData.digitalTwinId
        )
      ).to.be.revertedWith("Digital twin already linked to a certificate");
    });
  });

  describe("Batch Minting", function () {
    it("Should batch mint certificates successfully", async function () {
      const recipients = [recipient.address, owner.address];
      const wasteOrigins = ["Facility A", "Facility B"];
      const processingMethods = ["Method A", "Method B"];
      const carbonCredits = [100, 150];
      const recyclingEfficiencies = [95, 90];
      const environmentalImpacts = [85, 80];
      const ipfsHashes = ["QmTest1", "QmTest2"];
      const digitalTwinIds = ["DT1", "DT2"];

      await wasteCertificate.connect(processor).batchMintCertificates(
        recipients,
        wasteOrigins,
        processingMethods,
        carbonCredits,
        recyclingEfficiencies,
        environmentalImpacts,
        ipfsHashes,
        digitalTwinIds
      );

      expect(await wasteCertificate.totalSupply()).to.equal(2);
      expect(await wasteCertificate.ownerOf(1)).to.equal(recipient.address);
      expect(await wasteCertificate.ownerOf(2)).to.equal(owner.address);
      
      // Check digital twin links
      const [tokenId1] = await wasteCertificate.getCertificateByDigitalTwin("DT1");
      const [tokenId2] = await wasteCertificate.getCertificateByDigitalTwin("DT2");
      expect(tokenId1).to.equal(1);
      expect(tokenId2).to.equal(2);
    });

    it("Should revert if array lengths don't match", async function () {
      const recipients = [recipient.address];
      const wasteOrigins = ["Facility A", "Facility B"]; // Different length

      await expect(
        wasteCertificate.connect(processor).batchMintCertificates(
          recipients,
          wasteOrigins,
          ["Method A"],
          [100],
          [95],
          [85],
          ["QmTest1"],
          ["DT1"]
        )
      ).to.be.revertedWith("Array lengths must match");
    });
  });

  describe("Certificate Updates", function () {
    beforeEach(async function () {
      await wasteCertificate.connect(processor).mintCertificate(
        recipient.address,
        "Delhi Facility A",
        "Advanced Recycling",
        100,
        95,
        85,
        "QmTest123",
        "DT12345"
      );
    });

    it("Should update certificate successfully", async function () {
      const tx = await wasteCertificate.connect(processor).updateCertificate(
        1,
        150, // new carbon credits
        98,  // new recycling efficiency
        90,  // new environmental impact
        "QmUpdated123" // new IPFS hash
      );

      // Check event includes timestamp
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'CertificateUpdated');
      expect(event.args.tokenId).to.equal(1);
      expect(event.args.newIpfsHash).to.equal("QmUpdated123");
      expect(event.args.carbonCredits).to.equal(150);
      expect(event.args.timestamp).to.be.gt(0);

      const certificate = await wasteCertificate.getCertificate(1);
      expect(certificate.carbonCredits).to.equal(150);
      expect(certificate.recyclingEfficiency).to.equal(98);
      expect(certificate.environmentalImpact).to.equal(90);
      expect(certificate.ipfsHash).to.equal("QmUpdated123");
      expect(certificate.lastUpdated).to.be.gt(certificate.processingTimestamp);
    });

    it("Should not allow unauthorized updates", async function () {
      await expect(
        wasteCertificate.connect(unauthorized).updateCertificate(
          1, 150, 98, 90, "QmUpdated123"
        )
      ).to.be.revertedWith("Not authorized to update this certificate");
    });

    it("Should allow updater role to update any certificate", async function () {
      await wasteCertificate.connect(updater).updateCertificate(
        1, 150, 98, 90, "QmUpdated123"
      );

      const certificate = await wasteCertificate.getCertificate(1);
      expect(certificate.carbonCredits).to.equal(150);
    });
    
    it("Should add processing stage to certificate", async function () {
      const tx = await wasteCertificate.connect(processor).addProcessingStage(
        1,
        "Quality Check",
        "quality_check",
        "QmStageData123"
      );
      
      await expect(tx)
        .to.emit(wasteCertificate, "ProcessingStageAdded")
        .withArgs(1, "Quality Check", "quality_check", await ethers.provider.getBlock(tx.blockNumber).then(b => b.timestamp));
      
      const stages = await wasteCertificate.getProcessingStages(1);
      expect(stages.length).to.equal(2);
      expect(stages[1].stageName).to.equal("Quality Check");
      expect(stages[1].stageType).to.equal("quality_check");
      expect(stages[1].dataHash).to.equal("QmStageData123");
    });
    
    it("Should not allow unauthorized processing stage additions", async function () {
      await expect(
        wasteCertificate.connect(unauthorized).addProcessingStage(
          1, "Quality Check", "quality_check", "QmStageData123"
        )
      ).to.be.revertedWith("Not authorized to update this certificate");
    });
  });

  describe("Certificate Verification", function () {
    beforeEach(async function () {
      await wasteCertificate.connect(processor).mintCertificate(
        recipient.address,
        "Delhi Facility A",
        "Advanced Recycling",
        100,
        95,
        85,
        "QmTest123",
        "DT12345"
      );
    });

    it("Should verify certificate", async function () {
      const tx = await wasteCertificate.connect(verifier).verifyCertificate(1);
      
      await expect(tx)
        .to.emit(wasteCertificate, "CertificateVerified")
        .withArgs(1, verifier.address, await ethers.provider.getBlock(tx.blockNumber).then(b => b.timestamp));
      
      const certificate = await wasteCertificate.getCertificate(1);
      expect(certificate.isVerified).to.be.true;
    });

    it("Should only allow verifier role to verify", async function () {
      await expect(
        wasteCertificate.connect(unauthorized).verifyCertificate(1)
      ).to.be.revertedWith("AccessControl: account " + unauthorized.address.toLowerCase() + " is missing role " + VERIFIER_ROLE);
    });

    it("Should check authenticity correctly", async function () {
      // Initially not authentic (not verified)
      expect(await wasteCertificate.isAuthentic(1)).to.be.false;

      // After verification, should be authentic
      await wasteCertificate.connect(verifier).verifyCertificate(1);
      expect(await wasteCertificate.isAuthentic(1)).to.be.true;

      // After revoking processor role, should not be authentic
      await wasteCertificate.revokeRole(PROCESSOR_ROLE, processor.address);
      expect(await wasteCertificate.isAuthentic(1)).to.be.false;
    });
  });
  
  describe("Digital Twin Integration", function () {
    beforeEach(async function () {
      await wasteCertificate.connect(processor).mintCertificate(
        recipient.address,
        "Delhi Facility A",
        "Advanced Recycling",
        100,
        95,
        85,
        "QmTest123",
        "DT12345"
      );
    });
    
    it("Should link a new digital twin to certificate", async function () {
      const tx = await wasteCertificate.connect(processor).linkDigitalTwin(1, "DT67890");
      
      await expect(tx)
        .to.emit(wasteCertificate, "DigitalTwinLinked")
        .withArgs(1, "DT67890");
      
      const certificate = await wasteCertificate.getCertificate(1);
      expect(certificate.digitalTwinId).to.equal("DT67890");
      
      // Old digital twin should be unlinked
      await expect(
        wasteCertificate.getCertificateByDigitalTwin("DT12345")
      ).to.be.revertedWith("No certificate linked to this digital twin");
      
      // New digital twin should be linked
      const [tokenId] = await wasteCertificate.getCertificateByDigitalTwin("DT67890");
      expect(tokenId).to.equal(1);
    });
    
    it("Should not allow unauthorized digital twin linking", async function () {
      await expect(
        wasteCertificate.connect(unauthorized).linkDigitalTwin(1, "DT67890")
      ).to.be.revertedWith("Not authorized to update this certificate");
    });
    
    it("Should not allow linking to already linked digital twin", async function () {
      // Create a second certificate
      await wasteCertificate.connect(processor).mintCertificate(
        recipient.address,
        "Another Origin",
        "Another Method",
        200,
        90,
        80,
        "QmTest456",
        "DT67890"
      );
      
      // Try to link the first certificate to the second's digital twin
      await expect(
        wasteCertificate.connect(processor).linkDigitalTwin(1, "DT67890")
      ).to.be.revertedWith("Digital twin already linked to another certificate");
    });
  });
  
  describe("Royalty Support", function () {
    it("Should have default royalty set", async function () {
      const [receiver, amount] = await wasteCertificate.royaltyInfo(1, 10000);
      expect(receiver).to.equal(owner.address);
      expect(amount).to.equal(250); // 2.5% of 10000
    });
    
    it("Should allow owner to set default royalty", async function () {
      await wasteCertificate.setDefaultRoyalty(recipient.address, 500); // 5%
      
      const [receiver, amount] = await wasteCertificate.royaltyInfo(1, 10000);
      expect(receiver).to.equal(recipient.address);
      expect(amount).to.equal(500); // 5% of 10000
    });
    
    it("Should allow owner to set token-specific royalty", async function () {
      // Mint a token first
      await wasteCertificate.connect(processor).mintCertificate(
        recipient.address,
        "Delhi Facility A",
        "Advanced Recycling",
        100,
        95,
        85,
        "QmTest123",
        "DT12345"
      );
      
      // Set token-specific royalty
      await wasteCertificate.setTokenRoyalty(1, verifier.address, 300); // 3%
      
      const [receiver, amount] = await wasteCertificate.royaltyInfo(1, 10000);
      expect(receiver).to.equal(verifier.address);
      expect(amount).to.equal(300); // 3% of 10000
    });
  });
  
  describe("Pausable Functionality", function () {
    it("Should allow owner to pause contract", async function () {
      await wasteCertificate.pause();
      expect(await wasteCertificate.paused()).to.be.true;
    });
    
    it("Should not allow minting when paused", async function () {
      await wasteCertificate.pause();
      
      await expect(
        wasteCertificate.connect(processor).mintCertificate(
          recipient.address,
          "Delhi Facility A",
          "Advanced Recycling",
          100,
          95,
          85,
          "QmTest123",
          "DT12345"
        )
      ).to.be.revertedWith("Pausable: paused");
    });
    
    it("Should allow owner to unpause contract", async function () {
      await wasteCertificate.pause();
      await wasteCertificate.unpause();
      expect(await wasteCertificate.paused()).to.be.false;
      
      // Should be able to mint after unpausing
      await wasteCertificate.connect(processor).mintCertificate(
        recipient.address,
        "Delhi Facility A",
        "Advanced Recycling",
        100,
        95,
        85,
        "QmTest123",
        "DT12345"
      );
      
      expect(await wasteCertificate.totalSupply()).to.equal(1);
    });
  });

  describe("Edge Cases", function () {
    it("Should revert when getting non-existent certificate", async function () {
      await expect(
        wasteCertificate.getCertificate(999)
      ).to.be.revertedWith("Certificate does not exist");
    });

    it("Should revert when updating non-existent certificate", async function () {
      await expect(
        wasteCertificate.connect(processor).updateCertificate(
          999, 150, 98, 90, "QmUpdated123"
        )
      ).to.be.revertedWith("Certificate does not exist");
    });

    it("Should revert when verifying non-existent certificate", async function () {
      await expect(
        wasteCertificate.connect(verifier).verifyCertificate(999)
      ).to.be.revertedWith("Certificate does not exist");
    });

    it("Should return false for non-existent certificate authenticity", async function () {
      expect(await wasteCertificate.isAuthentic(999)).to.be.false;
    });
    
    it("Should revert when getting non-existent digital twin", async function () {
      await expect(
        wasteCertificate.getCertificateByDigitalTwin("NonExistent")
      ).to.be.revertedWith("No certificate linked to this digital twin");
    });
  });
});