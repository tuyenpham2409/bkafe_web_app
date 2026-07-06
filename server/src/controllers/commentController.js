import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { shapeComment } from '../utils/serialize.js';

const AUTHOR_FIELDS = 'displayName username photoURL';

// GET /api/posts/:postId/comments
export const listComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ post: req.params.postId })
    .sort({ createdAt: 1 })
    .populate('author', AUTHOR_FIELDS)
    .lean();
  res.json(comments.map((c) => shapeComment(c, req.user)));
});

// POST /api/posts/:postId/comments  { content }
export const createComment = asyncHandler(async (req, res) => {
  const content = String(req.body.content || '').trim();
  if (!content) return res.status(400).json({ message: 'Vui lòng nhập nội dung bình luận.' });
  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết.' });

  const comment = await Comment.create({
    post: post._id,
    parent: null,
    author: req.user._id,
    authorName: req.user.displayName,
    authorEmail: req.user.email,
    content,
  });
  await comment.populate('author', AUTHOR_FIELDS);
  res.status(201).json(shapeComment(comment, req.user));
});

// POST /api/comments/:id/reply  { content }
export const replyComment = asyncHandler(async (req, res) => {
  const content = String(req.body.content || '').trim();
  if (!content) return res.status(400).json({ message: 'Vui lòng nhập nội dung trả lời.' });
  const parent = await Comment.findById(req.params.id);
  if (!parent) return res.status(404).json({ message: 'Không tìm thấy bình luận gốc.' });

  const reply = await Comment.create({
    post: parent.post,
    parent: parent._id,
    author: req.user._id,
    authorName: req.user.displayName,
    authorEmail: req.user.email,
    content,
  });
  await reply.populate('author', AUTHOR_FIELDS);

  // notify the parent comment's author (unless replying to self)
  if (String(parent.author) !== String(req.user._id)) {
    await Notification.create({
      user: parent.author,
      type: 'reply',
      title: 'Có người trả lời bình luận của bạn',
      message: `${req.user.displayName} đã trả lời: "${content.slice(0, 60)}"`,
      link: `/post/${parent.post}`,
    });
  }
  res.status(201).json(shapeComment(reply, req.user));
});

// POST /api/comments/:id/rate  { value }
export const rateComment = asyncHandler(async (req, res) => {
  const value = Number(req.body.value);
  if (!Number.isFinite(value) || value < 0 || value > 5) {
    return res.status(400).json({ message: 'Điểm đánh giá phải từ 0 đến 5.' });
  }
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ message: 'Không tìm thấy bình luận.' });
  comment.ratings.set(String(req.user._id), value);
  comment.recomputeRating();
  await comment.save();
  res.json({ ratingAvg: comment.ratingAvg, ratingCount: comment.ratingCount, myRating: value });
});

// DELETE /api/comments/:id  (admin)
export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ message: 'Không tìm thấy bình luận.' });
  // delete the comment and any replies to it
  await Comment.deleteMany({ $or: [{ _id: comment._id }, { parent: comment._id }] });
  res.json({ message: 'Đã xoá bình luận.' });
});

// GET /api/comments  (admin) — all comments for moderation
export const listAllComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find().sort({ createdAt: -1 }).populate('author', AUTHOR_FIELDS).lean();
  res.json(comments.map((c) => shapeComment(c, req.user)));
});
