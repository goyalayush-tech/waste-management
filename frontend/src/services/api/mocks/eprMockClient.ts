// EPR Mock Client - provides realistic mock data for EPR API endpoints
import { 
  EprApiClient, 
  DocumentUploadRequest, 
  DocumentUploadResponse, 
  Document, 
  OcrResult, 
  AuditResult, 
  RecyclerMaster, 
  ComplianceScore, 
  Client, 
  BillingRecord 
} from '../eprClient';

export class EprMockClient extends EprApiClient {
  private documents: Document[] = [];
  private ocrResults: Map<string, OcrResult> = new Map();
  private auditResults: Map<string, AuditResult> = new Map();
  private clients: Client[] = [];
  private recyclers: RecyclerMaster[] = [];
  private complianceScores: ComplianceScore[] = [];
  private billingRecords: BillingRecord[] = [];

  constructor() {
    super({ baseURL: 'mock://epr' });
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock clients
    this.clients = [
      {
        id: 'client-1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        companyName: 'Green Solutions Pvt Ltd',
        subscriptionTier: 'premium',
        isActive: true,
        createdAt: '2024-01-15T00:00:00Z',
        lastLoginAt: '2024-08-24T08:00:00Z',
      },
      {
        id: 'client-2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        companyName: 'EcoWaste Industries',
        subscriptionTier: 'enterprise',
        isActive: true,
        createdAt: '2024-02-01T00:00:00Z',
        lastLoginAt: '2024-08-23T14:30:00Z',
      },
    ];

    // Mock recyclers
    this.recyclers = [
      {
        id: 'recycler-1',
        name: 'Delhi Recycling Hub',
        gstNumber: '07AABCU9603R1ZX',
        address: 'Sector 15, Noida, Uttar Pradesh 201301',
        contactInfo: { phone: '+91-9876543210', email: 'contact@delhirecycling.com' },
        certifications: ['ISO 14001', 'CPCB Authorized'],
        riskProfile: 'low',
        isActive: true,
        createdAt: '2023-06-01T00:00:00Z',
        updatedAt: '2024-08-20T00:00:00Z',
      },
      {
        id: 'recycler-2',
        name: 'Green Earth Recyclers',
        gstNumber: '09AABCU9603R1ZY',
        address: 'Gurgaon Industrial Area, Haryana 122001',
        contactInfo: { phone: '+91-9876543211', email: 'info@greenearth.com' },
        certifications: ['ISO 9001', 'CPCB Authorized'],
        riskProfile: 'medium',
        isActive: true,
        createdAt: '2023-08-15T00:00:00Z',
        updatedAt: '2024-08-22T00:00:00Z',
      },
    ];

    // Mock documents
    this.documents = [
      {
        id: 'doc-1',
        filename: 'invoice-001.pdf',
        documentType: 'invoice',
        size: 256789,
        uploadedAt: '2024-08-20T10:30:00Z',
        processedAt: '2024-08-20T10:35:00Z',
        status: 'processed',
        metadata: { clientId: 'client-1', recyclerGst: '07AABCU9603R1ZX' },
      },
      {
        id: 'doc-2',
        filename: 'weighbridge-002.pdf',
        documentType: 'weighbridge',
        size: 145632,
        uploadedAt: '2024-08-21T14:15:00Z',
        processedAt: '2024-08-21T14:20:00Z',
        status: 'processed',
        metadata: { clientId: 'client-1', vehicleNumber: 'DL-01-AB-1234' },
      },
    ];

    // Mock OCR results
    this.ocrResults.set('doc-1', {
      id: 'ocr-1',
      documentId: 'doc-1',
      extractedData: {
        invoiceNumber: 'INV-2024-001',
        invoiceDate: '2024-08-15',
        supplierGst: '07AABCU9603R1ZX',
        supplierName: 'Delhi Recycling Hub',
        totalAmount: 25000,
        items: [
          { description: 'Plastic Waste - PET', quantity: 500, unit: 'kg', rate: 50 }
        ]
      },
      confidence: 0.95,
      processedAt: '2024-08-20T10:35:00Z',
      status: 'completed',
    });

    this.ocrResults.set('doc-2', {
      id: 'ocr-2',
      documentId: 'doc-2',
      extractedData: {
        vehicleNumber: 'DL-01-AB-1234',
        dateTime: '2024-08-21T09:00:00Z',
        grossWeight: 5000,
        tareWeight: 2000,
        netWeight: 3000,
        materialType: 'Plastic Waste'
      },
      confidence: 0.88,
      processedAt: '2024-08-21T14:20:00Z',
      status: 'completed',
    });

    // Mock compliance scores
    this.complianceScores = [
      {
        id: 'score-1',
        clientId: 'client-1',
        score: 85,
        breakdown: {
          documentation: 90,
          recyclerQuality: 85,
          processCompliance: 80,
          timeliness: 85,
        },
        recommendations: [
          {
            category: 'Documentation',
            suggestion: 'Ensure all invoices have proper GST details',
            impact: 'medium',
          },
          {
            category: 'Process',
            suggestion: 'Improve submission timeline for better compliance',
            impact: 'low',
          },
        ],
        calculatedAt: '2024-08-20T00:00:00Z',
        period: {
          startDate: '2024-08-01',
          endDate: '2024-08-31',
        },
      },
    ];
  }

