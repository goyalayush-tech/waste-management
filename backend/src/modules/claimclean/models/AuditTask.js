import mongoose from 'mongoose';

const { Schema } = mongoose;

const auditTaskSchema = new Schema({
  claimId: { type: Schema.Types.ObjectId, ref: 'Claim', required: true, index: true },
  type: { type: String, enum: ['ai', 'field'], default: 'ai' },
  status: { type: String, enum: ['queued', 'running', 'complete', 'failed'], default: 'queued' },
  result: {
    issues: [{
      code: String,
      severity: { type: String, enum: ['low', 'med', 'high'] },
      message: String,
    }],
    score: Number,
    details: Schema.Types.Mixed,
  },
  assignedTo: { type: String },
}, {
  timestamps: true,
  versionKey: false,
});

export default mongoose.models.AuditTask || mongoose.model('AuditTask', auditTaskSchema);
