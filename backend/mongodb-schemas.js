// MongoDB Schemas for Waste Management System (Mongoose)
const mongoose = require('mongoose');
const { Schema } = mongoose;

// User Schema
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  select: false,
  },
  role: {
    type: String,
    enum: ['vendor', 'buyer', 'admin', 'epr-client', 'auditor'],
    required: true,
  default: 'vendor',
  },
  profile: {
    name: { type: String, required: true, trim: true, maxlength: 100 },
  organization: { type: String, trim: true, maxlength: 200 },
  },
}, { timestamps: true });

// Location Schema
const locationSchema = new Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: coords => coords.length === 2 && coords[0] >= -180 && coords[0] <= 180 && coords[1] >= -90 && coords[1] <= 90,
  message: 'Invalid GPS coordinates',
  },
  },
  address: { type: String, trim: true },
  accuracy: { type: Number, min: 0, max: 1000 },
}, { _id: false });

// Image Metadata Schema
const imageMetadataSchema = new Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
}, { _id: false });

// WasteSubmission Schema
const wasteSubmissionSchema = new Schema({
  vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  wasteType: { type: String, enum: ['plastic', 'paper', 'metal', 'glass', 'organic', 'mixed'], required: true },
  subType: { type: String, trim: true, maxlength: 100 },
  quantity: { type: Number, required: true },
  location: locationSchema,
  imageMetadata: [imageMetadataSchema],
  status: { type: String, required: true },
}, { timestamps: true });

// WasteCredit Schema
// WasteCredit Schema
const wasteCreditSchema = new Schema({
  submissionId: { type: Schema.Types.ObjectId, ref: 'WasteSubmission', required: true, unique: true, index: true },
  vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  creditId: { type: String, required: true, unique: true, uppercase: true, match: [/^WC[0-9]{8}[A-Z0-9]{4}$/] },
  wasteType: { type: String, enum: ['plastic', 'paper', 'metal', 'glass', 'organic', 'mixed'], required: true, index: true },
  subType: { type: String, trim: true, maxlength: 100 },
  quantity: { type: Number, required: true },
  status: { type: String, required: true },
}, { timestamps: true });

// BlockchainTransaction Schema
// BlockchainTransaction Schema
const blockchainTransactionSchema = new Schema({
  transactionHash: { type: String, required: true, unique: true, match: [/^0x[a-fA-F0-9]{64}$/], index: true },
  entityType: { type: String, enum: ['waste_submission', 'waste_credit', 'user_registration', 'credit_transfer', 'audit_record'], required: true, index: true },
  entityId: { type: Schema.Types.ObjectId, required: true, index: true },
  contractAddress: { type: String, required: true, match: [/^0x[a-fA-F0-9]{40}$/] },
  fromAddress: { type: String, required: true, match: [/^0x[a-fA-F0-9]{40}$/] },
  toAddress: { type: String, match: [/^0x[a-fA-F0-9]{40}$/] },
}, { timestamps: true });

// IPFSMetadata Schema
// IPFSMetadata Schema
const ipfsMetadataSchema = new Schema({
  ipfsHash: { type: String, required: true, unique: true, match: [/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/], index: true },
  entityType: { type: String, enum: ['waste_image', 'document', 'certificate', 'qr_code', 'avatar', 'report'], required: true, index: true },
  entityId: { type: Schema.Types.ObjectId, required: true, index: true },
  filename: { type: String, required: true, trim: true, maxlength: 255 },
  originalName: { type: String, required: true, trim: true, maxlength: 255 },
  mimeType: { type: String, required: true, trim: true, maxlength: 100 },
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', userSchema),
  WasteSubmission: mongoose.model('WasteSubmission', wasteSubmissionSchema),
  WasteCredit: mongoose.model('WasteCredit', wasteCreditSchema),
  BlockchainTransaction: mongoose.model('BlockchainTransaction', blockchainTransactionSchema),
  IPFSMetadata: mongoose.model('IPFSMetadata', ipfsMetadataSchema),
};
