import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EprApiClient } from '../services/api/eprClient';

// Mock fetch globally
global.fetch = vi.fn();

describe('EprApiClient', () => {
  let client: EprApiClient;
  const mockBaseURL = 'http://localhost:3001/api';

  beforeEach(() => {
    client = new EprApiClient({ baseURL: mockBaseURL });
    vi.clearAllMocks();
  });

  describe('Document Upload', () => {
    it('should upload documents successfully', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const mockResponse = {
        documentId: 'doc-123',
        filename: 'test.pdf',
        size: 1024,
        uploadedAt: '2024-01-15T10:00:00Z',
        status: 'uploaded',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.uploadDocument({
        file: mockFile,
        documentType: 'invoice',
        metadata: { originalName: 'test.pdf' },
      });

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseURL}/documents/upload`,
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
    });

    it('should handle upload errors gracefully', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid file type' }),
      } as Response);

      await expect(
        client.uploadDocument({
          file: mockFile,
          documentType: 'invoice',
          metadata: { originalName: 'test.pdf' },
        })
      ).rejects.toThrow('Upload failed: Invalid file type');
    });
  });

  describe('Document Management', () => {
    it('should get documents with pagination', async () => {
      const mockResponse = {
        documents: [
          { id: 'doc-1', filename: 'invoice1.pdf', status: 'processed' },
          { id: 'doc-2', filename: 'invoice2.pdf', status: 'pending' },
        ],
        total: 2,
        hasMore: false,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.getDocuments({ limit: 10, offset: 0 });

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseURL}/documents?limit=10&offset=0`
      );
    });

    it('should get document by ID', async () => {
      const mockResponse = {
        id: 'doc-123',
        filename: 'test.pdf',
        status: 'processed',
        metadata: { originalName: 'test.pdf', size: 1024 },
        uploadedAt: '2024-01-15T10:00:00Z',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.getDocumentById('doc-123');

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseURL}/documents/doc-123`
      );
    });

    it('should delete documents', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const result = await client.deleteDocument('doc-123');

      expect(result).toEqual({ success: true });
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseURL}/documents/doc-123`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('OCR Processing', () => {
    it('should process documents with OCR', async () => {
      const mockResponse = {
        ocrId: 'ocr-123',
        status: 'processing',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.processOcr('doc-123');

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseURL}/ocr/process/doc-123`,
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should get OCR results', async () => {
      const mockResponse = {
        id: 'ocr-123',
        documentId: 'doc-123',
        extractedData: { vendor: 'Test Vendor', amount: 150.00 },
        confidence: 0.95,
        processedAt: '2024-01-15T10:30:00Z',
        status: 'completed',
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.getOcrResult('doc-123');

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseURL}/ocr/result/doc-123`
      );
    });
  });

  describe('Compliance Features', () => {
    it('should get compliance scores', async () => {
      const mockResponse = {
        id: 'score-123',
        clientId: 'client-123',
        score: 85.5,
        breakdown: {
          documentation: 90,
          recyclerQuality: 85,
          processCompliance: 80,
          timeliness: 87,
        },
        recommendations: [
          { category: 'data', suggestion: 'Improve data accuracy', impact: 'medium' },
        ],
        calculatedAt: '2024-01-15T12:00:00Z',
        period: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await client.getComplianceScore('client-123');

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        `${mockBaseURL}/compliance/score/client-123`
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        client.getDocuments({ limit: 10, offset: 0 })
      ).rejects.toThrow('Network error');
    });

    it('should handle HTTP errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      } as Response);

      await expect(
        client.getDocuments({ limit: 10, offset: 0 })
      ).rejects.toThrow('Server error');
    });
  });
}); 