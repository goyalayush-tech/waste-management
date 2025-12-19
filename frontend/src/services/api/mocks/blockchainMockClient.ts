// Blockchain Mock Client - provides realistic mock data for blockchain API endpoints
import { 
  BlockchainApiClient,
  WasteCertificate,
  DigitalTwin,
  CarbonCredit,
  StakingPool,
  StakingPosition,
  Transaction,
  WalletInfo
} from '../blockchainClient';

export class BlockchainMockClient extends BlockchainApiClient {
  private certificates: WasteCertificate[] = [];
  private digitalTwins: DigitalTwin[] = [];
  private carbonCredits: CarbonCredit[] = [];
  private stakingPools: StakingPool[] = [];
  private stakingPositions: StakingPosition[] = [];
  private transactions: Transaction[] = [];
  private walletInfo: WalletInfo | null = null;

  constructor() {
    super({ baseURL: 'mock://blockchain' });
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock waste certificates
    this.certificates = [
      {
        id: 'cert-1',
        tokenId: 1001,
        wasteType: 'plastic',
        quantity: 500,
        unit: 'kg',
        processingDate: '2024-08-20T00:00:00Z',
        recyclerInfo: {
          name: 'Delhi Recycling Hub',
          address: '0x742f35cc6bf8f1e8c9a4f8d1b7d3f2a8b9c1d2e3',
          certifications: ['ISO 14001', 'CPCB Authorized'],
        },
        metadata: {
          ipfsHash: 'QmX7Y8Z9A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S',
          verificationStatus: 'verified',
          gpsLocation: { lat: 28.6139, lng: 77.2090 },
          imageHashes: ['QmImageHash1', 'QmImageHash2'],
        },
        transactionHash: '0x123456789abcdef123456789abcdef123456789abcdef',
        blockNumber: 12345678,
        createdAt: '2024-08-20T10:30:00Z',
        status: 'active',
      },
      {
        id: 'cert-2',
        tokenId: 1002,
        wasteType: 'paper',
        quantity: 1000,
        unit: 'kg',
        processingDate: '2024-08-21T00:00:00Z',
        recyclerInfo: {
          name: 'Green Earth Recyclers',
          address: '0x851f46ca7db9e2a3f8c4b1e6d5c9a2b8f3e7d4c1',
          certifications: ['ISO 9001', 'CPCB Authorized'],
        },
        metadata: {
          ipfsHash: 'QmB2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W',
          verificationStatus: 'verified',
          gpsLocation: { lat: 28.4595, lng: 77.0266 },
          imageHashes: ['QmImageHash3', 'QmImageHash4'],
        },
        transactionHash: '0xabcdef123456789abcdef123456789abcdef123456789',
        blockNumber: 12345679,
        createdAt: '2024-08-21T14:15:00Z',
        status: 'active',
      },
    ];

    // Mock digital twins
    this.digitalTwins = [
      {
        id: 'twin-1',
        realWorldEntityId: 'facility-delhi-1',
        entityType: 'recycling-facility',
        name: 'Delhi Central Recycling Facility',
        description: 'Main recycling facility for Delhi region',
        metadata: {
          capacity: 1000,
          currentLoad: 750,
          efficiency: 0.85,
          operationalStatus: 'active',
          location: { lat: 28.6139, lng: 77.2090 },
          lastMaintenance: '2024-08-15T00:00:00Z',
        },
        ipfsHash: 'QmTwin1DataHash123456789',
        createdAt: '2024-06-01T00:00:00Z',
        updatedAt: '2024-08-24T08:00:00Z',
        isActive: true,
      },
      {
        id: 'twin-2',
        realWorldEntityId: 'vehicle-fleet-1',
        entityType: 'collection-vehicle',
        name: 'Waste Collection Vehicle Fleet #1',
        description: 'Primary collection vehicle for Zone A',
        metadata: {
          vehicleCount: 5,
          averageLoad: 0.65,
          fuelEfficiency: 12.5,
          routeOptimizationScore: 0.92,
          maintenanceSchedule: 'weekly',
        },
        ipfsHash: 'QmTwin2DataHash987654321',
        createdAt: '2024-07-01T00:00:00Z',
        updatedAt: '2024-08-24T08:00:00Z',
        isActive: true,
      },
    ];

    // Mock carbon credits
    this.carbonCredits = [
      {
        id: 'carbon-1',
        tokenId: 2001,
        creditAmount: 10.5,
        unit: 'tCO2e',
        projectId: 'waste-recycling-delhi-2024',
        projectName: 'Delhi Waste Recycling Carbon Project',
        issueDate: '2024-08-20T00:00:00Z',
        expiryDate: '2029-08-20T00:00:00Z',
        verificationStandard: 'VCS',
        verificationId: 'VCS-2024-001',
        status: 'active',
        price: 25.0,
        currency: 'USD',
        metadata: {
          methodologyVersion: 'VM0024 v1.0',
          projectLocation: 'Delhi, India',
          co2Avoided: 10.5,
          certificationBody: 'Gold Standard',
        },
        transactionHash: '0xcarbon123456789abcdef123456789abcdef123456789',
        blockNumber: 12345680,
        createdAt: '2024-08-20T12:00:00Z',
      },
    ];

    // Mock staking pools
    this.stakingPools = [
      {
        id: 'pool-1',
        name: 'Waste Token Staking Pool',
        description: 'Earn rewards by staking WASTE tokens',
        tokenAddress: '0xWASTEToken123456789abcdef123456789abcdef',
        totalStaked: 1000000,
        totalRewards: 50000,
        apy: 12.5,
        lockupPeriod: 90, // days
        minStakeAmount: 100,
        maxStakeAmount: 100000,
        isActive: true,
        createdAt: '2024-06-01T00:00:00Z',
        updatedAt: '2024-08-24T08:00:00Z',
      },
      {
        id: 'pool-2',
        name: 'Carbon Credit Yield Pool',
        description: 'Liquidity mining for carbon credit tokens',
        tokenAddress: '0xCARBONToken987654321fedcba987654321fedcba',
        totalStaked: 500000,
        totalRewards: 75000,
        apy: 18.0,
        lockupPeriod: 180, // days
        minStakeAmount: 500,
        maxStakeAmount: 50000,
        isActive: true,
        createdAt: '2024-07-01T00:00:00Z',
        updatedAt: '2024-08-24T08:00:00Z',
      },
    ];

    // Mock wallet info
    this.walletInfo = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      balance: 2500.75,
      tokenBalances: {
        WASTE: 15000,
        CARBON: 250,
        USDC: 1000,
      },
      stakedAmount: 5000,
      rewards: 125.5,
      isConnected: true,
      network: 'polygon-mumbai',
      networkId: 80001,
    };

