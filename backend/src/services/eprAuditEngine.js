/**
 * EPR Compliance Audit Engine - Core audit rules and anomaly detection
 * Implements ClaimClean scoring algorithm and validation rules
 */

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Audit Rule Schema
const auditRuleSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['date_consistency', 'tonnage_validation', 'gst_compliance', 'cross_reference', 'anomaly_detection'],
    required: true 
  },
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    required: true 
  },
  isActive: { type: Boolean, default: true },
  conditions: {
    field: { type: String, required: true },
    operator: { 
      type: String, 
      enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'between', 'regex', 'exists', 'not_exists'],
      required: true 
    },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    tolerance: { type: Number, default: 0 }
  },
  action: {
    type: { 
      type: String, 
      enum: ['flag', 'reject', 'warn', 'auto_correct'],
      default: 'flag' 
    },
    message: { type: String, required: true },
    recommendation: { type: String }
  },
  scoreImpact: {
    penalty: { type: Number, default: 0, min: 0, max: 100 },
    weight: { type: Number, default: 1, min: 0, max: 10 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Audit Result Schema
const auditResultSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  documentId: { type: String, required: true },
  clientId: { type: String, required: true },
  auditType: { 
    type: String, 
    enum: ['invoice', 'weighbridge', 'certificate', 'comprehensive'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending' 
  },
  overallScore: { type: Number, min: 0, max: 100 },
  riskLevel: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low' 
  },
  findings: [{
    ruleId: { type: String, required: true },
    ruleName: { type: String, required: true },
    severity: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['flagged', 'resolved', 'ignored', 'false_positive'],
      default: 'flagged' 
    },
    message: { type: String, required: true },
    recommendation: { type: String },
    fieldPath: { type: String },
    expectedValue: { type: mongoose.Schema.Types.Mixed },
    actualValue: { type: mongoose.Schema.Types.Mixed },
    confidence: { type: Number, min: 0, max: 1, default: 1 },
    scoreImpact: { type: Number, default: 0 },
    detectedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    resolvedBy: { type: String },
    resolution: { type: String }
  }],
  scoreBreakdown: {
    compliance: { score: Number, weight: Number, details: Object },
    timeliness: { score: Number, weight: Number, details: Object },
    accuracy: { score: Number, weight: Number, details: Object },
    completeness: { score: Number, weight: Number, details: Object },
    consistency: { score: Number, weight: Number, details: Object }
  },
  metadata: {
    processingTimeMs: { type: Number },
    rulesEvaluated: { type: Number },
    anomaliesDetected: { type: Number },
    autoCorrections: { type: Number }
  },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  reviewedBy: { type: String },
  reviewedAt: { type: Date }
});

// Create models
const AuditRule = mongoose.model('AuditRule', auditRuleSchema);
const AuditResult = mongoose.model('AuditResult', auditResultSchema);

// Default audit rules
const DEFAULT_AUDIT_RULES = [
  {
    name: 'Invoice Date Consistency',
    description: 'Invoice date should be within reasonable range and not in future',
    category: 'date_consistency',
    severity: 'high',
    conditions: {
      field: 'extractedData.date',
      operator: 'between',
      value: [new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), new Date()],
      tolerance: 7 // 7 days tolerance
    },
    action: {
      type: 'flag',
      message: 'Invoice date is outside acceptable range',
      recommendation: 'Verify the invoice date with the vendor'
    },
    scoreImpact: { penalty: 15, weight: 2 }
  },
  {
    name: 'GST Number Format Validation',
    description: 'GST number should follow Indian GST format (15 digits)',
    category: 'gst_compliance',
    severity: 'critical',
    conditions: {
      field: 'extractedData.vendorGST',
      operator: 'regex',
      value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    },
    action: {
      type: 'reject',
      message: 'Invalid GST number format',
      recommendation: 'Obtain valid GST certificate from vendor'
    },
    scoreImpact: { penalty: 25, weight: 3 }
  },
  {
    name: 'Tonnage Validation',
    description: 'Waste tonnage should be within realistic limits',
    category: 'tonnage_validation',
    severity: 'medium',
    conditions: {
      field: 'extractedData.netWeight',
      operator: 'between',
      value: [10, 50000], // 10kg to 50 tons
      tolerance: 0.1
    },
    action: {
      type: 'warn',
      message: 'Tonnage appears unusual for this waste type',
      recommendation: 'Verify weighbridge ticket and recalculate if necessary'
    },
    scoreImpact: { penalty: 10, weight: 1.5 }
  },
  {
    name: 'Invoice Amount Reasonableness',
    description: 'Invoice amount should align with tonnage and market rates',
    category: 'anomaly_detection',
    severity: 'medium',
    conditions: {
      field: 'extractedData.totalAmount',
      operator: 'between',
      value: [1000, 1000000], // ₹1,000 to ₹10,00,000
      tolerance: 0.2
    },
    action: {
      type: 'flag',
      message: 'Invoice amount may be inconsistent with tonnage',
      recommendation: 'Review pricing calculation and market rates'
    },
    scoreImpact: { penalty: 12, weight: 2 }
  },
  {
    name: 'Vendor Registration Check',
    description: 'Vendor must be registered in approved recycler database',
    category: 'cross_reference',
    severity: 'critical',
    conditions: {
      field: 'extractedData.vendorGST',
      operator: 'exists',
      value: true
    },
    action: {
      type: 'reject',
      message: 'Vendor not found in approved recycler database',
      recommendation: 'Verify vendor credentials and update master database'
    },
    scoreImpact: { penalty: 30, weight: 3 }
  }
];

