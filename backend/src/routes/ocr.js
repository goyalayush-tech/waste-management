/**
 * OCR Processing API Routes - Minimal stubs for P0 milestone
 * Handles OCR processing and results
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// In-memory storage for demo (replace with database in production)
const ocrJobs = new Map();
const ocrResults = new Map();

// Mock OCR processing function
const mockOcrProcessing = async (documentId) => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  // Generate mock OCR result based on document type
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
            amount: (Math.random() * 25000 + 5000).toFixed(2)
          }
        ],
        taxDetails: {
          cgst: '9%',
          sgst: '9%',
          igst: '0%'
        }
      },
      confidence: 0.85 + Math.random() * 0.14
    },
    weighbridge: {
      documentType: 'weighbridge',
      extractedData: {
        ticketNumber: `WB-${Math.floor(Math.random() * 10000)}`,
        date: new Date().toISOString().split('T')[0],
        vehicleNumber: `MH12AB${Math.floor(Math.random() * 9000 + 1000)}`,
        grossWeight: Math.floor(Math.random() * 5000 + 2000),
        tareWeight: Math.floor(Math.random() * 1000 + 500),
        netWeight: 0, // Will be calculated
        materialType: 'Mixed Plastic Waste',
        driverName: 'Rajesh Kumar',
        destination: 'Recycling Facility - Zone A'
      },
      confidence: 0.88 + Math.random() * 0.11
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
        scope: 'Waste Management and Recycling Operations'
      },
      confidence: 0.92 + Math.random() * 0.07
    }
  };

  const documentTypes = Object.keys(mockResults);
  const randomType = documentTypes[Math.floor(Math.random() * documentTypes.length)];
  const result = mockResults[randomType];

  // Calculate net weight for weighbridge
  if (result.documentType === 'weighbridge') {
    result.extractedData.netWeight = result.extractedData.grossWeight - result.extractedData.tareWeight;
  }

  return result;
};

/**
 * POST /api/ocr/process/:documentId
 * Start OCR processing for a document
 */
router.post('/process/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const ocrId = uuidv4();

    // Create OCR job
    const job = {
      id: ocrId,
      documentId,
      status: 'pending',
      startedAt: new Date().toISOString(),
      progress: 0
    };

    ocrJobs.set(ocrId, job);

    // Start async processing
    processOcrAsync(ocrId, documentId);

    res.status(202).json({
      success: true,
      data: {
        ocrId,
        status: 'pending',
        message: 'OCR processing started'
      }
    });
  } catch (error) {
    console.error('OCR process error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start OCR processing',
      error: error.message
    });
  }
});

/**
 * GET /api/ocr/status/:documentId
 * Get OCR processing status
 */
router.get('/status/:documentId', (req, res) => {
  try {
    const { documentId } = req.params;
    
    // Find job by document ID
    const job = Array.from(ocrJobs.values()).find(j => j.documentId === documentId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'OCR job not found'
      });
    }

    res.json({
      success: true,
      data: {
        status: job.status,
        progress: job.progress,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error
      }
    });
  } catch (error) {
    console.error('OCR status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get OCR status',
      error: error.message
    });
  }
});

/**
 * GET /api/ocr/result/:documentId
 * Get OCR processing result
 */
router.get('/result/:documentId', (req, res) => {
  try {
    const { documentId } = req.params;
    const result = ocrResults.get(documentId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'OCR result not found'
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('OCR result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get OCR result',
      error: error.message
    });
  }
});

// Async OCR processing function
const processOcrAsync = async (ocrId, documentId) => {
  try {
    const job = ocrJobs.get(ocrId);
    if (!job) return;

    // Update progress
    job.status = 'processing';
    job.progress = 25;

    // Simulate OCR processing
    const result = await mockOcrProcessing(documentId);
    
    // Update progress
    job.progress = 75;
    
    // Simulate final processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Complete job
    job.status = 'completed';
    job.progress = 100;
    job.completedAt = new Date().toISOString();

    // Store result
    const ocrResult = {
      id: uuidv4(),
      documentId,
      extractedData: result.extractedData,
      confidence: result.confidence,
      processedAt: new Date().toISOString(),
      status: 'completed'
    };

    ocrResults.set(documentId, ocrResult);

  } catch (error) {
    console.error('OCR processing failed:', error);
    
    const job = ocrJobs.get(ocrId);
    if (job) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date().toISOString();
    }
  }
};

export default router;