    // Mock transactions
    this.transactions = [
      {
        id: 'tx-1',
        hash: '0x123456789abcdef123456789abcdef123456789abcdef',
        type: 'certificate_mint',
        from: '0x0000000000000000000000000000000000000000',
        to: '0x1234567890abcdef1234567890abcdef12345678',
        amount: 1,
        tokenId: 1001,
        gasUsed: 150000,
        gasPrice: 20000000000,
        status: 'confirmed',
        blockNumber: 12345678,
        timestamp: '2024-08-20T10:30:00Z',
        metadata: {
          wasteType: 'plastic',
          quantity: 500,
          recyclerName: 'Delhi Recycling Hub',
        },
      },
      {
        id: 'tx-2',
        hash: '0xabcdef123456789abcdef123456789abcdef123456789',
        type: 'staking_deposit',
        from: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0xStakingContract987654321fedcba987654321fedcba',
        amount: 1000,
        gasUsed: 80000,
        gasPrice: 25000000000,
        status: 'confirmed',
        blockNumber: 12345685,
        timestamp: '2024-08-22T16:45:00Z',
        metadata: {
          poolId: 'pool-1',
          lockupPeriod: 90,
        },
      },
    ];
  }

  // Override API methods with mock implementations
  async getCertificates(params = {}): Promise<{
    certificates: WasteCertificate[];
    total: number;
    hasMore: boolean;
  }> {
    const { limit = 10, offset = 0 } = params;
    const startIndex = Number(offset);
    const endIndex = startIndex + Number(limit);
    
    return {
      certificates: this.certificates.slice(startIndex, endIndex),
      total: this.certificates.length,
      hasMore: endIndex < this.certificates.length,
    };
  }

  async getCertificateById(id: string): Promise<WasteCertificate> {
    const cert = this.certificates.find(c => c.id === id);
    if (!cert) {
      throw new Error(`Certificate ${id} not found`);
    }
    return cert;
  }

  async createCertificate(wasteData: {
    wasteType: string;
    quantity: number;
    unit: string;
    recyclerAddress: string;
    metadata: any;
  }): Promise<{ certificateId: string; transactionHash: string }> {
    // Simulate blockchain transaction delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    const certificateId = `cert-${Date.now()}`;
    const transactionHash = `0x${Math.random().toString(16).substring(2)}${'0'.repeat(40)}`;

    const newCert: WasteCertificate = {
      id: certificateId,
      tokenId: this.certificates.length + 1001,
      ...wasteData,
      processingDate: new Date().toISOString(),
      recyclerInfo: {
        name: 'Mock Recycler',
        address: wasteData.recyclerAddress,
        certifications: ['Mock Certification'],
      },
      metadata: {
        ...wasteData.metadata,
        ipfsHash: `Qm${Math.random().toString(36).substring(2)}`,
        verificationStatus: 'pending',
      },
      transactionHash,
      blockNumber: 12345000 + this.certificates.length,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    this.certificates.push(newCert);

    return { certificateId, transactionHash };
  }

  async getDigitalTwins(): Promise<DigitalTwin[]> {
    return this.digitalTwins;
  }

  async getDigitalTwinById(id: string): Promise<DigitalTwin> {
    const twin = this.digitalTwins.find(t => t.id === id);
    if (!twin) {
      throw new Error(`Digital twin ${id} not found`);
    }
    return twin;
  }

  async updateDigitalTwin(id: string, updateData: Partial<DigitalTwin>): Promise<DigitalTwin> {
    const twinIndex = this.digitalTwins.findIndex(t => t.id === id);
    if (twinIndex === -1) {
      throw new Error(`Digital twin ${id} not found`);
    }

    this.digitalTwins[twinIndex] = {
      ...this.digitalTwins[twinIndex],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    return this.digitalTwins[twinIndex];
  }

  async getCarbonCredits(): Promise<CarbonCredit[]> {
    return this.carbonCredits;
  }

  async getStakingPools(): Promise<StakingPool[]> {
    return this.stakingPools;
  }

  async getStakingPositions(address: string): Promise<StakingPosition[]> {
    // Mock staking positions for the given address
    return [
      {
        id: 'position-1',
        poolId: 'pool-1',
        userAddress: address,
        stakedAmount: 5000,
        rewardsEarned: 125.5,
        stakingDate: '2024-07-15T00:00:00Z',
        lockupEndDate: '2024-10-13T00:00:00Z',
        isActive: true,
      },
    ];
  }

  async stakeTokens(poolId: string, amount: number): Promise<{ transactionHash: string }> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const transactionHash = `0x${Math.random().toString(16).substring(2)}${'0'.repeat(40)}`;
    
    // Add mock transaction
    this.transactions.push({
      id: `tx-${Date.now()}`,
      hash: transactionHash,
      type: 'staking_deposit',
      from: this.walletInfo?.address || '0x1234567890abcdef1234567890abcdef12345678',
      to: '0xStakingContract987654321fedcba987654321fedcba',
      amount,
      gasUsed: 80000,
      gasPrice: 25000000000,
      status: 'confirmed',
      blockNumber: 12345000 + this.transactions.length,
      timestamp: new Date().toISOString(),
      metadata: { poolId },
    });

    return { transactionHash };
  }

  async getWalletInfo(address: string): Promise<WalletInfo> {
    return {
      ...this.walletInfo!,
      address,
    };
  }

  async getTransactions(address: string): Promise<Transaction[]> {
    return this.transactions.filter(tx => tx.from === address || tx.to === address);
  }

  async healthCheck(): Promise<{ status: string; timestamp: string; blockNumber: number }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      blockNumber: 12345000 + Math.floor(Math.random() * 1000),
    };
  }
}