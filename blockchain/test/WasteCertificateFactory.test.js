const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WasteCertificateFactory", function () {
  let WasteCertificateFactory;
  let factory;
  let owner;
  let unauthorized;

  beforeEach(async function () {
    [owner, unauthorized] = await ethers.getSigners();

    WasteCertificateFactory = await ethers.getContractFactory("WasteCertificateFactory");
    factory = await WasteCertificateFactory.deploy();
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
  });

  describe("Contract Deployment", function () {
    it("Should deploy certificate contract successfully", async function () {
      const facilityId = "FACILITY_001";
      const name = "Delhi Facility A Certificates";
      const symbol = "DFA";

      const tx = await factory.deployCertificateContract(facilityId, name, symbol);
      
      await expect(tx)
        .to.emit(factory, "CertificateContractDeployed");

      const contractAddress = await factory.getCertificateContract(facilityId);
      expect(contractAddress).to.not.equal(ethers.constants.AddressZero);

      expect(await factory.getContractCount()).to.equal(1);
    });

    it("Should initialize deployed contract correctly", async function () {
      const facilityId = "FACILITY_001";
      const name = "Delhi Facility A Certificates";
      const symbol = "DFA";

      await factory.deployCertificateContract(facilityId, name, symbol);
      const contractAddress = await factory.getCertificateContract(facilityId);

      const WasteCertificateNFT = await ethers.getContractFactory("WasteCertificateNFT");
      const certificate = WasteCertificateNFT.attach(contractAddress);

      expect(await certificate.name()).to.equal(name);
      expect(await certificate.symbol()).to.equal(symbol);
      expect(await certificate.owner()).to.equal(owner.address);
    });

    it("Should not allow duplicate facility contracts", async function () {
      const facilityId = "FACILITY_001";
      const name = "Delhi Facility A Certificates";
      const symbol = "DFA";

      await factory.deployCertificateContract(facilityId, name, symbol);

      await expect(
        factory.deployCertificateContract(facilityId, name, symbol)
      ).to.be.revertedWith("Contract already exists for this facility");
    });

    it("Should only allow owner to deploy contracts", async function () {
      await expect(
        factory.connect(unauthorized).deployCertificateContract(
          "FACILITY_001",
          "Test",
          "TEST"
        )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Contract Management", function () {
    beforeEach(async function () {
      await factory.deployCertificateContract("FACILITY_001", "Facility A", "FA");
      await factory.deployCertificateContract("FACILITY_002", "Facility B", "FB");
      await factory.deployCertificateContract("FACILITY_003", "Facility C", "FC");
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
  });

  describe("Integration with Certificate Contract", function () {
    let certificateContract;
    let processor;
    let recipient;

    beforeEach(async function () {
      [owner, processor, recipient] = await ethers.getSigners();
      
      await factory.deployCertificateContract("FACILITY_001", "Test Facility", "TF");
      const contractAddress = await factory.getCertificateContract("FACILITY_001");
      
      const WasteCertificateNFT = await ethers.getContractFactory("WasteCertificateNFT");
      certificateContract = WasteCertificateNFT.attach(contractAddress);
      
      // Authorize processor
      await certificateContract.authorizeProcessor(processor.address);
    });

    it("Should allow minting certificates in deployed contract", async function () {
      await certificateContract.connect(processor).mintCertificate(
        recipient.address,
        "Test Origin",
        "Test Method",
        100,
        95,
        85,
        "QmTest123"
      );

      expect(await certificateContract.totalSupply()).to.equal(1);
      expect(await certificateContract.ownerOf(1)).to.equal(recipient.address);
    });

    it("Should maintain separate state for different facility contracts", async function () {
      // Deploy second facility contract
      await factory.deployCertificateContract("FACILITY_002", "Test Facility 2", "TF2");
      const contract2Address = await factory.getCertificateContract("FACILITY_002");
      
      const WasteCertificateNFT = await ethers.getContractFactory("WasteCertificateNFT");
      const certificate2Contract = WasteCertificateNFT.attach(contract2Address);
      
      await certificate2Contract.authorizeProcessor(processor.address);

      // Mint in first contract
      await certificateContract.connect(processor).mintCertificate(
        recipient.address, "Origin 1", "Method 1", 100, 95, 85, "QmTest1"
      );

      // Mint in second contract
      await certificate2Contract.connect(processor).mintCertificate(
        recipient.address, "Origin 2", "Method 2", 150, 90, 80, "QmTest2"
      );

      // Check separate state
      expect(await certificateContract.totalSupply()).to.equal(1);
      expect(await certificate2Contract.totalSupply()).to.equal(1);

      const cert1 = await certificateContract.getCertificate(1);
      const cert2 = await certificate2Contract.getCertificate(1);

      expect(cert1.wasteOrigin).to.equal("Origin 1");
      expect(cert2.wasteOrigin).to.equal("Origin 2");
    });
  });
});