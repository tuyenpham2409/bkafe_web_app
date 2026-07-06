import Notification from '../models/Notification.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

// GET /api/notifications  (mine)
export const listMine = asyncHandler(async (req, res) => {
  const items = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
  const unread = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({
    unread,
    items: items.map((n) => ({
      id: String(n._id),
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      read: n.read,
      createdAt: n.createdAt,
    })),
  });
});

// PATCH /api/notifications/:id/read
export const markRead = asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { read: true });
  res.json({ message: 'ok' });
});

// PATCH /api/notifications/read-all
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ message: 'ok' });
});
