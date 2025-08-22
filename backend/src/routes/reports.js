/**
 * Reports Routes - P0 stubs
 */
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const jobs = new Map(); // reportId -> job

// POST /api/reports/generate/:type
router.post('/generate/:type', (req, res) => {
  const { type } = req.params;
  const reportId = uuidv4();
  const job = {
    id: reportId,
    type,
    status: 'pending',
    progress: 0,
    createdAt: new Date().toISOString(),
  };
  jobs.set(reportId, job);

  // simulate async job
  setTimeout(() => {
    const j = jobs.get(reportId);
    if (!j) return;
    j.status = 'completed';
    j.progress = 100;
    j.downloadUrl = `/api/reports/download/${reportId}.pdf`;
    j.completedAt = new Date().toISOString();
    jobs.set(reportId, j);
  }, 1500);

  res.status(202).json({ success: true, data: { reportId, downloadUrl: '', expiresAt: new Date(Date.now() + 86400000).toISOString() } });
});

// GET /api/reports/status/:reportId
router.get('/status/:reportId', (req, res) => {
  const j = jobs.get(req.params.reportId);
  if (!j) return res.status(404).json({ success: false, message: 'Report not found' });
  res.json({ success: true, data: { status: j.status, progress: j.progress, downloadUrl: j.downloadUrl, error: j.error } });
});

export default router;
