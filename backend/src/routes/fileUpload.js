import express from 'express';
import fileUploadService from '../services/fileUploadService.js';
import { authenticate as authenticateToken } from '../middleware/auth.js';
import { 
  uploadRateLimit, 
  bulkUploadRateLimit, 
  fileUploadSecurity, 
  validateUploadRequest, 
  handleMulterError, 
  validateFileMetadata, 
  logFileUpload, 
  cleanupTempFiles,
  enhancedSecurityScan 
} from '../middleware/fileUpload.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const uploadValidation = {
  wasteSubmission: Joi.object({
    batchId: Joi.string().required(),
    location: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      address: Joi.string().optional()
    }).required(),
    wasteType: Joi.string().valid('plastic', 'metal', 'glass', 'paper', 'organic', 'other').optional(),
    estimatedQuantity: Joi.number().min(0).optional()
  }),
  
  eprDocument: Joi.object({
    documentType: Joi.string().valid('invoice', 'weighbridge', 'transport', 'certificate', 'other').required(),
    clientId: Joi.string().required(),
    recyclerName: Joi.string().optional(),
    tonnage: Joi.number().min(0).optional(),
    date: Joi.date().optional()
  })
};

// Upload waste images (before/after)
router.post('/waste/images', 
  uploadRateLimit,
  authenticateToken,
  validateUploadRequest('waste'),
  fileUploadSecurity,
  fileUploadService.getUploadMiddleware('fields'),
  handleMulterError,
  validateFileMetadata,
  enhancedSecurityScan,
  logFileUpload,
  cleanupTempFiles,
  async (req, res) => {
    try {
      // Validate request body
      const { error, value } = uploadValidation.wasteSubmission.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details
        });
      }

      const files = [];
      if (req.files.beforeImage) files.push(...req.files.beforeImage);
      if (req.files.afterImage) files.push(...req.files.afterImage);

      if (files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      // Process files for waste submission (upload to IPFS)
      const results = await fileUploadService.processUploadedFiles(files, 'waste');

      // Check if any uploads failed
      const failedUploads = results.filter(r => !r.success);
      if (failedUploads.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Some files failed to upload',
          results,
          failedUploads
        });
      }

      res.json({
        success: true,
        message: 'Files uploaded successfully',
        data: {
          batchId: value.batchId,
          location: value.location,
          files: results,
          uploadedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Waste image upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Upload EPR documents
router.post('/epr/documents',
  bulkUploadRateLimit,
  authenticateToken,
  validateUploadRequest('epr'),
  fileUploadSecurity,
  fileUploadService.getUploadMiddleware('multiple', 'documents'),
  handleMulterError,
  validateFileMetadata,
  enhancedSecurityScan,
  logFileUpload,
  cleanupTempFiles,
  async (req, res) => {
    try {
      // Validate request body
      const { error, value } = uploadValidation.eprDocument.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      // Process files for EPR documents (upload to S3)
      const results = await fileUploadService.processUploadedFiles(req.files, 'epr');

      // Check if any uploads failed
      const failedUploads = results.filter(r => !r.success);
      if (failedUploads.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Some files failed to upload',
          results,
          failedUploads
        });
      }

      res.json({
        success: true,
        message: 'Documents uploaded successfully',
        data: {
          documentType: value.documentType,
          clientId: value.clientId,
          files: results,
          uploadedAt: new Date()
        }
      });

    } catch (error) {
      console.error('EPR document upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Single file upload endpoint (generic)
router.post('/single',
  uploadRateLimit,
  authenticateToken,
  fileUploadSecurity,
  fileUploadService.getUploadMiddleware('single', 'file'),
  handleMulterError,
  enhancedSecurityScan,
  logFileUpload,
  cleanupTempFiles,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const uploadType = req.body.uploadType || 'waste';
      const results = await fileUploadService.processUploadedFiles([req.file], uploadType);

      if (!results[0].success) {
        return res.status(400).json({
          success: false,
          message: 'File upload failed',
          error: results[0].error
        });
      }

      res.json({
        success: true,
        message: 'File uploaded successfully',
        data: results[0]
      });

    } catch (error) {
      console.error('Single file upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Get secure download URL for S3 files
router.get('/download/:s3Key',
  authenticateToken,
  async (req, res) => {
    try {
      const { s3Key } = req.params;
      const expiresIn = parseInt(req.query.expires) || 3600; // 1 hour default

      // Decode the s3Key if it was URL encoded
      const decodedKey = decodeURIComponent(s3Key);

      const downloadUrl = await fileUploadService.generateSecureDownloadUrl(decodedKey, expiresIn);

      res.json({
        success: true,
        downloadUrl,
        expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000)
      });

    } catch (error) {
      console.error('Download URL generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate download URL',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Check IPFS connection
    let ipfsStatus = 'disconnected';
    try {
      await fileUploadService.ipfs.id();
      ipfsStatus = 'connected';
    } catch (error) {
      console.warn('IPFS connection check failed:', error.message);
    }

    // Check S3 connection
    let s3Status = 'disconnected';
    try {
      await fileUploadService.s3.headBucket({ Bucket: fileUploadService.bucketName }).promise();
      s3Status = 'connected';
    } catch (error) {
      console.warn('S3 connection check failed:', error.message);
    }

    res.json({
      success: true,
      services: {
        ipfs: ipfsStatus,
        s3: s3Status
      },
      timestamp: new Date()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

export default router;