  // Override API methods with mock implementations
  async uploadDocument(request: DocumentUploadRequest, onProgress?: (progress: number) => void): Promise<DocumentUploadResponse> {
    // Simulate upload progress
    if (onProgress) {
      const steps = [10, 30, 50, 70, 90, 100];
      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 100));
        onProgress(step);
      }
    }

    const mockDoc: DocumentUploadResponse = {
      documentId: `doc-${Date.now()}`,
      filename: request.file.name,
      size: request.file.size,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
    };

    // Add to documents list
    this.documents.push({
      ...mockDoc,
      id: mockDoc.documentId,
      documentType: request.documentType,
      metadata: request.metadata || {},
    });

    return mockDoc;
  }

  async getDocuments(params = {}): Promise<{
    documents: Document[];
    total: number;
    hasMore: boolean;
  }> {
    const { limit = 10, offset = 0 } = params;
    const startIndex = Number(offset);
    const endIndex = startIndex + Number(limit);
    
    return {
      documents: this.documents.slice(startIndex, endIndex),
      total: this.documents.length,
      hasMore: endIndex < this.documents.length,
    };
  }

  async getDocumentById(id: string): Promise<Document> {
    const doc = this.documents.find(d => d.id === id);
    if (!doc) {
      throw new Error(`Document ${id} not found`);
    }
    
    // Attach OCR and audit results if available
    const ocrResult = this.ocrResults.get(id);
    const auditResult = this.auditResults.get(id);
    
    return {
      ...doc,
      ocrResult,
      auditResult,
    };
  }

  async deleteDocument(id: string): Promise<{ success: boolean }> {
    const index = this.documents.findIndex(d => d.id === id);
    if (index === -1) {
      throw new Error(`Document ${id} not found`);
    }
    
    this.documents.splice(index, 1);
    this.ocrResults.delete(id);
    this.auditResults.delete(id);
    
    return { success: true };
  }

  async processOcr(documentId: string): Promise<{ ocrId: string; status: string }> {
    // Simulate OCR processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const ocrId = `ocr-${Date.now()}`;
    
    // Create mock OCR result
    const mockOcrResult: OcrResult = {
      id: ocrId,
      documentId,
      extractedData: {
        mockField: 'Mock extracted text',
        confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
      },
      confidence: Math.random() * 0.3 + 0.7,
      processedAt: new Date().toISOString(),
      status: 'completed',
    };
    
    this.ocrResults.set(documentId, mockOcrResult);
    
    return { ocrId, status: 'processing' };
  }

  async getOcrResult(documentId: string): Promise<OcrResult> {
    const result = this.ocrResults.get(documentId);
    if (!result) {
      throw new Error(`OCR result for document ${documentId} not found`);
    }
    return result;
  }

  async getOcrStatus(documentId: string): Promise<{ status: string; progress?: number }> {
    const result = this.ocrResults.get(documentId);
    return {
      status: result?.status || 'pending',
      progress: result?.status === 'completed' ? 100 : Math.floor(Math.random() * 90) + 10,
    };
  }

  async getRecyclers(params = {}): Promise<{
    recyclers: RecyclerMaster[];
    total: number;
    hasMore: boolean;
  }> {
    const { limit = 10, offset = 0 } = params;
    const startIndex = Number(offset);
    const endIndex = startIndex + Number(limit);
    
    return {
      recyclers: this.recyclers.slice(startIndex, endIndex),
      total: this.recyclers.length,
      hasMore: endIndex < this.recyclers.length,
    };
  }

  async getComplianceScore(clientId: string): Promise<ComplianceScore> {
    const score = this.complianceScores.find(s => s.clientId === clientId);
    if (!score) {
      // Generate a mock score
      return {
        id: `score-${Date.now()}`,
        clientId,
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        breakdown: {
          documentation: Math.floor(Math.random() * 30) + 70,
          recyclerQuality: Math.floor(Math.random() * 30) + 70,
          processCompliance: Math.floor(Math.random() * 30) + 70,
          timeliness: Math.floor(Math.random() * 30) + 70,
        },
        recommendations: [
          {
            category: 'Mock Category',
            suggestion: 'Mock recommendation for improvement',
            impact: 'medium',
          },
        ],
        calculatedAt: new Date().toISOString(),
        period: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        },
      };
    }
    return score;
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}