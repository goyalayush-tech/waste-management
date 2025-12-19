/**
 * CSV Import Routes
 * Handles bulk data import from CSV files for recyclers, claims, and compliance data
 */

import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import Claim from '../modules/claimclean/models/Claim.js';

const router = express.Router();

// Configure multer for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'imports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * Parse CSV file and return records
 */
function parseCSV(filePath, options = {}) {
  return new Promise((resolve, reject) => {
    const records = [];
    const parser = fs.createReadStream(filePath).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        ...options,
      })
    );

    parser.on('data', (record) => records.push(record));
    parser.on('error', (err) => reject(err));
    parser.on('end', () => resolve(records));
  });
}

/**
 * @route   POST /api/import/recyclers
 * @desc    Import recycler master data from CSV
 * @access  Admin
 */
router.post('/recyclers', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'CSV file is required' });
    }

    const records = await parseCSV(req.file.path);
    const results = { imported: 0, errors: [], total: records.length };

    // Store recyclers in-memory for now (can be moved to MongoDB/PostgreSQL later)
    const recyclers = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        const recycler = {
          id: record.id || `REC-${Date.now()}-${i}`,
          name: record.name || record.recycler_name,
          organization: record.organization || record.company,
          location: record.location || record.city,
          state: record.state,
          region: record.region,
          capacity: parseFloat(record.capacity) || 0,
          certifications: record.certifications ? record.certifications.split(',').map(c => c.trim()) : [],
          contactEmail: record.email || record.contact_email,
          contactPhone: record.phone || record.contact_phone,
          status: record.status || 'active',
          createdAt: new Date(),
        };
        recyclers.push(recycler);
        results.imported++;
      } catch (error) {
        results.errors.push({ row: i + 2, error: error.message });
      }
    }

    // Store in global for demo (in production, save to DB)
    global.importedRecyclers = global.importedRecyclers || [];
    global.importedRecyclers.push(...recyclers);

    // Cleanup uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Imported ${results.imported} of ${results.total} recyclers`,
      data: results,
    });
  } catch (error) {
    console.error('Recycler import error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/import/claims
 * @desc    Import claims data from CSV
 * @access  Admin
 */
router.post('/claims', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'CSV file is required' });
    }

    const records = await parseCSV(req.file.path);
    const results = { imported: 0, errors: [], total: records.length };

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        // Map CSV columns to Claim model fields
        const claimData = {
          brandId: record.brand_id || record.brandId || record.brand,
          recyclerId: record.recycler_id || record.recyclerId || record.recycler,
          facilityId: record.facility_id || record.facilityId || `fac-${i}`,
          period: {
            from: record.period_from || record.from_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            to: record.period_to || record.to_date || new Date(),
          },
          claimedWeightKg: parseFloat(record.weight_kg || record.claimedWeightKg || record.tonnage * 1000) || 0,
          status: record.status || 'submitted',
          plasticType: record.plastic_type || record.plasticType || 'mixed',
          audit: {
            score: parseFloat(record.score) || null,
            issues: record.issues ? record.issues.split(';').map(i => i.trim()) : [],
          },
        };

        const claim = await Claim.create(claimData);
        results.imported++;
      } catch (error) {
        results.errors.push({ row: i + 2, error: error.message, data: record });
      }
    }

    // Cleanup uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Imported ${results.imported} of ${results.total} claims`,
      data: results,
    });
  } catch (error) {
    console.error('Claims import error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/import/compliance
 * @desc    Import EPR compliance records from CSV
 * @access  Admin
 */
router.post('/compliance', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'CSV file is required' });
    }

    const records = await parseCSV(req.file.path);
    const results = { imported: 0, errors: [], total: records.length };

    // Store compliance records in-memory for demo
    const complianceRecords = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        const compliance = {
          id: record.id || `COMP-${Date.now()}-${i}`,
          brandId: record.brand_id || record.brand,
          year: parseInt(record.year) || new Date().getFullYear(),
          quarter: record.quarter || 'Q4',
          targetTonnage: parseFloat(record.target_tonnage || record.target) || 0,
          achievedTonnage: parseFloat(record.achieved_tonnage || record.achieved) || 0,
          compliancePercentage: parseFloat(record.compliance_percentage) || 0,
          status: record.status || 'pending',
          region: record.region || 'national',
          createdAt: new Date(),
        };
        complianceRecords.push(compliance);
        results.imported++;
      } catch (error) {
        results.errors.push({ row: i + 2, error: error.message });
      }
    }

    // Store in global for demo
    global.importedCompliance = global.importedCompliance || [];
    global.importedCompliance.push(...complianceRecords);

    // Cleanup uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Imported ${results.imported} of ${results.total} compliance records`,
      data: results,
    });
  } catch (error) {
    console.error('Compliance import error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/import/templates/:type
 * @desc    Download CSV template for import
 * @access  Admin
 */
router.get('/templates/:type', (req, res) => {
  const { type } = req.params;

  const templates = {
    recyclers: 'id,name,organization,location,state,region,capacity,certifications,email,phone,status\nREC-001,EcoCycle Mumbai,EcoCycle Pvt Ltd,Mumbai,Maharashtra,West,5000,"ISO 14001,EPR",contact@ecocycle.in,+91-9876543210,active',
    claims: 'brand_id,recycler_id,facility_id,period_from,period_to,weight_kg,status,plastic_type,score\nHUL India,EcoCycle Mumbai,fac-mum-01,2024-12-01,2024-12-31,12500,submitted,PET,',
    compliance: 'brand_id,year,quarter,target_tonnage,achieved_tonnage,compliance_percentage,status,region\nHUL India,2024,Q4,50000,45000,90,verified,national',
  };

  if (!templates[type]) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${type}-template.csv`);
  res.send(templates[type]);
});

/**
 * @route   GET /api/import/recyclers
 * @desc    Get imported recyclers
 * @access  Admin
 */
router.get('/recyclers', (req, res) => {
  const recyclers = global.importedRecyclers || [];
  res.json({ success: true, data: recyclers, total: recyclers.length });
});

export default router;
