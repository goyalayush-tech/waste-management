const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WasteCertificateFactory", function () {
  let WasteCertificateFactory;
  let factory;
  let owner;
  let deployer;
  let processor;
  let verifier;
  let updater;
  let recipient;
  let unauthorized;
  
  // Role constants
  const DEPLOYER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("DEPLOYER_ROLE"));
  const PROCESSOR_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PROCESSOR_ROLE"));
  const VERIFIER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("VERIFIER_ROLE"));
  const UPDATER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("UPDATER_ROLE"));
  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

  beforeEach(async function () {
    [owner, deployer, processor, verifier, updater, recipient, unauthorized] = await ethers.getSigners();

    WasteCertificateFactory = await ethers.getContractFactory("WasteCertificateFactory");
    factory = await WasteCertificateFactory.deploy();
    
    // Grant deployer role
    await factory.grantDeployerRole(deployer.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await factory.owner()).to.equal(owner.address);
    });

    it("Should deploy certificate implementation", async function () {
      const implementation = await factory.certificateImplementation();
      expect(implementation).to.not.equal(ethers.constants.AddressZero);
    });

    it("Should start with zero contracts", async function () {
      expect(await factory.getContractCount()).to.equal(0);
    });
    
    it("Should set up roles correctly", async function () {
      expect(await factory.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await factory.hasRole(DEPLOYER_ROLE, owner.address)).to.be.true;
      expect(await factory.hasRole(DEPLOYER_ROLE, deployer.address)).to.be.true;
    });
  });
  
  describe("Role Management", function () {
    it("Should allow admin to grant deployer role", async function () {
      await factory.grantDeployerRole(unauthorized.address);
      expect(await factory.hasRole(DEPLOYER_ROLE, unauthorized.address)).to.be.true;
    });
    
    it("Should allow admin to revoke deployer role", async function () {
      await factory.revokeDeployerRole(deployer.address);
      expect(await factory.hasRole(DEPLOYER_ROLE, deployer.address)).to.be.false;
    });
    
    it("Should not allow non-admin to grant roles", async function () {
      await expect(
        factory.connect(unauthorized).grantDeployerRole(unauthorized.address)
      ).to.be.revertedWith("AccessControl: account " + unauthorized.address.toLowerCase() + " is missing role " + DEFAULT_ADMIN_ROLE);
    });
  });

  describe("Contract Deployment", function () {
    it("Should deploy certificate contract successfully", async function () {
      const facilityId = "FACILITY_001";
      const name = "Delhi Facility A Certificates";
      const symbol = "DFA";
      const location = "Delhi, India";
      const facilityType = "Recycling Center";

      const tx = await factory.connect(deployer).deployCertificateContract(
        facilityId, name, symbol, location, facilityType
      );
      
      await expect(tx)
        .to.emit(factory, "CertificateContractDeployed")
        .withArgs(facilityId, await factory.getCertificateContract(facilityId), name, symbol, facilityType);

      const contractAddress = await factory.getCertificateContract(facilityId);
      expect(contractAddress).to.not.equal(ethers.constants.AddressZero);

      expect(await factory.getContractCount()).to.equal(1);
      
      // Check facility info
      const facilityInfo = await factory.getFacilityInfo(facilityId);
      expect(facilityInfo.name).to.equal(name);
      expect(facilityInfo.location).to.equal(location);
      expect(facilityInfo.facilityType).to.equal(facilityType);
      expect(facilityInfo.isActive).to.be.true;
    });

    it("Should initialize deployed contract correctly", async function () {
      const facilityId = "FACILITY_001";
      const name = "Delhi Facility A Certificates";
      const symbol = "DFA";
      const location = "Delhi, India";
      const facilityType = "Recycling Center";

      await factory.connect(deployer).deployCertificateContract(
        facilityId, name, symbol, location, facilityType
      );
      const contractAddress = await factory.getCertificateContract(facilityId);

      const WasteCertificateNFT = await ethers.getContractFactory("WasteCertificateNFT");
      const certificate = WasteCertificateNFT.attach(contractAddress);

      expect(await certificate.name()).to.equal(name);
      expect(await certificate.symbol()).to.equal(symbol);
      expect(await certificate.owner()).to.equal(owner.address);
      
      // Check roles are set up
      expect(await certificate.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await certificate.hasRole(PROCESSOR_ROLE, owner.address)).to.be.true;
      expect(await certificate.hasRole(VERIFIER_ROLE, owner.address)).to.be.true;
      expect(await certificate.hasRole(UPDATER_ROLE, owner.address)).to.be.true;
    });

    it("Should not allow duplicate facility contracts", async function () {
      const facilityId = "FACILITY_001";
      const name = "Delhi Facility A Certificates";
      const symbol = "DFA";
      const location = "Delhi, India";
      const facilityType = "Recycling Center";

      await factory.connect(deployer).deployCertificateContract(
        facilityId, name, symbol, location, facilityType
      );

      await expect(
        factory.connect(deployer).deployCertificateContract(
          facilityId, name, symbol, location, facilityType
        )
      ).to.be.revertedWith("Contract already exists for this facility");
    });

    it("Should only allow deployer role to deploy contracts", async function () {
      await expect(
        factory.connect(unauthorized).deployCertificateContract(
          "FACILITY_001",
          "Test",
          "TEST",
          "Location",
          "Type"
        )
      ).to.be.revertedWith("AccessControl: account " + unauthorized.address.toLowerCase() + " is missing role " + DEPLOYER_ROLE);
    });
  });

  describe("Contract Management", function () {
    beforeEach(async function () {
      await factory.connect(deployer).deployCertificateContract(
        "FACILITY_001", "Facility A", "FA", "Location A", "Type A"
      );
      await factory.connect(deployer).deployCertificateContract(
        "FACILITY_002", "Facility B", "FB", "Location B", "Type B"
      );
      await factory.connect(deployer).deployCertificateContract(
        "FACILITY_003", "Facility C", "FC", "Location C", "Type C"
      );
    });

    it("Should return correct contract count", async function () {
      expect(await factory.getContractCount()).to.equal(3);
    });

    it("Should return all deployed contracts", async function () {
      const contracts = await factory.getAllContracts();
      expect(contracts.length).to.equal(3);
      
      for (let i = 0; i < contracts.length; i++) {
        expect(contracts[i]).to.not.equal(ethers.constants.AddressZero);
      }
    });

    it("Should return correct contract for facility", async function () {
      const facility1Contract = await factory.getCertificateContract("FACILITY_001");
      const facility2Contract = await factory.getCertificateContract("FACILITY_002");
      
      expect(facility1Contract).to.not.equal(facility2Contract);
      expect(facility1Contract).to.not.equal(ethers.constants.AddressZero);
      expect(facility2Contract).to.not.equal(ethers.constants.AddressZero);
    });

    it("Should return zero address for non-existent facility", async function () {
      const contract = await factory.getCertificateContract("NON_EXISTENT");
      expect(contract).to.equal(ethers.constants.AddressZero);
    });
    
    it("Should set facility status", async function () {
      await factory.setFacilityStatus("FACILITY_001", false);
      
      const facilityInfo = await factory.getFacilityInfo("FACILITY_001");
      expect(facilityInfo.isActive).to.be.false;
      
      // Check that contract is paused
      const contractAddress = await factory.getCertificateContract("FACILITY_001");
      const WasteCertificateNFT = await ethers.getContractFactory("WasteCertificateNFT");
      const certificate = WasteCertificateNFT.attach(contractAddress);
      expect(await certificate.paused()).to.be.true;
      
      // Reactivate
      await factory.setFacilityStatus("FACILITY_001", true);
      const updatedInfo = await factory.getFacilityInfo("FACILITY_001");
      expect(updatedInfo.isActive).to.be.true;
      expect(await certificate.paused()).to.be.false;
    });
  });
  
  describe("Role Authorization", function () {
    let certificateContract;
    
    beforeEach(async function () {
      await factory.connect(deployer).deployCertificateContract(
        "FACILITY_001", "Test Facility", "TF", "Test Location", "Test Type"
      );
      const contractAddress = await factory.getCertificateContract("FACILITY_001");
      
      const WasteCertificateNFT = await ethers.getContractFactory("WasteCertificateNFT");
      certificateContract = WasteCertificateNFT.attach(contractAddress);
    });
    
    it("Should authorize processor for a facility", async function () {
      await factory.authorizeProcessor("FACILITY_001", processor.address);
      
      expect(await certificateContract.hasRole(PROCESSOR_ROLE, processor.address)).to.be.true;
    });
    
    it("Should authorize verifier for a facility", async function () {
      await factory.authorizeVerifier("FACILITY_001", verifier.address);
      
      expect(await certificateContract.hasRole(VERIFIER_ROLE, verifier.address)).to.be.true;
    });
    
    it("Should authorize updater for a facility", async function () {
      await factory.authorizeUpdater("FACILITY_001", updater.address);
      
      expect(await certificateContract.hasRole(UPDATER_ROLE, updater.address)).to.be.true;
    });
    
    it("Should not allow unauthorized role authorization", async function () {
      await expect(
        factory.connect(unauthorized).authorizeProcessor("FACILITY_001", processor.address)
      ).to.be.revertedWith("AccessControl: account " + unauthorized.address.toLowerCase() + " is missing role " + DEFAULT_ADMIN_ROLE);
    });
    
    it("Should revert when authorizing for non-existent facility", async function () {
      await expect(
        factory.authorizeProcessor("NON_EXISTENT", processor.address)
      ).to.be.revertedWith("Facility contract does not exist");
    });
  });

  describe("Integration with Certificate Contract", function () {
    let certificateContract;

    beforeEach(async function () {
      await factory.connect(deployer).deployCertificateContract(
        "FACILITY_001", "Test Facility", "TF", "Test Location", "Test Type"
      );
      const contractAddress = await factory.getCertificateContract("FACILITY_001");
      
      const WasteCertificateNFT = await ethers.getContractFactory("WasteCertificateNFT");
      certificateContract = WasteCertificateNFT.attach(contractAddress);
      
      // Authorize processor
      await factory.authorizeProcessor("FACILITY_001", processor.address);
    });

    it("Should allow minting certificates in deployed contract", async function () {
      await certificateContract.connect(processor).mintCertificate(
        recipient.address,
        "Test Origin",
        "Test Method",
        100,
        95,
        85,
        "QmTest123",
        "DT12345"
      );

      expect(await certificateContract.totalSupply()).to.equal(1);
      expect(await certificateContract.ownerOf(1)).to.equal(recipient.address);
    });

    it("Should maintain separate state for different facility contracts", async function () {
      // Deploy second facility contract
      await factory.connect(deployer).deployCertificateContract(
        "FACILITY_002", "Test Facility 2", "TF2", "Location 2", "Type 2"
      );
      const contract2Address = await factory.getCertificateContract("FACILITY_002");
      
      const WasteCertificateNFT = await ethers.getContractFactory("WasteCertificateNFT");
      const certificate2Contract = WasteCertificateNFT.attach(contract2Address);
      
      // Authorize processor for second facility
      await factory.authorizeProcessor("FACILITY_002", processor.address);

      // Mint in first contract
      await certificateContract.connect(processor).mintCertificate(
        recipient.address, "Origin 1", "Method 1", 100, 95, 85, "QmTest1", "DT1"
      );

      // Mint in second contract
      await certificate2Contract.connect(processor).mintCertificate(
        recipient.address, "Origin 2", "Method 2", 150, 90, 80, "QmTest2", "DT2"
      );

      // Check separate state
      expect(await certificateContract.totalSupply()).to.equal(1);
      expect(await certificate2Contract.totalSupply()).to.equal(1);

      const cert1 = await certificateContract.getCertificate(1);
      const cert2 = await certificate2Contract.getCertificate(1);

      expect(cert1.wasteOrigin).to.equal("Origin 1");
      expect(cert2.wasteOrigin).to.equal("Origin 2");
      expect(cert1.digitalTwinId).to.equal("DT1");
      expect(cert2.digitalTwinId).to.equal("DT2");
    });
    
    it("Should not allow minting when facility is inactive", async function () {
      // Deactivate facility
      await factory.setFacilityStatus("FACILITY_001", false);
      
      // Try to mint
      await expect(
        certificateContract.connect(processor).mintCertificate(
          recipient.address, "Origin", "Method", 100, 95, 85, "QmTest", "DT"
        )
      ).to.be.revertedWith("Pausable: paused");
      
      // Reactivate and try again
      await factory.setFacilityStatus("FACILITY_001", true);
      
      await certificateContract.connect(processor).mintCertificate(
        recipient.address, "Origin", "Method", 100, 95, 85, "QmTest", "DT"
      );
      
      expect(await certificateContract.totalSupply()).to.equal(1);
    });
  });
});