/**
 * Unit tests for EPR compliance data models
 */

import { jest } from '@jest/globals';
import { 
  Client,
  Document,
  AuditResult,
  RecyclerMaster,
  ComplianceScore,
  AuditTrail,
  BillingRecord
} from '../models/epr/index.js';
import { initializeDatabases, closeDatabases } from '../config/database.js';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.POSTGRES_DB = 'epr_compliance_test';
process.env.JWT_SECRET = 'test-jwt-secret';

describe('EPR Data Models', () => {
  let sequelize;

  beforeAll(async () => {
    const connections = await initializeDatabases();
    sequelize = connections.postgresql;
    
    // Initialize models
    Client.init(sequelize);
    Document.init(sequelize);
    AuditResult.init(sequelize);
    RecyclerMaster.init(sequelize);
    ComplianceScore.init(sequelize);
    AuditTrail.init(sequelize);
    BillingRecord.init(sequelize);
    
    // Set up associations
    Client.associate({ Document, AuditResult, ComplianceScore, BillingRecord, AuditTrail });
    Document.associate({ Client, AuditResult, AuditTrail });
    AuditResult.associate({ Client, Document, AuditTrail });
    RecyclerMaster.associate({ AuditTrail });
    ComplianceScore.associate({ Client, AuditTrail });
    BillingRecord.associate({ Client, AuditTrail });
    
    // Sync database
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await closeDatabases();
  });

  beforeEach(async () => {
    // Clear all tables before each test
    await sequelize.truncate({ cascade: true });
  });

  describe('Client Model', () => {
    const validClientData = {
      name: 'Test Client',
      email: 'client@test.com',
      password: 'password123',
      organization: 'Test Organization',
      subscriptionTier: 'professional'
    };

    test('should create a valid client', async () => {
      const client = await Client.create(validClientData);
      
      expect(client.id).toBeDefined();
      expect(client.email).toBe(validClientData.email);
      expect(client.subscriptionTier).toBe(validClientData.subscriptionTier);
      expect(client.status).toBe('trial');
      expect(client.password).not.toBe(validClientData.password); // Should be hashed
    });

    test('should validate required fields', async () => {
      await expect(Client.create({})).rejects.toThrow();
    });

    test('should enforce unique email', async () => {
      await Client.create(validClientData);
      
      await expect(Client.create({
        ...validClientData,
        name: 'Another Client'
      })).rejects.toThrow();
    });

    test('should hash password before saving', async () => {
      const client = await Client.create(validClientData);
      
      expect(client.password).not.toBe(validClientData.password);
      expect(client.password.length).toBeGreaterThan(50);
    });

    test('should compare passwords correctly', async () => {
      const client = await Client.create(validClientData);
      
      const isMatch = await client.comparePassword(validClientData.password);
      expect(isMatch).toBe(true);
      
      const isNotMatch = await client.comparePassword('wrongpassword');
      expect(isNotMatch).toBe(false);
    });

    test('should generate JWT token', async () => {
      const client = await Client.create(validClientData);
      
      const token = client.generateAuthToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    test('should check usage limits', async () => {
      const client = await Client.create(validClientData);
      
      const limits = client.checkUsageLimits();
      expect(limits.documents).toBeDefined();
      expect(limits.tonnage).toBeDefined();
      expect(limits.apiCalls).toBeDefined();
      expect(limits.reports).toBeDefined();
    });

    test('should upgrade subscription', async () => {
      const client = await Client.create(validClientData);
      
      const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      await client.upgradeSubscription('enterprise', endDate);
      
      expect(client.subscriptionTier).toBe('enterprise');
      expect(client.status).toBe('active');
      expect(client.subscriptionEndsAt).toEqual(endDate);
    });
  });

  describe('Document Model', () => {
    let testClient;

    beforeEach(async () => {
      testClient = await Client.create({
        name: 'Test Client',
        email: 'client@test.com',
        password: 'password123',
        organization: 'Test Organization'
      });
    });

    const validDocumentData = {
      filename: 'test-document.pdf',
      originalName: 'test_document.pdf',
      filePath: '/uploads/test-document.pdf',
      fileSize: 1024000,
      mimeType: 'application/pdf',
      documentType: 'invoice'
    };

    test('should create a valid document', async () => {
      const document = await Document.create({
        ...validDocumentData,
        clientId: testClient.id
      });
      
      expect(document.id).toBeDefined();
      expect(document.filename).toBe(validDocumentData.filename);
      expect(document.documentType).toBe(validDocumentData.documentType);
      expect(document.ocrStatus).toBe('pending');
      expect(document.status).toBe('active');
    });

    test('should validate file size limits', async () => {
      await expect(Document.create({
        ...validDocumentData,
        clientId: testClient.id,
        fileSize: 100000000 // 100MB - exceeds limit
      })).rejects.toThrow();
    });

    test('should validate MIME types', async () => {
      await expect(Document.create({
        ...validDocumentData,
        clientId: testClient.id,
        mimeType: 'application/exe' // Invalid MIME type
      })).rejects.toThrow();
    });

    test('should update OCR results', async () => {
      const document = await Document.create({
        ...validDocumentData,
        clientId: testClient.id
      });
      
      const ocrData = {
        text: 'Extracted text content',
        confidence: 0.95,
        processingTime: 1500,
        engine: 'tesseract',
        version: '4.1.1'
      };
      
      await document.updateOCRResults(ocrData);
      
      expect(document.ocrStatus).toBe('completed');
      expect(document.ocrResults.rawText).toBe(ocrData.text);
      expect(document.ocrResults.confidence).toBe(ocrData.confidence);
    });

    test('should find documents by client', async () => {
      await Document.create({
        ...validDocumentData,
        clientId: testClient.id
      });
      
      const result = await Document.findByClient(testClient.id);
      expect(result.count).toBe(1);
      expect(result.rows[0].clientId).toBe(testClient.id);
    });

    test('should get document statistics', async () => {
      await Document.create({
        ...validDocumentData,
        clientId: testClient.id,
        ocrStatus: 'completed'
      });
      
      const stats = await Document.getStatistics(testClient.id);
      expect(stats.byTypeAndStatus).toBeDefined();
      expect(stats.processing).toBeDefined();
    });
  });

  describe('AuditResult Model', () => {
    let testClient, testDocument;

    beforeEach(async () => {
      testClient = await Client.create({
        name: 'Test Client',
        email: 'client@test.com',
        password: 'password123',
        organization: 'Test Organization'
      });

      testDocument = await Document.create({
        clientId: testClient.id,
        filename: 'test-document.pdf',
        originalName: 'test_document.pdf',
        filePath: '/uploads/test-document.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        documentType: 'invoice'
      });
    });

    const validAuditData = {
      auditType: 'document_validation',
      priority: 'medium',
      findings: {
        summary: 'Document validation completed',
        issues: [],
        compliantItems: ['valid_format', 'readable_text'],
        nonCompliantItems: [],
        dataQualityIssues: []
      },
      recommendations: ['Maintain current document quality'],
      complianceScore: 85.5,
      confidenceScore: 0.92
    };

    test('should create a valid audit result', async () => {
      const auditResult = await AuditResult.create({
        ...validAuditData,
        clientId: testClient.id,
        documentId: testDocument.id
      });
      
      expect(auditResult.id).toBeDefined();
      expect(auditResult.auditType).toBe(validAuditData.auditType);
      expect(auditResult.status).toBe('pending');
      expect(auditResult.complianceScore).toBe(validAuditData.complianceScore);
    });

    test('should start audit', async () => {
      const auditResult = await AuditResult.create({
        ...validAuditData,
        clientId: testClient.id,
        documentId: testDocument.id
      });
      
      await auditResult.startAudit();
      
      expect(auditResult.status).toBe('in_progress');
      expect(auditResult.startedAt).toBeDefined();
    });

    test('should complete audit', async () => {
      const auditResult = await AuditResult.create({
        ...validAuditData,
        clientId: testClient.id,
        documentId: testDocument.id
      });
      
      await auditResult.startAudit();
      await auditResult.completeAudit(
        validAuditData.findings,
        validAuditData.recommendations,
        validAuditData.complianceScore
      );
      
      expect(auditResult.status).toBe('completed');
      expect(auditResult.completedAt).toBeDefined();
      expect(auditResult.executionTime).toBeDefined();
    });

    test('should find pending audits', async () => {
      await AuditResult.create({
        ...validAuditData,
        clientId: testClient.id,
        documentId: testDocument.id
      });
      
      const pendingAudits = await AuditResult.findPending();
      expect(pendingAudits).toHaveLength(1);
    });

    test('should get audit statistics', async () => {
      await AuditResult.create({
        ...validAuditData,
        clientId: testClient.id,
        documentId: testDocument.id,
        status: 'completed'
      });
      
      const stats = await AuditResult.getStatistics(testClient.id);
      expect(stats.byTypeStatusPriority).toBeDefined();
      expect(stats.followUp).toBeDefined();
    });
  });

  describe('RecyclerMaster Model', () => {
    const validRecyclerData = {
      name: 'Test Recycler Ltd',
      registrationNumber: 'REC123456',
      gstNumber: '29ABCDE1234F1Z5',
      address: {
        street: '123 Recycler Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      },
      state: 'Maharashtra',
      district: 'Mumbai',
      pincode: '400001',
      licenseType: 'cpcb',
      licenseNumber: 'CPCB/REC/2023/001',
      wasteTypesAccepted: ['plastic', 'paper', 'metal']
    };

    test('should create a valid recycler', async () => {
      const recycler = await RecyclerMaster.create(validRecyclerData);
      
      expect(recycler.id).toBeDefined();
      expect(recycler.name).toBe(validRecyclerData.name);
      expect(recycler.registrationNumber).toBe(validRecyclerData.registrationNumber);
      expect(recycler.verificationStatus).toBe('pending');
      expect(recycler.status).toBe('active');
    });

    test('should validate GST number format', async () => {
      await expect(RecyclerMaster.create({
        ...validRecyclerData,
        gstNumber: 'INVALID_GST'
      })).rejects.toThrow();
    });

    test('should enforce unique registration number', async () => {
      await RecyclerMaster.create(validRecyclerData);
      
      await expect(RecyclerMaster.create({
        ...validRecyclerData,
        name: 'Another Recycler'
      })).rejects.toThrow();
    });

    test('should find by registration number', async () => {
      const recycler = await RecyclerMaster.create(validRecyclerData);
      
      const found = await RecyclerMaster.findByRegistrationNumber(validRecyclerData.registrationNumber);
      expect(found.id).toBe(recycler.id);
    });

    test('should find by waste type', async () => {
      await RecyclerMaster.create(validRecyclerData);
      
      const recyclers = await RecyclerMaster.findByWasteType('plastic');
      expect(recyclers).toHaveLength(0); // Not verified yet
      
      // Verify the recycler first
      const recycler = await RecyclerMaster.findByRegistrationNumber(validRecyclerData.registrationNumber);
      await recycler.verify('test-admin', 'manual');
      
      const verifiedRecyclers = await RecyclerMaster.findByWasteType('plastic');
      expect(verifiedRecyclers).toHaveLength(1);
    });

    test('should update risk profile', async () => {
      const recycler = await RecyclerMaster.create(validRecyclerData);
      
      const riskFactors = {
        environmental: [{ factor: 'pollution_control', score: 80 }],
        operational: [{ factor: 'capacity_utilization', score: 75 }]
      };
      
      await recycler.updateRiskProfile(riskFactors);
      
      expect(recycler.riskFactors.environmental).toBeDefined();
      expect(recycler.riskFactors.overall_score).toBeGreaterThan(0);
    });

    test('should get statistics', async () => {
      await RecyclerMaster.create(validRecyclerData);
      
      const stats = await RecyclerMaster.getStatistics();
      expect(stats.byStateStatusRisk).toBeDefined();
      expect(stats.byWasteType).toBeDefined();
      expect(stats.capacity).toBeDefined();
    });
  });

  describe('ComplianceScore Model', () => {
    let testClient;

    beforeEach(async () => {
      testClient = await Client.create({
        name: 'Test Client',
        email: 'client@test.com',
        password: 'password123',
        organization: 'Test Organization'
      });
    });

    const validScoreData = {
      overallScore: 85.5,
      componentScores: {
        documentationQuality: { score: 90, weight: 0.2 },
        recyclerVerification: { score: 85, weight: 0.2 },
        tonnageAccuracy: { score: 80, weight: 0.2 },
        timelinessCompliance: { score: 88, weight: 0.15 },
        dataConsistency: { score: 82, weight: 0.15 },
        regulatoryAdherence: { score: 87, weight: 0.1 }
      },
      periodStart: new Date('2023-01-01'),
      periodEnd: new Date('2023-12-31'),
      totalTonnageAudited: 1000.5,
      documentsProcessed: 150,
      auditFindingsCount: 5
    };

    test('should create a valid compliance score', async () => {
      const score = await ComplianceScore.create({
        ...validScoreData,
        clientId: testClient.id
      });
      
      expect(score.id).toBeDefined();
      expect(score.scoreId).toBeDefined();
      expect(score.overallScore).toBe(validScoreData.overallScore);
      expect(score.grade).toBe('B+'); // 85.5 should be B+
      expect(score.status).toBe('calculated');
    });

    test('should calculate grade correctly', async () => {
      const score = new ComplianceScore();
      
      expect(score.calculateGrade(95)).toBe('A+');
      expect(score.calculateGrade(90)).toBe('A');
      expect(score.calculateGrade(85)).toBe('B+');
      expect(score.calculateGrade(80)).toBe('B');
      expect(score.calculateGrade(75)).toBe('C+');
      expect(score.calculateGrade(70)).toBe('C');
      expect(score.calculateGrade(60)).toBe('D');
      expect(score.calculateGrade(50)).toBe('F');
    });

    test('should validate score', async () => {
      const score = await ComplianceScore.create({
        ...validScoreData,
        clientId: testClient.id
      });
      
      await score.validateScore();
      
      expect(score.validationResults.isValid).toBeDefined();
    });

    test('should publish score', async () => {
      const score = await ComplianceScore.create({
        ...validScoreData,
        clientId: testClient.id
      });
      
      await score.publish(90);
      
      expect(score.status).toBe('published');
      expect(score.publishedAt).toBeDefined();
      expect(score.validUntil).toBeDefined();
    });

    test('should find latest score for client', async () => {
      const score = await ComplianceScore.create({
        ...validScoreData,
        clientId: testClient.id
      });
      
      await score.publish();
      
      const latestScore = await ComplianceScore.findLatestForClient(testClient.id);
      expect(latestScore.id).toBe(score.id);
    });

    test('should get score distribution', async () => {
      await ComplianceScore.create({
        ...validScoreData,
        clientId: testClient.id,
        status: 'published'
      });
      
      const distribution = await ComplianceScore.getScoreDistribution();
      expect(distribution.byGrade).toBeDefined();
      expect(distribution.byRange).toBeDefined();
    });
  });

  describe('AuditTrail Model', () => {
    test('should log activity', async () => {
      const auditTrail = await AuditTrail.logActivity({
        entityType: 'client',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
        action: 'create',
        actorId: '123e4567-e89b-12d3-a456-426614174001',
        actorType: 'admin',
        changes: { name: 'Test Client' },
        severity: 'medium'
      });
      
      expect(auditTrail.id).toBeDefined();
      expect(auditTrail.entityType).toBe('client');
      expect(auditTrail.action).toBe('create');
      expect(auditTrail.severity).toBe('medium');
    });

    test('should find by entity', async () => {
      const entityId = '123e4567-e89b-12d3-a456-426614174000';
      
      await AuditTrail.logActivity({
        entityType: 'client',
        entityId,
        action: 'create',
        actorId: '123e4567-e89b-12d3-a456-426614174001',
        actorType: 'admin'
      });
      
      const result = await AuditTrail.findByEntity('client', entityId);
      expect(result.count).toBe(1);
    });

    test('should find high-risk activities', async () => {
      await AuditTrail.logActivity({
        entityType: 'client',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
        action: 'delete',
        actorId: '123e4567-e89b-12d3-a456-426614174001',
        actorType: 'admin',
        riskLevel: 'high'
      });
      
      const highRiskActivities = await AuditTrail.findHighRiskActivities();
      expect(highRiskActivities.count).toBe(1);
    });

    test('should get activity statistics', async () => {
      await AuditTrail.logActivity({
        entityType: 'client',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
        action: 'create',
        actorId: '123e4567-e89b-12d3-a456-426614174001',
        actorType: 'admin'
      });
      
      const stats = await AuditTrail.getActivityStatistics();
      expect(stats.byAction).toBeDefined();
      expect(stats.bySeverity).toBeDefined();
      expect(stats.byRiskLevel).toBeDefined();
      expect(stats.byEntityType).toBeDefined();
    });
  });

  describe('BillingRecord Model', () => {
    let testClient;

    beforeEach(async () => {
      testClient = await Client.create({
        name: 'Test Client',
        email: 'client@test.com',
        password: 'password123',
        organization: 'Test Organization',
        subscriptionTier: 'professional'
      });
    });

    const validBillingData = {
      billingPeriodStart: new Date('2023-01-01'),
      billingPeriodEnd: new Date('2023-01-31'),
      subscriptionFee: 299.00,
      usageCharges: 150.00,
      totalAmount: 449.00
    };

    test('should create a valid billing record', async () => {
      const billingRecord = await BillingRecord.create({
        ...validBillingData,
        clientId: testClient.id
      });
      
      expect(billingRecord.id).toBeDefined();
      expect(billingRecord.invoiceNumber).toBeDefined();
      expect(billingRecord.paymentStatus).toBe('pending');
      expect(billingRecord.status).toBe('draft');
    });

    test('should calculate totals', async () => {
      const billingRecord = await BillingRecord.create({
        ...validBillingData,
        clientId: testClient.id
      });
      
      billingRecord.calculateTotals();
      
      expect(billingRecord.subtotal).toBe(449.00);
      expect(billingRecord.totalAmount).toBeGreaterThanOrEqual(449.00);
    });

    test('should calculate usage charges', async () => {
      const billingRecord = await BillingRecord.create({
        ...validBillingData,
        clientId: testClient.id,
        usageDetails: {
          documentsProcessed: 100,
          tonnageAudited: 50,
          apiCalls: 1000,
          reportsGenerated: 5
        },
        usageRates: {
          perDocument: 0.5,
          perTonne: 2.0,
          perApiCall: 0.01,
          perReport: 5.0
        }
      });
      
      const usageCharges = billingRecord.calculateUsageCharges();
      
      // 100*0.5 + 50*2.0 + 1000*0.01 + 5*5.0 = 50 + 100 + 10 + 25 = 185
      expect(usageCharges).toBe(185);
    });

    test('should apply discount', async () => {
      const billingRecord = await BillingRecord.create({
        ...validBillingData,
        clientId: testClient.id
      });
      
      await billingRecord.applyDiscount('SAVE10', 0, 10);
      
      expect(billingRecord.discounts.applied).toHaveLength(1);
      expect(billingRecord.discounts.totalDiscount).toBeGreaterThan(0);
    });

    test('should mark as paid', async () => {
      const billingRecord = await BillingRecord.create({
        ...validBillingData,
        clientId: testClient.id
      });
      
      await billingRecord.markAsPaid({
        transactionId: 'TXN123456',
        paymentGateway: 'stripe'
      });
      
      expect(billingRecord.paymentStatus).toBe('paid');
      expect(billingRecord.status).toBe('paid');
      expect(billingRecord.paymentDate).toBeDefined();
    });

    test('should find overdue invoices', async () => {
      await BillingRecord.create({
        ...validBillingData,
        clientId: testClient.id,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        paymentStatus: 'pending'
      });
      
      const overdueInvoices = await BillingRecord.findOverdue();
      expect(overdueInvoices).toHaveLength(1);
    });

    test('should get revenue statistics', async () => {
      await BillingRecord.create({
        ...validBillingData,
        clientId: testClient.id,
        paymentStatus: 'paid',
        paymentDate: new Date()
      });
      
      const stats = await BillingRecord.getRevenueStatistics();
      expect(stats.overall.totalRevenue).toBeDefined();
      expect(stats.monthly).toBeDefined();
    });

    test('should check if overdue', async () => {
      const billingRecord = await BillingRecord.create({
        ...validBillingData,
        clientId: testClient.id,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      });
      
      expect(billingRecord.isOverdue()).toBe(true);
      expect(billingRecord.getDaysOverdue()).toBe(1);
    });
  });
});