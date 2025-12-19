import fs from 'fs/promises';
import path from 'path';
import Claim from '../models/Claim.js';
import ClaimDocument from '../models/ClaimDocument.js';
import AuditTask from '../models/AuditTask.js';
import { runAiAudit, computeSha256, ensureUploadDirectory } from '../services/ClaimAuditService.js';

export async function createClaim(req, res, next) {
  try {
    const claim = await Claim.create(req.body);
    return res.status(201).json({ success: true, data: claim });
  } catch (error) {
    return next(error);
  }
}

export async function listClaims(req, res, next) {
  try {
    const { status, brandId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (brandId) query.brandId = brandId;

    const claims = await Claim.find(query).sort({ createdAt: -1 }).limit(200);
    return res.json({ success: true, data: claims });
  } catch (error) {
    return next(error);
  }
}

export async function getClaim(req, res, next) {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }
    return res.json({ success: true, data: claim });
  } catch (error) {
    return next(error);
  }
}

export async function uploadDocument(req, res, next) {
  try {
    const { id } = req.params;
    const { docType = 'other' } = req.body;
    const claim = await Claim.findById(id);

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }

    await ensureUploadDirectory();

    const absolutePath = req.file.path;
    const fileBuffer = await fs.readFile(absolutePath);
    const sha256 = computeSha256(fileBuffer);

    const storedUrl = `/uploads/claims/${path.basename(absolutePath)}`;

    const document = await ClaimDocument.create({
      claimId: claim.id,
      docType,
      storageUrl: storedUrl,
      sha256,
      mimeType: req.file.mimetype,
    });

    return res.status(201).json({ success: true, data: document });
  } catch (error) {
    return next(error);
  }
}

export async function runAuditController(req, res, next) {
  try {
    const result = await runAiAudit(req.params.id);

    await AuditTask.findOneAndUpdate(
      { claimId: req.params.id, type: 'ai' },
      {
        claimId: req.params.id,
        type: 'ai',
        status: 'complete',
        result: {
          issues: result.issues,
          score: result.score,
          details: result.report,
        },
      },
      { upsert: true, new: true },
    );

    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
}

export async function getAuditReport(req, res, next) {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim || !claim.audit) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    return res.json({
      success: true,
      data: {
        score: claim.audit.score,
        issues: claim.audit.issues,
        reportHash: claim.audit.reportJsonHash,
        reportUrl: claim.audit.reportUrl,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function listAuditTasks(req, res, next) {
  try {
    const tasks = await AuditTask.find({}).sort({ createdAt: -1 }).limit(200);
    return res.json({ success: true, data: tasks });
  } catch (error) {
    return next(error);
  }
}

export async function queueFieldAudit(req, res, next) {
  try {
    const { claimId } = req.body;
    if (!claimId) {
      return res.status(400).json({ success: false, message: 'claimId is required' });
    }

    const claim = await Claim.findById(claimId);
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    const task = await AuditTask.create({
      claimId,
      type: 'field',
      status: 'queued',
      assignedTo: req.body.assignedTo || null,
    });

    return res.status(201).json({ success: true, data: task });
  } catch (error) {
    return next(error);
  }
}

export async function completeFieldAudit(req, res, next) {
  try {
    const { id } = req.params;
    const task = await AuditTask.findById(id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Audit task not found' });
    }

    task.status = 'complete';
    task.result = {
      issues: req.body.issues || [],
      score: req.body.score,
      details: req.body.details,
    };
    await task.save();

    if (req.body.claimStatus) {
      await Claim.findByIdAndUpdate(task.claimId, { status: req.body.claimStatus });
    }

    return res.json({ success: true, data: task });
  } catch (error) {
    return next(error);
  }
}
