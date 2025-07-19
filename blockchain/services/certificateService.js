const { ethers } = require('hardhat');
const ipfsService = require('./ipfsService');
const { createCertificateMetadata } = require('./metadataSchema');
require('dotenv').config();

/**
 * Service for interacting with waste certificate NFT contracts
 */
class CertificateService {
  /**
   * Initialize the service with contract instances
   * @param {string} factoryAddress - Address of the WasteCertificateFactory contract
   */
  async initialize(factoryAddress) {
    try {
      // Get contract factories
      this.WasteCertificateFactory = await ethers.getContractFactory('WasteCertificateFactory');
      this.WasteCertificateNFT = await ethers.getContractFactory('WasteCertificateNFT');
      
      // Connect to factory contract
      this.factory = this.WasteCertificateFactory.attach(factoryAddress);
      console.log(`Connected to WasteCertificateFactory at: ${factoryAddress}`);
      
      return true;
    } catch (error) {
      console.error('Error initializing CertificateService:', error);
      return false;
    }
  }
  
  /**
   * Get certificate contract for a facility
   * @param {string} facilityId - Facility identifier
   * @returns {Promise<Contract>} - Certificate contract instance
   */
  async getCertificateContract(facilityId) {
    try {
      const contractAddress = await this.factory.getCertificateContract(facilityId);
      
      if (contractAddress === ethers.constants.AddressZero) {
        throw new Error(`No certificate contract found for facility: ${facilityId}`);
      }
      
      return this.WasteCertificateNFT.attach(contractAddress);
    } catch (error) {
      console.error(`Error getting certificate contract for facility ${facilityId}:`, error);
      throw error;
    }
  }
  
  /**
   * Deploy a new certificate contract for a facility
   * @param {string} facilityId - Facility identifier
   * @param {string} name - Contract name
   * @param {string} symbol - Contract symbol
   * @returns {Promise<string>} - Deployed contract address
   */
  async deployCertificateContract(facilityId, name, symbol) {
    try {
      const tx = await this.factory.deployCertificateContract(facilityId, name, symbol);
      await tx.wait();
      
      const contractAddress = await this.factory.getCertificateContract(facilityId);
      console.log(`Deployed certificate contract for ${facilityId} at: ${contractAddress}`);
      
      return contractAddress;
    } catch (error) {
      console.error(`Error deploying certificate contract for facility ${facilityId}:`, error);
      throw error;
    }
  }
  
  /**
   * Mint a new waste certificate NFT
   * @param {string} facilityId - Facility identifier
   * @param {string} recipient - Recipient address
   * @param {Object} certificateData - Certificate data
   * @returns {Promise<Object>} - Minting result with token ID and transaction hash
   */
  async mintCertificate(facilityId, recipient, certificateData) {
    try {
      // Get certificate contract
      const certificateContract = await this.getCertificateContract(facilityId);
      
      // Create metadata
      const metadata = createCertificateMetadata({
        ...certificateData,
        processingFacility: facilityId
      });
      
      // Store metadata on IPFS
      const cid = await ipfsService.storeMetadata(metadata);
      const ipfsUri = `ipfs://${cid}`;
      
      // Create backup of metadata
      await ipfsService.createBackup(cid, metadata);
      
      // Mint certificate
      const tx = await certificateContract.mintCertificate(
        recipient,
        certificateData.wasteOrigin || "",
        certificateData.processingMethod || "",
        certificateData.carbonCredits || 0,
        certificateData.recyclingEfficiency || 0,
        certificateData.environmentalImpact || 0,
        ipfsUri
      );
      
      const receipt = await tx.wait();
      
      // Get token ID from event
      const mintEvent = receipt.events.find(e => e.event === 'CertificateMinted');
      const tokenId = mintEvent.args.tokenId.toString();
      
      console.log(`Minted certificate with token ID ${tokenId} for ${recipient}`);
      
      return {
        tokenId,
        transactionHash: receipt.transactionHash,
        ipfsUri,
        ipfsGatewayUrl: ipfsService.getGatewayUrl(cid)
      };
    } catch (error) {
      console.error(`Error minting certificate for facility ${facilityId}:`, error);
      throw error;
    }
  }
  
