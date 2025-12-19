import mongoose from 'mongoose';

const { Schema } = mongoose;

const auditIssueSchema = new Schema({
  code: { type: String },
  severity: { type: String, enum: ['low', 'med', 'high'], default: 'low' },
  message: { type: String },
}, { _id: false });

const claimSchema = new Schema({
  brandId: { type: String, required: true, index: true },
  recyclerId: { type: String, required: true, index: true },
  facilityId: { type: String, required: true },
  period: {
    from: { type: Date, required: true },
    to: { type: Date, required: true },
  },
  claimedWeightKg: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['submitted', 'auditing', 'verified', 'rejected'],
    default: 'submitted',
    index: true,
  },
  audit: {
    score: { type: Number },
    issues: [auditIssueSchema],
    reportJsonHash: { type: String },
    reportUrl: { type: String },
    version: { type: String, default: 'cc-mvp-0.2' },
  },
}, {
  timestamps: true,
  versionKey: false,
});

export default mongoose.models.Claim || mongoose.model('Claim', claimSchema);
