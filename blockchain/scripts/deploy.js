const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying Waste Certificate NFT contracts...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the Factory contract
  console.log("\nDeploying WasteCertificateFactory...");
  const WasteCertificateFactory = await ethers.getContractFactory("WasteCertificateFactory");
  const factory = await WasteCertificateFactory.deploy();
  await factory.deployed();

  console.log("WasteCertificateFactory deployed to:", factory.address);
  console.log("Certificate implementation deployed to:", await factory.certificateImplementation());

  // Deploy a sample certificate contract for testing
  console.log("\nDeploying sample certificate contract...");
  const tx = await factory.deployCertificateContract(
    "DELHI_MAIN_FACILITY",
    "Delhi Main Waste Facility Certificates",
    "DMWFC"
  );
  await tx.wait();

  const sampleContractAddress = await factory.getCertificateContract("DELHI_MAIN_FACILITY");
  console.log("Sample certificate contract deployed to:", sampleContractAddress);

  // Verify deployment
  console.log("\nVerifying deployment...");
  console.log("Total contracts deployed:", (await factory.getContractCount()).toString());

  // Get the certificate contract instance
  const WasteCertificateNFT = await ethers.getContractFactory("WasteCertificateNFT");
  const sampleContract = WasteCertificateNFT.attach(sampleContractAddress);
  
  console.log("Sample contract name:", await sampleContract.name());
  console.log("Sample contract symbol:", await sampleContract.symbol());
  console.log("Sample contract owner:", await sampleContract.owner());

  console.log("\nDeployment completed successfully!");
  
  return {
    factory: factory.address,
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