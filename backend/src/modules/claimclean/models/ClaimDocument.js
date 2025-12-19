import mongoose from 'mongoose';

const { Schema } = mongoose;

const claimDocumentSchema = new Schema({
  claimId: { type: Schema.Types.ObjectId, ref: 'Claim', required: true, index: true },
  docType: {
    type: String,
    enum: ['invoice', 'weighbridge', 'photo', 'gps', 'license', 'other'],
    default: 'other',
    required: true,
  },
  storageUrl: { type: String, required: true },
  sha256: { type: String, required: true, index: true },
  phash: { type: String },
  mimeType: { type: String, required: true },
  meta: { type: Schema.Types.Mixed },
}, {
  timestamps: { createdAt: true, updatedAt: true },
  versionKey: false,
});

export default mongoose.models.ClaimDocument || mongoose.model('ClaimDocument', claimDocumentSchema);
