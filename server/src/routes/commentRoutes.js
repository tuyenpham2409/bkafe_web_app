import { Router } from 'express';
import { auth, isAdmin } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import * as cm from '../controllers/commentController.js';

const r = Router();
r.get('/', auth(), isAdmin, cm.listAllComments); // admin moderation list
r.post('/:id/reply', auth(), upload.array('media', 5), cm.replyComment);
r.post('/:id/rate', auth(), cm.rateComment);
r.put('/:id', auth(), upload.array('media', 5), cm.updateComment);
r.delete('/:id', auth(), cm.deleteComment);

export default r;
