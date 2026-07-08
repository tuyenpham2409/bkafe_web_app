import { Router } from 'express';
import { api } from '../lib/apiClient.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

// Get notification list
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const data = await api.get('/notifications', req);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// Mark all notifications read
router.post('/notifications/read-all', requireAuth, async (req, res) => {
  try {
    const data = await api.patch('/notifications/read-all', {}, req);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// Mark specific notification read
router.post('/notifications/:id/read', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const data = await api.patch(`/notifications/${id}/read`, {}, req);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

// Increment website views count
router.post('/stats/view', async (req, res) => {
  try {
    const data = await api.post('/stats/view', {}, req);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

export default router;
