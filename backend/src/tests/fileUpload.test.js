import request from 'supertest';
import app from '../server.js';
import { jest } from '@jest/globals';
import fileUploadService from '../services/fileUploadService.js';
import virusScanService from '../services/virusScanService.js';
import fs from 'fs';
import path from 'path';

// Mock services
jest.mock('../services/fileUploadService.js');
jest.mock('../services/virusScanService.js');

describe('File Upload System', () => {
  let authToken;
  
  beforeAll(async () => {
    // Mock authentication token
    authToken = 'mock-jwt-token';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Security Validation', () => {
    test('should reject files with malicious content', async () => {
      // Mock virus scan to return infected status
      virusScanService.scanFile.mockResolvedValue({
        overallStatus: 'infected',
        threats: [{
          type: 'virus_detected',
          severity: 'high',
          description: 'Test virus detected'
        }],
        confidence: 0
      });

      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('malicious content'), 'malicious.exe')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('malicious content');
    });

    test('should allow clean files to pass', async () => {
      // Mock virus scan to return clean status
      virusScanService.scanFile.mockResolvedValue({
        overallStatus: 'clean',
        threats: [],
        confidence: 95
      });

      // Mock file upload service
      fileUploadService.processUploadedFiles.mockResolvedValue([{
        filename: 'clean-image.jpg',
        success: true,
        ipfsHash: 'QmTest123',
        fileHash: 'abc123'
      }]);

      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('clean image data'), 'clean-image.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should handle suspicious files appropriately', async () => {
      // Mock virus scan to return suspicious status with low confidence
      virusScanService.scanFile.mockResolvedValue({
        overallStatus: 'suspicious',
        threats: [{
          type: 'high_entropy',
          severity: 'medium',
          description: 'File has high entropy'
        }],
        confidence: 60
      });

      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('suspicious content'), 'suspicious.pdf')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('suspicious');
    });
  });

  describe('File Type Validation', () => {
    test('should accept valid image files', async () => {
      virusScanService.scanFile.mockResolvedValue({
        overallStatus: 'clean',
        threats: [],
        confidence: 95
      });

      fileUploadService.processUploadedFiles.mockResolvedValue([{
        filename: 'test.jpg',
        success: true,
        ipfsHash: 'QmTest123'
      }]);

      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('fake jpg data'), 'test.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should accept valid PDF files', async () => {
      virusScanService.scanFile.mockResolvedValue({
        overallStatus: 'clean',
        threats: [],
        confidence: 95
      });

      fileUploadService.processUploadedFiles.mockResolvedValue([{
        filename: 'document.pdf',
        success: true,
        s3Key: 'documents/test.pdf'
      }]);

      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('%PDF-1.4 fake pdf'), 'document.pdf')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject invalid file types', async () => {
      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('executable content'), 'malware.exe')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid file type');
    });
  });

  describe('Waste Image Upload', () => {
    test('should upload waste images with proper metadata', async () => {
      virusScanService.scanFile.mockResolvedValue({
        overallStatus: 'clean',
        threats: [],
        confidence: 95
      });

      fileUploadService.processUploadedFiles.mockResolvedValue([
        {
          filename: 'before.jpg',
          success: true,
          ipfsHash: 'QmBefore123'
        },
        {
          filename: 'after.jpg',
          success: true,
          ipfsHash: 'QmAfter123'
        }
      ]);

      const response = await request(app)
        .post('/api/upload/waste/images')
        .set('Authorization', `Bearer ${authToken}`)
        .field('batchId', 'BATCH-001')
        .field('location', JSON.stringify({
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'New York, NY'
        }))
        .attach('beforeImage', Buffer.from('before image'), 'before.jpg')
        .attach('afterImage', Buffer.from('after image'), 'after.jpg')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.batchId).toBe('BATCH-001');
      expect(response.body.data.files).toHaveLength(2);
    });

    test('should validate GPS coordinates', async () => {
      const response = await request(app)
        .post('/api/upload/waste/images')
        .set('Authorization', `Bearer ${authToken}`)
        .field('batchId', 'BATCH-001')
        .field('location', JSON.stringify({
          latitude: 200, // Invalid latitude
          longitude: -74.0060
        }))
        .attach('beforeImage', Buffer.from('before image'), 'before.jpg')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid GPS coordinates');
    });

    test('should require batch ID for waste submissions', async () => {
      const response = await request(app)
        .post('/api/upload/waste/images')
        .set('Authorization', `Bearer ${authToken}`)
        .field('location', JSON.stringify({
          latitude: 40.7128,
          longitude: -74.0060
        }))
        .attach('beforeImage', Buffer.from('before image'), 'before.jpg')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Batch ID is required');
    });
  });

  describe('EPR Document Upload', () => {
    test('should upload EPR documents with proper metadata', async () => {
      virusScanService.scanFile.mockResolvedValue({
        overallStatus: 'clean',
        threats: [],
        confidence: 95
      });

      fileUploadService.processUploadedFiles.mockResolvedValue([
        {
          filename: 'invoice.pdf',
          success: true,
          s3Key: 'documents/invoice.pdf'
        }
      ]);

      const response = await request(app)
        .post('/api/upload/epr/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .field('documentType', 'invoice')
        .field('clientId', 'CLIENT-001')
        .attach('documents', Buffer.from('%PDF-1.4 invoice'), 'invoice.pdf')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.documentType).toBe('invoice');
      expect(response.body.data.clientId).toBe('CLIENT-001');
    });

    test('should require document type for EPR uploads', async () => {
      const response = await request(app)
        .post('/api/upload/epr/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .field('clientId', 'CLIENT-001')
        .attach('documents', Buffer.from('%PDF-1.4 doc'), 'document.pdf')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Document type is required');
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits on uploads', async () => {
      // This test would need to make multiple requests rapidly
      // Implementation depends on your rate limiting configuration
      
      const promises = [];
      for (let i = 0; i < 60; i++) {
        promises.push(
          request(app)
            .post('/api/upload/single')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', Buffer.from('test'), 'test.jpg')
        );
      }

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Authentication and Authorization', () => {
    test('should require authentication for uploads', async () => {
      const response = await request(app)
        .post('/api/upload/single')
        .attach('file', Buffer.from('test'), 'test.jpg')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Authentication required');
    });

    test('should enforce role-based access for waste uploads', async () => {
      // Mock user with buyer role (should not be able to upload waste)
      const buyerToken = 'buyer-token';
      
      const response = await request(app)
        .post('/api/upload/waste/images')
        .set('Authorization', `Bearer ${buyerToken}`)
        .field('batchId', 'BATCH-001')
        .field('location', JSON.stringify({ latitude: 40.7128, longitude: -74.0060 }))
        .attach('beforeImage', Buffer.from('image'), 'before.jpg')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('Error Handling', () => {
    test('should handle file processing errors gracefully', async () => {
      virusScanService.scanFile.mockResolvedValue({
        overallStatus: 'clean',
        threats: [],
        confidence: 95
      });

      // Mock file upload service to throw error
      fileUploadService.processUploadedFiles.mockRejectedValue(
        new Error('IPFS connection failed')
      );

      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('test'), 'test.jpg')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Internal server error');
    });

    test('should handle virus scan errors', async () => {
      // Mock virus scan to throw error
      virusScanService.scanFile.mockRejectedValue(
        new Error('Virus scan service unavailable')
      );

      const response = await request(app)
        .post('/api/upload/single')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('test'), 'test.jpg')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Security scan failed');
    });
  });

  describe('Health Check', () => {
    test('should return service health status', async () => {
      // Mock service health checks
      fileUploadService.ipfs = { id: jest.fn().mockResolvedValue({}) };
      fileUploadService.s3 = { 
        headBucket: jest.fn().mockReturnValue({
          promise: jest.fn().mockResolvedValue({})
        })
      };

      const response = await request(app)
        .get('/api/upload/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.services).toHaveProperty('ipfs');
      expect(response.body.services).toHaveProperty('s3');
    });
  });
});

describe('Virus Scan Service', () => {
  describe('Heuristic Analysis', () => {
    test('should detect high entropy files', async () => {
      // Create a high entropy buffer (random data)
      const highEntropyBuffer = Buffer.from(Array.from({ length: 1000 }, () => 
        Math.floor(Math.random() * 256)
      ));

      const result = await virusScanService.performHeuristicScan(
        highEntropyBuffer, 
        'test.bin', 
        'application/octet-stream'
      );

      expect(result.entropy).toBeGreaterThan(7.5);
      expect(result.threats.some(t => t.type === 'high_entropy')).toBe(true);
    });

    test('should detect executable signatures', async () => {
      // Create buffer with PE executable signature
      const peBuffer = Buffer.from([0x4D, 0x5A, ...Array(100).fill(0)]);

      const result = await virusScanService.performHeuristicScan(
        peBuffer,
        'test.exe',
        'application/octet-stream'
      );

      expect(result.threats.some(t => t.type === 'executable_content')).toBe(true);
      expect(result.status).toBe('infected');
    });

    test('should detect suspicious strings', async () => {
      const suspiciousBuffer = Buffer.from(
        'This file contains eval() and <script> tags for malicious purposes'
      );

      const result = await virusScanService.performHeuristicScan(
        suspiciousBuffer,
        'suspicious.txt',
        'text/plain'
      );

      expect(result.threats.some(t => t.type === 'suspicious_strings')).toBe(true);
    });
  });

  describe('File Signature Analysis', () => {
    test('should identify file signatures correctly', async () => {
      // Test JPEG signature
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, ...Array(100).fill(0)]);
      
      const result = await virusScanService.performSignatureScan(jpegBuffer);
      
      // Should not flag JPEG as suspicious by signature alone
      expect(result.status).toBe('clean');
    });

    test('should flag executable signatures', async () => {
      // Test ELF signature
      const elfBuffer = Buffer.from([0x7F, 0x45, 0x4C, 0x46, ...Array(100).fill(0)]);
      
      const result = await virusScanService.performSignatureScan(elfBuffer);
      
      expect(result.threats.some(t => t.type === 'file_signature')).toBe(true);
      expect(result.status).toBe('infected');
    });
  });

  describe('Confidence Scoring', () => {
    test('should calculate confidence scores correctly', async () => {
      const cleanScanResult = {
        methods: {
          heuristic: { status: 'clean', threats: [] },
          signature: { status: 'clean', threats: [] }
        }
      };

      const confidence = virusScanService.calculateConfidenceScore(cleanScanResult);
      expect(confidence).toBeGreaterThan(90);
    });

    test('should reduce confidence for threats', async () => {
      const threateningScanResult = {
        methods: {
          heuristic: { 
            status: 'suspicious', 
            threats: [{ severity: 'high' }, { severity: 'medium' }] 
          },
          signature: { status: 'clean', threats: [] }
        }
      };

      const confidence = virusScanService.calculateConfidenceScore(threateningScanResult);
      expect(confidence).toBeLessThan(70);
    });
  });
});