class EPRAuditEngine {
  constructor() {
    this.rules = new Map();
    this.recyclerDatabase = new Map();
    this.priceRanges = new Map();
    this.initializeRules();
  }

  async initializeRules() {
    try {
      // Load rules from database or create defaults
      const existingRules = await AuditRule.find({ isActive: true });
      
      if (existingRules.length === 0) {
        // Create default rules
        for (const ruleData of DEFAULT_AUDIT_RULES) {
          const rule = new AuditRule(ruleData);
          await rule.save();
          this.rules.set(rule.id, rule);
        }
      } else {
        existingRules.forEach(rule => {
          this.rules.set(rule.id, rule);
        });
      }

      // Initialize mock recycler database
      this.initializeRecyclerDatabase();
      this.initializePriceRanges();
      
    } catch (error) {
      console.error('Failed to initialize audit rules:', error);
    }
  }

  initializeRecyclerDatabase() {
    // Mock approved recyclers
    const mockRecyclers = [
      { gst: '27AABCU9603R1ZX', name: 'Green Recycling Solutions Pvt Ltd', status: 'active', riskScore: 0.2 },
      { gst: '09ABCDE1234F1Z5', name: 'EcoWaste Management Ltd', status: 'active', riskScore: 0.1 },
      { gst: '19FGHIJ5678K2A3', name: 'Sustainable Materials Corp', status: 'active', riskScore: 0.3 },
      { gst: '33LMNOP9012Q4B7', name: 'CleanTech Recyclers', status: 'suspended', riskScore: 0.8 }
    ];

    mockRecyclers.forEach(recycler => {
      this.recyclerDatabase.set(recycler.gst, recycler);
    });
  }

  initializePriceRanges() {
    // Mock price ranges per kg for different waste types
    this.priceRanges.set('plastic', { min: 8, max: 25, avg: 15 });
    this.priceRanges.set('paper', { min: 5, max: 12, avg: 8 });
    this.priceRanges.set('metal', { min: 15, max: 45, avg: 28 });
    this.priceRanges.set('glass', { min: 2, max: 8, avg: 4 });
  }

