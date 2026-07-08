import { Router } from 'express';
import { api } from '../lib/apiClient.js';

const router = Router();

const SORTS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'rating_desc', label: 'Đánh giá cao → thấp' },
  { value: 'rating_asc', label: 'Đánh giá thấp → cao' },
];

// GET /search?q=&tab=posts|users&sort=&topic=
router.get('/search', async (req, res, next) => {
  const q = req.query.q || '';
  const tab = req.query.tab === 'users' ? 'users' : 'posts';
  const sort = req.query.sort || 'newest';
  const topic = req.query.topic || 'all';

  if (!q) {
    return res.render('pages/search', {
      q, tab, sort, topic, SORTS, posts: [], users: [],
    });
  }

  try {
    const params = new URLSearchParams({ q });
    if (topic !== 'all') params.set('topic', topic);
    const [rawPosts, users] = await Promise.all([
      api.get(`/posts?status=approved&${params.toString()}`, req),
      api.get(`/users/search?q=${encodeURIComponent(q)}`, req),
    ]);

    const posts = [...rawPosts].sort((a, b) => {
      if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === 'rating_desc') return (b.ratingAvg || 0) - (a.ratingAvg || 0);
      if (sort === 'rating_asc') return (a.ratingAvg || 0) - (b.ratingAvg || 0);
      return new Date(b.createdAt) - new Date(a.createdAt); // newest
    });

    res.render('pages/search', { q, tab, sort, topic, SORTS, posts, users });
  } catch (err) {
    next(err);
  }
});

export default router;
