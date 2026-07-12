import { Router } from 'express';
import { api } from '../lib/apiClient.js';

const router = Router();

router.get('/login', (req, res) => {
  if (res.locals.currentUser) {
    return res.redirect('/');
  }
  res.render('pages/login', {
    error: req.query.error || null,
    success: req.query.success || null,
    next: req.query.next || '/',
  });
});

router.post('/login', async (req, res) => {
  const { identifier, password, next = '/' } = req.body;
  try {
    const data = await api.post('/auth/login', { identifier, password });
    
    
    res.cookie('bkafe_token', data.token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, 
      sameSite: 'lax',
    });
    
    res.redirect(next);
  } catch (err) {
    const nextUrl = encodeURIComponent(next);
    res.redirect(`/login?next=${nextUrl}&error=${encodeURIComponent(err.message)}`);
  }
});

router.get('/register', (req, res) => {
  if (res.locals.currentUser) {
    return res.redirect('/');
  }
  res.render('pages/register', {
    error: req.query.error || null,
  });
});

router.post('/register', async (req, res) => {
  const { username, displayName, email, password } = req.body;
  try {
    const data = await api.post('/auth/register', { username, displayName, email, password });
    
    
    res.cookie('bkafe_token', data.token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, 
      sameSite: 'lax',
    });
    
    res.redirect('/');
  } catch (err) {
    res.redirect(`/register?error=${encodeURIComponent(err.message)}`);
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('bkafe_token');
  res.redirect('/');
});

export default router;
