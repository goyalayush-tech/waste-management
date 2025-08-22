import multer from 'multer';
import sharp from 'sharp';
import AWS from 'aws-sdk';
import { create as createIPFS } from 'ipfs-http-client';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { promisify } from 'util';
import virusScanService from './virusScanService.js';

class FileUploadService {
  constructor() {
    this.initializeAWS();
    this.initializeIPFS();
    this.setupMulter();
  }

  initializeAWS() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
    this.bucketName = process.env.AWS_S3_BUCKET || 'waste-verification-documents';
  }

  initializeIPFS() {
    this.ipfs = createIPFS({
      host: process.env.IPFS_HOST || 'localhost',
      port: process.env.IPFS_PORT || 5001,
      protocol: process.env.IPFS_PROTOCOL || 'http'
    });
  }

  setupMulter() {
    // Configure multer for memory storage
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 10 // Maximum 10 files per request
      },
      fileFilter: this.fileFilter.bind(this)
    });
  }

  fileFilter(req, file, cb) {
    const allowedTypes = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
      'image/heic': ['.heic'],
      'image/heif': ['.heif']
    };

    const fileExtension = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;

    if (allowedTypes[mimeType] && allowedTypes[mimeType].includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${Object.keys(allowedTypes).join(', ')}`), false);
    }
  }

  // Validate file content and scan for viruses (enhanced implementation)
  async validateAndScanFile(buffer, mimetype, filename) {
    try {
      // Basic file validation
      if (mimetype.startsWith('image/')) {
        await this.validateImage(buffer);
      } else if (mimetype === 'application/pdf') {
        await this.validatePDF(buffer);
      }

      // Enhanced virus scanning using comprehensive service
      const scanResult = await virusScanService.scanFile(buffer, filename, mimetype);
      
      // Check scan results
      if (scanResult.overallStatus === 'infected') {
        return { 
          isValid: false, 
          message: 'File contains malicious content',
          scanResult,
          threats: scanResult.threats
        };
      }

      if (scanResult.overallStatus === 'suspicious' && scanResult.confidence < 70) {
        return { 
          isValid: false, 
          message: 'File appears suspicious and requires manual review',
          scanResult,
          threats: scanResult.threats
        };
      }

      // File passed all checks
      return { 
        isValid: true, 
        message: 'File validation and security scan passed',
        scanResult
      };

    } catch (error) {
      console.error('File validation error:', error);
      return { 
        isValid: false, 
        message: `File validation failed: ${error.message}`,
        error: error.message
      };
    }
  }

  async validateImage(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      
      // Check image dimensions (reasonable limits)
      if (metadata.width > 10000 || metadata.height > 10000) {
        throw new Error('Image dimensions too large');
      }

      // Check for minimum dimensions
      if (metadata.width < 100 || metadata.height < 100) {
        throw new Error('Image dimensions too small');
      }

      return metadata;
    } catch (error) {
      throw new Error(`Invalid image file: ${error.message}`);
    }
  }

  async validatePDF(buffer) {
    // Basic PDF validation - check for PDF header
    const pdfHeader = buffer.slice(0, 4).toString();
    if (pdfHeader !== '%PDF') {
      throw new Error('Invalid PDF file format');
    }

    // Check file size is reasonable
    if (buffer.length > 100 * 1024 * 1024) { // 100MB
      throw new Error('PDF file too large');
    }

    return true;
  }

  // Legacy method - now handled by virusScanService
  async basicVirusScan(buffer) {
    console.warn('basicVirusScan is deprecated. Use virusScanService.scanFile instead.');
    return true;
  }

  // Process and optimize images
  async processImage(buffer, options = {}) {
    const {
      maxWidth = 2048,
      maxHeight = 2048,
      quality = 85,
      format = 'jpeg'
    } = options;

    try {
      const processedBuffer = await sharp(buffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality })
        .toBuffer();

      return processedBuffer;
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  // Upload to IPFS for waste images
  async uploadToIPFS(buffer, filename, metadata = {}) {
    try {
      const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
      
      const file = {
        path: filename,
        content: buffer
      };

      const result = await this.ipfs.add(file, {
        pin: true,
        hashAlg: 'sha2-256'
      });

      const ipfsHash = result.cid.toString();

      // Store metadata
      const fileMetadata = {
        filename,
        size: buffer.length,
        hash: fileHash,
        ipfsHash,
        uploadedAt: new Date(),
        ...metadata
      };

      return {
        ipfsHash,
        fileHash,
        metadata: fileMetadata,
        url: `https://ipfs.io/ipfs/${ipfsHash}`
      };
    } catch (error) {
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  // Upload to AWS S3 for EPR documents with encryption
  async uploadToS3(buffer, filename, metadata = {}) {
    try {
      const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
      const key = `documents/${Date.now()}-${fileHash}-${filename}`;

      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: metadata.mimetype || 'application/octet-stream',
        ServerSideEncryption: 'AES256',
        Metadata: {
          originalName: filename,
          uploadedAt: new Date().toISOString(),
          fileHash,
          ...metadata
        }
      };

      const result = await this.s3.upload(uploadParams).promise();

      return {
        s3Key: key,
        s3Url: result.Location,
        fileHash,
        etag: result.ETag,
        metadata: {
          filename,
          size: buffer.length,
          hash: fileHash,
          s3Key: key,
          uploadedAt: new Date(),
          ...metadata
        }
      };
    } catch (error) {
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  // Generate secure download URL for S3 objects
  async generateSecureDownloadUrl(s3Key, expiresIn = 3600) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: s3Key,
        Expires: expiresIn
      };

      const url = await this.s3.getSignedUrlPromise('getObject', params);
      return url;
    } catch (error) {
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  // Process uploaded files based on type and purpose
  async processUploadedFiles(files, uploadType = 'waste') {
    const results = [];

    for (const file of files) {
      try {
        // Validate and scan file
        const validation = await this.validateAndScanFile(file.buffer, file.mimetype, file.originalname);
        if (!validation.isValid) {
          results.push({
            filename: file.originalname,
            success: false,
            error: validation.message,
            scanResult: validation.scanResult,
            threats: validation.threats
          });
          continue;
        }

        let processedBuffer = file.buffer;
        
        // Process images
        if (file.mimetype.startsWith('image/')) {
          processedBuffer = await this.processImage(file.buffer);
        }

        let uploadResult;
        
        // Upload based on type
        if (uploadType === 'waste') {
          // Waste images go to IPFS
          uploadResult = await this.uploadToIPFS(
            processedBuffer,
            file.originalname,
            {
              mimetype: file.mimetype,
              originalSize: file.size,
              processedSize: processedBuffer.length
            }
          );
        } else if (uploadType === 'epr') {
          // EPR documents go to S3
          uploadResult = await this.uploadToS3(
            processedBuffer,
            file.originalname,
            {
              mimetype: file.mimetype,
              originalSize: file.size,
              processedSize: processedBuffer.length
            }
          );
        }

        results.push({
          filename: file.originalname,
          success: true,
          scanResult: validation.scanResult,
          ...uploadResult
        });

      } catch (error) {
        results.push({
          filename: file.originalname,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // Get multer middleware for different upload types
  getUploadMiddleware(uploadType = 'single', fieldName = 'file') {
    switch (uploadType) {
      case 'single':
        return this.upload.single(fieldName);
      case 'multiple':
        return this.upload.array(fieldName, 10);
      case 'fields':
        return this.upload.fields([
          { name: 'beforeImage', maxCount: 1 },
          { name: 'afterImage', maxCount: 1 },
          { name: 'documents', maxCount: 10 }
        ]);
      default:
        return this.upload.single(fieldName);
    }
  }
}

export default new FileUploadService();