export type ClaimStatus = 'submitted' | 'auditing' | 'verified' | 'rejected';

export interface AuditIssue {
  code: string;
  severity: 'low' | 'med' | 'high';
  message: string;
}

export interface ClaimAudit {
  score?: number;
  issues?: AuditIssue[];
  reportJsonHash?: string;
  reportUrl?: string | null;
}

// OCR-related types
export interface OCRField {
  fieldName: string;
  extractedValue: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  validated?: boolean;
  correctedValue?: string;
}

export interface OCRResult {
  documentId: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  confidence: number;
  language: string;
  rawText: string;
  extractedFields: OCRField[];
  documentType?: string;
  processingTime?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentTemplate {
  templateId: string;
  templateName: string;
  documentType: 'invoice' | 'weighbridge' | 'license' | 'certificate' | 'other';
  expectedFields: {
    fieldName: string;
    fieldType: 'text' | 'number' | 'date' | 'currency' | 'address';
    required: boolean;
    validationPattern?: string;
    description: string;
  }[];
}

export interface Claim {
  _id: string;
  brandId: string;
  recyclerId: string;
  facilityId: string;
  period: {
    from: string;
    to: string;
  };
  claimedWeightKg: number;
  status: ClaimStatus;
  audit?: ClaimAudit;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimDocument {
  _id: string;
  claimId: string;
  docType: 'invoice' | 'weighbridge' | 'photo' | 'gps' | 'license' | 'other';
  storageUrl: string;
  sha256: string;
  phash?: string;
  mimeType: string;
  meta?: Record<string, unknown>;
  ocrResult?: OCRResult; // OCR integration
  createdAt: string;
}

export interface AuditTask {
  _id: string;
  claimId: string;
  type: 'ai' | 'field';
  status: 'queued' | 'running' | 'complete' | 'failed';
  result?: {
    issues?: AuditIssue[];
    score?: number;
    details?: unknown;
  };
  assignedTo?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditRunResponse {
  score: number;
  issues: AuditIssue[];
  report: Record<string, unknown>;
  reportHash: string;
}
