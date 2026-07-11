import { Router } from 'express';
import { api } from '../lib/apiClient.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { upload } from '../middlewares/upload.js';

const router = Router();

// GET /profile/:id - User profile page (own posts included)
router.get('/profile/:id', async (req, res, next) => {
  const { id } = req.params;
  const isOwnProfile = res.locals.currentUser?.id === id;
  try {
    const [profile, posts] = await Promise.all([
      api.get(`/users/${id}`, req),
      // Own profile sees pending/rejected posts too; other users only ever see approved ones.
      isOwnProfile
        ? api.get('/posts?status=mine&sort=newest', req)
        : api.get(`/posts?author=${id}&sort=newest`, req),
    ]);
    res.render('pages/profile', {
      profile,
      posts,
      error: req.query.error || null,
      success: req.query.success || null,
    });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).render('errors/404');
    }
    next(err);
  }
});

// POST /profile/edit - Edit own display name & bio
router.post('/profile/edit', requireAuth, async (req, res) => {
  const { displayName, bio } = req.body;
  const userId = res.locals.currentUser?.id;
  try {
    await api.put('/users/me', { displayName, bio }, req);
    res.redirect(`/profile/${userId}?success=${encodeURIComponent('Cập nhật thông tin cá nhân thành công.')}`);
  } catch (err) {
    res.redirect(`/profile/${userId}?edit=1&error=${encodeURIComponent(err.message)}`);
  }
});

// POST /profile/avatar - Instant avatar upload (stored as base64 data URL, like the API expects)
router.post('/profile/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  const userId = res.locals.currentUser?.id;
  try {
    if (!req.file) throw new Error('Vui lòng chọn một tệp ảnh.');
    const base64Photo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    await api.put('/users/me', { photoURL: base64Photo }, req);
    res.redirect(`/profile/${userId}?success=${encodeURIComponent('Đã cập nhật ảnh đại diện.')}`);
  } catch (err) {
    res.redirect(`/profile/${userId}?error=${encodeURIComponent(err.message)}`);
  }
});

// POST /profile/username - Edit own username (allowed once)
router.post('/profile/username', requireAuth, async (req, res) => {
  const { username } = req.body;
  const userId = res.locals.currentUser?.id;
  try {
    await api.put('/auth/username', { username }, req);
    res.redirect(`/profile/${userId}?settings=1&success=${encodeURIComponent('Thay đổi tên đăng nhập thành công.')}`);
  } catch (err) {
    res.redirect(`/profile/${userId}?settings=1&error=${encodeURIComponent(err.message)}`);
  }
});

// POST /profile/password - Change password
router.post('/profile/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = res.locals.currentUser?.id;
  try {
    await api.put('/auth/password', { currentPassword, newPassword }, req);
    res.redirect(`/profile/${userId}?settings=1&success=${encodeURIComponent('Đổi mật khẩu thành công.')}`);
  } catch (err) {
    res.redirect(`/profile/${userId}?settings=1&error=${encodeURIComponent(err.message)}`);
  }
});

export default router;
