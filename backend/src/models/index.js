/**
 * Models index file
 * Exports all MongoDB models for the waste verification system
 */

import User from './User.js';
import WasteSubmission from './WasteSubmission.js';
import WasteCredit from './WasteCredit.js';
import BlockchainTransaction from './BlockchainTransaction.js';
import IPFSMetadata from './IPFSMetadata.js';

export {
  User,
  WasteSubmission,
  WasteCredit,
  BlockchainTransaction,
  IPFSMetadata
};

export default {
  User,
  WasteSubmission,
  WasteCredit,
  BlockchainTransaction,
  IPFSMetadata
};