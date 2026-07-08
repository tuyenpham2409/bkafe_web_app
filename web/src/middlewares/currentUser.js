import { api } from '../lib/apiClient.js';

export async function currentUser(req, res, next) {
  res.locals.currentUser = null;
  const token = req.cookies?.bkafe_token;

  if (token) {
    try {
      const data = await api.get('/auth/me', req);
      res.locals.currentUser = data.user;
    } catch (err) {
      // Clear cookie if token is invalid or expired
      res.clearCookie('bkafe_token');
    }
  }
  next();
}
