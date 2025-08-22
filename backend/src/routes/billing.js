/**
 * Billing Routes - P0 stubs
 */
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const records = new Map(); // key: clientId -> array of records

// GET /api/billing/:clientId
router.get('/:clientId', (req, res) => {
  const { clientId } = req.params;
  const list = records.get(clientId) || [];
  const { limit = 50, offset = 0, status } = req.query;
  let filtered = list;
  if (status) filtered = filtered.filter(r => r.status === status);
  const total = filtered.length;
  const paged = filtered.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  res.json({ success: true, data: { records: paged, total, hasMore: parseInt(offset) + parseInt(limit) < total } });
});

// POST /api/billing/:clientId
router.post('/:clientId', (req, res) => {
  const { clientId } = req.params;
  const body = req.body || {};
  const rec = {
    id: uuidv4(),
    clientId,
    amount: body.amount ?? 0,
    currency: body.currency || 'INR',
    description: body.description || 'Service charges',
    status: body.status || 'pending',
    billingPeriod: body.billingPeriod || {
      startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
      endDate: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    paidAt: body.status === 'paid' ? new Date().toISOString() : undefined,
  };
  const list = records.get(clientId) || [];
  list.push(rec);
  records.set(clientId, list);
  res.status(201).json({ success: true, data: rec });
});

export default router;
