/**
 * Recycler Master DB Routes - P0 stubs
 */
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// In-memory recyclers
const recyclers = new Map();

// Seed a few
['Eco Recyclers Pvt Ltd', 'GreenWaste Solutions', 'Urban Recycle Hub'].forEach((name, i) => {
  const id = uuidv4();
  recyclers.set(id, {
    id,
    name,
    gstNumber: `27ABCDE${1000 + i}F1Z${i}`,
    address: `Address ${i + 1}, Pune, MH`,
    contactInfo: { email: `contact${i + 1}@example.com` },
    certifications: ['ISO 14001'],
    riskProfile: ['low', 'medium', 'high'][i % 3],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
});

// GET /api/recyclers
router.get('/', (req, res) => {
  const list = Array.from(recyclers.values());
  res.json({ success: true, data: { recyclers: list, total: list.length, hasMore: false } });
});

// GET /api/recyclers/:id
router.get('/:id', (req, res) => {
  const r = recyclers.get(req.params.id);
  if (!r) return res.status(404).json({ success: false, message: 'Recycler not found' });
  res.json({ success: true, data: r });
});

// POST /api/recyclers/validate-gst
router.post('/validate-gst', (req, res) => {
  const { gstNumber } = req.body || {};
  if (!gstNumber) return res.status(400).json({ success: false, message: 'gstNumber required' });
  // Stub: mark valid if ends with Z
  const isValid = /Z$/i.test(gstNumber);
  res.json({ success: true, data: { isValid, companyName: 'Stub Co', address: 'Stub Address', status: 'ACTIVE' } });
});

// PATCH /api/recyclers/:id/risk
router.patch('/:id/risk', (req, res) => {
  const r = recyclers.get(req.params.id);
  if (!r) return res.status(404).json({ success: false, message: 'Recycler not found' });
  const { riskProfile } = req.body || {};
  if (!['low', 'medium', 'high'].includes(riskProfile)) return res.status(400).json({ success: false, message: 'invalid riskProfile' });
  r.riskProfile = riskProfile;
  r.updatedAt = new Date().toISOString();
  recyclers.set(r.id, r);
  res.json({ success: true });
});

export default router;
