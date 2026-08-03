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
    enum: ['All', 'Wordpress', 'WIX', 'Shopify', 'Global'],
    default: 'Global',
  },
  isPinned: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

if (mongoose.models && mongoose.models.Notice) {
  delete mongoose.models.Notice;
}

export default mongoose.model('Notice', NoticeSchema);
