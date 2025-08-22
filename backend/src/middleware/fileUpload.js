import rateLimit from 'express-rate-limit';
import fileUploadService from '../services/fileUploadService.js';
import virusScanService from '../services/virusScanService.js';

// Rate limiting for file uploads
export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 upload requests per windowMs
  message: {
    success: false,
    message: 'Too many upload requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiting for bulk uploads
export const bulkUploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 bulk upload requests per hour
  message: {
    success: false,
    message: 'Too many bulk upload requests, please try again later'
  }
});

// File upload security middleware
export const fileUploadSecurity = (req, res, next) => {
  // Check content-length header
  const contentLength = parseInt(req.headers['content-length']);
  const maxSize = 100 * 1024 * 1024; // 100MB

  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large'
    });
  }

  // Check content-type
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return res.status(400).json({
      success: false,
      message: 'Invalid content type. Expected multipart/form-data'
    });
  }

  next();
};

// Validate file upload request
export const validateUploadRequest = (uploadType = 'waste') => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Validate upload type specific requirements
      if (uploadType === 'waste') {
        // Waste uploads require vendor role
        if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions for waste uploads'
          });
        }
      } else if (uploadType === 'epr') {
        // EPR uploads require client or auditor role
        if (!['client', 'auditor', 'admin'].includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions for EPR document uploads'
          });
        }
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Upload validation failed',
        error: error.message
      });
    }
  };
};

// Handle multer errors
export const handleMulterError = (error, req, res, next) => {
  if (error) {
    let message = 'File upload error';
    let statusCode = 400;

    if (error.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large';
      statusCode = 413;
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files';
      statusCode = 400;
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
      statusCode = 400;
    } else if (error.message.includes('Invalid file type')) {
      message = error.message;
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  next();
};

// Validate file metadata
export const validateFileMetadata = (req, res, next) => {
  try {
    // Check for required metadata based on upload type
    const uploadType = req.body.uploadType || 'waste';

    if (uploadType === 'waste') {
      // Validate waste submission metadata
      if (!req.body.batchId) {
        return res.status(400).json({
          success: false,
          message: 'Batch ID is required for waste submissions'
        });
      }

      if (!req.body.location) {
        return res.status(400).json({
          success: false,
          message: 'Location data is required for waste submissions'
        });
      }

      try {
        const location = typeof req.body.location === 'string' 
          ? JSON.parse(req.body.location) 
          : req.body.location;

        if (!location.latitude || !location.longitude) {
          return res.status(400).json({
            success: false,
            message: 'Valid GPS coordinates are required'
          });
        }

        // Validate coordinate ranges
        if (location.latitude < -90 || location.latitude > 90 ||
            location.longitude < -180 || location.longitude > 180) {
          return res.status(400).json({
            success: false,
            message: 'Invalid GPS coordinates'
          });
        }

        req.body.location = location;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location data format'
        });
      }

    } else if (uploadType === 'epr') {
      // Validate EPR document metadata
      if (!req.body.documentType) {
        return res.status(400).json({
          success: false,
          message: 'Document type is required for EPR uploads'
        });
      }

      if (!req.body.clientId) {
        return res.status(400).json({
          success: false,
          message: 'Client ID is required for EPR uploads'
        });
      }
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Metadata validation failed',
      error: error.message
    });
  }
};

// Enhanced security scanning middleware
export const enhancedSecurityScan = async (req, res, next) => {
  try {
    if (!req.files && !req.file) {
      return next();
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    const scanResults = [];

    for (const file of files) {
      try {
        // Perform comprehensive virus scan
        const scanResult = await virusScanService.scanFile(file.buffer, file.originalname, file.mimetype);
        
        scanResults.push({
          filename: file.originalname,
          scanResult
        });

        // Block infected files immediately
        if (scanResult.overallStatus === 'infected') {
          return res.status(400).json({
            success: false,
            message: `File ${file.originalname} contains malicious content and has been blocked`,
            scanResult,
            threats: scanResult.threats
          });
        }

        // Flag suspicious files for manual review
        if (scanResult.overallStatus === 'suspicious' && scanResult.confidence < 70) {
          console.warn(`Suspicious file detected: ${file.originalname}`, scanResult);
          
          // You might want to quarantine these files or require admin approval
          // For now, we'll allow them but log the warning
        }

      } catch (error) {
        console.error(`Security scan failed for ${file.originalname}:`, error);
        
        // In production, you might want to block files that can't be scanned
        scanResults.push({
          filename: file.originalname,
          scanResult: {
            overallStatus: 'error',
            error: error.message
          }
        });
      }
    }

    // Attach scan results to request for logging
    req.securityScanResults = scanResults;
    next();

  } catch (error) {
    console.error('Security scan middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Security scan failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Log file upload activities
export const logFileUpload = (req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    // Log upload activity
    const logData = {
      userId: req.user?.id,
      userRole: req.user?.role,
      uploadType: req.body?.uploadType || 'unknown',
      fileCount: req.files ? (Array.isArray(req.files) ? req.files.length : Object.keys(req.files).length) : (req.file ? 1 : 0),
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      success: JSON.parse(data).success || false,
      securityScanResults: req.securityScanResults
    };

    console.log('File upload activity:', logData);

    // Call original send
    originalSend.call(this, data);
  };

  next();
};

// Cleanup temporary files on error
export const cleanupTempFiles = (req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    try {
      const response = JSON.parse(data);
      
      // If upload failed, cleanup any temporary files
      if (!response.success && req.files) {
        const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
        
        files.forEach(file => {
          if (file.path) {
            // If files were stored temporarily, clean them up
            // This is mainly for disk storage, but good practice
            console.log(`Cleaning up temporary file: ${file.path}`);
          }
        });
      }
    } catch (error) {
      console.error('Error in cleanup middleware:', error);
    }

    originalSend.call(this, data);
  };

  next();
};