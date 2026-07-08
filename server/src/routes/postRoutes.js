import { Router } from 'express';
import { auth, isAdmin } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import * as p from '../controllers/postController.js';
import * as cm from '../controllers/commentController.js';

const r = Router();

// posts
r.get('/', auth(false), p.listPosts);
r.get('/:id', auth(false), p.getPost);
r.post('/', auth(), upload.array('media', 5), p.createPost);
r.put('/:id', auth(), upload.array('media', 5), p.updatePost);
r.delete('/:id', auth(), p.deletePost);
r.patch('/:id/approve', auth(), isAdmin, p.approvePost);
r.patch('/:id/reject', auth(), isAdmin, p.rejectPost);
r.post('/:id/rate', auth(), p.ratePost);
r.post('/:id/share', auth(false), p.sharePost);

// comments nested under a post
r.get('/:postId/comments', auth(false), cm.listComments);
r.post('/:postId/comments', auth(), upload.array('media', 5), cm.createComment);


export default r;
