import { Router } from 'express';
import { api } from '../lib/apiClient.js';

const router = Router();

router.get('/', async (req, res, next) => {
  const sort = req.query.sort || 'newest';
  try {
    const posts = await api.get(`/posts?status=approved&sort=${sort}`, req);
    res.render('pages/home', {
      posts,
      sort,
      currentTopic: null,
      error: req.query.error || null,
      success: req.query.success || null,
      notice: req.query.notice || null,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/topic/:slug', async (req, res, next) => {
  const { slug } = req.params;
  const sort = req.query.sort || 'newest';
  try {
    const posts = await api.get(`/posts?status=approved&topic=${slug}&sort=${sort}`, req);
    
    
    const topicObj = res.locals.topics?.find(t => t.slug === slug);
    const topicName = topicObj ? topicObj.name : slug;

    res.render('pages/home', {
      posts,
      sort,
      currentTopic: { slug, name: topicName },
      error: req.query.error || null,
      success: req.query.success || null,
      notice: req.query.notice || null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
