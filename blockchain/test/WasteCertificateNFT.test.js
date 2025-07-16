const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WasteCertificateNFT", function () {
  let WasteCertificateNFT;
  let wasteCertificate;
  let owner;
  let processor;
  let recipient;
  let unauthorized;

  beforeEach(async function () {
    [owner, processor, recipient, unauthorized] = await ethers.getSigners();

    WasteCertificateNFT = await ethers.getContractFactory("WasteCertificateNFT");
    wasteCertificate = await WasteCertificateNFT.deploy();
    await wasteCertificate.initialize("Waste Certificate", "WCERT");
    
    // Authorize processor
    await wasteCertificate.authorizeProcessor(processor.address);
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
  });

  describe("Processor Authorization", function () {
    it("Should authorize processor correctly", async function () {
      expect(await wasteCertificate.authorizedProcessors(processor.address)).to.be.true;
    });

    it("Should emit ProcessorAuthorized event", async function () {
      await expect(wasteCertificate.authorizeProcessor(unauthorized.address))
        .to.emit(wasteCertificate, "ProcessorAuthorized")
        .withArgs(unauthorized.address);
    });

    it("Should revoke processor authorization", async function () {
      await wasteCertificate.revokeProcessor(processor.address);
      expect(await wasteCertificate.authorizedProcessors(processor.address)).to.be.false;
    });

    it("Should only allow owner to authorize processors", async function () {
      await expect(
        wasteCertificate.connect(unauthorized).authorizeProcessor(unauthorized.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Certificate Minting", function () {
    const certificateData = {
      wasteOrigin: "Delhi Facility A",
      processingMethod: "Advanced Recycling",
      carbonCredits: 100,
      recyclingEfficiency: 95,
      environmentalImpact: 85,
      ipfsHash: "QmTest123"
    };

    it("Should mint certificate successfully", async function () {
      const tx = await wasteCertificate.connect(processor).mintCertificate(
        recipient.address,
        certificateData.wasteOrigin,
        certificateData.processingMethod,
        certificateData.carbonCredits,
        certificateData.recyclingEfficiency,
        certificateData.environmentalImpact,
        certificateData.ipfsHash
      );

      await expect(tx)
        .to.emit(wasteCertificate, "CertificateMinted")
        .withArgs(1, recipient.address, certificateData.wasteOrigin, certificateData.ipfsHash);

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
        certificateData.ipfsHash
      );

      const certificate = await wasteCertificate.getCertificate(1);
      expect(certificate.wasteOrigin).to.equal(certificateData.wasteOrigin);
      expect(certificate.processingMethod).to.equal(certificateData.processingMethod);
      expect(certificate.carbonCredits).to.equal(certificateData.carbonCredits);
      expect(certificate.recyclingEfficiency).to.equal(certificateData.recyclingEfficiency);
      expect(certificate.environmentalImpact).to.equal(certificateData.environmentalImpact);
      expect(certificate.ipfsHash).to.equal(certificateData.ipfsHash);
      expect(certificate.processor).to.equal(processor.address);
      expect(certificate.isVerified).to.be.false;
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
          certificateData.ipfsHash
        )
      ).to.be.revertedWith("Not authorized to mint certificates");
    });

    it("Should allow owner to mint without authorization", async function () {
      await wasteCertificate.connect(owner).mintCertificate(
        recipient.address,
        certificateData.wasteOrigin,
        certificateData.processingMethod,
        certificateData.carbonCredits,
        certificateData.recyclingEfficiency,
        certificateData.environmentalImpact,
        certificateData.ipfsHash
      );

      expect(await wasteCertificate.totalSupply()).to.equal(1);
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

      const tokenIds = await wasteCertificate.connect(processor).batchMintCertificates(
        recipients,
        wasteOrigins,
        processingMethods,
        carbonCredits,
        recyclingEfficiencies,
        environmentalImpacts,
        ipfsHashes
      );

      expect(await wasteCertificate.totalSupply()).to.equal(2);
      expect(await wasteCertificate.ownerOf(1)).to.equal(recipient.address);
      expect(await wasteCertificate.ownerOf(2)).to.equal(owner.address);
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
          ["QmTest1"]
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
        "QmTest123"
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

      await expect(tx)
        .to.emit(wasteCertificate, "CertificateUpdated")
        .withArgs(1, "QmUpdated123", 150);

      const certificate = await wasteCertificate.getCertificate(1);
      expect(certificate.carbonCredits).to.equal(150);
      expect(certificate.recyclingEfficiency).to.equal(98);
      expect(certificate.environmentalImpact).to.equal(90);
      expect(certificate.ipfsHash).to.equal("QmUpdated123");
    });

    it("Should not allow unauthorized updates", async function () {
      await expect(
        wasteCertificate.connect(unauthorized).updateCertificate(
          1, 150, 98, 90, "QmUpdated123"
        )
      ).to.be.revertedWith("Not authorized to update this certificate");
    });

    it("Should allow owner to update any certificate", async function () {
      await wasteCertificate.connect(owner).updateCertificate(
        1, 150, 98, 90, "QmUpdated123"
      );

      const certificate = await wasteCertificate.getCertificate(1);
      expect(certificate.carbonCredits).to.equal(150);
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
        "QmTest123"
      );
    });

    it("Should verify certificate", async function () {
      await wasteCertificate.verifyCertificate(1);
      const certificate = await wasteCertificate.getCertificate(1);
      expect(certificate.isVerified).to.be.true;
    });

    it("Should only allow owner to verify", async function () {
      await expect(
        wasteCertificate.connect(unauthorized).verifyCertificate(1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should check authenticity correctly", async function () {
      // Initially not authentic (not verified)
      expect(await wasteCertificate.isAuthentic(1)).to.be.false;

      // After verification, should be authentic
      await wasteCertificate.verifyCertificate(1);
      expect(await wasteCertificate.isAuthentic(1)).to.be.true;

      // After revoking processor, should not be authentic
      await wasteCertificate.revokeProcessor(processor.address);
      expect(await wasteCertificate.isAuthentic(1)).to.be.false;
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
        wasteCertificate.verifyCertificate(999)
      ).to.be.revertedWith("Certificate does not exist");
    });

    it("Should return false for non-existent certificate authenticity", async function () {
      expect(await wasteCertificate.isAuthentic(999)).to.be.false;
    });
  });
});