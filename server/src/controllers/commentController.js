import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { shapeComment } from '../utils/serialize.js';
import { env } from '../config/env.js';

const AUTHOR_FIELDS = 'displayName username photoURL';

/** Build media array from multer files */
function mediaFromFiles(files) {
  return (files || []).map((f) => ({
    type: f.mimetype.startsWith('video') ? 'video' : 'image',
    url: `${env.apiUrl}/uploads/${f.filename}`,
  }));
}

// GET /api/posts/:postId/comments
export const listComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ post: req.params.postId })
    .sort({ createdAt: 1 })
    .populate('author', AUTHOR_FIELDS)
    .lean();
  res.json(comments.map((c) => shapeComment(c, req.user)));
});

// POST /api/posts/:postId/comments  — multipart/form-data: { content, media[] }
export const createComment = asyncHandler(async (req, res) => {
  if (req.user.bannedCommenting) {
    return res.status(403).json({ message: 'Tài khoản của bạn đã bị hạn chế quyền bình luận.' });
  }
  const content = String(req.body.content || '').trim();
  if (!content) return res.status(400).json({ message: 'Vui lòng nhập nội dung bình luận.' });
  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết.' });

  const media = mediaFromFiles(req.files);
  const comment = await Comment.create({
    post: post._id,
    parent: null,
    author: req.user._id,
    authorName: req.user.displayName,
    authorEmail: req.user.email,
    content,
    media,
  });
  await comment.populate('author', AUTHOR_FIELDS);

  // Notify the post's author (unless commenting on own post)
  if (String(post.author) !== String(req.user._id)) {
    await Notification.create({
      user: post.author,
      type: 'comment',
      title: 'Có bình luận mới về bài viết của bạn',
      message: `${req.user.displayName} đã bình luận: "${content.slice(0, 60)}"`,
      link: `/post/${post._id}`,
    });
  }

  res.status(201).json(shapeComment(comment, req.user));
});

// POST /api/comments/:id/reply  — multipart/form-data: { content, media[] }
export const replyComment = asyncHandler(async (req, res) => {
  if (req.user.bannedCommenting) {
    return res.status(403).json({ message: 'Tài khoản của bạn đã bị hạn chế quyền bình luận.' });
  }
  const content = String(req.body.content || '').trim();
  if (!content) return res.status(400).json({ message: 'Vui lòng nhập nội dung trả lời.' });
  const parent = await Comment.findById(req.params.id);
  if (!parent) return res.status(404).json({ message: 'Không tìm thấy bình luận gốc.' });

  const media = mediaFromFiles(req.files);
  const reply = await Comment.create({
    post: parent.post,
    parent: parent._id,
    author: req.user._id,
    authorName: req.user.displayName,
    authorEmail: req.user.email,
    content,
    media,
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

// PUT /api/comments/:id  (owner) — multipart/form-data: { content, keepMedia, media[] }
export const updateComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ message: 'Không tìm thấy bình luận.' });
  if (String(comment.author) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Bạn không có quyền sửa bình luận này.' });
  }

  const content = String(req.body.content || '').trim();
  if (!content) return res.status(400).json({ message: 'Nội dung bình luận không được để trống.' });
  comment.content = content;

  // keepMedia: JSON array of existing media URLs to retain
  if (req.body.keepMedia !== undefined) {
    let keepUrls = [];
    try { keepUrls = JSON.parse(req.body.keepMedia); } catch {}
    comment.media = comment.media.filter((m) => keepUrls.includes(m.url));
  }
  // Append new uploaded files (total capped at 5)
  if (req.files?.length) {
    const newMedia = mediaFromFiles(req.files);
    comment.media = [...comment.media, ...newMedia].slice(0, 5);
  }

  await comment.save();
  await comment.populate('author', AUTHOR_FIELDS);
  res.json(shapeComment(comment, req.user));
});

// POST /api/comments/:id/rate  { value }  —  value=0 xoá đánh giá
export const rateComment = asyncHandler(async (req, res) => {
  const value = Number(req.body.value);
  if (!Number.isFinite(value) || value < 0 || value > 5) {
    return res.status(400).json({ message: 'Điểm đánh giá phải từ 0 đến 5.' });
  }
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ message: 'Không tìm thấy bình luận.' });
  if (value === 0) {
    comment.ratings.delete(String(req.user._id)); // 0 = huỷ đánh giá
    comment.markModified('ratings');
  } else {
    comment.ratings.set(String(req.user._id), value);
  }
  comment.recomputeRating();
  await comment.save();

  if (value > 0 && String(comment.author) !== String(req.user._id)) {
    await Notification.create({
      user: comment.author,
      type: 'comment_rated',
      title: 'Bình luận được đánh giá',
      message: `${req.user.displayName} đã đánh giá bình luận của bạn ${value}★.`,
      link: `/post/${comment.post}`,
    });
  }
  res.json({ ratingAvg: comment.ratingAvg, ratingCount: comment.ratingCount, myRating: value === 0 ? null : value });
});

// DELETE /api/comments/:id  (admin or owner)
export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ message: 'Không tìm thấy bình luận.' });
  const isOwner = String(comment.author) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền xoá bình luận này.' });
  }

  // Collect all descendant IDs recursively
  const collectDescendants = async (parentId) => {
    const children = await Comment.find({ parent: parentId }).select('_id').lean();
    const ids = children.map((c) => c._id);
    for (const cid of ids) {
      const nested = await collectDescendants(cid);
      ids.push(...nested);
    }
    return ids;
  };
  const descendants = await collectDescendants(comment._id);
  const toDelete = [comment._id, ...descendants];
  await Comment.deleteMany({ _id: { $in: toDelete } });
  res.json({ message: 'Đã xoá bình luận.' });
});

// GET /api/comments  (admin) — all comments for moderation
export const listAllComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find().sort({ createdAt: -1 }).populate('author', AUTHOR_FIELDS).lean();
  res.json(comments.map((c) => shapeComment(c, req.user)));
});
