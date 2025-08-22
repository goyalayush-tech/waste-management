import crypto from 'crypto';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

class VirusScanService {
  constructor() {
    this.virusTotalApiKey = process.env.VIRUSTOTAL_API_KEY;
    this.clamAvEnabled = process.env.CLAMAV_ENABLED === 'true';
    this.tempDir = process.env.TEMP_DIR || os.tmpdir();
  }

  /**
   * Comprehensive virus scanning using multiple methods
   */
  async scanFile(buffer, filename, mimetype) {
    const scanResults = {
      filename,
      mimetype,
      size: buffer.length,
      scannedAt: new Date(),
      methods: {},
      overallStatus: 'clean',
      threats: [],
      confidence: 0
    };

    try {
      // 1. Basic file validation and heuristic analysis
      const heuristicResult = await this.performHeuristicScan(buffer, filename, mimetype);
      scanResults.methods.heuristic = heuristicResult;

      if (heuristicResult.status !== 'clean') {
        scanResults.overallStatus = heuristicResult.status;
        scanResults.threats.push(...heuristicResult.threats);
      }

      // 2. File signature analysis
      const signatureResult = await this.performSignatureScan(buffer);
      scanResults.methods.signature = signatureResult;

      if (signatureResult.status !== 'clean') {
        scanResults.overallStatus = 'suspicious';
        scanResults.threats.push(...signatureResult.threats);
      }

      // 3. ClamAV scanning (if available)
      if (this.clamAvEnabled) {
        try {
          const clamAvResult = await this.performClamAvScan(buffer, filename);
          scanResults.methods.clamav = clamAvResult;

          if (clamAvResult.status === 'infected') {
            scanResults.overallStatus = 'infected';
            scanResults.threats.push(...clamAvResult.threats);
          }
        } catch (error) {
          console.warn('ClamAV scan failed:', error.message);
          scanResults.methods.clamav = { status: 'error', error: error.message };
        }
      }

      // 4. VirusTotal API scanning (if API key available)
      if (this.virusTotalApiKey && buffer.length < 32 * 1024 * 1024) { // 32MB limit
        try {
          const vtResult = await this.performVirusTotalScan(buffer);
          scanResults.methods.virustotal = vtResult;

          if (vtResult.status === 'infected') {
            scanResults.overallStatus = 'infected';
            scanResults.threats.push(...vtResult.threats);
          }
        } catch (error) {
          console.warn('VirusTotal scan failed:', error.message);
          scanResults.methods.virustotal = { status: 'error', error: error.message };
        }
      }

      // Calculate confidence score
      scanResults.confidence = this.calculateConfidenceScore(scanResults);

      return scanResults;

    } catch (error) {
      console.error('Virus scan error:', error);
      return {
        ...scanResults,
        overallStatus: 'error',
        error: error.message
      };
    }
  }

