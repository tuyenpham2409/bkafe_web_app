import Counter from '../models/Counter.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import { asyncHandler } from '../middlewares/errorHandler.js';


export const trackView = asyncHandler(async (_req, res) => {
  const c = await Counter.findOneAndUpdate(
    { key: 'totalViews' },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  res.json({ totalViews: c.value });
});


export const getStats = asyncHandler(async (_req, res) => {
  const [viewsDoc, approved, pending, rejected, comments, users, active] = await Promise.all([
    Counter.findOne({ key: 'totalViews' }).lean(),
    Post.countDocuments({ status: 'approved' }),
    Post.countDocuments({ status: 'pending' }),
    Post.countDocuments({ status: 'rejected' }),
    Comment.countDocuments({}),
    User.countDocuments({}),
    User.countDocuments({ lastActiveAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } }),
  ]);
  res.json({
    totalViews: viewsDoc?.value || 0,
    approvedPosts: approved,
    pendingPosts: pending,
    rejectedPosts: rejected,
    comments,
    users,
    activeUsers: active || 1, 
  });
});
