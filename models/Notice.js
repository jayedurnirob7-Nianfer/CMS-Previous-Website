import mongoose from 'mongoose';

const NoticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for the notice'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Please provide content for the notice'],
  },
  link: {
    type: String,
    default: '',
    trim: true,
  },
  category: {
    type: String,
    enum: ['All', 'Wordpress', 'WIX', 'Shopify', 'Document', 'Global'],
    default: 'Global',
  },
  isPinned: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

if (mongoose.models && mongoose.models.Notice) {
  delete mongoose.models.Notice;
}

export default mongoose.model('Notice', NoticeSchema);
