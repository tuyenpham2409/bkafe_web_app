import { Router } from 'express';
import { auth, isAdmin } from '../middlewares/auth.js';
import * as u from '../controllers/userController.js';

const r = Router();
// own profile update (must come before '/:id' matching for clarity)
r.put('/me', auth(), u.updateMe);

// tìm kiếm user công khai (phải đặt trước /:id để tránh match nhầm)
r.get('/search', u.searchUsers);

// admin user management
r.get('/', auth(), isAdmin, u.listUsers);
r.post('/', auth(), isAdmin, u.createUser);
r.patch('/:id/ban', auth(), isAdmin, u.banUser);
r.put('/:id', auth(), isAdmin, u.adminUpdateUser);
r.delete('/:id', auth(), isAdmin, u.deleteUser);

// public profile
r.get('/:id', auth(false), u.getProfile);

export default r;