  async auditDocument(documentId, documentData, clientId) {
    const startTime = Date.now();
    
    try {
      // Create audit result
      const auditResult = new AuditResult({
        documentId,
        clientId,
        auditType: this.determineAuditType(documentData),
        status: 'in_progress'
      });

      const findings = [];
      let totalPenalty = 0;
      let totalWeight = 0;

      // Evaluate each rule
      for (const [ruleId, rule] of this.rules) {
        const evaluation = await this.evaluateRule(rule, documentData);
        
        if (!evaluation.passed) {
          const finding = {
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            message: rule.action.message,
            recommendation: rule.action.recommendation,
            fieldPath: rule.conditions.field,
            expectedValue: rule.conditions.value,
            actualValue: evaluation.actualValue,
            confidence: evaluation.confidence,
            scoreImpact: rule.scoreImpact.penalty,
            detectedAt: new Date()
          };
          
          findings.push(finding);
          totalPenalty += rule.scoreImpact.penalty * rule.scoreImpact.weight;
          totalWeight += rule.scoreImpact.weight;
        }
      }

      // Perform anomaly detection
      const anomalies = await this.detectAnomalies(documentData, clientId);
      findings.push(...anomalies);

      // Calculate ClaimClean score
      const scoreBreakdown = this.calculateClaimCleanScore(documentData, findings);
      const overallScore = this.calculateOverallScore(scoreBreakdown);
      const riskLevel = this.determineRiskLevel(overallScore, findings);

      // Update audit result
      auditResult.findings = findings;
      auditResult.overallScore = overallScore;
      auditResult.riskLevel = riskLevel;
      auditResult.scoreBreakdown = scoreBreakdown;
      auditResult.status = 'completed';
      auditResult.completedAt = new Date();
      auditResult.metadata = {
        processingTimeMs: Date.now() - startTime,
        rulesEvaluated: this.rules.size,
        anomaliesDetected: anomalies.length,
        autoCorrections: 0
      };

      await auditResult.save();
      return auditResult;

    } catch (error) {
      console.error('Audit failed:', error);
      throw new Error(`Audit process failed: ${error.message}`);
    }
  }

  async evaluateRule(rule, documentData) {
    try {
      const fieldValue = this.getNestedValue(documentData, rule.conditions.field);
      const condition = rule.conditions;
      let passed = true;
      let confidence = 1.0;

      switch (condition.operator) {
        case 'equals':
          passed = fieldValue === condition.value;
          break;
          
        case 'not_equals':
          passed = fieldValue !== condition.value;
          break;
          
        case 'greater_than':
          passed = Number(fieldValue) > Number(condition.value);
          break;
          
        case 'less_than':
          passed = Number(fieldValue) < Number(condition.value);
          break;
          
        case 'between':
          const [min, max] = condition.value;
          const numValue = Number(fieldValue);
          passed = numValue >= min && numValue <= max;
          break;
          
        case 'regex':
          passed = condition.value.test(String(fieldValue));
          break;
          
        case 'exists':
          passed = fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
          break;
          
        case 'not_exists':
          passed = fieldValue === undefined || fieldValue === null || fieldValue === '';
          break;
      }

      // Special validation for GST numbers
      if (rule.category === 'gst_compliance' && fieldValue) {
        const recycler = this.recyclerDatabase.get(fieldValue);
        if (!recycler) {
          passed = false;
          confidence = 0.9;
        } else if (recycler.status !== 'active') {
          passed = false;
          confidence = 0.8;
        }
      }

      return {
        passed,
        actualValue: fieldValue,
        confidence,
        metadata: {
          ruleId: rule.id,
          evaluatedAt: new Date()
        }
      };

    } catch (error) {
      console.error(`Rule evaluation failed for ${rule.name}:`, error);
      return {
        passed: false,
        actualValue: null,
        confidence: 0.5,
        error: error.message
      };
    }
  }

