import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import * as n from '../controllers/notificationController.js';

const r = Router();
r.get('/', auth(), n.listMine);
r.patch('/read-all', auth(), n.markAllRead);
r.patch('/:id/read', auth(), n.markRead);

export default r;
