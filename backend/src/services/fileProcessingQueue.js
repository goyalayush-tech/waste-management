import Bull from 'bull';
import fileUploadService from './fileUploadService.js';
import { WasteSubmission } from '../models/WasteSubmission.js';
import { Document } from '../models/epr/Document.js';
import { IPFSMetadata } from '../models/IPFSMetadata.js';

class FileProcessingQueue {
  constructor() {
    this.initializeQueues();
  }

  initializeQueues() {
    // Redis connection for Bull queues
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0
    };

    // Create queues
    this.imageProcessingQueue = new Bull('image processing', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    this.documentProcessingQueue = new Bull('document processing', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    this.virusScanQueue = new Bull('virus scanning', {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 25,
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 5000
        }
      }
    });

    this.setupProcessors();
  }

  setupProcessors() {
    // Image processing processor
    this.imageProcessingQueue.process('process-waste-images', 5, async (job) => {
      const { submissionId, files, metadata } = job.data;
      
      try {
        const processedFiles = [];

        for (const file of files) {
          // Process and upload to IPFS
          const result = await fileUploadService.processUploadedFiles([file], 'waste');
          
          if (result[0].success) {
            // Store IPFS metadata
            const ipfsMetadata = new IPFSMetadata({
              submissionId,
              filename: file.originalname,
              ipfsHash: result[0].ipfsHash,
              fileHash: result[0].fileHash,
              size: file.size,
              mimetype: file.mimetype,
              metadata: result[0].metadata
            });
            
            await ipfsMetadata.save();
            processedFiles.push(result[0]);
          }
        }

        // Update waste submission with processed files
        await WasteSubmission.findByIdAndUpdate(submissionId, {
          $set: {
            'processing.status': 'completed',
            'processing.completedAt': new Date(),
            'files': processedFiles
          }
        });

        return { success: true, processedFiles };

      } catch (error) {
        // Update submission with error status
        await WasteSubmission.findByIdAndUpdate(submissionId, {
          $set: {
            'processing.status': 'failed',
            'processing.error': error.message,
            'processing.failedAt': new Date()
          }
        });

        throw error;
      }
    });

    // Document processing processor
    this.documentProcessingQueue.process('process-epr-documents', 3, async (job) => {
      const { documentId, files, metadata } = job.data;

      try {
        const processedFiles = [];

        for (const file of files) {
          // Process and upload to S3
          const result = await fileUploadService.processUploadedFiles([file], 'epr');
          
          if (result[0].success) {
            processedFiles.push(result[0]);
          }
        }

        // Update document record with processed files
        await Document.findByIdAndUpdate(documentId, {
          processing: {
            status: 'completed',
            completedAt: new Date()
          },
          files: processedFiles
        });

        return { success: true, processedFiles };

      } catch (error) {
        // Update document with error status
        await Document.findByIdAndUpdate(documentId, {
          processing: {
            status: 'failed',
            error: error.message,
            failedAt: new Date()
          }
        });

        throw error;
      }
    });

    // Virus scanning processor
    this.virusScanQueue.process('scan-file', 10, async (job) => {
      const { fileId, buffer, filename, mimetype } = job.data;

      try {
        // Perform virus scanning
        const scanResult = await this.performVirusScan(buffer, filename, mimetype);
        
        return {
          fileId,
          scanResult,
          scannedAt: new Date()
        };

      } catch (error) {
        console.error(`Virus scan failed for file ${filename}:`, error);
        throw error;
      }
    });

    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Image processing events
    this.imageProcessingQueue.on('completed', (job, result) => {
      console.log(`Image processing job ${job.id} completed:`, result);
    });

    this.imageProcessingQueue.on('failed', (job, err) => {
      console.error(`Image processing job ${job.id} failed:`, err);
    });

    // Document processing events
    this.documentProcessingQueue.on('completed', (job, result) => {
      console.log(`Document processing job ${job.id} completed:`, result);
    });

    this.documentProcessingQueue.on('failed', (job, err) => {
      console.error(`Document processing job ${job.id} failed:`, err);
    });

    // Virus scanning events
    this.virusScanQueue.on('completed', (job, result) => {
      console.log(`Virus scan job ${job.id} completed:`, result);
    });

    this.virusScanQueue.on('failed', (job, err) => {
      console.error(`Virus scan job ${job.id} failed:`, err);
    });
  }

  // Add jobs to queues
  async addImageProcessingJob(submissionId, files, metadata = {}) {
    return await this.imageProcessingQueue.add('process-waste-images', {
      submissionId,
      files,
      metadata
    }, {
      priority: 10,
      delay: 1000 // 1 second delay
    });
  }

  async addDocumentProcessingJob(documentId, files, metadata = {}) {
    return await this.documentProcessingQueue.add('process-epr-documents', {
      documentId,
      files,
      metadata
    }, {
      priority: 5,
      delay: 2000 // 2 second delay
    });
  }

  async addVirusScanJob(fileId, buffer, filename, mimetype) {
    return await this.virusScanQueue.add('scan-file', {
      fileId,
      buffer,
      filename,
      mimetype
    }, {
      priority: 20, // High priority for security
      delay: 0 // Immediate processing
    });
  }

  // Enhanced virus scanning
  async performVirusScan(buffer, filename, mimetype) {
    try {
      // Basic file validation
      const validation = await fileUploadService.validateAndScanFile(buffer, mimetype);
      
      if (!validation.isValid) {
        return {
          status: 'infected',
          threat: 'validation_failed',
          message: validation.message
        };
      }

      // Additional scanning logic can be added here
      // For production, integrate with services like ClamAV, VirusTotal API, etc.
      
      // Check file entropy (high entropy might indicate encryption/packing)
      const entropy = this.calculateEntropy(buffer);
      if (entropy > 7.5) {
        return {
          status: 'suspicious',
          threat: 'high_entropy',
          message: 'File has unusually high entropy',
          entropy
        };
      }

      // Check for executable signatures
      if (this.hasExecutableSignature(buffer)) {
        return {
          status: 'infected',
          threat: 'executable_content',
          message: 'File contains executable content'
        };
      }

      return {
        status: 'clean',
        message: 'File passed all security checks',
        entropy
      };

    } catch (error) {
      return {
        status: 'error',
        message: `Scan failed: ${error.message}`
      };
    }
  }

  // Calculate file entropy
  calculateEntropy(buffer) {
    const frequencies = new Array(256).fill(0);
    
    for (let i = 0; i < buffer.length; i++) {
      frequencies[buffer[i]]++;
    }

    let entropy = 0;
    const length = buffer.length;

    for (let i = 0; i < 256; i++) {
      if (frequencies[i] > 0) {
        const probability = frequencies[i] / length;
        entropy -= probability * Math.log2(probability);
      }
    }

    return entropy;
  }

  // Check for executable file signatures
  hasExecutableSignature(buffer) {
    const signatures = [
      [0x4D, 0x5A], // PE executable (MZ)
      [0x7F, 0x45, 0x4C, 0x46], // ELF executable
      [0xFE, 0xED, 0xFA, 0xCE], // Mach-O executable (32-bit)
      [0xFE, 0xED, 0xFA, 0xCF], // Mach-O executable (64-bit)
      [0xCA, 0xFE, 0xBA, 0xBE], // Java class file
    ];

    for (const signature of signatures) {
      if (buffer.length >= signature.length) {
        let match = true;
        for (let i = 0; i < signature.length; i++) {
          if (buffer[i] !== signature[i]) {
            match = false;
            break;
          }
        }
        if (match) return true;
      }
    }

    return false;
  }

  // Get queue statistics
  async getQueueStats() {
    const imageStats = await this.imageProcessingQueue.getJobCounts();
    const documentStats = await this.documentProcessingQueue.getJobCounts();
    const virusStats = await this.virusScanQueue.getJobCounts();

    return {
      imageProcessing: imageStats,
      documentProcessing: documentStats,
      virusScanning: virusStats,
      timestamp: new Date()
    };
  }

  // Clean up completed jobs
  async cleanupJobs() {
    await this.imageProcessingQueue.clean(24 * 60 * 60 * 1000, 'completed'); // 24 hours
    await this.documentProcessingQueue.clean(24 * 60 * 60 * 1000, 'completed');
    await this.virusScanQueue.clean(12 * 60 * 60 * 1000, 'completed'); // 12 hours
  }
}

export default new FileProcessingQueue();