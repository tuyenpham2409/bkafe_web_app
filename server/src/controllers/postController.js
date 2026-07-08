import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { shapePost } from '../utils/serialize.js';
import { env } from '../config/env.js';

const AUTHOR_FIELDS = 'displayName username photoURL';

function mediaFromFiles(files) {
  return (files || []).map((f) => ({
    type: f.mimetype.startsWith('video') ? 'video' : 'image',
    url: `${env.apiUrl}/uploads/${f.filename}`,
  }));
}

// GET /api/posts?topic=&q=&sort=&status=&author=
export const listPosts = asyncHandler(async (req, res) => {
  const { topic, q, sort, status, author } = req.query;
  const filter = {};

  // Visibility: admins may request any status; everyone else only sees approved,
  // except an author viewing their own posts also sees pending/rejected.
  if (req.user?.role === 'admin' && status) {
    filter.status = status;
  } else if (author && req.user && String(req.user._id) === String(author)) {
    // own profile: all statuses
  } else if (author) {
    filter.status = 'approved';
  } else {
    filter.status = 'approved';
  }

  if (topic && topic !== 'all') filter.topic = topic;
  if (author) filter.author = author;
  if (q && q.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: rx }, { content: rx }];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    rating_desc: { ratingAvg: -1, ratingCount: -1 },
    rating_asc: { ratingAvg: 1, ratingCount: -1 },
  };
  const sortBy = sortMap[sort] || sortMap.newest;

  const posts = await Post.find(filter).sort(sortBy).populate('author', AUTHOR_FIELDS).lean();

  // comment counts per post (single grouped query)
  const ids = posts.map((p) => p._id);
  const counts = await Comment.aggregate([
    { $match: { post: { $in: ids } } },
    { $group: { _id: '$post', n: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));

  res.json(posts.map((p) => ({ ...shapePost(p, req.user), commentCount: countMap[String(p._id)] || 0 })));
});

// GET /api/posts/:id  (?noview=1 to skip view increment)
export const getPost = asyncHandler(async (req, res) => {
  const skipView = req.query.noview === '1';
  const post = skipView
    ? await Post.findById(req.params.id).populate('author', AUTHOR_FIELDS)
    : await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true }).populate('author', AUTHOR_FIELDS);
  if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
  res.json(shapePost(post, req.user));

});

// POST /api/posts   (multipart: title, content, topic, media[])
export const createPost = asyncHandler(async (req, res) => {
  // Kiểm tra bị khóa đăng bài
  if (req.user.bannedPosting) {
    return res.status(403).json({ message: 'Tài khoản của bạn đã bị hạn chế quyền đăng bài.' });
  }
  const { title, content, topic } = req.body;
  // Chỉ bắt buộc content và topic; title có thể để trống
  if (!content?.trim() || !topic?.trim()) {
    return res.status(400).json({ message: 'Vui lòng nhập nội dung và chọn chủ đề.' });
  }
  const post = await Post.create({
    title: title?.trim() || '',
    content: content.trim(),
    topic: topic.trim(),
    author: req.user._id,
    media: mediaFromFiles(req.files),
    status: req.user.role === 'admin' ? 'approved' : 'pending',
  });
  await post.populate('author', AUTHOR_FIELDS);
  // Gửi thông báo đến tất cả admin khi có câu hỏi mới chờ duyệt
  if (req.user.role !== 'admin') {
    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    await Promise.all(
      admins.map((a) =>
        Notification.create({
          user: a._id,
          type: 'new_pending_post',
          title: 'Có câu hỏi mới cần duyệt',
          message: `${req.user.displayName} vừa đăng câu hỏi mới đang chờ duyệt.`,
          link: `/post/${post._id}`,
        })
      )
    );
  }
  res.status(201).json(shapePost(post, req.user));
});

