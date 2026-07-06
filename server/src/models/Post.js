import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    topic: { type: String, required: true, index: true }, // Topic.slug
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    media: { type: [mediaSchema], default: [] },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    rejectReason: { type: String, default: '' },
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    // one rating per user: Map<userId, value 0..5>
    ratings: { type: Map, of: Number, default: {} },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Recompute the cached average/count from the ratings map.
postSchema.methods.recomputeRating = function () {
  const values = Array.from(this.ratings.values());
  this.ratingCount = values.length;
  this.ratingAvg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
};

export default mongoose.model('Post', postSchema);
