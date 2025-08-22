/**
 * Clients Routes - P0 stubs
 */
import express from 'express';

const router = express.Router();

const clients = new Map();

// Seed demo clients
['Acme Plastics', 'Urban Eco Pvt Ltd', 'Green Cycle Corp'].forEach((name, i) => {
  const id = `client_${i + 1}`;
  clients.set(id, {
    id,
    name,
    email: `client${i + 1}@example.com`,
    companyName: name,
    subscriptionTier: ['basic', 'premium', 'enterprise'][i % 3],
    isActive: true,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    lastLoginAt: new Date().toISOString(),
  });
});

// GET /api/clients
router.get('/', (req, res) => {
  const { limit = 50, offset = 0, search, subscriptionTier, isActive } = req.query;

  let list = Array.from(clients.values());
  if (search) {
    const s = String(search).toLowerCase();
    list = list.filter(c => c.name.toLowerCase().includes(s) || c.companyName.toLowerCase().includes(s) || c.email.toLowerCase().includes(s));
  }
  if (subscriptionTier) list = list.filter(c => c.subscriptionTier === subscriptionTier);
  if (isActive !== undefined) list = list.filter(c => c.isActive === (isActive === 'true'));

  const total = list.length;
  const paged = list.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  res.json({ success: true, data: { clients: paged, total, hasMore: parseInt(offset) + parseInt(limit) < total } });
});

// GET /api/clients/:id
router.get('/:id', (req, res) => {
  const c = clients.get(req.params.id);
  if (!c) return res.status(404).json({ success: false, message: 'Client not found' });
  res.json({ success: true, data: c });
});

// PATCH /api/clients/:id
router.patch('/:id', (req, res) => {
  const c = clients.get(req.params.id);
  if (!c) return res.status(404).json({ success: false, message: 'Client not found' });
  const updates = req.body || {};
  const allowed = ['name', 'email', 'companyName', 'subscriptionTier', 'isActive'];
  for (const k of allowed) if (k in updates) c[k] = updates[k];
  clients.set(c.id, c);
  res.json({ success: true, data: c });
});

export default router;
