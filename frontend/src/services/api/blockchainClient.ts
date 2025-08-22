// Blockchain Services API Client
import { BaseApiClient, ApiConfig } from './baseClient';

// Blockchain Service Types
export interface WasteCertificate {
  tokenId: string;
  wasteType: string;
  quantity: number;
  processingMethod: string;
  carbonCredits: number;
  certificationDate: string;
  expiryDate: string;
  issuer: string;
  owner: string;
  metadata: {
    imageUrl?: string;
    description: string;
    attributes: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
  transactionHash: string;
  blockNumber: number;
  status: 'pending' | 'minted' | 'transferred' | 'burned';
}

export interface DigitalTwin {
  id: string;
  name: string;
  type: 'facility' | 'equipment' | 'process' | 'material';
  description: string;
  owner: string;
  metadata: Record<string, any>;
  sensors: Array<{
    id: string;
    type: string;
    location: string;
    status: 'active' | 'inactive' | 'error';
  }>;
  alerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: string;
    acknowledged: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
  blockchainAddress?: string;
}

export interface CarbonCredit {
  id: string;
  amount: number;
  price: number;
  currency: string;
  vintage: string;
  projectType: string;
  verificationStandard: string;
  seller: string;
  buyer?: string;
  status: 'available' | 'reserved' | 'sold' | 'retired';
  certificateUrl?: string;
  transactionHash?: string;
  listedAt: string;
  soldAt?: string;
}

export interface StakingPool {
  id: string;
  name: string;
  tokenSymbol: string;
  totalStaked: number;
  apy: number;
  lockPeriod: number; // in days
  minStake: number;
  maxStake?: number;
  isActive: boolean;
  createdAt: string;
}

export interface StakingPosition {
  id: string;
  poolId: string;
  user: string;
  amount: number;
  stakedAt: string;
  unlocksAt: string;
  rewards: number;
  status: 'active' | 'unlocking' | 'withdrawn';
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: number;
  gasPrice: string;
  blockNumber: number;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
  type: 'mint' | 'transfer' | 'burn' | 'stake' | 'unstake' | 'trade';
}

export interface WalletInfo {
  address: string;
  balance: {
    eth: string;
    tokens: Record<string, string>;
  };
  nfts: WasteCertificate[];
  stakingPositions: StakingPosition[];
  transactionHistory: Transaction[];
}

export class BlockchainApiClient extends BaseApiClient {
  constructor(config: Omit<ApiConfig, 'baseURL'> & { baseURL?: string } = {}) {
    super({
      baseURL: config.baseURL || process.env.REACT_APP_BLOCKCHAIN_API_URL || 'http://localhost:8003/api',
      ...config,
    });
  }

  // NFT Certificates
  async mintCertificate(request: {
    wasteType: string;
    quantity: number;
    processingMethod: string;
    carbonCredits: number;
    metadata: {
      description: string;
      imageUrl?: string;
      attributes: Array<{
        trait_type: string;
        value: string | number;
      }>;
    };
    recipient?: string;
  }): Promise<{
    tokenId: string;
    transactionHash: string;
    status: 'pending' | 'confirmed';
  }> {
    return this.post('/certificates/mint', request);
  }

