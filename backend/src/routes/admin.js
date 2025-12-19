import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// In-memory admin data (replace with DB queries in production)
const adminStats = {
  totalUsers: 25,
  activeUsers: 18,
  totalClients: 12,
  activeClients: 10,
  totalDocuments: 156,
  pendingAudits: 8,
  completedAudits: 142,
  totalRevenue: 45000,
  monthlyRevenue: 8500,
  systemHealth: 'healthy',
  lastBackup: new Date().toISOString()
};

// Admin overview dashboard
router.get('/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: adminStats,
      recentActivity: [
        { id: uuidv4(), type: 'user_login', user: 'admin@example.com', timestamp: new Date().toISOString() },
        { id: uuidv4(), type: 'document_upload', user: 'client1@example.com', timestamp: new Date(Date.now() - 300000).toISOString() },
        { id: uuidv4(), type: 'audit_completed', user: 'auditor1@example.com', timestamp: new Date(Date.now() - 600000).toISOString() }
      ],
      alerts: [
        { id: uuidv4(), severity: 'low', message: 'Backup completed successfully', timestamp: new Date().toISOString() },
        { id: uuidv4(), severity: 'medium', message: '3 documents pending review', timestamp: new Date(Date.now() - 3600000).toISOString() }
      ]
    }
  });
});

// User management
router.get('/users', (req, res) => {
  const { page = 1, limit = 10, status, role } = req.query;
  
  // Mock user data
  const users = [
    { id: uuidv4(), email: 'admin@example.com', role: 'admin', status: 'active', lastLogin: new Date().toISOString() },
    { id: uuidv4(), email: 'client1@example.com', role: 'client', status: 'active', lastLogin: new Date(Date.now() - 86400000).toISOString() },
    { id: uuidv4(), email: 'auditor1@example.com', role: 'auditor', status: 'active', lastLogin: new Date(Date.now() - 172800000).toISOString() }
  ];
  
  let filteredUsers = users;
  if (status) filteredUsers = filteredUsers.filter(u => u.status === status);
  if (role) filteredUsers = filteredUsers.filter(u => u.role === role);
  
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedUsers = filteredUsers.slice(start, end);
  
  res.json({
    success: true,
    data: {
      users: paginatedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredUsers.length,
        pages: Math.ceil(filteredUsers.length / limit)
      }
    }
  });
});

// Client management
router.get('/clients', (req, res) => {
  const { page = 1, limit = 10, status, subscriptionTier } = req.query;
  
  // Mock client data
  const clients = [
    { id: uuidv4(), name: 'Green Recycling Co', email: 'contact@greenrecycling.com', subscriptionTier: 'premium', status: 'active', documentsCount: 45, lastActivity: new Date().toISOString() },
    { id: uuidv4(), name: 'EcoWaste Solutions', email: 'info@ecowaste.com', subscriptionTier: 'enterprise', status: 'active', documentsCount: 78, lastActivity: new Date(Date.now() - 86400000).toISOString() },
    { id: uuidv4(), name: 'WasteTech Ltd', email: 'hello@wastetech.com', subscriptionTier: 'basic', status: 'inactive', documentsCount: 12, lastActivity: new Date(Date.now() - 604800000).toISOString() }
  ];
  
  let filteredClients = clients;
  if (status) filteredClients = filteredClients.filter(c => c.status === status);
  if (subscriptionTier) filteredClients = filteredClients.filter(c => c.subscriptionTier === subscriptionTier);
  
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedClients = filteredClients.slice(start, end);
  
  res.json({
    success: true,
    data: {
      clients: paginatedClients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredClients.length,
        pages: Math.ceil(filteredClients.length / limit)
      }
    }
  });
});

// System health and monitoring
router.get('/system/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
        fileStorage: 'connected'
      }
    }
  });
});

// Audit logs
router.get('/audit-logs', (req, res) => {
  const { page = 1, limit = 20, action, userId } = req.query;
  
  // Mock audit logs
  const auditLogs = [
    { id: uuidv4(), action: 'user_login', userId: 'admin@example.com', ip: '192.168.1.100', timestamp: new Date().toISOString() },
    { id: uuidv4(), action: 'document_upload', userId: 'client1@example.com', ip: '203.0.113.45', timestamp: new Date(Date.now() - 300000).toISOString() },
    { id: uuidv4(), action: 'audit_review', userId: 'auditor1@example.com', ip: '198.51.100.67', timestamp: new Date(Date.now() - 600000).toISOString() }
  ];
  
  let filteredLogs = auditLogs;
  if (action) filteredLogs = filteredLogs.filter(log => log.action === action);
  if (userId) filteredLogs = filteredLogs.filter(log => log.userId === userId);
  
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedLogs = filteredLogs.slice(start, end);
  
  res.json({
    success: true,
    data: {
      logs: paginatedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredLogs.length,
        pages: Math.ceil(filteredLogs.length / limit)
      }
    }
  });
});

// Billing overview
router.get('/billing/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      totalRevenue: adminStats.totalRevenue,
      monthlyRevenue: adminStats.monthlyRevenue,
      activeSubscriptions: 8,
      pendingInvoices: 3,
      overdueInvoices: 1,
      revenueByTier: {
        basic: 5000,
        premium: 25000,
        enterprise: 15000
      }
    }
  });
});

export default router; 