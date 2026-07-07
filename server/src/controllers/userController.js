import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,15}$/;

// GET /api/users/:id  (public profile + activity counts)
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
  const [postCount, commentCount] = await Promise.all([
    Post.countDocuments({ author: user._id, status: 'approved' }),
    Comment.countDocuments({ author: user._id }),
  ]);
  res.json({ ...user.toPublic(), postCount, commentCount });
});

// PUT /api/users/me  (own profile) { displayName, bio, photoURL }
export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { displayName, bio, photoURL } = req.body;
  if (displayName !== undefined) {
    if (!displayName.trim()) return res.status(400).json({ message: 'Tên hiển thị không được để trống.' });
    user.displayName = displayName.trim();
  }
  if (bio !== undefined) user.bio = bio;
  if (photoURL !== undefined) user.photoURL = photoURL; // data URL or /uploads path
  await user.save();
  res.json({ user: user.toPublic() });
});

/* ---------------- Admin: user CRUD ---------------- */

// GET /api/users  (admin)
export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).lean();
  res.json(
    users.map((u) => ({
      id: String(u._id),
      username: u.username,
      displayName: u.displayName,
      email: u.email,
      role: u.role,
      photoURL: u.photoURL || '',
      joinedAt: u.createdAt,
      lastActiveAt: u.lastActiveAt,
    }))
  );
});

// POST /api/users  (admin) { username, displayName, email, password, role }
export const createUser = asyncHandler(async (req, res) => {
  const { username, displayName, email, password, role } = req.body;
  const uname = String(username || '').trim().toLowerCase();
  if (!USERNAME_RE.test(uname)) return res.status(400).json({ message: 'Tên đăng nhập không hợp lệ (3-15 ký tự).' });
  if (!displayName?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ message: 'Thiếu tên hiển thị, email hoặc mật khẩu.' });
  }
  const user = new User({
    username: uname,
    displayName: displayName.trim(),
    email: email.trim().toLowerCase(),
    role: role === 'admin' ? 'admin' : 'user',
  });
  await user.setPassword(password);
  await user.save();
  res.status(201).json({ user: user.toPublic() });
});

// PUT /api/users/:id  (admin) { displayName, email, role, password? }
export const adminUpdateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
  const { displayName, email, role, password } = req.body;
  if (displayName !== undefined) user.displayName = displayName.trim();
  if (email !== undefined) user.email = email.trim().toLowerCase();
  if (role !== undefined) user.role = role === 'admin' ? 'admin' : 'user';
  if (password) await user.setPassword(password);
  await user.save();
  res.json({ user: user.toPublic() });
});

// DELETE /api/users/:id  (admin)
export const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.user._id) === String(req.params.id)) {
    return res.status(400).json({ message: 'Bạn không thể tự xoá tài khoản admin đang đăng nhập.' });
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
  res.json({ message: 'Đã xoá người dùng.' });
});

// GET /api/users/search?q=  (public) — tìm kiếm user theo displayName hoặc username
export const searchUsers = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json([]);
  // Escape ký tự đặc biệt regex để tránh lỗi
  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const users = await User.find({ $or: [{ displayName: rx }, { username: rx }] })
    .limit(20)
    .lean();
  res.json(
    users.map((u) => ({
      id: String(u._id),
      username: u.username,
      displayName: u.displayName,
      photoURL: u.photoURL || '',
      role: u.role,
      joinedAt: u.createdAt,
      lastActiveAt: u.lastActiveAt,
    }))
  );
});
