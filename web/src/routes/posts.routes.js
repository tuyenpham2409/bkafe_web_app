import { Router } from 'express';
import { api } from '../lib/apiClient.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';
import { upload } from '../middlewares/upload.js';

const router = Router();

// Render post detail page
router.get('/post/:id', async (req, res, next) => {
  const { id } = req.params;
  const noView = req.query.noview === '1';
  try {
    // Fetch post and comments in parallel
    const [post, comments] = await Promise.all([
      api.get(`/posts/${id}${noView ? '?noview=1' : ''}`, req),
      api.get(`/posts/${id}/comments`, req)
    ]);

    res.render('pages/post-detail', {
      post,
      comments,
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

// Render create post page
router.get('/create-post', requireAuth, (req, res) => {
  res.render('pages/create-post', {
    post: null,
    error: req.query.error || null,
  });
});

// Handle post creation
router.post('/create-post', requireAuth, upload.array('media', 5), async (req, res) => {
  const { title, content, topic } = req.body;
  try {
    const formData = new FormData();
    formData.append('title', title || '');
    formData.append('content', content);
    formData.append('topic', topic);

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const blob = new Blob([file.buffer], { type: file.mimetype });
        formData.append('media', blob, file.originalname);
      }
    }

    const post = await api.post('/posts', formData, req);
    
    // Redirect with message based on approval status
    if (post.status === 'approved') {
      res.redirect(`/post/${post.id}?success=${encodeURIComponent('Đăng bài viết thành công!')}`);
    } else {
      res.redirect(`/?notice=${encodeURIComponent('Bài viết của bạn đã được gửi và đang chờ ban quản trị phê duyệt.')}`);
    }
  } catch (err) {
    res.redirect(`/create-post?error=${encodeURIComponent(err.message)}`);
  }
});

// Render edit post page
router.get('/post/:id/edit', requireAuth, async (req, res, next) => {
  const { id } = req.params;
  try {
    const post = await api.get(`/posts/${id}?noview=1`, req);
    if (post.authorId !== res.locals.currentUser?.id) {
      return res.status(403).send('Bạn không có quyền sửa bài viết này.');
    }
    res.render('pages/create-post', {
      post,
      error: req.query.error || null,
    });
  } catch (err) {
    next(err);
  }
});

// Handle post update
router.post('/post/:id/edit', requireAuth, upload.array('media', 5), async (req, res) => {
  const { id } = req.params;
  const { title, content, topic, keepMedia } = req.body;
  try {
    const formData = new FormData();
    formData.append('title', title || '');
    formData.append('content', content);
    formData.append('topic', topic);

    if (keepMedia !== undefined) {
      if (Array.isArray(keepMedia)) {
        formData.append('keepMedia', JSON.stringify(keepMedia));
      } else {
        formData.append('keepMedia', JSON.stringify([keepMedia]));
      }
    } else {
      formData.append('keepMedia', JSON.stringify([]));
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const blob = new Blob([file.buffer], { type: file.mimetype });
        formData.append('media', blob, file.originalname);
      }
    }

    const post = await api.put(`/posts/${id}`, formData, req);

    if (post.status === 'approved') {
      res.redirect(`/post/${id}?noview=1&success=${encodeURIComponent('Đã cập nhật bài viết thành công.')}`);
    } else {
      res.redirect(`/?notice=${encodeURIComponent('Bài viết đã được cập nhật và đang chờ duyệt lại.')}`);
    }
  } catch (err) {
    res.redirect(`/post/${id}/edit?error=${encodeURIComponent(err.message)}`);
  }
});

// Admin Approve post (returnTo lets the admin posts list stay on itself instead of
// jumping to the post detail page)
router.post('/admin/posts/:id/approve', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const returnTo = req.body.returnTo || `/post/${id}?noview=1`;
  const sep = returnTo.includes('?') ? '&' : '?';
  try {
    await api.patch(`/posts/${id}/approve`, {}, req);
    res.redirect(`${returnTo}${sep}success=${encodeURIComponent('Đã duyệt bài viết.')}`);
  } catch (err) {
    res.redirect(`${returnTo}${sep}error=${encodeURIComponent(err.message)}`);
  }
});

// Admin Reject post
router.post('/admin/posts/:id/reject', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { reason, returnTo: rt } = req.body;
  const returnTo = rt || `/post/${id}?noview=1`;
  const sep = returnTo.includes('?') ? '&' : '?';
  try {
    await api.patch(`/posts/${id}/reject`, { reason }, req);
    res.redirect(`${returnTo}${sep}success=${encodeURIComponent('Đã từ chối duyệt bài viết.')}`);
  } catch (err) {
    res.redirect(`${returnTo}${sep}error=${encodeURIComponent(err.message)}`);
  }
});

// Delete post (Admin or Owner)
router.post('/admin/posts/:id/delete', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { reason, returnTo: rt } = req.body;
  const returnTo = rt || '/';
  const sep = returnTo.includes('?') ? '&' : '?';
  try {
    await api.del(`/posts/${id}`, { reason }, req);
    res.redirect(`${returnTo}${sep}success=${encodeURIComponent('Đã xóa bài viết.')}`);
  } catch (err) {
    res.redirect(`/post/${id}?noview=1&error=${encodeURIComponent(err.message)}`);
  }
});

// Rate post route
router.post('/post/:id/rate', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { value } = req.body;
  try {
    await api.post(`/posts/${id}/rate`, { value: Number(value) }, req);
    res.redirect(`/post/${id}?noview=1`);
  } catch (err) {
    res.redirect(`/post/${id}?noview=1&error=${encodeURIComponent(err.message)}`);
  }
});

// Share post route
router.post('/post/:id/share', async (req, res) => {
  const { id } = req.params;
  try {
    await api.post(`/posts/${id}/share`, {}, req);
    res.redirect(`/post/${id}?noview=1`);
  } catch (err) {
    res.redirect(`/post/${id}?noview=1&error=${encodeURIComponent(err.message)}`);
  }
});

export default router;
