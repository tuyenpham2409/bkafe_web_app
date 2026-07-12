import { Router } from 'express';
import { api } from '../lib/apiClient.js';
import { upload } from '../middlewares/upload.js';

const router = Router();


router.post('/post/:postId/comments', upload.array('media', 5), async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  try {
    const formData = new FormData();
    formData.append('content', content);

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const blob = new Blob([file.buffer], { type: file.mimetype });
        formData.append('media', blob, file.originalname);
      }
    }

    const created = await api.post(`/posts/${postId}/comments`, formData, req);
    if (req.headers.accept?.includes('application/json')) {
      const postObj = await api.get(`/posts/${postId}?noview=1`, req);
      return res.render('partials/comment', {
        comment: created,
        comments: [created],
        post: postObj,
        depth: 0
      }, (err, html) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ success: true, html, id: created.id });
      });
    }
    res.redirect(`/post/${postId}?noview=1&success=${encodeURIComponent('Đã đăng bình luận thành công.')}#comment-${created.id}`);
  } catch (err) {
    if (req.headers.accept?.includes('application/json')) {
      return res.status(err.status || 500).json({ message: err.message });
    }
    res.redirect(`/post/${postId}?noview=1&error=${encodeURIComponent(err.message)}#comments-section`);
  }
});


router.post('/comments/:id/reply', upload.array('media', 5), async (req, res) => {
  const { id } = req.params;
  const { content, postId } = req.body;
  try {
    const formData = new FormData();
    formData.append('content', content);

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const blob = new Blob([file.buffer], { type: file.mimetype });
        formData.append('media', blob, file.originalname);
      }
    }

    const created = await api.post(`/comments/${id}/reply`, formData, req);
    if (req.headers.accept?.includes('application/json')) {
      const postObj = await api.get(`/posts/${postId}?noview=1`, req);
      const parentDepth = Number(req.body.depth || 0);
      return res.render('partials/comment', {
        comment: created,
        comments: [created],
        post: postObj,
        depth: parentDepth + 1
      }, (err, html) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ success: true, html, id: created.id });
      });
    }
    res.redirect(`/post/${postId}?noview=1&success=${encodeURIComponent('Đã trả lời thành công.')}#comment-${created.id}`);
  } catch (err) {
    if (req.headers.accept?.includes('application/json')) {
      return res.status(err.status || 500).json({ message: err.message });
    }
    res.redirect(`/post/${postId}?noview=1&error=${encodeURIComponent(err.message)}#comment-${id}`);
  }
});


router.post('/comments/:id/rate', async (req, res) => {
  const { id } = req.params;
  const { value, postId } = req.body;
  try {
    const result = await api.post(`/comments/${id}/rate`, { value: Number(value) }, req);
    if (req.headers.accept?.includes('application/json')) {
      return res.json(result);
    }
    res.redirect(`/post/${postId}?noview=1#comment-${id}`);
  } catch (err) {
    if (req.headers.accept?.includes('application/json')) {
      return res.status(err.status || 500).json({ message: err.message });
    }
    res.redirect(`/post/${postId}?noview=1&error=${encodeURIComponent(err.message)}#comment-${id}`);
  }
});


router.post('/comments/:id/edit', upload.array('media', 5), async (req, res) => {
  const { id } = req.params;
  const { content, keepMedia, postId } = req.body;
  try {
    const formData = new FormData();
    formData.append('content', content);

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

    const updated = await api.put(`/comments/${id}`, formData, req);
    if (req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, comment: updated });
    }
    res.redirect(`/post/${postId}?noview=1&success=${encodeURIComponent('Đã sửa bình luận thành công.')}#comment-${id}`);
  } catch (err) {
    if (req.headers.accept?.includes('application/json')) {
      return res.status(err.status || 500).json({ message: err.message });
    }
    res.redirect(`/post/${postId}?noview=1&error=${encodeURIComponent(err.message)}#comment-${id}`);
  }
});


router.post('/comments/:id/delete', async (req, res) => {
  const { id } = req.params;
  const { postId } = req.body;
  try {
    await api.del(`/comments/${id}`, null, req);
    if (req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, message: 'Đã xoá bình luận.' });
    }
    res.redirect(`/post/${postId}?noview=1&success=${encodeURIComponent('Đã xoá bình luận.')}#comments-section`);
  } catch (err) {
    if (req.headers.accept?.includes('application/json')) {
      return res.status(err.status || 500).json({ message: err.message });
    }
    res.redirect(`/post/${postId}?noview=1&error=${encodeURIComponent(err.message)}#comments-section`);
  }
});

export default router;
