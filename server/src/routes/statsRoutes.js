import { Router } from 'express';
import { auth, isAdmin } from '../middlewares/auth.js';
import * as s from '../controllers/statsController.js';

const r = Router();
r.post('/view', s.trackView); 
r.get('/', auth(), isAdmin, s.getStats);

export default r;
