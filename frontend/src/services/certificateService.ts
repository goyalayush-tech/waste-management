import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

/**
 * Service for interacting with waste certificate NFTs
 */
export class CertificateService {
  /**
   * Mint a new waste certificate NFT
   * @param facilityId - Facility identifier
   * @param recipient - Recipient address
   * @param certificateData - Certificate data
   * @returns Minting result with token ID and transaction hash
   */
  async mintCertificate(facilityId: string, recipient: string, certificateData: any) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/certificates/${facilityId}`,
        { recipient, certificateData }
      );
      return response.data;
    } catch (error) {
      console.error('Error minting certificate:', error);
      throw error;
    }
  }
  
  /**
   * Batch mint multiple certificates
   * @param facilityId - Facility identifier
   * @param certificateBatch - Array of certificate data with recipients
   * @returns Array of minting results
   */
  async batchMintCertificates(facilityId: string, certificateBatch: any[]) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/certificates/${facilityId}/batch`,
        { certificateBatch }
      );
      return response.data;
    } catch (error) {
      console.error('Error batch minting certificates:', error);
      throw error;
    }
  }
  
  /**
   * Update certificate metadata
   * @param facilityId - Facility identifier
   * @param tokenId - Token ID
   * @param updatedData - Updated certificate data
   * @returns Update result
   */
  async updateCertificate(facilityId: string, tokenId: string, updatedData: any) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/certificates/${facilityId}/${tokenId}`,
        { updatedData }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating certificate:', error);
      throw error;
    }
  }
  
  /**
   * Verify a certificate
   * @param facilityId - Facility identifier
   * @param tokenId - Token ID
   * @returns Verification result
   */
  async verifyCertificate(facilityId: string, tokenId: string) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/certificates/${facilityId}/${tokenId}/verify`
      );
      return response.data;
    } catch (error) {
      console.error('Error verifying certificate:', error);
      throw error;
    }
  }
  
  /**
   * Check if a certificate is authentic
   * @param facilityId - Facility identifier
   * @param tokenId - Token ID
   * @returns Authenticity status
   */
  async isAuthentic(facilityId: string, tokenId: string) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/certificates/${facilityId}/${tokenId}/authentic`
      );
      return response.data.isAuthentic;
    } catch (error) {
      console.error('Error checking certificate authenticity:', error);
      throw error;
    }
  }
  
  /**
   * Register a webhook for certificate updates
   * @param facilityId - Facility identifier
   * @param tokenId - Token ID
   * @param callbackUrl - Callback URL for updates
   * @returns Registration result
   */
  async registerWebhook(facilityId: string, tokenId: string, callbackUrl: string) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/webhooks/register`,
        { facilityId, tokenId, callbackUrl }
      );
      return response.data;
    } catch (error) {
      console.error('Error registering webhook:', error);
      throw error;
    }
  }
  
  /**
   * Trigger certificate update based on processing milestone
   * @param facilityId - Facility identifier
   * @param tokenId - Token ID
   * @param milestoneData - Processing milestone data
   * @returns Update result
   */
  async triggerMilestoneUpdate(facilityId: string, tokenId: string, milestoneData: any) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/webhooks/trigger`,
        { facilityId, tokenId, milestoneData }
      );
      return response.data;
    } catch (error) {
      console.error('Error triggering milestone update:', error);
      throw error;
    }
  }
}

export default new CertificateService();