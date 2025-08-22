/**
 * Audit Engine Routes - P0 stubs
 */
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// In-memory stores
const audits = new Map(); // key: documentId -> latest audit

// POST /api/audit/submit/:documentId
router.post('/submit/:documentId', async (req, res) => {
  const { documentId } = req.params;
  const auditId = uuidv4();
  const audit = {
    id: auditId,
    documentId,
    clientId: req.body?.clientId || 'client_demo',
    auditScore: Math.round(70 + Math.random() * 30),
    findings: [
      { type: 'info', message: 'Auto audit ran in stub mode', severity: 'low' },
    ],
    recommendations: ['Provide clearer vendor details if available'],
    complianceStatus: Math.random() > 0.2 ? 'compliant' : 'needs-review',
    auditedAt: new Date().toISOString(),
  };
  audits.set(documentId, audit);
  return res.status(202).json({ success: true, data: { auditId, status: 'processing' } });
});

// GET /api/audit/result/:documentId
router.get('/result/:documentId', (req, res) => {
  const audit = audits.get(req.params.documentId);
  if (!audit) return res.status(404).json({ success: false, message: 'Audit not found' });
  return res.json({ success: true, data: audit });
});

// GET /api/audit/history
router.get('/history', (req, res) => {
  const all = Array.from(audits.values());
  return res.json({ success: true, data: { audits: all, total: all.length, hasMore: false } });
});

// POST /api/audit/:auditId/review
router.post('/:auditId/review', (req, res) => {
  // Stub: accept review and return success
  return res.json({ success: true });
});

export default router;
