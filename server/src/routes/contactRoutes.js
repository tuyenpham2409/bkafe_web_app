import { Router } from 'express';
import { auth, isAdmin } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import * as c from '../controllers/contactController.js';

const r = Router();
r.post('/', auth(false), upload.array('media', 5), c.createContact); // public; user attached if logged in; hỗ trợ upload tối đa 5 file
r.get('/', auth(), isAdmin, c.listContacts);
r.patch('/:id/handled', auth(), isAdmin, c.toggleHandled);
r.delete('/:id', auth(), isAdmin, c.deleteContact);

export default r;