  /**
   * Batch mint multiple certificates
   * @param {string} facilityId - Facility identifier
   * @param {Array<Object>} certificateBatch - Array of certificate data with recipients
   * @returns {Promise<Array<Object>>} - Array of minting results
   */
  async batchMintCertificates(facilityId, certificateBatch) {
    try {
      // Get certificate contract
      const certificateContract = await this.getCertificateContract(facilityId);
      
      // Prepare batch data
      const recipients = [];
      const wasteOrigins = [];
      const processingMethods = [];
      const carbonCredits = [];
      const recyclingEfficiencies = [];
      const environmentalImpacts = [];
      const ipfsHashes = [];
      
      // Process each certificate
      const metadataArray = certificateBatch.map(item => {
        return createCertificateMetadata({
          ...item.certificateData,
          processingFacility: facilityId
        });
      });
      
      // Store all metadata on IPFS
      const cids = await ipfsService.storeBatchMetadata(metadataArray);
      
      // Prepare batch arrays
      for (let i = 0; i < certificateBatch.length; i++) {
        const item = certificateBatch[i];
        const data = item.certificateData;
        
        recipients.push(item.recipient);
        wasteOrigins.push(data.wasteOrigin || "");
        processingMethods.push(data.processingMethod || "");
        carbonCredits.push(data.carbonCredits || 0);
        recyclingEfficiencies.push(data.recyclingEfficiency || 0);
        environmentalImpacts.push(data.environmentalImpact || 0);
        ipfsHashes.push(`ipfs://${cids[i]}`);
        
        // Create backup of metadata
        await ipfsService.createBackup(cids[i], metadataArray[i]);
      }
      
      // Batch mint certificates
      const tx = await certificateContract.batchMintCertificates(
        recipients,
        wasteOrigins,
        processingMethods,
        carbonCredits,
        recyclingEfficiencies,
        environmentalImpacts,
        ipfsHashes
      );
      
      const receipt = await tx.wait();
      
      console.log(`Batch minted ${certificateBatch.length} certificates for facility ${facilityId}`);
      
      return {
        transactionHash: receipt.transactionHash,
        gasUsed: receipt.gasUsed.toString(),
        certificateCount: certificateBatch.length
      };
    } catch (error) {
      console.error(`Error batch minting certificates for facility ${facilityId}:`, error);
      throw error;
    }
  }
  
  /**
   * Update certificate metadata
   * @param {string} facilityId - Facility identifier
   * @param {string} tokenId - Token ID
   * @param {Object} updatedData - Updated certificate data
   * @returns {Promise<Object>} - Update result
   */
  async updateCertificate(facilityId, tokenId, updatedData) {
    try {
      // Get certificate contract
      const certificateContract = await this.getCertificateContract(facilityId);
      
      // Get current certificate data
      const currentCert = await certificateContract.getCertificate(tokenId);
      
      // Create updated metadata
      const metadata = createCertificateMetadata({
        ...updatedData,
        tokenId,
        processingFacility: facilityId
      });
      
      // Store updated metadata on IPFS
      const cid = await ipfsService.storeMetadata(metadata);
      const ipfsUri = `ipfs://${cid}`;
      
      // Create backup of metadata
      await ipfsService.createBackup(cid, metadata);
      
      // Update certificate on-chain
      const tx = await certificateContract.updateCertificate(
        tokenId,
        updatedData.carbonCredits || currentCert.carbonCredits,
        updatedData.recyclingEfficiency || currentCert.recyclingEfficiency,
        updatedData.environmentalImpact || currentCert.environmentalImpact,
        ipfsUri
      );
      
      const receipt = await tx.wait();
      
      console.log(`Updated certificate with token ID ${tokenId} for facility ${facilityId}`);
      
      return {
        tokenId,
        transactionHash: receipt.transactionHash,
        ipfsUri,
        ipfsGatewayUrl: ipfsService.getGatewayUrl(cid)
      };
    } catch (error) {
      console.error(`Error updating certificate ${tokenId} for facility ${facilityId}:`, error);
      throw error;
    }
  }
  
  /**
   * Verify a certificate
   * @param {string} facilityId - Facility identifier
   * @param {string} tokenId - Token ID
   * @returns {Promise<Object>} - Verification result
   */
  async verifyCertificate(facilityId, tokenId) {
    try {
      // Get certificate contract
      const certificateContract = await this.getCertificateContract(facilityId);
      
      // Verify certificate
      const tx = await certificateContract.verifyCertificate(tokenId);
      const receipt = await tx.wait();
      
      console.log(`Verified certificate with token ID ${tokenId} for facility ${facilityId}`);
      
      return {
        tokenId,
        transactionHash: receipt.transactionHash,
        verified: true
      };
    } catch (error) {
      console.error(`Error verifying certificate ${tokenId} for facility ${facilityId}:`, error);
      throw error;
    }
  }
  
  /**
   * Check if a certificate is authentic
   * @param {string} facilityId - Facility identifier
   * @param {string} tokenId - Token ID
   * @returns {Promise<boolean>} - Authenticity status
   */
  async isAuthentic(facilityId, tokenId) {
    try {
      // Get certificate contract
      const certificateContract = await this.getCertificateContract(facilityId);
      
      // Check authenticity
      const isAuthentic = await certificateContract.isAuthentic(tokenId);
      
      return isAuthentic;
    } catch (error) {
      console.error(`Error checking authenticity of certificate ${tokenId} for facility ${facilityId}:`, error);
      throw error;
    }
  }
}

module.exports = new CertificateService();