  async detectAnomalies(documentData, clientId) {
    const anomalies = [];

    try {
      // Price per kg anomaly detection
      if (documentData.extractedData?.totalAmount && documentData.extractedData?.netWeight) {
        const pricePerKg = documentData.extractedData.totalAmount / documentData.extractedData.netWeight;
        const materialType = this.inferMaterialType(documentData);
        const priceRange = this.priceRanges.get(materialType) || { min: 5, max: 30, avg: 15 };
        
        if (pricePerKg < priceRange.min * 0.5 || pricePerKg > priceRange.max * 2) {
          anomalies.push({
            ruleId: 'anomaly_price_per_kg',
            ruleName: 'Price Per Kg Anomaly',
            severity: 'medium',
            message: `Price per kg (₹${pricePerKg.toFixed(2)}) is unusual for ${materialType}`,
            recommendation: `Expected range: ₹${priceRange.min}-${priceRange.max} per kg`,
            fieldPath: 'pricing.pricePerKg',
            expectedValue: priceRange,
            actualValue: pricePerKg,
            confidence: 0.8,
            scoreImpact: 8
          });
        }
      }

      // Date sequence anomaly
      if (documentData.extractedData?.date) {
        const docDate = new Date(documentData.extractedData.date);
        const dayOfWeek = docDate.getDay();
        const hour = docDate.getHours();
        
        // Flag weekend or late night transactions as potential anomalies
        if (dayOfWeek === 0 || dayOfWeek === 6 || hour < 6 || hour > 22) {
          anomalies.push({
            ruleId: 'anomaly_unusual_timing',
            ruleName: 'Unusual Transaction Timing',
            severity: 'low',
            message: 'Transaction occurred outside normal business hours',
            recommendation: 'Verify the transaction timing with the vendor',
            fieldPath: 'extractedData.date',
            expectedValue: 'Business hours (Mon-Fri, 6 AM - 10 PM)',
            actualValue: docDate.toISOString(),
            confidence: 0.6,
            scoreImpact: 3
          });
        }
      }

      // Quantity pattern anomaly (for repeat clients)
      // This would typically check against historical data
      const historicalAvg = 1500; // Mock historical average
      if (documentData.extractedData?.netWeight) {
        const currentWeight = documentData.extractedData.netWeight;
        const deviation = Math.abs(currentWeight - historicalAvg) / historicalAvg;
        
        if (deviation > 3) { // More than 300% deviation
          anomalies.push({
            ruleId: 'anomaly_quantity_pattern',
            ruleName: 'Unusual Quantity Pattern',
            severity: 'medium',
            message: 'Quantity significantly deviates from historical pattern',
            recommendation: 'Review quantity against previous submissions',
            fieldPath: 'extractedData.netWeight',
            expectedValue: `~${historicalAvg}kg (historical average)`,
            actualValue: currentWeight,
            confidence: 0.7,
            scoreImpact: 10
          });
        }
      }

    } catch (error) {
      console.error('Anomaly detection failed:', error);
    }

    return anomalies;
  }

  calculateClaimCleanScore(documentData, findings) {
    // ClaimClean scoring components
    const components = {
      compliance: { weight: 0.3, maxScore: 100 },
      timeliness: { weight: 0.2, maxScore: 100 },
      accuracy: { weight: 0.25, maxScore: 100 },
      completeness: { weight: 0.15, maxScore: 100 },
      consistency: { weight: 0.1, maxScore: 100 }
    };

    const scoreBreakdown = {};

    // Compliance score (based on rule violations)
    const criticalFindings = findings.filter(f => f.severity === 'critical').length;
    const highFindings = findings.filter(f => f.severity === 'high').length;
    const mediumFindings = findings.filter(f => f.severity === 'medium').length;
    
    let complianceScore = 100;
    complianceScore -= criticalFindings * 25; // -25 per critical
    complianceScore -= highFindings * 15;     // -15 per high
    complianceScore -= mediumFindings * 8;    // -8 per medium
    
    scoreBreakdown.compliance = {
      score: Math.max(0, complianceScore),
      weight: components.compliance.weight,
      details: {
        criticalViolations: criticalFindings,
        highViolations: highFindings,
        mediumViolations: mediumFindings
      }
    };

    // Timeliness score (based on submission timing)
    const submissionDate = new Date();
    const documentDate = new Date(documentData.extractedData?.date || Date.now());
    const daysDiff = Math.abs((submissionDate - documentDate) / (1000 * 60 * 60 * 24));
    
    let timelinessScore = 100;
    if (daysDiff > 30) timelinessScore -= 20;
    else if (daysDiff > 15) timelinessScore -= 10;
    else if (daysDiff > 7) timelinessScore -= 5;
    
    scoreBreakdown.timeliness = {
      score: Math.max(0, timelinessScore),
      weight: components.timeliness.weight,
      details: {
        daysSinceDocument: Math.round(daysDiff),
        submissionDelay: daysDiff > 7 ? 'delayed' : 'timely'
      }
    };

    // Accuracy score (based on OCR confidence and data quality)
    const ocrConfidence = documentData.confidence || 0.85;
    const accuracyScore = Math.round(ocrConfidence * 100);
    
    scoreBreakdown.accuracy = {
      score: accuracyScore,
      weight: components.accuracy.weight,
      details: {
        ocrConfidence: ocrConfidence,
        dataQuality: ocrConfidence > 0.9 ? 'excellent' : ocrConfidence > 0.7 ? 'good' : 'poor'
      }
    };

    // Completeness score (based on missing fields)
    const requiredFields = ['vendorName', 'vendorGST', 'totalAmount', 'date', 'items'];
    const extractedData = documentData.extractedData || {};
    const presentFields = requiredFields.filter(field => extractedData[field]);
    const completenessScore = Math.round((presentFields.length / requiredFields.length) * 100);
    
    scoreBreakdown.completeness = {
      score: completenessScore,
      weight: components.completeness.weight,
      details: {
        requiredFields: requiredFields.length,
        presentFields: presentFields.length,
        missingFields: requiredFields.filter(field => !extractedData[field])
      }
    };

    // Consistency score (based on internal data consistency)
    let consistencyScore = 100;
    const inconsistencies = [];
    
    // Check if calculated totals match
    if (extractedData.items && extractedData.totalAmount) {
      const calculatedTotal = extractedData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
      const declaredTotal = extractedData.totalAmount;
      const difference = Math.abs(calculatedTotal - declaredTotal) / declaredTotal;
      
      if (difference > 0.05) { // 5% tolerance
        consistencyScore -= 20;
        inconsistencies.push('Total amount mismatch');
      }
    }
    
    scoreBreakdown.consistency = {
      score: Math.max(0, consistencyScore),
      weight: components.consistency.weight,
      details: {
        inconsistencies,
        internalChecks: ['amount_calculation', 'date_format', 'gst_format']
      }
    };

    return scoreBreakdown;
  }

