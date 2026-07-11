import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import * as c from '../controllers/authController.js';

const r = Router();
r.post('/register', c.register);
r.post('/login', c.login);
r.get('/me', auth(), c.me);
r.put('/password', auth(), c.changePassword);
r.put('/username', auth(), c.changeUsername);

export default r;
