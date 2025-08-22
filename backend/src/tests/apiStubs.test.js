/**
 * API Stubs Test - P0 Milestone
 * Tests the minimal API endpoints for frontend integration
 */

import request from 'supertest';
import app from '../server.js';

describe('API Stubs - P0 Milestone', () => {
  
  describe('Health Check API', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });

    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/api/health/ready')
        .expect('Content-Type', /json/);

      expect(response.body.status).toBeDefined();
    });

    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/api/health/live')
        .expect(200);

      expect(response.body.status).toBe('alive');
    });
  });

  describe('Authentication Stub API', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth-stub/login')
        .send({
          email: 'admin@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('admin@example.com');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth-stub/login')
        .send({
          email: 'admin@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should require email and password', async () => {
      const response = await request(app)
        .post('/api/auth-stub/login')
        .send({
          email: 'admin@example.com'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Documents API', () => {
    it('should return empty documents list initially', async () => {
      const response = await request(app)
        .get('/api/documents')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.documents).toEqual([]);
      expect(response.body.data.total).toBe(0);
    });

    it('should handle document not found', async () => {
      const response = await request(app)
        .get('/api/documents/nonexistent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Document not found');
    });
  });

  describe('OCR API', () => {
    it('should start OCR processing', async () => {
      const response = await request(app)
        .post('/api/ocr/process/test-document-id')
        .expect(202);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ocrId).toBeDefined();
      expect(response.body.data.status).toBe('pending');
    });

    it('should return OCR status', async () => {
      // First start a job
      const startResponse = await request(app)
        .post('/api/ocr/process/test-document-id-2')
        .expect(202);

      // Then check status
      const statusResponse = await request(app)
        .get('/api/ocr/status/test-document-id-2')
        .expect(200);

      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data.status).toBeDefined();
    });

    it('should handle OCR job not found', async () => {
      const response = await request(app)
        .get('/api/ocr/status/nonexistent-document')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('OCR job not found');
    });
  });

  describe('AI Services API', () => {
    it('should analyze waste', async () => {
      const response = await request(app)
        .post('/api/ai/waste-analysis/analyze')
        .send({
          visualData: 'base64-encoded-image-data',
          analysisMode: 'multi'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.classification).toBeDefined();
      expect(response.body.data.confidence).toBeGreaterThan(0);
    });

    it('should detect contamination', async () => {
      const response = await request(app)
        .post('/api/ai/contamination/detect')
        .send({
          imageData: 'base64-encoded-image-data',
          expectedMaterialType: 'plastic'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(typeof response.body.data.contaminationDetected).toBe('boolean');
    });

    it('should get real-time data', async () => {
      const response = await request(app)
        .get('/api/ai/real-time/data')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.throughput).toBeDefined();
      expect(response.body.data.efficiency).toBeDefined();
      expect(response.body.data.systemStatus).toBeDefined();
    });

    it('should calibrate sensors', async () => {
      const response = await request(app)
        .post('/api/ai/sensors/calibrate')
        .send({
          sensorIds: ['visual_1', 'spectral_1']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.calibrationId).toBeDefined();
      expect(response.body.data.sensorStatuses).toBeDefined();
    });

    it('should get sensor status', async () => {
      const response = await request(app)
        .get('/api/ai/sensors/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should require visual data for waste analysis', async () => {
      const response = await request(app)
        .post('/api/ai/waste-analysis/analyze')
        .send({
          analysisMode: 'single'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Visual data is required');
    });

    it('should require image data for contamination detection', async () => {
      const response = await request(app)
        .post('/api/ai/contamination/detect')
        .send({
          expectedMaterialType: 'plastic'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Image data is required');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Route');
      expect(response.body.message).toContain('not found');
    });
  });
});