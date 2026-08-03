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
  'Deli_Last_Time': { type: String, default: '' },
  rowIndex: { type: Number },
}, { timestamps: true, strict: false });

ClientSchema.index({ 'Client Name': 1 });
ClientSchema.index({ createdAt: -1 });
ClientSchema.index({ category: 1 });

if (mongoose.models && mongoose.models.Client) {
  delete mongoose.models.Client;
}

export default mongoose.model('Client', ClientSchema);
