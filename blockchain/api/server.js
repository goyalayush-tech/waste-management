const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const certificateService = require('../services/certificateService');
const digitalTwinService = require('../services/digitalTwinService');
const ipfsService = require('../services/ipfsService');
const webhookService = require('../services/webhookService');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize services
async function initializeServices() {
  try {
    // Get factory address from environment or use default
    const factoryAddress = process.env.FACTORY_ADDRESS;
    
    if (!factoryAddress) {
      console.error('FACTORY_ADDRESS not set in environment variables');
      process.exit(1);
    }
    
    // Initialize certificate service
    const initialized = await certificateService.initialize(factoryAddress);
    
    if (!initialized) {
      console.error('Failed to initialize certificate service');
      process.exit(1);
    }
    
    console.log('Services initialized successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
    process.exit(1);
  }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Certificate routes
app.post('/api/certificates/:facilityId', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { recipient, certificateData } = req.body;
    
    const result = await certificateService.mintCertificate(facilityId, recipient, certificateData);
    res.json(result);
  } catch (error) {
    console.error('Error minting certificate:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/certificates/:facilityId/batch', async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { certificateBatch } = req.body;
    
    const result = await certificateService.batchMintCertificates(facilityId, certificateBatch);
    res.json(result);
  } catch (error) {
    console.error('Error batch minting certificates:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/certificates/:facilityId/:tokenId', async (req, res) => {
  try {
    const { facilityId, tokenId } = req.params;
    const { updatedData } = req.body;
    
    const result = await certificateService.updateCertificate(facilityId, tokenId, updatedData);
    res.json(result);
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/certificates/:facilityId/:tokenId/verify', async (req, res) => {
  try {
    const { facilityId, tokenId } = req.params;
    
    const result = await certificateService.verifyCertificate(facilityId, tokenId);
    res.json(result);
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/certificates/:facilityId/:tokenId/authentic', async (req, res) => {
  try {
    const { facilityId, tokenId } = req.params;
    
    const isAuthentic = await certificateService.isAuthentic(facilityId, tokenId);
    res.json({ tokenId, isAuthentic });
  } catch (error) {
    console.error('Error checking certificate authenticity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Digital Twin routes
app.post('/api/digital-twins', async (req, res) => {
  try {
    const twinData = req.body;
    
    const result = await digitalTwinService.createDigitalTwin(twinData);
    res.json(result);
  } catch (error) {
    console.error('Error creating digital twin:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/digital-twins/:twinId', async (req, res) => {
  try {
    const { twinId } = req.params;
    
    const result = await digitalTwinService.getDigitalTwin(twinId);
    res.json(result);
  } catch (error) {
    console.error('Error getting digital twin:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/digital-twins/:twinId/state', async (req, res) => {
  try {
    const { twinId } = req.params;
    const { state } = req.body;
    
    const result = await digitalTwinService.updateTwinState(twinId, state);
    res.json(result);
  } catch (error) {
    console.error('Error updating digital twin state:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/digital-twins/:twinId/link-nft', async (req, res) => {
  try {
    const { twinId } = req.params;
    const { tokenId, contractAddress } = req.body;
    
    const result = await digitalTwinService.linkTwinToNFT(twinId, tokenId, contractAddress);
    res.json(result);
  } catch (error) {
    console.error('Error linking digital twin to NFT:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/digital-twins/:twinId/simulate', async (req, res) => {
  try {
    const { twinId } = req.params;
    const { simulationType, parameters } = req.body;
    
    const result = await digitalTwinService.runSimulation(twinId, simulationType, parameters);
    res.json(result);
  } catch (error) {
    console.error('Error running simulation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enhanced Webhook routes
app.post('/api/webhooks/register', async (req, res) => {
  try {
    const { facilityId, tokenId, callbackUrl } = req.body;
    
    const result = await webhookService.registerWebhook(facilityId, tokenId, callbackUrl);
    res.json(result);
  } catch (error) {
    console.error('Error registering webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/webhooks/register-enhanced', async (req, res) => {
  try {
    const { facilityId, tokenId, callbackUrl, milestoneTypes, options } = req.body;
    
    const result = await webhookService.registerEnhancedWebhook(facilityId, tokenId, callbackUrl, milestoneTypes, options);
    res.json(result);
  } catch (error) {
    console.error('Error registering enhanced webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/webhooks/trigger', async (req, res) => {
  try {
    const { facilityId, tokenId, milestoneData } = req.body;
    
    const result = await webhookService.triggerMilestoneUpdate(facilityId, tokenId, milestoneData);
    res.json(result);
  } catch (error) {
    console.error('Error triggering webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/webhooks/detect-milestones', async (req, res) => {
  try {
    const { facilityId, tokenId, processingData } = req.body;
    
    const result = await webhookService.detectAndTriggerMilestones(facilityId, tokenId, processingData);
    res.json(result);
  } catch (error) {
    console.error('Error detecting milestones:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/webhooks/batch-update', async (req, res) => {
  try {
    const { updates } = req.body;
    
    const result = await webhookService.processBatchUpdates(updates);
    res.json(result);
  } catch (error) {
    console.error('Error processing batch updates:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/webhooks/:webhookId/stats', async (req, res) => {
  try {
    const { webhookId } = req.params;
    
    const result = webhookService.getWebhookStats(webhookId);
    res.json(result);
  } catch (error) {
    console.error('Error getting webhook stats:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/webhooks/system/status', async (req, res) => {
  try {
    const result = webhookService.getSystemStatus();
    res.json(result);
  } catch (error) {
    console.error('Error getting system status:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/webhooks/:webhookId/notify', async (req, res) => {
  try {
    const { webhookId } = req.params;
    const payload = req.body;
    
    const result = await webhookService.triggerWebhookNotification(webhookId, payload);
    res.json(result);
  } catch (error) {
    console.error('Error triggering webhook notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
async function startServer() {
  await initializeServices();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Start the server
startServer();