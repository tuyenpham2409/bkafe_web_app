import mongoose from 'mongoose';

// Fixed set of discussion topics ("4 chủ đề"). Posts belong to exactly one topic.
const topicSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Topic', topicSchema);
