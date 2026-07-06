import crypto from 'crypto';
import User from '../models/User.js';
import { signToken } from '../utils/token.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,15}$/;
const ADMIN_EMAIL = 'admin@bkafe.hust.edu.vn';

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { username, displayName, email, password } = req.body;
  if (!username || !displayName || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
  }
  const uname = String(username).trim().toLowerCase();
  if (!USERNAME_RE.test(uname)) {
    return res.status(400).json({ message: 'Tên đăng nhập 3-15 ký tự, chỉ gồm chữ, số và dấu gạch dưới.' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
  }

  // enforce uniqueness explicitly for friendly messages (unique index is the real guard)
  if (await User.exists({ username: uname })) {
    return res.status(409).json({ message: 'Tên đăng nhập này đã được sử dụng.' });
  }
  if (await User.exists({ email: String(email).trim().toLowerCase() })) {
    return res.status(409).json({ message: 'Email này đã được đăng ký.' });
  }

  const role = String(email).trim().toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user';
  const user = new User({ username: uname, displayName: displayName.trim(), email: email.trim().toLowerCase(), role });
  await user.setPassword(password);
  await user.save();

  res.status(201).json({ token: signToken(user), user: user.toPublic() });
});

// POST /api/auth/login  { identifier (username or email), password }
export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) return res.status(400).json({ message: 'Vui lòng nhập tài khoản và mật khẩu.' });

  const id = String(identifier).trim().toLowerCase();
  const query = id.includes('@') ? { email: id } : { username: id };
  const user = await User.findOne(query).select('+passwordHash');
  if (!user || !(await user.verifyPassword(password))) {
    return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng.' });
  }
  res.json({ token: signToken(user), user: user.toPublic() });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toPublic() });
});

// PUT /api/auth/password  { currentPassword, newPassword }
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
  }
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await user.verifyPassword(currentPassword || ''))) {
    return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng.' });
  }
  await user.setPassword(newPassword);
  await user.save();
  res.json({ message: 'Đã đổi mật khẩu thành công.' });
});

// PUT /api/auth/username  { username } — allowed only ONCE
export const changeUsername = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.usernameChanged) {
    return res.status(400).json({ message: 'Bạn chỉ được đổi tên đăng nhập một lần duy nhất.' });
  }
  const uname = String(req.body.username || '').trim().toLowerCase();
  if (!USERNAME_RE.test(uname)) {
    return res.status(400).json({ message: 'Tên đăng nhập 3-15 ký tự, chỉ gồm chữ, số và dấu gạch dưới.' });
  }
  if (uname === user.username) {
    return res.status(400).json({ message: 'Tên đăng nhập mới trùng với tên hiện tại.' });
  }
  if (await User.exists({ username: uname })) {
    return res.status(409).json({ message: 'Tên đăng nhập này đã được sử dụng.' });
  }
  user.username = uname;
  user.usernameChanged = true;
  await user.save();
  res.json({ message: 'Đã đổi tên đăng nhập.', user: user.toPublic() });
});

// POST /api/auth/forgot  { identifier } -> returns a reset token (dev; normally emailed)
export const forgotPassword = asyncHandler(async (req, res) => {
  const id = String(req.body.identifier || '').trim().toLowerCase();
  const query = id.includes('@') ? { email: id } : { username: id };
  const user = await User.findOne(query);
  // Always respond success to avoid leaking which accounts exist.
  if (!user) return res.json({ message: 'Nếu tài khoản tồn tại, mã đặt lại đã được tạo.' });

  const raw = crypto.randomBytes(24).toString('hex');
  user.resetToken = crypto.createHash('sha256').update(raw).digest('hex');
  user.resetTokenExp = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  await user.save();
  // No email service in local mode -> return the token so the reset can be completed.
  res.json({ message: 'Đã tạo mã đặt lại mật khẩu (hiệu lực 30 phút).', resetToken: raw });
});

// POST /api/auth/reset  { token, newPassword }
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ message: 'Thiếu mã hoặc mật khẩu mới quá ngắn (tối thiểu 6 ký tự).' });
  }
  const hashed = crypto.createHash('sha256').update(String(token)).digest('hex');
  const user = await User.findOne({ resetToken: hashed, resetTokenExp: { $gt: new Date() } }).select('+resetToken +resetTokenExp');
  if (!user) return res.status(400).json({ message: 'Mã đặt lại không hợp lệ hoặc đã hết hạn.' });

  await user.setPassword(newPassword);
  user.resetToken = undefined;
  user.resetTokenExp = undefined;
  await user.save();
  res.json({ message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' });
});
