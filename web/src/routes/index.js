import { Router } from 'express';
import authRouter from './auth.routes.js';
import homeRouter from './home.routes.js';
import postsRouter from './posts.routes.js';
import commentsRouter from './comments.routes.js';
import apiRouter from './api.routes.js';
import aboutRouter from './about.routes.js';
import profileRouter from './profile.routes.js';
import adminRouter from './admin.routes.js';
import searchRouter from './search.routes.js';

const router = Router();


router.use('/', authRouter);
router.use('/', homeRouter);
router.use('/', postsRouter);
router.use('/', commentsRouter);
router.use('/', aboutRouter);
router.use('/', profileRouter);
router.use('/', adminRouter);
router.use('/', searchRouter);
router.use('/api', apiRouter);


router.get('/health', (req, res) => res.send('OK'));

export default router;
