import { Router } from 'express';
import { auth, isAdmin } from '../middlewares/auth.js';
import * as t from '../controllers/topicController.js';

const r = Router();
r.get('/', t.listTopics);
r.get('/counts', t.topicCounts);
r.put('/:slug', auth(), isAdmin, t.updateTopic);

export default r;