  calculateOverallScore(scoreBreakdown) {
    let weightedSum = 0;
    let totalWeight = 0;

    Object.values(scoreBreakdown).forEach(component => {
      weightedSum += component.score * component.weight;
      totalWeight += component.weight;
    });

    return Math.round(weightedSum / totalWeight);
  }

  determineRiskLevel(overallScore, findings) {
    const criticalFindings = findings.filter(f => f.severity === 'critical').length;
    const highFindings = findings.filter(f => f.severity === 'high').length;

    if (criticalFindings > 0 || overallScore < 40) return 'critical';
    if (highFindings > 2 || overallScore < 60) return 'high';
    if (overallScore < 80) return 'medium';
    return 'low';
  }

  determineAuditType(documentData) {
    const docType = documentData.documentType || 'unknown';
    if (docType.includes('invoice')) return 'invoice';
    if (docType.includes('weighbridge')) return 'weighbridge';
    if (docType.includes('certificate')) return 'certificate';
    return 'comprehensive';
  }

  inferMaterialType(documentData) {
    const description = (documentData.extractedData?.items?.[0]?.description || '').toLowerCase();
    if (description.includes('plastic')) return 'plastic';
    if (description.includes('paper')) return 'paper';
    if (description.includes('metal')) return 'metal';
    if (description.includes('glass')) return 'glass';
    return 'plastic'; // default
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Rule management methods
  async addRule(ruleData) {
    const rule = new AuditRule(ruleData);
    await rule.save();
    this.rules.set(rule.id, rule);
    return rule;
  }

  async updateRule(ruleId, updates) {
    const rule = await AuditRule.findOneAndUpdate(
      { id: ruleId },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    if (rule) {
      this.rules.set(rule.id, rule);
    }
    return rule;
  }

  async deactivateRule(ruleId) {
    const rule = await AuditRule.findOneAndUpdate(
      { id: ruleId },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
    if (rule) {
      this.rules.delete(ruleId);
    }
    return rule;
  }

  async getAuditHistory(clientId, limit = 50, offset = 0) {
    return await AuditResult.find({ clientId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
  }

  async getComplianceMetrics(clientId, timeframe = '30d') {
    const days = parseInt(timeframe.replace('d', ''));
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const results = await AuditResult.aggregate([
      {
        $match: {
          clientId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$overallScore' },
          totalAudits: { $sum: 1 },
          lowRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'low'] }, 1, 0] } },
          mediumRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'medium'] }, 1, 0] } },
          highRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'high'] }, 1, 0] } },
          criticalRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'critical'] }, 1, 0] } }
        }
      }
    ]);

    return results[0] || {
      averageScore: 0,
      totalAudits: 0,
      lowRisk: 0,
      mediumRisk: 0,
      highRisk: 0,
      criticalRisk: 0
    };
  }
}

// Export the audit engine and models
export default EPRAuditEngine;
export { AuditRule, AuditResult };