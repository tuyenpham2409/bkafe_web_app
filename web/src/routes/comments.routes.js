import { Router } from 'express';
import { api } from '../lib/apiClient.js';
import { upload } from '../middlewares/upload.js';

const router = Router();

// 1. Submit a top-level comment
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
    res.redirect(`/post/${postId}?noview=1&success=${encodeURIComponent('Đã đăng bình luận thành công.')}#comment-${created.id}`);
  } catch (err) {
    res.redirect(`/post/${postId}?noview=1&error=${encodeURIComponent(err.message)}#comments-section`);
  }
});

// 2. Submit a nested reply
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
    res.redirect(`/post/${postId}?noview=1&success=${encodeURIComponent('Đã trả lời thành công.')}#comment-${created.id}`);
  } catch (err) {
    res.redirect(`/post/${postId}?noview=1&error=${encodeURIComponent(err.message)}#comment-${id}`);
  }
});

// 3. Rate a comment
router.post('/comments/:id/rate', async (req, res) => {
  const { id } = req.params;
  const { value, postId } = req.body;
  try {
    await api.post(`/comments/${id}/rate`, { value: Number(value) }, req);
    res.redirect(`/post/${postId}?noview=1#comment-${id}`);
  } catch (err) {
    res.redirect(`/post/${postId}?noview=1&error=${encodeURIComponent(err.message)}#comment-${id}`);
  }
});

// 4. Edit a comment
router.post('/comments/:id/edit', upload.array('media', 5), async (req, res) => {
  const { id } = req.params;
  const { content, keepMedia, postId } = req.body;
  try {
    const formData = new FormData();
    formData.append('content', content);

    if (keepMedia !== undefined) {
      formData.append('keepMedia', keepMedia);
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const blob = new Blob([file.buffer], { type: file.mimetype });
        formData.append('media', blob, file.originalname);
      }
    }

    await api.put(`/comments/${id}`, formData, req);
    res.redirect(`/post/${postId}?noview=1&success=${encodeURIComponent('Đã sửa bình luận thành công.')}#comment-${id}`);
  } catch (err) {
    res.redirect(`/post/${postId}?noview=1&error=${encodeURIComponent(err.message)}#comment-${id}`);
  }
});

// 5. Delete a comment
router.post('/comments/:id/delete', async (req, res) => {
  const { id } = req.params;
  const { postId } = req.body;
  try {
    await api.del(`/comments/${id}`, null, req);
    res.redirect(`/post/${postId}?noview=1&success=${encodeURIComponent('Đã xoá bình luận.')}#comments-section`);
  } catch (err) {
    res.redirect(`/post/${postId}?noview=1&error=${encodeURIComponent(err.message)}#comments-section`);
  }
});

export default router;