// PUT /api/posts/:id   (author or admin)
export const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
  const isOwner = String(post.author) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền sửa bài viết này.' });
  }
  const { title, content, topic, keepMedia } = req.body;
  if (title !== undefined) post.title = title.trim();
  if (content !== undefined) post.content = content.trim();
  if (topic !== undefined) post.topic = topic.trim();

  // keepMedia: JSON array of existing media URLs to retain; others are removed
  if (keepMedia !== undefined) {
    let keepUrls = [];
    try { keepUrls = JSON.parse(keepMedia); } catch {}
    post.media = post.media.filter((m) => keepUrls.includes(m.url));
  }
  // Append newly uploaded files
  if (req.files?.length) {
    const newMedia = mediaFromFiles(req.files);
    post.media = [...post.media, ...newMedia].slice(0, 5);
  }


  // Nếu bài đã approved được sửa đổi bởi người dùng thường, reset trạng thái về pending để duyệt lại
  if (post.status === 'approved' && req.user.role !== 'admin') {
    post.status = 'pending';
    // Gửi thông báo đến tất cả admin khi bài viết cập nhật cần duyệt lại
    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    await Promise.all(
      admins.map((a) =>
        Notification.create({
          user: a._id,
          type: 'new_pending_post',
          title: 'Câu hỏi được cập nhật cần duyệt lại',
          message: `${req.user.displayName} vừa cập nhật câu hỏi "${post.title || 'không tiêu đề'}". Vui lòng duyệt lại.`,
          link: `/post/${post._id}`,
        })
      )
    );
  }

  await post.save();
  await post.populate('author', AUTHOR_FIELDS);
  res.json(shapePost(post, req.user));
});

// DELETE /api/posts/:id  { reason }  (author or admin)
export const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
  const isOwner = String(post.author) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền xoá bài viết này.' });
  }
  const reason = String(req.body.reason || '').trim();
  // Admin xoá bài của người khác → gửi thông báo cho tác giả
  if (req.user.role === 'admin' && !isOwner) {
    const displayTitle = post.title?.trim() || post.content?.substring(0, 50);
    await Notification.create({
      user: post.author,
      type: 'post_deleted_by_admin',
      title: 'Bài viết bị xoá bởi quản trị viên',
      message: `Bài viết "${displayTitle}" của bạn đã bị xoá.${reason ? ` Lý do: ${reason}` : ''}`,
      link: '/',
    });
  }
  await Comment.deleteMany({ post: post._id });
  await post.deleteOne();
  res.json({ message: 'Đã xoá bài viết.' });
});

// PATCH /api/posts/:id/approve  (admin)
export const approvePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
  post.status = 'approved';
  post.rejectReason = '';
  await post.save();
  await Notification.create({
    user: post.author,
    type: 'post_approved',
    title: 'Bài viết đã được duyệt',
    message: `Bài viết "${post.title}" của bạn đã được duyệt và hiển thị công khai.`,
    link: `/post/${post._id}`,
  });
  await post.populate('author', AUTHOR_FIELDS);
  res.json(shapePost(post, req.user));
});

// PATCH /api/posts/:id/reject  (admin)  { reason }
export const rejectPost = asyncHandler(async (req, res) => {
  const reason = String(req.body.reason || '').trim();
  if (!reason) return res.status(400).json({ message: 'Vui lòng chọn/nhập lý do từ chối.' });
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
  post.status = 'rejected';
  post.rejectReason = reason;
  await post.save();
  await Notification.create({
    user: post.author,
    type: 'post_rejected',
    title: 'Bài viết bị từ chối',
    message: `Bài viết "${post.title}" của bạn đã bị từ chối. Lý do: ${reason}`,
    link: `/post/${post._id}`,
  });
  await post.populate('author', AUTHOR_FIELDS);
  res.json(shapePost(post, req.user));
});

// POST /api/posts/:id/rate  { value 0..5 }  —  value=0 xoá đánh giá
export const ratePost = asyncHandler(async (req, res) => {
  const value = Number(req.body.value);
  if (!Number.isFinite(value) || value < 0 || value > 5) {
    return res.status(400).json({ message: 'Điểm đánh giá phải từ 0 đến 5.' });
  }
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
  if (value === 0) {
    post.ratings.delete(String(req.user._id)); // 0 = huỷ đánh giá
    post.markModified('ratings');
  } else {
    post.ratings.set(String(req.user._id), value);
  }
  post.recomputeRating();
  await post.save();
  res.json({ ratingAvg: post.ratingAvg, ratingCount: post.ratingCount, myRating: value === 0 ? null : value });
});


// POST /api/posts/:id/share
export const sharePost = asyncHandler(async (req, res) => {
  const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { shares: 1 } }, { new: true });
  if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
  res.json({ shares: post.shares });
});
