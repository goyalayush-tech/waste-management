/**
 * EPR Audit Engine API Routes
 * Provides endpoints for audit processing, rule management, and compliance scoring
 */

import express from 'express';
import EPRAuditEngine, { AuditRule, AuditResult } from '../services/eprAuditEngine.js';
import { authenticate, authorize, requireVerification } from '../middleware/auth.js';

const router = express.Router();
const auditEngine = new EPRAuditEngine();

/**
 * POST /api/audit/process/:documentId
 * Process a document through the audit engine
 */
router.post('/process/:documentId', authenticate, authorize('epr-client', 'admin'), async (req, res) => {
  try {
    const { documentId } = req.params;
    const { documentData, forceReaudit = false } = req.body;
    const clientId = req.user.role === 'admin' ? req.body.clientId : req.user._id.toString();

    if (!documentData) {
      return res.status(400).json({
        success: false,
        message: 'Document data is required for audit processing'
      });
    }

    // Check if document has already been audited
    if (!forceReaudit) {
      const existingAudit = await AuditResult.findOne({ documentId, clientId });
      if (existingAudit) {
        return res.status(409).json({
          success: false,
          message: 'Document has already been audited',
          data: existingAudit
        });
      }
    }

    // Process the audit
    const auditResult = await auditEngine.auditDocument(documentId, documentData, clientId);

    res.status(201).json({
      success: true,
      message: 'Document audit completed successfully',
      data: auditResult
    });

  } catch (error) {
    console.error('Audit processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process document audit',
      error: error.message
    });
  }
});

/**
 * GET /api/audit/results/:documentId
 * Get audit results for a specific document
 */
router.get('/results/:documentId', authenticate, authorize('epr-client', 'admin', 'auditor'), async (req, res) => {
  try {
    const { documentId } = req.params;
    const clientId = req.user.role === 'admin' ? req.query.clientId : req.user._id.toString();

    const auditResult = await AuditResult.findOne({ documentId, clientId });
    
    if (!auditResult) {
      return res.status(404).json({
        success: false,
        message: 'Audit result not found'
      });
    }

    res.json({
      success: true,
      data: auditResult
    });

  } catch (error) {
    console.error('Get audit result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit result',
      error: error.message
    });
  }
});

/**
 * GET /api/audit/history
 * Get audit history for the client
 */
router.get('/history', authenticate, authorize('epr-client', 'admin', 'auditor'), async (req, res) => {
  try {
    const { limit = 50, offset = 0, riskLevel, status, startDate, endDate } = req.query;
    const clientId = req.user.role === 'admin' ? req.query.clientId : req.user._id.toString();

    // Build query filters
    const filters = { clientId };
    if (riskLevel) filters.riskLevel = riskLevel;
    if (status) filters.status = status;
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    const total = await AuditResult.countDocuments(filters);
    const results = await AuditResult.find(filters)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    res.json({
      success: true,
      data: {
        results,
        total,
        hasMore: parseInt(offset) + parseInt(limit) < total,
        filters: {
          clientId,
          riskLevel,
          status,
          startDate,
          endDate
        }
      }
    });

  } catch (error) {
    console.error('Get audit history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit history',
      error: error.message
    });
  }
});

/**
 * GET /api/audit/metrics
 * Get compliance metrics for the client
 */
router.get('/metrics', authenticate, authorize('epr-client', 'admin', 'auditor'), async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const clientId = req.user.role === 'admin' ? req.query.clientId : req.user._id.toString();

    const metrics = await auditEngine.getComplianceMetrics(clientId, timeframe);

    // Calculate additional metrics
    const riskDistribution = {
      low: metrics.lowRisk,
      medium: metrics.mediumRisk,
      high: metrics.highRisk,
      critical: metrics.criticalRisk
    };

    const complianceRate = metrics.totalAudits > 0 
      ? Math.round(((metrics.lowRisk + metrics.mediumRisk) / metrics.totalAudits) * 100)
      : 0;

    const trend = await calculateComplianceTrend(clientId, timeframe);

    res.json({
      success: true,
      data: {
        overview: {
          averageScore: Math.round(metrics.averageScore || 0),
          totalAudits: metrics.totalAudits,
          complianceRate,
          timeframe
        },
        riskDistribution,
        trend,
        recommendations: generateRecommendations(metrics)
      }
    });

  } catch (error) {
    console.error('Get audit metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit metrics',
      error: error.message
    });
  }
});

/**
 * POST /api/audit/findings/:findingId/resolve
 * Resolve a specific audit finding
 */
router.post('/findings/:findingId/resolve', authenticate, authorize('auditor', 'admin'), async (req, res) => {
  try {
    const { findingId } = req.params;
    const { resolution, status = 'resolved' } = req.body;
    const resolvedBy = req.user._id.toString();

    if (!resolution) {
      return res.status(400).json({
        success: false,
        message: 'Resolution description is required'
      });
    }

    const auditResult = await AuditResult.findOne({
      'findings._id': findingId
    });

    if (!auditResult) {
      return res.status(404).json({
        success: false,
        message: 'Audit finding not found'
      });
    }

    // Update the specific finding
    const finding = auditResult.findings.id(findingId);
    finding.status = status;
    finding.resolution = resolution;
    finding.resolvedBy = resolvedBy;
    finding.resolvedAt = new Date();

    await auditResult.save();

    res.json({
      success: true,
      message: 'Finding resolved successfully',
      data: finding
    });

  } catch (error) {
    console.error('Resolve finding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve finding',
      error: error.message
    });
  }
});

