/**
 * Documents API Routes - Minimal stubs for P0 milestone
 * Handles document upload, processing, and management
 */

import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

// Simple antivirus scan stub (replace with ClamAV / external service later)
async function scanFileForViruses(filePath) { // eslint-disable-line no-unused-vars
  // Simulate async scan delay
  await new Promise(r => setTimeout(r, 50));
  // Always clean in stub
  return { clean: true, engine: 'stub-av', scannedAt: new Date().toISOString() };
}

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'));
    }
  },
});

// In-memory storage for demo (replace with database in production)
const documents = new Map();
const ocrResults = new Map();

/**
 * POST /api/documents/upload
 * Upload a document
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const documentId = uuidv4();
    // AV scan stub
    const scan = await scanFileForViruses(req.file.path);

    const document = {
      id: documentId,
      filename: req.file.originalname,
      storedFilename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      documentType: req.body.documentType || 'other',
      uploadedAt: new Date().toISOString(),
  status: 'uploaded',
  metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {},
      scan,
    };

    documents.set(documentId, document);

    res.status(201).json({
      success: true,
      data: {
        documentId: document.id,
        filename: document.filename,
        size: document.size,
        uploadedAt: document.uploadedAt,
        status: document.status,
        scan: document.scan,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message,
    });
  }
});

/**
 * GET /api/documents
 * Get list of documents
 */
router.get('/', (req, res) => {
  try {
    const { limit = 50, offset = 0, documentType, status } = req.query;
    
    let documentList = Array.from(documents.values());
    
    // Apply filters
    if (documentType) {
      documentList = documentList.filter(doc => doc.documentType === documentType);
    }
    if (status) {
      documentList = documentList.filter(doc => doc.status === status);
    }
    
    // Apply pagination
    const total = documentList.length;
    const paginatedDocs = documentList
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
      .map(doc => ({
        id: doc.id,
        filename: doc.filename,
        documentType: doc.documentType,
        size: doc.size,
        uploadedAt: doc.uploadedAt,
        status: doc.status,
        metadata: doc.metadata,
      }));

    res.json({
      success: true,
      data: {
        documents: paginatedDocs,
        total,
        hasMore: parseInt(offset) + parseInt(limit) < total,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents',
      error: error.message,
    });
  }
});

/**
 * GET /api/documents/:id
 * Get document by ID
 */
router.get('/:id', (req, res) => {
  try {
    const document = documents.get(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve document',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/documents/:id
 * Update document metadata or status
 */
router.patch('/:id', (req, res) => {
  try {
    const document = documents.get(req.params.id);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const { status, metadata } = req.body || {};
    if (status) document.status = status;
    if (metadata && typeof metadata === 'object') {
      document.metadata = { ...document.metadata, ...metadata };
    }
    document.updatedAt = new Date().toISOString();
    documents.set(document.id, document);

    res.json({ success: true, data: document });
  } catch (error) {
  // eslint-disable-next-line no-console
  console.error('Update document error:', error);
    res.status(500).json({ success: false, message: 'Failed to update document', error: error.message });
  }
});

/**
 * GET /api/documents/:id/ocr
 * Convenience endpoint returning OCR (status + result if available)
 */
router.get('/:id/ocr', (req, res) => {
  try {
    const { id } = req.params;
    const result = ocrResults.get(id);
    if (!result) {
      return res.json({ success: true, data: { status: 'pending' } });
    }
    res.json({ success: true, data: { status: 'completed', result } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get OCR info', error: error.message });
  }
});

/**
 * DELETE /api/documents/:id
 * Delete document
 */
router.delete('/:id', async (req, res) => {
  try {
    const document = documents.get(req.params.id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Delete file from filesystem
    try {
      const filePath = path.join(process.cwd(), 'uploads', 'documents', document.storedFilename);
      await fs.unlink(filePath);
    } catch (fileError) {
      // eslint-disable-next-line no-console
      console.warn('Failed to delete file:', fileError.message);
    }

    // Remove from memory
    documents.delete(req.params.id);
    ocrResults.delete(req.params.id);

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message,
    });
  }
});

export default router;