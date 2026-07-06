import Topic from '../models/Topic.js';
import Post from '../models/Post.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

// GET /api/topics
export const listTopics = asyncHandler(async (_req, res) => {
  const topics = await Topic.find().sort({ order: 1 }).lean();
  res.json(topics.map((t) => ({ id: String(t._id), slug: t.slug, name: t.name, description: t.description })));
});

// PUT /api/topics/:slug  (admin) { name, description }
export const updateTopic = asyncHandler(async (req, res) => {
  const t = await Topic.findOne({ slug: req.params.slug });
  if (!t) return res.status(404).json({ message: 'Không tìm thấy chủ đề.' });
  if (req.body.name !== undefined) t.name = req.body.name.trim();
  if (req.body.description !== undefined) t.description = req.body.description.trim();
  await t.save();
  res.json({ id: String(t._id), slug: t.slug, name: t.name, description: t.description });
});

// GET /api/topics/counts  -> approved post count per topic (for tab badges)
export const topicCounts = asyncHandler(async (_req, res) => {
  const rows = await Post.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: '$topic', n: { $sum: 1 } } },
  ]);
  res.json(Object.fromEntries(rows.map((r) => [r._id, r.n])));
});
