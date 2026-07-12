import mongoose from 'mongoose';

const commentMediaSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, 
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    authorName: { type: String, required: true },
    authorEmail: { type: String, default: '' },
    content: { type: String, required: true },
    media: { type: [commentMediaSchema], default: [] },
    
    ratings: { type: Map, of: Number, default: {} },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

commentSchema.methods.recomputeRating = function () {
  const values = Array.from(this.ratings.values());
  this.ratingCount = values.length;
  this.ratingAvg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
};

export default mongoose.model('Comment', commentSchema);
