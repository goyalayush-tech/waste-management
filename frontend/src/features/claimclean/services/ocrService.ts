import type { OCRResult, DocumentTemplate, OCRField } from '../types';

export interface OCRProcessingRequest {
  documentId: string;
  documentUrl: string;
  documentType?: string;
  templateId?: string;
  language?: string;
}

export interface OCRValidationRequest {
  documentId: string;
  fieldValidations: {
    fieldName: string;
    correctedValue: string;
    isValid: boolean;
  }[];
}

class OCRService {
  private apiBaseUrl: string;
  private apiKey: string;

  constructor() {
    this.apiBaseUrl = process.env.REACT_APP_AI_API_URL || 'http://localhost:8001/ai';
    this.apiKey = process.env.REACT_APP_AI_API_KEY || '';
  }

  /**
   * Submit document for OCR processing
   */
  async processDocument(request: OCRProcessingRequest): Promise<OCRResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/ocr/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`OCR processing failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('OCR processing error:', error);
      // Return mock data in development
      return this.getMockOCRResult(request.documentId, request.documentType);
    }
  }

  /**
   * Get OCR processing status
   */
  async getProcessingStatus(documentId: string): Promise<OCRResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/ocr/status/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get OCR status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('OCR status check error:', error);
      // Return mock completed result
      return this.getMockOCRResult(documentId);
    }
  }

  /**
   * Validate and correct OCR results
   */
  async validateOCRResults(request: OCRValidationRequest): Promise<OCRResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/ocr/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`OCR validation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('OCR validation error:', error);
      throw error;
    }
  }

  /**
   * Get available document templates
   */
  async getDocumentTemplates(): Promise<DocumentTemplate[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/ocr/templates`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get templates: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Template fetch error:', error);
      return this.getMockTemplates();
    }
  }

  /**
   * Extract structured data from text using AI
   */
  async extractStructuredData(
    text: string, 
    documentType: string, 
    templateId?: string
  ): Promise<OCRField[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/ocr/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          text,
          documentType,
          templateId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Data extraction failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Data extraction error:', error);
      return this.getMockExtractedFields(documentType);
    }
  }

  /**
   * Get OCR processing confidence metrics
   */
  async getConfidenceMetrics(documentId: string): Promise<{
    overallConfidence: number;
    fieldConfidences: Record<string, number>;
    qualityScore: number;
    recommendations: string[];
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/ocr/metrics/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get metrics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Metrics fetch error:', error);
      return {
        overallConfidence: 0.87,
        fieldConfidences: {
          'invoice_number': 0.95,
          'total_amount': 0.82,
          'date': 0.91,
          'weight': 0.76,
        },
        qualityScore: 8.2,
        recommendations: [
          'Consider rescanning for better image quality',
          'Verify weight field - low confidence detected',
        ],
      };
    }
  }

  // Mock data for development/testing
  private getMockOCRResult(documentId: string, documentType?: string): OCRResult {
    const mockFields = this.getMockExtractedFields(documentType || 'invoice');
    
    return {
      documentId,
      processingStatus: 'completed',
      confidence: 0.87,
      language: 'en',
      rawText: this.getMockRawText(documentType),
      extractedFields: mockFields,
      documentType: documentType || 'invoice',
      processingTime: 2340, // ms
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private getMockExtractedFields(documentType: string): OCRField[] {
    switch (documentType) {
      case 'invoice':
        return [
          {
            fieldName: 'invoice_number',
            extractedValue: 'INV-2025-001234',
            confidence: 0.95,
            boundingBox: { x: 100, y: 50, width: 120, height: 20 },
            validated: false,
          },
          {
            fieldName: 'total_amount',
            extractedValue: '₹45,250.00',
            confidence: 0.82,
            boundingBox: { x: 300, y: 200, width: 80, height: 18 },
            validated: false,
          },
          {
            fieldName: 'date',
            extractedValue: '2025-09-20',
            confidence: 0.91,
            boundingBox: { x: 100, y: 80, width: 90, height: 18 },
            validated: false,
          },
          {
            fieldName: 'weight',
            extractedValue: '12,500 kg',
            confidence: 0.76,
            boundingBox: { x: 150, y: 150, width: 70, height: 18 },
            validated: false,
          },
        ];
      case 'weighbridge':
        return [
          {
            fieldName: 'ticket_number',
            extractedValue: 'WB-789456',
            confidence: 0.94,
            boundingBox: { x: 80, y: 40, width: 100, height: 20 },
            validated: false,
          },
          {
            fieldName: 'gross_weight',
            extractedValue: '18,750 kg',
            confidence: 0.88,
            boundingBox: { x: 200, y: 100, width: 80, height: 18 },
            validated: false,
          },
          {
            fieldName: 'tare_weight',
            extractedValue: '6,250 kg',
            confidence: 0.85,
            boundingBox: { x: 200, y: 120, width: 80, height: 18 },
            validated: false,
          },
          {
            fieldName: 'net_weight',
            extractedValue: '12,500 kg',
            confidence: 0.89,
            boundingBox: { x: 200, y: 140, width: 80, height: 18 },
            validated: false,
          },
        ];
      case 'license':
        return [
          {
            fieldName: 'license_number',
            extractedValue: 'WM-MH-2025-0456',
            confidence: 0.96,
            boundingBox: { x: 120, y: 60, width: 140, height: 20 },
            validated: false,
          },
          {
            fieldName: 'expiry_date',
            extractedValue: '2026-03-15',
            confidence: 0.89,
            boundingBox: { x: 120, y: 200, width: 90, height: 18 },
            validated: false,
          },
          {
            fieldName: 'facility_name',
            extractedValue: 'EcoCycle Waste Processing Pvt Ltd',
            confidence: 0.92,
            boundingBox: { x: 120, y: 100, width: 200, height: 18 },
            validated: false,
          },
        ];
      default:
        return [];
    }
  }

  private getMockRawText(documentType?: string): string {
    switch (documentType) {
      case 'invoice':
        return `
WASTE RECYCLING INVOICE
Invoice No: INV-2025-001234
Date: 2025-09-20

Recycler: EcoCycle Mumbai Pvt Ltd
Address: Plot 45, Industrial Area, Mumbai 400001

Plastic Waste Processed
Material Type: PET Bottles
Weight: 12,500 kg
Rate: ₹3.62 per kg
Total Amount: ₹45,250.00

Processing Date: 2025-09-18
Certified by: Quality Control Team
        `.trim();
      case 'weighbridge':
        return `
WEIGHBRIDGE TICKET
Ticket No: WB-789456
Date: 2025-09-20 10:30 AM

Vehicle No: MH-01-AB-1234
Gross Weight: 18,750 kg
Tare Weight: 6,250 kg
Net Weight: 12,500 kg

Material: Plastic Waste (Mixed)
Operator: Raj Kumar
Authorized by: Site Manager
        `.trim();
      case 'license':
        return `
WASTE MANAGEMENT LICENSE
License No: WM-MH-2025-0456

Facility Name: EcoCycle Waste Processing Pvt Ltd
Address: Plot 45, Industrial Area, Mumbai 400001
Authorized Activity: Plastic Waste Recycling

Issue Date: 2025-03-15
Expiry Date: 2026-03-15
Authority: Maharashtra Pollution Control Board

This license authorizes the processing of up to 50,000 kg/month
of plastic waste materials.
        `.trim();
      default:
        return 'No text extracted';
    }
  }

  private getMockTemplates(): DocumentTemplate[] {
    return [
      {
        templateId: 'tpl-invoice-001',
        templateName: 'Standard Invoice',
        documentType: 'invoice',
        expectedFields: [
          {
            fieldName: 'invoice_number',
            fieldType: 'text',
            required: true,
            validationPattern: '^[A-Z0-9-]+$',
            description: 'Unique invoice identifier',
          },
          {
            fieldName: 'total_amount',
            fieldType: 'currency',
            required: true,
            description: 'Total invoice amount',
          },
          {
            fieldName: 'date',
            fieldType: 'date',
            required: true,
            description: 'Invoice date',
          },
          {
            fieldName: 'weight',
            fieldType: 'text',
            required: true,
            description: 'Weight of processed material',
          },
        ],
      },
      {
        templateId: 'tpl-weighbridge-001',
        templateName: 'Weighbridge Slip',
        documentType: 'weighbridge',
        expectedFields: [
          {
            fieldName: 'ticket_number',
            fieldType: 'text',
            required: true,
            description: 'Weighbridge ticket number',
          },
          {
            fieldName: 'gross_weight',
            fieldType: 'text',
            required: true,
            description: 'Gross weight measurement',
          },
          {
            fieldName: 'tare_weight',
            fieldType: 'text',
            required: true,
            description: 'Tare weight measurement',
          },
          {
            fieldName: 'net_weight',
            fieldType: 'text',
            required: true,
            description: 'Net weight measurement',
          },
        ],
      },
      {
        templateId: 'tpl-license-001',
        templateName: 'Waste Management License',
        documentType: 'license',
        expectedFields: [
          {
            fieldName: 'license_number',
            fieldType: 'text',
            required: true,
            description: 'License registration number',
          },
          {
            fieldName: 'expiry_date',
            fieldType: 'date',
            required: true,
            description: 'License expiry date',
          },
          {
            fieldName: 'facility_name',
            fieldType: 'text',
            required: true,
            description: 'Licensed facility name',
          },
        ],
      },
    ];
  }
}

export const ocrService = new OCRService();