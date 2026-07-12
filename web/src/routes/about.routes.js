import { Router } from 'express';
import { api } from '../lib/apiClient.js';
import { upload } from '../middlewares/upload.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';

const router = Router();




router.get('/about', async (req, res, next) => {
  if (res.locals.currentUser?.role === 'admin') {
    try {
      const feedbacks = await api.get('/contacts', req);
      return res.render('pages/admin-inbox', {
        feedbacks,
        error: req.query.error || null,
        success: req.query.success || null,
      });
    } catch (err) {
      return next(err);
    }
  }
  res.render('pages/about-contact', {
    error: req.query.error || null,
    success: req.query.success || null,
  });
});


router.post('/about', upload.array('media', 5), async (req, res) => {
  const { name, email, message } = req.body;
  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('message', message);

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const blob = new Blob([file.buffer], { type: file.mimetype });
        formData.append('media', blob, file.originalname);
      }
    }

    await api.post('/contacts', formData, req);
    res.redirect(`/about?success=${encodeURIComponent('Góp ý của bạn đã được gửi thành công! Cảm ơn ý kiến của bạn.')}`);
  } catch (err) {
    res.redirect(`/about?error=${encodeURIComponent(err.message)}`);
  }
});


router.post('/about/:id/toggle', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await api.patch(`/contacts/${id}/handled`, {}, req);
    res.redirect(`/about?success=${encodeURIComponent('Đã cập nhật trạng thái góp ý.')}`);
  } catch (err) {
    res.redirect(`/about?error=${encodeURIComponent(err.message)}`);
  }
});


router.post('/about/:id/delete', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await api.del(`/contacts/${id}`, null, req);
    res.redirect(`/about?success=${encodeURIComponent('Đã xóa góp ý.')}`);
  } catch (err) {
    res.redirect(`/about?error=${encodeURIComponent(err.message)}`);
  }
});

export default router;
