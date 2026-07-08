import { api } from '../lib/apiClient.js';

export async function loadTopics(req, res, next) {
  try {
    const topics = await api.get('/topics', req);
    res.locals.topics = topics || [];
  } catch (err) {
    console.error('[web loadTopics error]', err.message);
    res.locals.topics = [];
  }
  next();
}
