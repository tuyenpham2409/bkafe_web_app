import { Router } from 'express';
import { api } from '../lib/apiClient.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();


router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const data = await api.get('/notifications', req);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});


router.post('/notifications/read-all', requireAuth, async (req, res) => {
  try {
    const data = await api.patch('/notifications/read-all', {}, req);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});


router.post('/notifications/:id/read', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const data = await api.patch(`/notifications/${id}/read`, {}, req);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});


router.get('/admin/stats', async (req, res) => {
  if (!res.locals.currentUser || res.locals.currentUser.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const [stats, contacts] = await Promise.all([
      api.get('/stats', req),
      api.get('/contacts', req),
    ]);
    res.json({
      pendingPosts: stats.pendingPosts || 0,
      unreadContacts: contacts.filter(c => !c.handled).length,
    });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});


router.get('/posts', async (req, res) => {
  try {
    const { topic, sort = 'newest' } = req.query;
    let qs = `?status=approved&sort=${sort}`;
    if (topic) qs += `&topic=${encodeURIComponent(topic)}`;
    const posts = await api.get(`/posts${qs}`, req);
    res.json(posts);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});


router.post('/stats/view', async (req, res) => {
  try {
    const data = await api.post('/stats/view', {}, req);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

export default router;
