import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import Claim from '../models/Claim.js';
import ClaimDocument from '../models/ClaimDocument.js';

const AI_URL = process.env.CLAIM_AUDIT_AI_URL || 'http://claim-audit-ai:8000';
const VERIFIED_THRESHOLD = Number(process.env.CC_VERIFIED_THRESHOLD || 75);
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'claims');

export async function ensureUploadDirectory() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  return UPLOAD_DIR;
}

export function computeSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function runAiAudit(claimId) {
  const claim = await Claim.findById(claimId);

  if (!claim) {
    const error = new Error('Claim not found');
    error.statusCode = 404;
    throw error;
  }

  const documents = await ClaimDocument.find({ claimId });

  const payload = {
    claim: {
      id: claim.id,
      brandId: claim.brandId,
      recyclerId: claim.recyclerId,
      facilityId: claim.facilityId,
      period: claim.period,
      claimedWeightKg: claim.claimedWeightKg,
      facilityGps: claim.facilityGps || undefined, // optional if available
    },
    documents: documents.map((doc) => ({
      id: doc.id,
      docType: doc.docType,
      url: doc.storageUrl,
      sha256: doc.sha256,
      phash: doc.phash,
      mimeType: doc.mimeType,
      meta: doc.meta,
    })),
  };

  const { data } = await axios.post(`${AI_URL}/audit/claim`, payload, {
    timeout: Number(process.env.CLAIM_AUDIT_TIMEOUT_MS) || 30000,
  });

  const status = data.score >= VERIFIED_THRESHOLD ? 'verified' : 'submitted';
  claim.status = status;

  claim.audit = {
    score: data.score,
    issues: data.issues,
    reportJsonHash: data.reportHash,
    reportUrl: data.report?.reportUrl || null,
    version: data.report?.model_version,
  };

  await claim.save();

  return data;
}
