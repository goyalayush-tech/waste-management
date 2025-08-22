/**
 * EPR models index file
 * Exports all PostgreSQL models for the EPR compliance system
 */

import Client from './Client.js';
import Document from './Document.js';
import AuditResult from './AuditResult.js';
import RecyclerMaster from './RecyclerMaster.js';
import ComplianceScore from './ComplianceScore.js';
import AuditTrail from './AuditTrail.js';
import BillingRecord from './BillingRecord.js';

export {
  Client,
  Document,
  AuditResult,
  RecyclerMaster,
  ComplianceScore,
  AuditTrail,
  BillingRecord
};

export default {
  Client,
  Document,
  AuditResult,
  RecyclerMaster,
  ComplianceScore,
  AuditTrail,
  BillingRecord
};