/**
 * GET /api/audit/rules
 * Get all active audit rules
 */
router.get('/rules', authenticate, authorize('admin', 'auditor'), async (req, res) => {
  try {
    const { category, severity, isActive = true } = req.query;

    const filters = { isActive: isActive === 'true' };
    if (category) filters.category = category;
    if (severity) filters.severity = severity;

    const rules = await AuditRule.find(filters).sort({ category: 1, severity: -1 });

    const rulesByCategory = rules.reduce((acc, rule) => {
      if (!acc[rule.category]) acc[rule.category] = [];
      acc[rule.category].push(rule);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        rules,
        rulesByCategory,
        total: rules.length,
        categories: Object.keys(rulesByCategory)
      }
    });

  } catch (error) {
    console.error('Get audit rules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit rules',
      error: error.message
    });
  }
});

/**
 * POST /api/audit/rules
 * Create a new audit rule
 */
router.post('/rules', authenticate, authorize('admin'), async (req, res) => {
  try {
    const ruleData = req.body;

    // Validate required fields
    const requiredFields = ['name', 'description', 'category', 'severity', 'conditions', 'action'];
    const missingFields = requiredFields.filter(field => !ruleData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const rule = await auditEngine.addRule(ruleData);

    res.status(201).json({
      success: true,
      message: 'Audit rule created successfully',
      data: rule
    });

  } catch (error) {
    console.error('Create audit rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create audit rule',
      error: error.message
    });
  }
});

/**
 * PUT /api/audit/rules/:ruleId
 * Update an existing audit rule
 */
router.put('/rules/:ruleId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;

    const rule = await auditEngine.updateRule(ruleId, updates);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Audit rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Audit rule updated successfully',
      data: rule
    });

  } catch (error) {
    console.error('Update audit rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update audit rule',
      error: error.message
    });
  }
});

/**
 * DELETE /api/audit/rules/:ruleId
 * Deactivate an audit rule
 */
router.delete('/rules/:ruleId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { ruleId } = req.params;

    const rule = await auditEngine.deactivateRule(ruleId);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Audit rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Audit rule deactivated successfully',
      data: rule
    });

  } catch (error) {
    console.error('Deactivate audit rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate audit rule',
      error: error.message
    });
  }
});

/**
 * GET /api/audit/dashboard
 * Get audit dashboard data for admins
 */
router.get('/dashboard', authenticate, authorize('admin', 'auditor'), async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const days = parseInt(timeframe.replace('d', ''));
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get overall statistics
    const stats = await AuditResult.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalAudits: { $sum: 1 },
          averageScore: { $avg: '$overallScore' },
          totalFindings: { $sum: { $size: '$findings' } },
          criticalRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'critical'] }, 1, 0] } },
          highRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'high'] }, 1, 0] } },
          avgProcessingTime: { $avg: '$metadata.processingTimeMs' }
        }
      }
    ]);

    // Get top clients by audit count
    const topClients = await AuditResult.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$clientId',
          auditCount: { $sum: 1 },
          averageScore: { $avg: '$overallScore' },
          riskLevel: { $first: '$riskLevel' }
        }
      },
      { $sort: { auditCount: -1 } },
      { $limit: 10 }
    ]);

    // Get common violations
    const commonViolations = await AuditResult.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $unwind: '$findings' },
      {
        $group: {
          _id: '$findings.ruleName',
          count: { $sum: 1 },
          severity: { $first: '$findings.severity' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const dashboardData = {
      overview: stats[0] || {
        totalAudits: 0,
        averageScore: 0,
        totalFindings: 0,
        criticalRisk: 0,
        highRisk: 0,
        avgProcessingTime: 0
      },
      topClients,
      commonViolations,
      timeframe
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Get audit dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit dashboard',
      error: error.message
    });
  }
});

// Helper functions
async function calculateComplianceTrend(clientId, timeframe) {
  const days = parseInt(timeframe.replace('d', ''));
  const intervals = Math.min(days, 30); // Max 30 data points
  const intervalDays = Math.max(1, Math.floor(days / intervals));
  
  const trend = [];
  
  for (let i = intervals - 1; i >= 0; i--) {
    const endDate = new Date(Date.now() - i * intervalDays * 24 * 60 * 60 * 1000);
    const startDate = new Date(endDate.getTime() - intervalDays * 24 * 60 * 60 * 1000);
    
    const results = await AuditResult.aggregate([
      {
        $match: {
          clientId,
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$overallScore' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    trend.push({
      date: endDate.toISOString().split('T')[0],
      score: Math.round(results[0]?.averageScore || 0),
      auditCount: results[0]?.count || 0
    });
  }
  
  return trend;
}

function generateRecommendations(metrics) {
  const recommendations = [];
  
  if (metrics.averageScore < 60) {
    recommendations.push({
      priority: 'high',
      category: 'score_improvement',
      message: 'Average compliance score is below acceptable threshold',
      action: 'Review audit findings and implement corrective measures'
    });
  }
  
  if (metrics.criticalRisk > 0) {
    recommendations.push({
      priority: 'critical',
      category: 'risk_mitigation',
      message: `${metrics.criticalRisk} critical risk items detected`,
      action: 'Immediate attention required for critical compliance issues'
    });
  }
  
  if (metrics.totalAudits < 10) {
    recommendations.push({
      priority: 'medium',
      category: 'process_improvement',
      message: 'Low audit volume may indicate incomplete reporting',
      action: 'Ensure all waste transactions are being documented and audited'
    });
  }
  
  return recommendations;
}

export default router;