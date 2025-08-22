/**
 * Health Check API Routes - Enhanced health monitoring
 * Provides detailed system health information
 */

import express from 'express';
import mongoose from 'mongoose';
import { postgresConnection } from '../config/database.js';
import { promises as fs } from 'fs';
import path from 'path';

const router = express.Router();

/**
 * GET /api/health
 * Comprehensive health check
 */
router.get('/', async (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
services: {},
system: {},
    };

    // Check database connection
    try {
      if (mongoose.connection.readyState === 1) {
        healthData.services.database = {
          status: 'healthy',
          type: 'MongoDB',
          host: mongoose.connection.host,
          name: mongoose.connection.name,
        };
      } else {
        healthData.services.database = {
          status: 'unhealthy',
          type: 'MongoDB',
          error: 'Not connected',
        };
        healthData.status = 'degraded';
      }
    } catch (error) {
      healthData.services.database = {
        status: 'unhealthy',
        type: 'MongoDB',
        error: error.message,
      };
      healthData.status = 'degraded';
    }

    // Check file system (uploads directory)
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      await fs.access(uploadsDir);
      healthData.services.fileSystem = {
        status: 'healthy',
        uploadsDirectory: uploadsDir,
      };
    } catch (error) {
      healthData.services.fileSystem = {
        status: 'unhealthy',
        error: 'Uploads directory not accessible',
      };
      healthData.status = 'degraded';
    }

    // PostgreSQL connection check
    try {
      if (postgresConnection) {
        await postgresConnection.authenticate();
        healthData.services.postgresql = { status: 'healthy' };
      } else {
        healthData.services.postgresql = { status: 'unhealthy', error: 'Not initialized' };
        healthData.status = 'degraded';
      }
    } catch (error) {
      healthData.services.postgresql = { status: 'unhealthy', error: error.message };
      healthData.status = 'degraded';
    }

    // Redis connection check
  // Redis disabled in current config; report as mock
  healthData.services.redis = { status: 'mock', message: 'Redis disabled in dev' };

    // System information
    healthData.system = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      cpu: {
        loadAverage: process.loadavg ? process.loadavg() : null,
      },
    };

    // Mock external service checks (for P0 milestone)
    healthData.services.aiService = {
      status: 'mock',
      message: 'Using mock AI service for development',
    };

    healthData.services.blockchainService = {
      status: 'mock',
      message: 'Using mock blockchain service for development',
    };

    healthData.services.ocrService = {
      status: 'mock',
      message: 'Using mock OCR service for development',
    };

    const statusCode = healthData.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthData);

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime(),
    });
  }
});

/**
 * GET /api/health/ready
 * Readiness probe for Kubernetes/Docker
 */
router.get('/ready', (req, res) => {
  try {
    const isReady = mongoose.connection.readyState === 1;
    
    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        reason: 'Database not connected',
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * GET /api/health/live
 * Liveness probe for Kubernetes/Docker
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  });
});

export default router;