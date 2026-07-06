import { Router } from 'express';
import { auth, isAdmin } from '../middlewares/auth.js';
import * as c from '../controllers/contactController.js';

const r = Router();
r.post('/', auth(false), c.createContact); // public; user attached if logged in
r.get('/', auth(), isAdmin, c.listContacts);
r.patch('/:id/handled', auth(), isAdmin, c.toggleHandled);
r.delete('/:id', auth(), isAdmin, c.deleteContact);

export default r;
