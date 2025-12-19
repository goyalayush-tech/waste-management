/* eslint-disable */
/**
 * Main server file for Integrated Waste Verification & EPR Compliance System
 * Supports multi-role authentication and unified API endpoints
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { initializeDatabases } from './config/database.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import subscriptionRoutes from './routes/subscriptions.js';
import fileUploadRoutes from './routes/fileUpload.js';
import documentsRoutes from './routes/documents.js';
import ocrRoutes from './routes/ocr.js';
import healthRoutes from './routes/health.js';
import aiRoutes from './routes/ai.js';
import authStubRoutes from './routes/authStub.js';
import auditRoutes from './routes/audit.js';
import recyclersRoutes from './routes/recyclers.js';
import complianceRoutes from './routes/compliance.js';
import clientsRoutes from './routes/clients.js';
import billingRoutes from './routes/billing.js';
import reportsRoutes from './routes/reports.js';
import claimCleanRoutes from './modules/claimclean/routes.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads (including ClaimClean document storage)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root landing (avoid 404 on '/')
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Integrated Waste & EPR API server',
    docs: '/api/health',
  });
});

// API landing (avoid 404 on '/api')
app.get('/api', (req, res) => {
  res.status(200).json({
    status: 'ok',
    endpoints: [
      '/api/health',
      '/api/documents',
      '/api/ocr',
      '/api/compliance',
      '/api/recyclers',
      '/api/clients',
      '/api/billing/{clientId}',
    ],
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/upload', fileUploadRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth-stub', authStubRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/recyclers', recyclersRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/v1/claimclean', claimCleanRoutes);
import digitalTwinsRoutes from './routes/digitalTwins.js';
import quantumRoutes from './routes/quantum.js';
import adminRoutes from './routes/admin.js';
import importRoutes from './routes/import.js';
app.use('/api/digital-twins', digitalTwinsRoutes);
app.use('/api/quantum', quantumRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/import', importRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/waste-verification-mvp');
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
  // Initialize MongoDB, PostgreSQL, and Redis
  await initializeDatabases();
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;