import { Router } from 'express';
import { api } from '../lib/apiClient.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';

const router = Router();

// GET /admin - Admin dashboard (KPIs + section shortcuts)
router.get('/admin', requireAdmin, async (req, res, next) => {
  try {
    const stats = await api.get('/stats', req);
    res.render('pages/admin', {
      stats,
      error: req.query.error || null,
      success: req.query.success || null,
    });
  } catch (err) {
    next(err);
  }
});

// ───────────────────────── Users management ─────────────────────────

// GET /admin/users - list + search + role filter + sort (all via query string, no JS needed)
router.get('/admin/users', requireAdmin, async (req, res, next) => {
  try {
    const users = await api.get('/users', req);
    const q = String(req.query.q || '').toLowerCase();
    const roleFilter = req.query.role || 'all';
    const sortBy = req.query.sort || 'newest';

    let filtered = users.filter((u) => {
      const matchesQ = !q || u.displayName?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesQ && matchesRole;
    });
    filtered = filtered.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.joinedAt) - new Date(b.joinedAt);
      if (sortBy === 'active') return new Date(b.lastActiveAt || 0) - new Date(a.lastActiveAt || 0);
      return new Date(b.joinedAt) - new Date(a.joinedAt); // newest
    });

    res.render('pages/admin-users', {
      users: filtered,
      q: req.query.q || '',
      roleFilter,
      sortBy,
      error: req.query.error || null,
      success: req.query.success || null,
    });
  } catch (err) {
    next(err);
  }
});

// POST /admin/users - Create a new user
router.post('/admin/users', requireAdmin, async (req, res) => {
  const { username, displayName, email, password, role } = req.body;
  try {
    await api.post('/users', { username, displayName, email, password, role }, req);
    res.redirect(`/admin/users?success=${encodeURIComponent('Đã thêm tài khoản mới.')}`);
  } catch (err) {
    res.redirect(`/admin/users?error=${encodeURIComponent(err.message)}`);
  }
});

// POST /admin/users/:id/reset-password - Admin resets a user's password
router.post('/admin/users/:id/reset-password', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  try {
    await api.put(`/users/${id}`, { password }, req);
    res.redirect(`/admin/users?success=${encodeURIComponent('Đã đặt lại mật khẩu.')}`);
  } catch (err) {
    res.redirect(`/admin/users?error=${encodeURIComponent(err.message)}`);
  }
});

// POST /admin/users/:id/ban - Ban/unban user
router.post('/admin/users/:id/ban', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const bannedPosting = req.body.bannedPosting === 'on' || req.body.bannedPosting === 'true';
  const bannedCommenting = req.body.bannedCommenting === 'on' || req.body.bannedCommenting === 'true';
  const { reason } = req.body;

  try {
    await api.patch(`/users/${id}/ban`, {
      bannedPosting,
      bannedCommenting,
      reason: reason || '',
    }, req);
    res.redirect(`/admin/users?success=${encodeURIComponent('Đã cập nhật trạng thái hạn chế người dùng.')}`);
  } catch (err) {
    res.redirect(`/admin/users?error=${encodeURIComponent(err.message)}`);
  }
});

// POST /admin/users/:id/role - Update user role
router.post('/admin/users/:id/role', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    await api.put(`/users/${id}`, { role }, req);
    res.redirect(`/admin/users?success=${encodeURIComponent('Đã cập nhật vai trò người dùng.')}`);
  } catch (err) {
    res.redirect(`/admin/users?error=${encodeURIComponent(err.message)}`);
  }
});

// POST /admin/users/:id/delete - Delete user
router.post('/admin/users/:id/delete', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await api.del(`/users/${id}`, null, req);
    res.redirect(`/admin/users?success=${encodeURIComponent('Đã xóa người dùng thành công.')}`);
  } catch (err) {
    res.redirect(`/admin/users?error=${encodeURIComponent(err.message)}`);
  }
});

// ───────────────────────── Posts management ─────────────────────────

// GET /admin/posts - tabs (all/pending/approved) + search + sort, all via query string
router.get('/admin/posts', requireAdmin, async (req, res, next) => {
  try {
    const [pending, approved, rejected] = await Promise.all([
      api.get('/posts?status=pending', req),
      api.get('/posts?status=approved', req),
      api.get('/posts?status=rejected', req),
    ]);
    let allPosts = [...pending, ...approved, ...rejected].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const tab = req.query.tab || 'all';
    const q = String(req.query.q || '').toLowerCase();
    const sortBy = req.query.sort || 'newest';

    let tabPosts = allPosts.filter((p) => (tab === 'all' ? true : p.status === tab));
    tabPosts = tabPosts.filter((p) => {
      const title = (p.title?.trim() || p.content || '').toLowerCase();
      return !q || title.includes(q) || p.authorName?.toLowerCase().includes(q);
    });
    tabPosts = tabPosts.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.render('pages/admin-posts', {
      tabPosts,
      tab,
      q: req.query.q || '',
      sortBy,
      counts: {
        all: allPosts.length,
        pending: pending.length,
        approved: approved.length,
      },
      error: req.query.error || null,
      success: req.query.success || null,
    });
  } catch (err) {
    next(err);
  }
});

// ───────────────────────── Comments moderation ─────────────────────────

// GET /admin/comments - list all comments + search + sort
router.get('/admin/comments', requireAdmin, async (req, res, next) => {
  try {
    const allComments = await api.get('/comments', req);
    const q = String(req.query.q || '').toLowerCase();
    const sortBy = req.query.sort || 'newest';

    let comments = allComments.filter((c) => !q || c.content?.toLowerCase().includes(q) || c.authorName?.toLowerCase().includes(q));
    comments = comments.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.render('pages/admin-comments', {
      comments,
      q: req.query.q || '',
      sortBy,
      error: req.query.error || null,
      success: req.query.success || null,
    });
  } catch (err) {
    next(err);
  }
});

// POST /admin/comments/:id/delete - Delete a comment (moderation)
router.post('/admin/comments/:id/delete', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await api.del(`/comments/${id}`, null, req);
    res.redirect(`/admin/comments?success=${encodeURIComponent('Đã xóa bình luận.')}`);
  } catch (err) {
    res.redirect(`/admin/comments?error=${encodeURIComponent(err.message)}`);
  }
});

export default router;
