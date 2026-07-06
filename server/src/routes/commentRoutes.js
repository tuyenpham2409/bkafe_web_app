import { Router } from 'express';
import { auth, isAdmin } from '../middlewares/auth.js';
import * as cm from '../controllers/commentController.js';

const r = Router();
r.get('/', auth(), isAdmin, cm.listAllComments); // admin moderation list
r.post('/:id/reply', auth(), cm.replyComment);
r.post('/:id/rate', auth(), cm.rateComment);
r.delete('/:id', auth(), isAdmin, cm.deleteComment);

export default r;
