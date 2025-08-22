/**
 * Unit tests for waste verification data models
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { 
  User, 
  WasteSubmission, 
  WasteCredit, 
  BlockchainTransaction, 
  IPFSMetadata 
} from '../models/index.js';
import { initializeDatabases, closeDatabases } from '../config/database.js';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/waste-verification-test';
process.env.JWT_SECRET = 'test-jwt-secret';

describe('Data Models', () => {
  beforeAll(async () => {
    await initializeDatabases();
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await WasteSubmission.deleteMany({});
    await WasteCredit.deleteMany({});
    await BlockchainTransaction.deleteMany({});
    await IPFSMetadata.deleteMany({});
    
    await closeDatabases();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await User.deleteMany({});
    await WasteSubmission.deleteMany({});
    await WasteCredit.deleteMany({});
    await BlockchainTransaction.deleteMany({});
    await IPFSMetadata.deleteMany({});
  });

  describe('User Model', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'password123',
      role: 'vendor',
      profile: {
        name: 'Test User',
        organization: 'Test Org',
        phone: '+1234567890'
      }
    };

    test('should create a valid user', async () => {
      const user = new User(validUserData);
      const savedUser = await user.save();
      
      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(validUserData.email);
      expect(savedUser.role).toBe(validUserData.role);
      expect(savedUser.profile.name).toBe(validUserData.profile.name);
      expect(savedUser.password).not.toBe(validUserData.password); // Should be hashed
    });

    test('should validate required fields', async () => {
      const user = new User({});
      
      await expect(user.save()).rejects.toThrow();
    });

    test('should validate email format', async () => {
      const user = new User({
        ...validUserData,
        email: 'invalid-email'
      });
      
      await expect(user.save()).rejects.toThrow();
    });

    test('should enforce unique email', async () => {
      const user1 = new User(validUserData);
      await user1.save();
      
      const user2 = new User(validUserData);
      await expect(user2.save()).rejects.toThrow();
    });

    test('should hash password before saving', async () => {
      const user = new User(validUserData);
      await user.save();
      
      expect(user.password).not.toBe(validUserData.password);
      expect(user.password.length).toBeGreaterThan(50); // Hashed password should be longer
    });

    test('should compare passwords correctly', async () => {
      const user = new User(validUserData);
      await user.save();
      
      const isMatch = await user.comparePassword(validUserData.password);
      expect(isMatch).toBe(true);
      
      const isNotMatch = await user.comparePassword('wrongpassword');
      expect(isNotMatch).toBe(false);
    });

    test('should generate JWT token', async () => {
      const user = new User(validUserData);
      await user.save();
      
      const token = user.generateAuthToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    test('should find user by email', async () => {
      const user = new User(validUserData);
      await user.save();
      
      const foundUser = await User.findByEmail(validUserData.email);
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(validUserData.email);
    });

    test('should get user statistics', async () => {
      const users = [
        new User({ ...validUserData, email: 'vendor1@test.com', role: 'vendor' }),
        new User({ ...validUserData, email: 'vendor2@test.com', role: 'vendor' }),
        new User({ ...validUserData, email: 'buyer1@test.com', role: 'buyer' })
      ];
      
      await Promise.all(users.map(u => u.save()));
      
      const stats = await User.getUserStats();
      expect(stats).toHaveLength(2); // vendor and buyer roles
      
      const vendorStats = stats.find(s => s._id === 'vendor');
      expect(vendorStats.count).toBe(2);
    });
  });

  describe('WasteSubmission Model', () => {
    let testUser;

    beforeEach(async () => {
      testUser = new User({
        email: 'vendor@test.com',
        password: 'password123',
        role: 'vendor',
        profile: { name: 'Test Vendor' }
      });
      await testUser.save();
    });

    const validSubmissionData = {
      vendorId: null, // Will be set in tests
      images: {
        before: {
          filename: 'before.jpg',
          originalName: 'before_image.jpg',
          mimeType: 'image/jpeg',
          size: 1024000,
          ipfsHash: 'QmTest1234567890123456789012345678901234567890'
        },
        after: {
          filename: 'after.jpg',
          originalName: 'after_image.jpg',
          mimeType: 'image/jpeg',
          size: 1024000,
          ipfsHash: 'QmTest1234567890123456789012345678901234567891'
        }
      },
      location: {
        coordinates: [77.2090, 28.6139], // Delhi coordinates
        address: 'Test Address, Delhi'
      },
      collectionDetails: {
        collectionDate: new Date(),
        estimatedQuantity: 10.5,
        wasteSource: 'household',
        collectionMethod: 'door_to_door'
      }
    };

    test('should create a valid waste submission', async () => {
      const submission = new WasteSubmission({
        ...validSubmissionData,
        vendorId: testUser._id
      });
      
      const savedSubmission = await submission.save();
      
      expect(savedSubmission._id).toBeDefined();
      expect(savedSubmission.batchId).toBeDefined();
      expect(savedSubmission.batchId).toMatch(/^WB[0-9]{8}[A-Z0-9]{4}$/);
      expect(savedSubmission.qrCode.data).toBeDefined();
      expect(savedSubmission.status).toBe('pending');
    });

    test('should generate unique batch ID', async () => {
      const submission1 = new WasteSubmission({
        ...validSubmissionData,
        vendorId: testUser._id
      });
      const submission2 = new WasteSubmission({
        ...validSubmissionData,
        vendorId: testUser._id,
        images: {
          ...validSubmissionData.images,
          before: {
            ...validSubmissionData.images.before,
            ipfsHash: 'QmTest1234567890123456789012345678901234567892'
          },
          after: {
            ...validSubmissionData.images.after,
            ipfsHash: 'QmTest1234567890123456789012345678901234567893'
          }
        }
      });
      
      await submission1.save();
      await submission2.save();
      
      expect(submission1.batchId).not.toBe(submission2.batchId);
    });

    test('should validate GPS coordinates', async () => {
      const submission = new WasteSubmission({
        ...validSubmissionData,
        vendorId: testUser._id,
        location: {
          coordinates: [200, 100], // Invalid coordinates
          address: 'Test Address'
        }
      });
      
      await expect(submission.save()).rejects.toThrow();
    });

    test('should find submission by batch ID', async () => {
      const submission = new WasteSubmission({
        ...validSubmissionData,
        vendorId: testUser._id
      });
      await submission.save();
      
      const found = await WasteSubmission.findByBatchId(submission.batchId);
      expect(found).toBeDefined();
      expect(found._id.toString()).toBe(submission._id.toString());
    });

    test('should update AI verification', async () => {
      const submission = new WasteSubmission({
        ...validSubmissionData,
        vendorId: testUser._id
      });
      await submission.save();
      
      const verificationData = {
        wasteType: 'plastic',
        quantity: {
          estimatedWeight: 10.2,
          confidence: 0.85
        },
        qualityScore: 75,
        confidence: {
          overall: 0.8,
          classification: 0.9,
          quantity: 0.7
        },
        anomalies: [],
        processingTime: 1500,
        modelVersion: 'v1.0.0'
      };
      
      await submission.updateAIVerification(verificationData);
      
      expect(submission.aiVerification.wasteType).toBe('plastic');
      expect(submission.status).toBe('verified');
    });

    test('should get statistics', async () => {
      const submissions = [
        new WasteSubmission({
          ...validSubmissionData,
          vendorId: testUser._id,
          status: 'verified'
        }),
        new WasteSubmission({
          ...validSubmissionData,
          vendorId: testUser._id,
          status: 'pending',
          images: {
            ...validSubmissionData.images,
            before: {
              ...validSubmissionData.images.before,
              ipfsHash: 'QmTest1234567890123456789012345678901234567894'
            }
          }
        })
      ];
      
      await Promise.all(submissions.map(s => s.save()));
      
      const stats = await WasteSubmission.getStats();
      expect(stats.totalSubmissions).toBe(2);
      expect(stats.verifiedSubmissions).toBe(1);
      expect(stats.pendingSubmissions).toBe(1);
    });
  });

  describe('WasteCredit Model', () => {
    let testUser, testSubmission;

    beforeEach(async () => {
      testUser = new User({
        email: 'vendor@test.com',
        password: 'password123',
        role: 'vendor',
        profile: { name: 'Test Vendor' }
      });
      await testUser.save();

      testSubmission = new WasteSubmission({
        vendorId: testUser._id,
        images: {
          before: {
            filename: 'before.jpg',
            originalName: 'before_image.jpg',
            mimeType: 'image/jpeg',
            size: 1024000,
            ipfsHash: 'QmTest1234567890123456789012345678901234567890'
          },
          after: {
            filename: 'after.jpg',
            originalName: 'after_image.jpg',
            mimeType: 'image/jpeg',
            size: 1024000,
            ipfsHash: 'QmTest1234567890123456789012345678901234567891'
          }
        },
        location: {
          coordinates: [77.2090, 28.6139],
          address: 'Test Address, Delhi'
        },
        collectionDetails: {
          collectionDate: new Date(),
          estimatedQuantity: 10.5,
          wasteSource: 'household',
          collectionMethod: 'door_to_door'
        }
      });
      await testSubmission.save();
    });

    const validCreditData = {
      submissionId: null, // Will be set in tests
      vendorId: null, // Will be set in tests
      wasteType: 'plastic',
      quantity: {
        weight: 10.5,
        unit: 'kg'
      },
      qualityGrade: 'A',
      qualityScore: 85,
      verificationDetails: {
        confidence: 0.9,
        verificationMethod: 'ai_only'
      },
      pricing: {
        basePrice: 105.0,
        currency: 'USD',
        pricePerKg: 10.0
      },
      location: {
        coordinates: [77.2090, 28.6139],
        address: {
          city: 'Delhi',
          country: 'India'
        }
      },
      availability: {
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      tracking: {
        collectionDate: new Date()
      }
    };

    test('should create a valid waste credit', async () => {
      const credit = new WasteCredit({
        ...validCreditData,
        submissionId: testSubmission._id,
        vendorId: testUser._id
      });
      
      const savedCredit = await credit.save();
      
      expect(savedCredit._id).toBeDefined();
      expect(savedCredit.creditId).toBeDefined();
      expect(savedCredit.creditId).toMatch(/^WC[0-9]{8}[A-Z0-9]{4}$/);
      expect(savedCredit.availability.status).toBe('available');
    });

    test('should calculate price per kg', async () => {
      const credit = new WasteCredit({
        ...validCreditData,
        submissionId: testSubmission._id,
        vendorId: testUser._id
      });
      
      await credit.save();
      
      expect(credit.pricing.pricePerKg).toBe(10.0);
    });

    test('should find available credits', async () => {
      const credit = new WasteCredit({
        ...validCreditData,
        submissionId: testSubmission._id,
        vendorId: testUser._id
      });
      await credit.save();
      
      const availableCredits = await WasteCredit.findAvailable();
      expect(availableCredits).toHaveLength(1);
      expect(availableCredits[0]._id.toString()).toBe(credit._id.toString());
    });

    test('should reserve credit', async () => {
      const buyer = new User({
        email: 'buyer@test.com',
        password: 'password123',
        role: 'buyer',
        profile: { name: 'Test Buyer' }
      });
      await buyer.save();

      const credit = new WasteCredit({
        ...validCreditData,
        submissionId: testSubmission._id,
        vendorId: testUser._id
      });
      await credit.save();
      
      await credit.reserve(buyer._id, 24);
      
      expect(credit.availability.status).toBe('reserved');
      expect(credit.availability.reservedBy.toString()).toBe(buyer._id.toString());
    });

    test('should complete sale', async () => {
      const buyer = new User({
        email: 'buyer@test.com',
        password: 'password123',
        role: 'buyer',
        profile: { name: 'Test Buyer' }
      });
      await buyer.save();

      const credit = new WasteCredit({
        ...validCreditData,
        submissionId: testSubmission._id,
        vendorId: testUser._id
      });
      await credit.save();
      
      await credit.reserve(buyer._id, 24);
      await credit.completeSale(buyer._id, 100.0);
      
      expect(credit.availability.status).toBe('sold');
      expect(credit.availability.soldTo.toString()).toBe(buyer._id.toString());
      expect(credit.availability.soldPrice).toBe(100.0);
    });

    test('should get marketplace statistics', async () => {
      const credit = new WasteCredit({
        ...validCreditData,
        submissionId: testSubmission._id,
        vendorId: testUser._id
      });
      await credit.save();
      
      const stats = await WasteCredit.getMarketplaceStats();
      expect(stats.overall.totalCredits).toBe(1);
      expect(stats.overall.availableCredits).toBe(1);
      expect(stats.byWasteType).toHaveLength(1);
    });
  });

  describe('BlockchainTransaction Model', () => {
    let testUser;

    beforeEach(async () => {
      testUser = new User({
        email: 'user@test.com',
        password: 'password123',
        role: 'vendor',
        profile: { name: 'Test User' }
      });
      await testUser.save();
    });

    const validTransactionData = {
      transactionHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
      entityType: 'waste_submission',
      entityId: null, // Will be set in tests
      contractAddress: '0x1234567890123456789012345678901234567890',
      fromAddress: '0x1234567890123456789012345678901234567890',
      functionName: 'recordWasteSubmission',
      gasLimit: '21000',
      gasPrice: '20000000000',
      nonce: 1,
      network: {
        name: 'mumbai',
        chainId: 80001,
        rpcUrl: 'https://rpc-mumbai.maticvigil.com/'
      },
      metadata: {
        submittedBy: null // Will be set in tests
      }
    };

    test('should create a valid blockchain transaction', async () => {
      const transaction = new BlockchainTransaction({
        ...validTransactionData,
        entityId: new mongoose.Types.ObjectId(),
        metadata: {
          submittedBy: testUser._id
        }
      });
      
      const savedTransaction = await transaction.save();
      
      expect(savedTransaction._id).toBeDefined();
      expect(savedTransaction.status).toBe('pending');
      expect(savedTransaction.confirmations).toBe(0);
    });

    test('should validate transaction hash format', async () => {
      const transaction = new BlockchainTransaction({
        ...validTransactionData,
        transactionHash: 'invalid-hash',
        entityId: new mongoose.Types.ObjectId(),
        metadata: {
          submittedBy: testUser._id
        }
      });
      
      await expect(transaction.save()).rejects.toThrow();
    });

    test('should update confirmations', async () => {
      const transaction = new BlockchainTransaction({
        ...validTransactionData,
        entityId: new mongoose.Types.ObjectId(),
        blockNumber: 1000,
        metadata: {
          submittedBy: testUser._id
        }
      });
      await transaction.save();
      
      await transaction.updateConfirmations(1012);
      
      expect(transaction.confirmations).toBe(13);
    });

    test('should find pending transactions', async () => {
      const transaction = new BlockchainTransaction({
        ...validTransactionData,
        entityId: new mongoose.Types.ObjectId(),
        metadata: {
          submittedBy: testUser._id
        }
      });
      await transaction.save();
      
      const pendingTxs = await BlockchainTransaction.findPending();
      expect(pendingTxs).toHaveLength(1);
    });

    test('should get transaction statistics', async () => {
      const transactions = [
        new BlockchainTransaction({
          ...validTransactionData,
          transactionHash: '0x1234567890123456789012345678901234567890123456789012345678901234',
          entityId: new mongoose.Types.ObjectId(),
          status: 'confirmed',
          metadata: { submittedBy: testUser._id }
        }),
        new BlockchainTransaction({
          ...validTransactionData,
          transactionHash: '0x1234567890123456789012345678901234567890123456789012345678901235',
          entityId: new mongoose.Types.ObjectId(),
          status: 'pending',
          metadata: { submittedBy: testUser._id }
        })
      ];
      
      await Promise.all(transactions.map(t => t.save()));
      
      const stats = await BlockchainTransaction.getStats();
      expect(stats.totalTransactions).toBe(2);
      expect(stats.confirmedTransactions).toBe(1);
      expect(stats.pendingTransactions).toBe(1);
    });
  });

  describe('IPFSMetadata Model', () => {
    let testUser;

    beforeEach(async () => {
      testUser = new User({
        email: 'user@test.com',
        password: 'password123',
        role: 'vendor',
        profile: { name: 'Test User' }
      });
      await testUser.save();
    });

    const validMetadataData = {
      ipfsHash: 'QmTest1234567890123456789012345678901234567890',
      entityType: 'waste_image',
      entityId: null, // Will be set in tests
      filename: 'test-image.jpg',
      originalName: 'test_image.jpg',
      mimeType: 'image/jpeg',
      size: 1024000,
      checksum: {
        algorithm: 'sha256',
        hash: 'abc123def456'
      },
      uploadDetails: {
        uploadedBy: null // Will be set in tests
      }
    };

    test('should create valid IPFS metadata', async () => {
      const metadata = new IPFSMetadata({
        ...validMetadataData,
        entityId: new mongoose.Types.ObjectId(),
        uploadDetails: {
          uploadedBy: testUser._id
        }
      });
      
      const savedMetadata = await metadata.save();
      
      expect(savedMetadata._id).toBeDefined();
      expect(savedMetadata.status).toBe('active');
      expect(savedMetadata.storage.gateways).toHaveLength(3); // Default gateways
    });

    test('should validate IPFS hash format', async () => {
      const metadata = new IPFSMetadata({
        ...validMetadataData,
        ipfsHash: 'invalid-hash',
        entityId: new mongoose.Types.ObjectId(),
        uploadDetails: {
          uploadedBy: testUser._id
        }
      });
      
      await expect(metadata.save()).rejects.toThrow();
    });

    test('should find by entity', async () => {
      const entityId = new mongoose.Types.ObjectId();
      const metadata = new IPFSMetadata({
        ...validMetadataData,
        entityId,
        uploadDetails: {
          uploadedBy: testUser._id
        }
      });
      await metadata.save();
      
      const found = await IPFSMetadata.findByEntity('waste_image', entityId);
      expect(found).toHaveLength(1);
      expect(found[0]._id.toString()).toBe(metadata._id.toString());
    });

    test('should increment download count', async () => {
      const metadata = new IPFSMetadata({
        ...validMetadataData,
        entityId: new mongoose.Types.ObjectId(),
        uploadDetails: {
          uploadedBy: testUser._id
        }
      });
      await metadata.save();
      
      await metadata.incrementDownloadCount();
      
      expect(metadata.access.downloadCount).toBe(1);
    });

    test('should get storage statistics', async () => {
      const metadata = new IPFSMetadata({
        ...validMetadataData,
        entityId: new mongoose.Types.ObjectId(),
        uploadDetails: {
          uploadedBy: testUser._id
        }
      });
      await metadata.save();
      
      const stats = await IPFSMetadata.getStorageStats();
      expect(stats.overall.totalFiles).toBe(1);
      expect(stats.overall.totalSize).toBe(1024000);
      expect(stats.byType).toHaveLength(1);
    });

    test('should add and remove permissions', async () => {
      const otherUser = new User({
        email: 'other@test.com',
        password: 'password123',
        role: 'buyer',
        profile: { name: 'Other User' }
      });
      await otherUser.save();

      const metadata = new IPFSMetadata({
        ...validMetadataData,
        entityId: new mongoose.Types.ObjectId(),
        uploadDetails: {
          uploadedBy: testUser._id
        }
      });
      await metadata.save();
      
      await metadata.addPermission(otherUser._id, 'viewer', testUser._id);
      expect(metadata.access.permissions).toHaveLength(1);
      
      await metadata.removePermission(otherUser._id);
      expect(metadata.access.permissions).toHaveLength(0);
    });
  });
});