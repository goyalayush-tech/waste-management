// EPR Compliance API Client
import { BaseApiClient, ApiConfig } from './baseClient';

// EPR Service Types
export interface DocumentUploadRequest {
  file: File;
  documentType: 'invoice' | 'weighbridge' | 'certificate' | 'other';
  metadata?: Record<string, any>;
}

export interface DocumentUploadResponse {
  documentId: string;
  filename: string;
  size: number;
  uploadedAt: string;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
}

export interface Document {
  id: string;
  filename: string;
  documentType: string;
  size: number;
  uploadedAt: string;
  processedAt?: string;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  metadata: Record<string, any>;
  ocrResult?: OcrResult;
  auditResult?: AuditResult;
}

export interface OcrResult {
  id: string;
  documentId: string;
  extractedData: Record<string, any>;
  confidence: number;
  processedAt: string;
  status: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
}

export interface AuditResult {
  id: string;
  documentId: string;
  clientId: string;
  auditScore: number;
  findings: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    field?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  recommendations: string[];
  complianceStatus: 'compliant' | 'non-compliant' | 'needs-review';
  auditedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface RecyclerMaster {
  id: string;
  name: string;
  gstNumber: string;
  address: string;
  contactInfo: {
    phone?: string;
    email?: string;
  };
  certifications: string[];
  riskProfile: 'low' | 'medium' | 'high';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceScore {
  id: string;
  clientId: string;
  score: number;
  breakdown: {
    documentation: number;
    recyclerQuality: number;
    processCompliance: number;
    timeliness: number;
  };
  recommendations: Array<{
    category: string;
    suggestion: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  calculatedAt: string;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface Client {
  id: string;
  name: string;
  email: string;
  companyName: string;
  subscriptionTier: 'basic' | 'premium' | 'enterprise';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface BillingRecord {
  id: string;
  clientId: string;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  billingPeriod: {
    startDate: string;
    endDate: string;
  };
  createdAt: string;
  paidAt?: string;
}

export class EprApiClient extends BaseApiClient {
  constructor(config: Omit<ApiConfig, 'baseURL'> & { baseURL?: string } = {}) {
    super({
      baseURL: config.baseURL || process.env.REACT_APP_EPR_API_URL || 'http://localhost:3001/api',
      ...config,
    });
  }

  // Document Management
  async uploadDocument(request: DocumentUploadRequest, onProgress?: (progress: number) => void): Promise<DocumentUploadResponse> {
    // Use explicit FormData to include metadata and documentType
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('documentType', request.documentType);
    if (request.metadata) {
      formData.append('metadata', JSON.stringify(request.metadata));
    }

    const config: any = {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent: ProgressEvent) => {
        if (onProgress && (progressEvent as any).total) {
          const progress = Math.round(((progressEvent as any).loaded * 100) / (progressEvent as any).total);
          onProgress(progress);
        }
      },
    };

    return this.post<DocumentUploadResponse>('/documents/upload', formData, config);
  }

  async getDocuments(params: {
    limit?: number;
    offset?: number;
    documentType?: string;
    status?: string;
    clientId?: string;
  } = {}): Promise<{
    documents: Document[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.get(`/documents?${queryParams.toString()}`);
  }

  async getDocumentById(id: string): Promise<Document> {
    return this.get<Document>(`/documents/${id}`);
  }

  async deleteDocument(id: string): Promise<{ success: boolean }> {
    return this.delete(`/documents/${id}`);
  }

  // OCR Processing
  async processOcr(documentId: string): Promise<{ ocrId: string; status: string }> {
    return this.post(`/ocr/process/${documentId}`);
  }

  async getOcrResult(documentId: string): Promise<OcrResult> {
    return this.get<OcrResult>(`/ocr/result/${documentId}`);
  }

  async getOcrStatus(documentId: string): Promise<{ status: string; progress?: number }> {
    return this.get(`/ocr/status/${documentId}`);
  }

  // Audit Engine
  async submitForAudit(documentId: string): Promise<{ auditId: string; status: string }> {
    return this.post(`/audit/submit/${documentId}`);
  }

  async getAuditResult(documentId: string): Promise<AuditResult> {
    return this.get<AuditResult>(`/audit/result/${documentId}`);
  }

  async getAuditHistory(params: {
    limit?: number;
    offset?: number;
    clientId?: string;
    complianceStatus?: string;
  } = {}): Promise<{
    audits: AuditResult[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.get(`/audit/history?${queryParams.toString()}`);
  }

  async reviewAudit(auditId: string, review: {
    approved: boolean;
    comments?: string;
    overrides?: Array<{
      field: string;
      oldValue: any;
      newValue: any;
      reason: string;
    }>;
  }): Promise<{ success: boolean }> {
    return this.post(`/audit/${auditId}/review`, review);
  }

  // Recycler Master Database
  async getRecyclers(params: {
    limit?: number;
    offset?: number;
    search?: string;
    riskProfile?: string;
    isActive?: boolean;
  } = {}): Promise<{
    recyclers: RecyclerMaster[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.get(`/recyclers?${queryParams.toString()}`);
  }

  async getRecyclerById(id: string): Promise<RecyclerMaster> {
    return this.get<RecyclerMaster>(`/recyclers/${id}`);
  }

  async validateGst(gstNumber: string): Promise<{
    isValid: boolean;
    companyName?: string;
    address?: string;
    status?: string;
  }> {
    return this.post('/recyclers/validate-gst', { gstNumber });
  }

  async updateRecyclerRisk(id: string, riskProfile: 'low' | 'medium' | 'high', reason: string): Promise<{
    success: boolean;
  }> {
    return this.patch(`/recyclers/${id}/risk`, { riskProfile, reason });
  }

  // Compliance Scoring
  async getComplianceScore(clientId: string, period?: {
    startDate: string;
    endDate: string;
  }): Promise<ComplianceScore> {
    const params = period ? `?startDate=${period.startDate}&endDate=${period.endDate}` : '';
    return this.get<ComplianceScore>(`/compliance/score/${clientId}${params}`);
  }

  async calculateComplianceScore(clientId: string, period: {
    startDate: string;
    endDate: string;
  }): Promise<ComplianceScore> {
    return this.post(`/compliance/calculate/${clientId}`, period);
  }

  async getComplianceHistory(clientId: string, limit = 12): Promise<{
    scores: ComplianceScore[];
    trend: 'improving' | 'declining' | 'stable';
  }> {
    return this.get(`/compliance/history/${clientId}?limit=${limit}`);
  }

  // Client Management
  async getClients(params: {
    limit?: number;
    offset?: number;
    search?: string;
    subscriptionTier?: string;
    isActive?: boolean;
  } = {}): Promise<{
    clients: Client[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.get(`/clients?${queryParams.toString()}`);
  }

  async getClientById(id: string): Promise<Client> {
    return this.get<Client>(`/clients/${id}`);
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    return this.patch<Client>(`/clients/${id}`, updates);
  }

  // Billing
  async getBillingRecords(clientId: string, params: {
    limit?: number;
    offset?: number;
    status?: string;
  } = {}): Promise<{
    records: BillingRecord[];
    total: number;
    hasMore: boolean;
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    return this.get(`/billing/${clientId}?${queryParams.toString()}`);
  }

  async createBillingRecord(clientId: string, record: Omit<BillingRecord, 'id' | 'clientId' | 'createdAt'>): Promise<BillingRecord> {
    return this.post<BillingRecord>(`/billing/${clientId}`, record);
  }

  // Reports
  async generateReport(type: 'audit' | 'compliance' | 'billing', params: {
    clientId?: string;
    startDate: string;
    endDate: string;
    format?: 'pdf' | 'excel';
  }): Promise<{
    reportId: string;
    downloadUrl: string;
    expiresAt: string;
  }> {
    return this.post(`/reports/generate/${type}`, params);
  }

  async getReportStatus(reportId: string): Promise<{
    status: 'pending' | 'completed' | 'failed';
    progress?: number;
    downloadUrl?: string;
    error?: string;
  }> {
    return this.get(`/reports/status/${reportId}`);
  }
}