  /**
   * Heuristic analysis for suspicious patterns
   */
  async performHeuristicScan(buffer, filename, mimetype) {
    const threats = [];
    let status = 'clean';

    try {
      // Check file entropy
      const entropy = this.calculateEntropy(buffer);
      if (entropy > 7.8) {
        threats.push({
          type: 'high_entropy',
          severity: 'medium',
          description: `File has unusually high entropy (${entropy.toFixed(2)})`,
          entropy
        });
        status = 'suspicious';
      }

      // Check for executable signatures
      const executableCheck = this.checkExecutableSignatures(buffer);
      if (executableCheck.isExecutable) {
        threats.push({
          type: 'executable_content',
          severity: 'high',
          description: `File contains executable content: ${executableCheck.type}`,
          details: executableCheck
        });
        status = 'infected';
      }

      // Check for suspicious strings
      const stringAnalysis = this.analyzeSuspiciousStrings(buffer);
      if (stringAnalysis.suspicious.length > 0) {
        threats.push({
          type: 'suspicious_strings',
          severity: 'medium',
          description: 'File contains suspicious strings',
          details: stringAnalysis.suspicious.slice(0, 5) // Limit to first 5
        });
        if (status === 'clean') status = 'suspicious';
      }

      // Check file size anomalies
      if (this.checkSizeAnomalies(buffer, mimetype)) {
        threats.push({
          type: 'size_anomaly',
          severity: 'low',
          description: 'File size is unusual for its type'
        });
        if (status === 'clean') status = 'suspicious';
      }

      // Check for polyglot files
      const polyglotCheck = this.checkPolyglotFile(buffer, mimetype);
      if (polyglotCheck.isPolyglot) {
        threats.push({
          type: 'polyglot_file',
          severity: 'high',
          description: 'File appears to be a polyglot (multiple file formats)',
          details: polyglotCheck
        });
        status = 'suspicious';
      }

      return {
        status,
        threats,
        entropy,
        scanTime: Date.now()
      };

    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        threats: []
      };
    }
  }

  /**
   * File signature analysis
   */
  async performSignatureScan(buffer) {
    const threats = [];
    let status = 'clean';

    const signatures = {
      // Executable signatures
      pe: { pattern: [0x4D, 0x5A], description: 'PE Executable' },
      elf: { pattern: [0x7F, 0x45, 0x4C, 0x46], description: 'ELF Executable' },
      macho32: { pattern: [0xFE, 0xED, 0xFA, 0xCE], description: 'Mach-O 32-bit' },
      macho64: { pattern: [0xFE, 0xED, 0xFA, 0xCF], description: 'Mach-O 64-bit' },
      
      // Script signatures
      shebang: { pattern: [0x23, 0x21], description: 'Script with shebang' },
      
      // Archive signatures that might contain executables
      zip: { pattern: [0x50, 0x4B, 0x03, 0x04], description: 'ZIP Archive' },
      rar: { pattern: [0x52, 0x61, 0x72, 0x21], description: 'RAR Archive' },
      
      // Potentially dangerous formats
      rtf: { pattern: [0x7B, 0x5C, 0x72, 0x74, 0x66], description: 'RTF Document' },
      ole: { pattern: [0xD0, 0xCF, 0x11, 0xE0], description: 'OLE Document' }
    };

    for (const [name, sig] of Object.entries(signatures)) {
      if (this.matchesSignature(buffer, sig.pattern)) {
        const severity = ['pe', 'elf', 'macho32', 'macho64'].includes(name) ? 'high' : 'medium';
        
        threats.push({
          type: 'file_signature',
          severity,
          description: `File signature matches: ${sig.description}`,
          signature: name
        });

        if (severity === 'high') {
          status = 'infected';
        } else if (status === 'clean') {
          status = 'suspicious';
        }
      }
    }

    return {
      status,
      threats,
      scanTime: Date.now()
    };
  }

  /**
   * ClamAV scanning
   */
  async performClamAvScan(buffer, filename) {
    try {
      // Write buffer to temporary file
      const tempFilePath = path.join(this.tempDir, `scan_${Date.now()}_${filename}`);
      await fs.writeFile(tempFilePath, buffer);

      try {
        // Run ClamAV scan
        const { stdout, stderr } = await execAsync(`clamscan --no-summary ${tempFilePath}`);
        
        // Clean up temp file
        await fs.unlink(tempFilePath);

        if (stdout.includes('FOUND')) {
          const virusName = stdout.split(':')[1]?.trim() || 'Unknown virus';
          return {
            status: 'infected',
            threats: [{
              type: 'virus_detected',
              severity: 'high',
              description: `Virus detected: ${virusName}`,
              virusName
            }],
            scanTime: Date.now()
          };
        }

        return {
          status: 'clean',
          threats: [],
          scanTime: Date.now()
        };

      } catch (execError) {
        // Clean up temp file on error
        try {
          await fs.unlink(tempFilePath);
        } catch (unlinkError) {
          console.warn('Failed to clean up temp file:', unlinkError);
        }
        throw execError;
      }

    } catch (error) {
      throw new Error(`ClamAV scan failed: ${error.message}`);
    }
  }

  /**
   * VirusTotal API scanning
   */
  async performVirusTotalScan(buffer) {
    try {
      const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

      // First, check if we already have results for this hash
      const reportResponse = await axios.get(`https://www.virustotal.com/vtapi/v2/file/report`, {
        params: {
          apikey: this.virusTotalApiKey,
          resource: fileHash
        }
      });

      if (reportResponse.data.response_code === 1) {
        // We have existing results
        const positives = reportResponse.data.positives || 0;
        const total = reportResponse.data.total || 0;

        if (positives > 0) {
          const threats = Object.entries(reportResponse.data.scans || {})
            .filter(([engine, result]) => result.detected)
            .map(([engine, result]) => ({
              type: 'virus_detected',
              severity: 'high',
              description: `${engine}: ${result.result}`,
              engine,
              result: result.result
            }));

          return {
            status: 'infected',
            threats,
            positives,
            total,
            scanTime: Date.now()
          };
        }

        return {
          status: 'clean',
          threats: [],
          positives: 0,
          total,
          scanTime: Date.now()
        };
      }

      // No existing results, submit file for scanning
      const formData = new FormData();
      formData.append('apikey', this.virusTotalApiKey);
      formData.append('file', new Blob([buffer]));

      await axios.post('https://www.virustotal.com/vtapi/v2/file/scan', formData);

      // Return pending status - results will be available later
      return {
        status: 'pending',
        threats: [],
        message: 'File submitted to VirusTotal for analysis',
        scanTime: Date.now()
      };

    } catch (error) {
      throw new Error(`VirusTotal scan failed: ${error.message}`);
    }
  }

  /**
   * Calculate file entropy
   */
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

  /**
   * Check for executable signatures
   */
  checkExecutableSignatures(buffer) {
    const signatures = [
      { pattern: [0x4D, 0x5A], type: 'PE Executable' },
      { pattern: [0x7F, 0x45, 0x4C, 0x46], type: 'ELF Executable' },
      { pattern: [0xFE, 0xED, 0xFA, 0xCE], type: 'Mach-O 32-bit' },
      { pattern: [0xFE, 0xED, 0xFA, 0xCF], type: 'Mach-O 64-bit' },
      { pattern: [0xCA, 0xFE, 0xBA, 0xBE], type: 'Java Class File' }
    ];

    for (const sig of signatures) {
      if (this.matchesSignature(buffer, sig.pattern)) {
        return { isExecutable: true, type: sig.type };
      }
    }

    return { isExecutable: false };
  }

  /**
   * Analyze suspicious strings in file content
   */
  analyzeSuspiciousStrings(buffer) {
    const suspiciousPatterns = [
      /eval\s*\(/gi,
      /<script[^>]*>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload\s*=/gi,
      /onerror\s*=/gi,
      /cmd\.exe/gi,
      /powershell/gi,
      /\/bin\/sh/gi,
      /\/bin\/bash/gi,
      /CreateProcess/gi,
      /ShellExecute/gi,
      /WScript\.Shell/gi,
      /document\.write/gi,
      /innerHTML/gi,
      /fromCharCode/gi
    ];

    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 50000));
    const suspicious = [];

    for (const pattern of suspiciousPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        suspicious.push({
          pattern: pattern.source,
          matches: matches.slice(0, 3) // Limit matches
        });
      }
    }

    return { suspicious };
  }

  /**
   * Check for size anomalies
   */
  checkSizeAnomalies(buffer, mimetype) {
    const expectedSizes = {
      'image/jpeg': { min: 1000, max: 50 * 1024 * 1024 },
      'image/png': { min: 500, max: 50 * 1024 * 1024 },
      'application/pdf': { min: 1000, max: 100 * 1024 * 1024 },
      'image/webp': { min: 500, max: 50 * 1024 * 1024 }
    };

    const expected = expectedSizes[mimetype];
    if (!expected) return false;

    return buffer.length < expected.min || buffer.length > expected.max;
  }

  /**
   * Check for polyglot files
   */
  checkPolyglotFile(buffer, mimetype) {
    const signatures = [
      { pattern: [0xFF, 0xD8, 0xFF], type: 'JPEG' },
      { pattern: [0x89, 0x50, 0x4E, 0x47], type: 'PNG' },
      { pattern: [0x25, 0x50, 0x44, 0x46], type: 'PDF' },
      { pattern: [0x50, 0x4B, 0x03, 0x04], type: 'ZIP' }
    ];

    const detectedTypes = [];
    for (const sig of signatures) {
      if (this.matchesSignature(buffer, sig.pattern)) {
        detectedTypes.push(sig.type);
      }
    }

    return {
      isPolyglot: detectedTypes.length > 1,
      detectedTypes
    };
  }

  /**
   * Check if buffer matches signature pattern
   */
  matchesSignature(buffer, pattern) {
    if (buffer.length < pattern.length) return false;
    
    for (let i = 0; i < pattern.length; i++) {
      if (buffer[i] !== pattern[i]) return false;
    }
    
    return true;
  }

  /**
   * Calculate confidence score based on scan results
   */
  calculateConfidenceScore(scanResults) {
    let score = 100;
    
    // Reduce score based on threats
    for (const method of Object.values(scanResults.methods)) {
      if (method.threats) {
        for (const threat of method.threats) {
          switch (threat.severity) {
            case 'high':
              score -= 30;
              break;
            case 'medium':
              score -= 15;
              break;
            case 'low':
              score -= 5;
              break;
          }
        }
      }
    }

    // Bonus for multiple clean scans
    const cleanMethods = Object.values(scanResults.methods)
      .filter(method => method.status === 'clean').length;
    
    if (cleanMethods >= 2) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }
}

export default new VirusScanService();