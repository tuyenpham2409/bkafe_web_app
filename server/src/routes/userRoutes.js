import { Router } from 'express';
import { auth, isAdmin } from '../middlewares/auth.js';
import * as u from '../controllers/userController.js';

const r = Router();

r.put('/me', auth(), u.updateMe);


r.get('/search', u.searchUsers);


r.get('/', auth(), isAdmin, u.listUsers);
r.post('/', auth(), isAdmin, u.createUser);
r.patch('/:id/ban', auth(), isAdmin, u.banUser);
r.put('/:id', auth(), isAdmin, u.adminUpdateUser);
r.delete('/:id', auth(), isAdmin, u.deleteUser);


r.get('/:id', auth(false), u.getProfile);

export default r;
