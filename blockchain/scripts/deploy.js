const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Enhanced Waste Certificate NFT contracts...");

  // Get the deployer account
  const [deployer, processor, verifier, updater] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Get balance using provider
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy the Factory contract
  console.log("\nDeploying WasteCertificateFactory...");
  const WasteCertificateFactory = await ethers.getContractFactory("WasteCertificateFactory");
  const factory = await WasteCertificateFactory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("WasteCertificateFactory deployed to:", factoryAddress);
  console.log("Certificate implementation deployed to:", await factory.certificateImplementation());

  // Set up roles for testing
  if (processor && verifier && updater) {
    console.log("\nSetting up roles for testing...");
    
    // Define role constants
    const PROCESSOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PROCESSOR_ROLE"));
    const VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));
    const UPDATER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPDATER_ROLE"));
    const DEPLOYER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DEPLOYER_ROLE"));
    
    // Grant roles
    await factory.grantRole(PROCESSOR_ROLE, processor.address);
    await factory.grantRole(VERIFIER_ROLE, verifier.address);
    await factory.grantRole(UPDATER_ROLE, updater.address);
    await factory.grantRole(DEPLOYER_ROLE, deployer.address);
    
    console.log("Processor role granted to:", processor.address);
    console.log("Verifier role granted to:", verifier.address);
    console.log("Updater role granted to:", updater.address);
    console.log("Deployer role granted to:", deployer.address);
  }

  // Deploy a sample certificate contract for testing
  console.log("\nDeploying sample certificate contract...");
  const tx = await factory.deployCertificateContract(
    "DELHI_MAIN_FACILITY",
    "Delhi Main Waste Facility Certificates",
    "DMWFC",
    "Delhi, India",
    "Recycling Center"
  );
  await tx.wait();

  const sampleContractAddress = await factory.getCertificateContract("DELHI_MAIN_FACILITY");
  console.log("Sample certificate contract deployed to:", sampleContractAddress);

  // Get facility info
  const facilityInfo = await factory.getFacilityInfo("DELHI_MAIN_FACILITY");
  console.log("Facility info:", {
    name: facilityInfo.name,
    location: facilityInfo.location,
    facilityType: facilityInfo.facilityType,
    isActive: facilityInfo.isActive,
    createdAt: new Date(facilityInfo.createdAt * 1000).toISOString()
  });

  // Verify deployment
  console.log("\nVerifying deployment...");
  console.log("Total contracts deployed:", (await factory.getContractCount()).toString());

  // Get the certificate contract instance
  const WasteCertificateNFT = await ethers.getContractFactory("WasteCertificateNFT");
  const sampleContract = WasteCertificateNFT.attach(sampleContractAddress);
  
  console.log("Sample contract name:", await sampleContract.name());
  console.log("Sample contract symbol:", await sampleContract.symbol());
  console.log("Sample contract owner:", await sampleContract.owner());
  
  // Authorize roles for the sample contract
  if (processor && verifier && updater) {
    console.log("\nAuthorizing roles for sample contract...");
    
    await factory.authorizeProcessor("DELHI_MAIN_FACILITY", processor.address);
    await factory.authorizeVerifier("DELHI_MAIN_FACILITY", verifier.address);
    await factory.authorizeUpdater("DELHI_MAIN_FACILITY", updater.address);
    
    console.log("Roles authorized successfully");
    
    // Mint a sample certificate
    console.log("\nMinting sample certificate...");
    
    const mintTx = await sampleContract.connect(processor).mintCertificate(
      deployer.address,
      "Delhi Waste Collection Center",
      "Advanced Recycling Process",
      100, // carbon credits
      95,  // recycling efficiency
      85,  // environmental impact
      "QmSampleIPFSHash123456789",
      "DT12345" // digital twin ID
    );
    
    await mintTx.wait();
    
    const tokenId = 1; // First token ID
    const certificate = await sampleContract.getCertificate(tokenId);
    
    console.log(`Sample certificate minted with token ID: ${tokenId}`);
    console.log("Certificate details:", {
      wasteOrigin: certificate.wasteOrigin,
      processingMethod: certificate.processingMethod,
      carbonCredits: certificate.carbonCredits.toString(),
      recyclingEfficiency: certificate.recyclingEfficiency.toString(),
      environmentalImpact: certificate.environmentalImpact.toString(),
      isVerified: certificate.isVerified,
      digitalTwinId: certificate.digitalTwinId,
      processingTimestamp: new Date(certificate.processingTimestamp * 1000).toISOString()
    });
    
    // Add a processing stage
    console.log("\nAdding processing stage...");
    
    const stageTx = await sampleContract.connect(processor).addProcessingStage(
      tokenId,
      "Quality Check",
      "quality_check",
      "QmStageDataIPFSHash123456789"
    );
    
    await stageTx.wait();
    
    const stages = await sampleContract.getProcessingStages(tokenId);
    console.log(`Certificate now has ${stages.length} processing stages`);
    
    // Verify the certificate
    console.log("\nVerifying certificate...");
    
    const verifyTx = await sampleContract.connect(verifier).verifyCertificate(tokenId);
    await verifyTx.wait();
    
    const updatedCertificate = await sampleContract.getCertificate(tokenId);
    console.log("Certificate verified:", updatedCertificate.isVerified);
    console.log("Certificate authentic:", await sampleContract.isAuthentic(tokenId));
  }

  console.log("\nDeployment completed successfully!");
  
  return {
    factory: factoryAddress,
    sampleContract: sampleContractAddress,
    implementation: await factory.certificateImplementation()
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