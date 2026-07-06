import { Router } from 'express';
import { auth, isAdmin } from '../middlewares/auth.js';
import * as u from '../controllers/userController.js';

const r = Router();
// own profile update (must come before '/:id' matching for clarity)
r.put('/me', auth(), u.updateMe);

// admin user management
r.get('/', auth(), isAdmin, u.listUsers);
r.post('/', auth(), isAdmin, u.createUser);
r.put('/:id', auth(), isAdmin, u.adminUpdateUser);
r.delete('/:id', auth(), isAdmin, u.deleteUser);

// public profile
r.get('/:id', auth(false), u.getProfile);

export default r;