  async getCertificates(params: {
    owner?: string;
    limit?: number;
    offset?: number;
    wasteType?: string;
    status?: string;
  } = {}): Promise<{
    certificates: WasteCertificate[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.get(`/certificates?${queryParams.toString()}`);
  }

  async getCertificateById(tokenId: string): Promise<WasteCertificate> {
    return this.get<WasteCertificate>(`/certificates/${tokenId}`);
  }

  async transferCertificate(tokenId: string, to: string): Promise<{
    transactionHash: string;
    status: 'pending' | 'confirmed';
  }> {
    return this.post(`/certificates/${tokenId}/transfer`, { to });
  }

  async burnCertificate(tokenId: string): Promise<{
    transactionHash: string;
    status: 'pending' | 'confirmed';
  }> {
    return this.post(`/certificates/${tokenId}/burn`);
  }

  // Digital Twins
  async createDigitalTwin(request: {
    name: string;
    type: 'facility' | 'equipment' | 'process' | 'material';
    description: string;
    metadata: Record<string, any>;
    sensors?: Array<{
      type: string;
      location: string;
    }>;
  }): Promise<DigitalTwin> {
    return this.post<DigitalTwin>('/digital-twins', request);
  }

  async getDigitalTwins(params: {
    owner?: string;
    type?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    twins: DigitalTwin[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.get(`/digital-twins?${queryParams.toString()}`);
  }

  async getDigitalTwinById(id: string): Promise<DigitalTwin> {
    return this.get<DigitalTwin>(`/digital-twins/${id}`);
  }

  async updateDigitalTwin(id: string, updates: Partial<DigitalTwin>): Promise<DigitalTwin> {
    return this.patch<DigitalTwin>(`/digital-twins/${id}`, updates);
  }

  async addSensorData(twinId: string, sensorId: string, data: Record<string, any>): Promise<{
    success: boolean;
    timestamp: string;
  }> {
    return this.post(`/digital-twins/${twinId}/sensors/${sensorId}/data`, data);
  }

  async getSensorData(twinId: string, sensorId: string, params: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<{
    data: Array<{
      timestamp: string;
      values: Record<string, any>;
    }>;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.get(`/digital-twins/${twinId}/sensors/${sensorId}/data?${queryParams.toString()}`);
  }

  async addAlert(twinId: string, alert: {
    type: 'info' | 'warning' | 'error' | 'critical';
    message: string;
  }): Promise<{
    alertId: string;
    timestamp: string;
  }> {
    return this.post(`/digital-twins/${twinId}/alerts`, alert);
  }

  async acknowledgeAlert(twinId: string, alertId: string): Promise<{
    success: boolean;
  }> {
    return this.patch(`/digital-twins/${twinId}/alerts/${alertId}/acknowledge`);
  }

  // Carbon Credits Marketplace
  async listCarbonCredits(request: {
    amount: number;
    price: number;
    currency: string;
    vintage: string;
    projectType: string;
    verificationStandard: string;
    certificateUrl?: string;
  }): Promise<{
    listingId: string;
    transactionHash: string;
  }> {
    return this.post('/carbon-credits/list', request);
  }

  async getCarbonCredits(params: {
    seller?: string;
    buyer?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    vintage?: string;
    projectType?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    credits: CarbonCredit[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.get(`/carbon-credits?${queryParams.toString()}`);
  }

  async buyCarbonCredits(creditId: string, amount: number): Promise<{
    transactionHash: string;
    status: 'pending' | 'confirmed';
  }> {
    return this.post(`/carbon-credits/${creditId}/buy`, { amount });
  }

  async retireCarbonCredits(creditId: string, amount: number, reason?: string): Promise<{
    transactionHash: string;
    status: 'pending' | 'confirmed';
  }> {
    return this.post(`/carbon-credits/${creditId}/retire`, { amount, reason });
  }

  // Staking
  async getStakingPools(): Promise<StakingPool[]> {
    return this.get<StakingPool[]>('/staking/pools');
  }

  async getStakingPoolById(poolId: string): Promise<StakingPool> {
    return this.get<StakingPool>(`/staking/pools/${poolId}`);
  }

  async stake(poolId: string, amount: number): Promise<{
    positionId: string;
    transactionHash: string;
    status: 'pending' | 'confirmed';
  }> {
    return this.post(`/staking/pools/${poolId}/stake`, { amount });
  }

  async unstake(positionId: string): Promise<{
    transactionHash: string;
    status: 'pending' | 'confirmed';
    unlockDate: string;
  }> {
    return this.post(`/staking/positions/${positionId}/unstake`);
  }

  async claimRewards(positionId: string): Promise<{
    transactionHash: string;
    status: 'pending' | 'confirmed';
    rewardAmount: number;
  }> {
    return this.post(`/staking/positions/${positionId}/claim-rewards`);
  }

  async getStakingPositions(user?: string): Promise<StakingPosition[]> {
    const params = user ? `?user=${user}` : '';
    return this.get<StakingPosition[]>(`/staking/positions${params}`);
  }

  // Wallet & Transactions
  async connectWallet(address: string, signature: string): Promise<{
    success: boolean;
    token: string;
  }> {
    return this.post('/wallet/connect', { address, signature });
  }

  async getWalletInfo(address: string): Promise<WalletInfo> {
    return this.get<WalletInfo>(`/wallet/${address}`);
  }

  async getTransactionHistory(address: string, params: {
    type?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    transactions: Transaction[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.get(`/wallet/${address}/transactions?${queryParams.toString()}`);
  }

  async getTransactionById(hash: string): Promise<Transaction> {
    return this.get<Transaction>(`/transactions/${hash}`);
  }

  // IPFS
  async uploadToIpfs(file: File, onProgress?: (progress: number) => void): Promise<{
    hash: string;
    url: string;
    size: number;
  }> {
    return this.uploadFile('/ipfs/upload', file, onProgress);
  }

  async getFromIpfs(hash: string): Promise<{
    data: any;
    contentType: string;
  }> {
    return this.get(`/ipfs/${hash}`);
  }

  // Network Status
  async getNetworkStatus(): Promise<{
    chainId: number;
    blockNumber: number;
    gasPrice: string;
    isConnected: boolean;
    networkName: string;
  }> {
    return this.get('/network/status');
  }

  async getGasEstimate(transaction: {
    to: string;
    data?: string;
    value?: string;
  }): Promise<{
    gasLimit: number;
    gasPrice: string;
    estimatedCost: string;
  }> {
    return this.post('/network/gas-estimate', transaction);
  }
}