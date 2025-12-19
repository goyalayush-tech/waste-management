import { v4 as uuidv4 } from 'uuid';

// In-memory stores (replace with persistent storage later)
const ocrJobs = new Map(); // key: ocrId
const jobsByDocument = new Map(); // key: documentId -> ocrId
const ocrResults = new Map(); // key: documentId -> result

// Mock OCR processing function (same logic as original route)
// eslint-disable-next-line no-unused-vars
const mockOcrProcessing = async (documentId) => {
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  const mockResults = {
    invoice: {
      documentType: 'invoice',
      extractedData: {
        invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
        date: new Date().toISOString().split('T')[0],
        vendorName: 'Green Recycling Solutions Pvt Ltd',
        vendorGST: '27AABCU9603R1ZX',
        totalAmount: (Math.random() * 50000 + 10000).toFixed(2),
        items: [
          {
            description: 'Plastic Waste Collection',
            quantity: Math.floor(Math.random() * 1000 + 100),
            unit: 'kg',
            rate: (Math.random() * 50 + 10).toFixed(2),
            amount: (Math.random() * 25000 + 5000).toFixed(2),
          },
        ],
        taxDetails: { cgst: '9%', sgst: '9%', igst: '0%' },
      },
      confidence: 0.85 + Math.random() * 0.14,
    },
    weighbridge: {
      documentType: 'weighbridge',
      extractedData: {
        ticketNumber: `WB-${Math.floor(Math.random() * 10000)}`,
        date: new Date().toISOString().split('T')[0],
        vehicleNumber: `MH12AB${Math.floor(Math.random() * 9000 + 1000)}`,
        grossWeight: Math.floor(Math.random() * 5000 + 2000),
        tareWeight: Math.floor(Math.random() * 1000 + 500),
        netWeight: 0,
        materialType: 'Mixed Plastic Waste',
        driverName: 'Rajesh Kumar',
        destination: 'Recycling Facility - Zone A',
      },
      confidence: 0.88 + Math.random() * 0.11,
    },
    certificate: {
      documentType: 'certificate',
      extractedData: {
        certificateNumber: `CERT-${Math.floor(Math.random() * 10000)}`,
        issuedDate: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        issuingAuthority: 'Central Pollution Control Board',
        facilityName: 'EcoWaste Processing Unit',
        certificationStandard: 'ISO 14001:2015',
        scope: 'Waste Management and Recycling Operations',
      },
      confidence: 0.92 + Math.random() * 0.07,
    },
  };
  const documentTypes = Object.keys(mockResults);
  const randomType = documentTypes[Math.floor(Math.random() * documentTypes.length)];
  const result = mockResults[randomType];
  if (result.documentType === 'weighbridge') {
    result.extractedData.netWeight = result.extractedData.grossWeight - result.extractedData.tareWeight;
  }
  return result;
};

async function processOcrAsync(ocrId, documentId) {
  try {
    const job = ocrJobs.get(ocrId);
    if (!job) return;
    job.status = 'processing';
    job.progress = 25;
    const result = await mockOcrProcessing(documentId);
    job.progress = 75;
    await new Promise(resolve => setTimeout(resolve, 1000));
    job.status = 'completed';
    job.progress = 100;
    job.completedAt = new Date().toISOString();
    const ocrResult = {
      id: uuidv4(),
      documentId,
      extractedData: result.extractedData,
      confidence: result.confidence,
      processedAt: new Date().toISOString(),
      status: 'completed',
    };
    ocrResults.set(documentId, ocrResult);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('OCR processing failed:', error);
    const job = ocrJobs.get(ocrId);
    if (job) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date().toISOString();
    }
  }
}

export function startOcr(documentId) {
  // Return existing job if already started
  const existingOcrId = jobsByDocument.get(documentId);
  if (existingOcrId) {
    return ocrJobs.get(existingOcrId);
  }
  const ocrId = uuidv4();
  const job = {
    id: ocrId,
    documentId,
    status: 'pending',
    startedAt: new Date().toISOString(),
    progress: 0,
  };
  ocrJobs.set(ocrId, job);
  jobsByDocument.set(documentId, ocrId);
  processOcrAsync(ocrId, documentId);
  return job;
}

export function getJobByDocumentId(documentId) {
  const id = jobsByDocument.get(documentId);
  if (!id) return null;
  return ocrJobs.get(id) || null;
}

export function getResult(documentId) {
  return ocrResults.get(documentId) || null;
}

export function getStatus(documentId) {
  const job = getJobByDocumentId(documentId);
  if (!job) return null;
  return {
    status: job.status,
    progress: job.progress,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    error: job.error,
  };
}

export default {
  startOcr,
  getJobByDocumentId,
  getResult,
  getStatus,
};
