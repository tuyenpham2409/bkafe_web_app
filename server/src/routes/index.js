import { Router } from 'express';
import authRoutes from './authRoutes.js';
import postRoutes from './postRoutes.js';
import commentRoutes from './commentRoutes.js';
import userRoutes from './userRoutes.js';
import contactRoutes from './contactRoutes.js';
import topicRoutes from './topicRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import statsRoutes from './statsRoutes.js';

const api = Router();
api.get('/health', (_req, res) => res.json({ ok: true, service: 'bkafe-api' }));
api.use('/auth', authRoutes);
api.use('/posts', postRoutes);
api.use('/comments', commentRoutes);
api.use('/users', userRoutes);
api.use('/contacts', contactRoutes);
api.use('/topics', topicRoutes);
api.use('/notifications', notificationRoutes);
api.use('/stats', statsRoutes);

export default api;
