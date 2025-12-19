import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import {
  createClaim,
  listClaims,
  getClaim,
  uploadDocument,
  runAuditController,
  getAuditReport,
  listAuditTasks,
  queueFieldAudit,
  completeFieldAudit,
} from './controllers/ClaimController.js';
import { ensureUploadDirectory } from './services/ClaimAuditService.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'ClaimClean service is healthy', timestamp: new Date().toISOString() });
});

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadDir = await ensureUploadDirectory();
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: Number(process.env.CLAIM_AUDIT_MAX_FILE_SIZE || 10) * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|csv|xlsx|txt/;
    const mimetype = allowed.test(file.mimetype.toLowerCase());
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type for ClaimClean upload'));
    }
  },
});

// =====================
// Dashboard Stats Endpoints
// =====================

/**
 * @route   GET /api/v1/claimclean/stats/summary
 * @desc    Get dashboard summary statistics
 */
router.get('/stats/summary', async (req, res, next) => {
  try {
    const Claim = (await import('./models/Claim.js')).default;
    const AuditTask = (await import('./models/AuditTask.js')).default;

    const [
      totalClaims,
      verifiedClaims,
      pendingClaims,
      rejectedClaims,
      auditingClaims,
      totalWeight,
      avgScoreResult,
      pendingAudits,
      fieldAudits,
    ] = await Promise.all([
      Claim.countDocuments(),
      Claim.countDocuments({ status: 'verified' }),
      Claim.countDocuments({ status: 'submitted' }),
      Claim.countDocuments({ status: 'rejected' }),
      Claim.countDocuments({ status: 'auditing' }),
      Claim.aggregate([{ $group: { _id: null, total: { $sum: '$claimedWeightKg' } } }]),
      Claim.aggregate([{ $match: { 'audit.score': { $exists: true, $ne: null } } }, { $group: { _id: null, avg: { $avg: '$audit.score' } } }]),
      AuditTask.countDocuments({ status: 'pending' }),
      AuditTask.countDocuments({ type: 'field' }),
    ]);

    const stats = {
      totalClaims,
      verifiedClaims,
      pendingClaims,
      rejectedClaims,
      auditingClaims,
      totalWeightKg: totalWeight[0]?.total || 0,
      totalWeightTonnes: ((totalWeight[0]?.total || 0) / 1000).toFixed(2),
      averageScore: avgScoreResult[0]?.avg ? Math.round(avgScoreResult[0].avg * 10) / 10 : 0,
      pendingAudits,
      fieldAudits,
      openIssues: pendingClaims + auditingClaims,
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/claimclean/stats/by-status
 * @desc    Get claims grouped by status (for pie chart)
 */
router.get('/stats/by-status', async (req, res, next) => {
  try {
    const Claim = (await import('./models/Claim.js')).default;
    
    const statusCounts = await Claim.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, totalWeight: { $sum: '$claimedWeightKg' } } },
      { $sort: { count: -1 } },
    ]);

    const data = statusCounts.map(s => ({
      status: s._id || 'unknown',
      count: s.count,
      totalWeightKg: s.totalWeight,
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/claimclean/stats/trends
 * @desc    Get claims over time (for line chart)
 */
router.get('/stats/trends', async (req, res, next) => {
  try {
    const Claim = (await import('./models/Claim.js')).default;
    const { period = '30d' } = req.query;

    let daysBack = 30;
    if (period === '7d') daysBack = 7;
    if (period === '90d') daysBack = 90;
    if (period === '1y') daysBack = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const trends = await Claim.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          totalWeight: { $sum: '$claimedWeightKg' },
          verified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const data = trends.map(t => ({
      date: t._id,
      claims: t.count,
      weightKg: t.totalWeight,
      verified: t.verified,
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/claimclean/stats/by-recycler
 * @desc    Get top recyclers by volume (for bar chart)
 */
router.get('/stats/by-recycler', async (req, res, next) => {
  try {
    const Claim = (await import('./models/Claim.js')).default;
    const { limit = 10 } = req.query;

    const recyclerStats = await Claim.aggregate([
      { $group: { 
        _id: '$recyclerId', 
        claimCount: { $sum: 1 }, 
        totalWeight: { $sum: '$claimedWeightKg' },
        verifiedWeight: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, '$claimedWeightKg', 0] } },
        avgScore: { $avg: '$audit.score' },
      }},
      { $sort: { totalWeight: -1 } },
      { $limit: parseInt(limit) },
    ]);

    const data = recyclerStats.map(r => ({
      recyclerId: r._id || 'Unknown',
      claimCount: r.claimCount,
      totalWeightKg: r.totalWeight,
      verifiedWeightKg: r.verifiedWeight,
      averageScore: r.avgScore ? Math.round(r.avgScore * 10) / 10 : null,
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/claimclean/stats/by-region
 * @desc    Get claims by region/brand (for regional breakdown)
 */
router.get('/stats/by-region', async (req, res, next) => {
  try {
    const Claim = (await import('./models/Claim.js')).default;

    const brandStats = await Claim.aggregate([
      { $group: { 
        _id: '$brandId', 
        claimCount: { $sum: 1 }, 
        totalWeight: { $sum: '$claimedWeightKg' },
        verified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
      }},
      { $sort: { totalWeight: -1 } },
      { $limit: 15 },
    ]);

    const data = brandStats.map(b => ({
      brandId: b._id || 'Unknown',
      claimCount: b.claimCount,
      totalWeightKg: b.totalWeight,
      verifiedClaims: b.verified,
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/claimclean/stats/scores
 * @desc    Get ClaimClean score distribution (for histogram)
 */
router.get('/stats/scores', async (req, res, next) => {
  try {
    const Claim = (await import('./models/Claim.js')).default;

    const scoreDistribution = await Claim.aggregate([
      { $match: { 'audit.score': { $exists: true, $ne: null } } },
      {
        $bucket: {
          groupBy: '$audit.score',
          boundaries: [0, 25, 50, 60, 75, 90, 101],
          default: 'other',
          output: { count: { $sum: 1 }, avgWeight: { $avg: '$claimedWeightKg' } }
        }
      }
    ]);

    const labels = ['0-24 (Critical)', '25-49 (Poor)', '50-59 (Below Threshold)', '60-74 (Acceptable)', '75-89 (Good)', '90-100 (Excellent)'];
    const data = scoreDistribution.map((s, i) => ({
      range: labels[i] || `${s._id}+`,
      count: s.count,
      avgWeightKg: Math.round(s.avgWeight || 0),
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/claimclean/stats/tonnage
 * @desc    Get tonnage trends over time
 */
router.get('/stats/tonnage', async (req, res, next) => {
  try {
    const Claim = (await import('./models/Claim.js')).default;
    const { period = '12m' } = req.query;

    let months = 12;
    if (period === '6m') months = 6;
    if (period === '24m') months = 24;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const tonnageTrends = await Claim.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          totalWeight: { $sum: '$claimedWeightKg' },
          verifiedWeight: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, '$claimedWeightKg', 0] } },
          claimCount: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const data = tonnageTrends.map(t => ({
      month: t._id,
      totalTonnes: (t.totalWeight / 1000).toFixed(2),
      verifiedTonnes: (t.verifiedWeight / 1000).toFixed(2),
      claims: t.claimCount,
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// =====================
// Claims CRUD Endpoints
// =====================

router.post('/claims', createClaim);
router.get('/claims', listClaims);
router.get('/claims/:id', getClaim);
router.post('/claims/:id/documents', upload.single('file'), uploadDocument);
router.post('/claims/:id/audit/run', runAuditController);
router.get('/claims/:id/report', getAuditReport);
router.get('/audits', listAuditTasks);
router.post('/audits/field', queueFieldAudit);
router.post('/audits/:id/field/complete', completeFieldAudit);

// Temporary debug endpoint to list stored documents on disk
router.get('/claims/:id/documents/raw', async (req, res, next) => {
  try {
    const targetDir = path.join(process.cwd(), 'uploads', 'claims');
    const files = await fs.readdir(targetDir);
    res.json({ success: true, data: files });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json({ success: true, data: [] });
    } else {
      next(error);
    }
  }
});

export default router;
