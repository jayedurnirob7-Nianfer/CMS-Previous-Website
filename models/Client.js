import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
  'Client Name': { type: String, required: true },
  category: { type: String, default: 'All' },
  'Type of website': { type: String, default: '' },
  'Profile Name': { type: String, default: '' },
  'Our Domain': { type: String, default: '' },
  'Client Website': { type: String, default: '' },
  'Tags': { type: String, default: '' },
  'Status': { type: String, default: '' },
  'Team Name': { type: String, default: '' },
  'Developer': { type: String, default: '' },
  rowIndex: { type: Number },
}, { timestamps: true });

ClientSchema.index({ 'Client Name': 1 });
ClientSchema.index({ createdAt: -1 });
ClientSchema.index({ category: 1 });

export default mongoose.models.Client || mongoose.model('Client', ClientSchema);
