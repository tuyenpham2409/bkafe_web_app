// Xuất dữ liệu mẫu hiện có trong MongoDB ra sample-data/*.json (ở gốc repo),
// dùng để nộp bài kèm code khi không thể đính kèm trực tiếp một MongoDB đang chạy.
// Chạy sau khi đã `npm run seed`: `npm run export-sample-data`.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Topic from '../models/Topic.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Contact from '../models/Contact.js';
import Notification from '../models/Notification.js';
import Counter from '../models/Counter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '..', '..', '..', 'sample-data');

const COLLECTIONS = [
  { name: 'topics', model: Topic, selectHidden: '' },
  { name: 'users', model: User, selectHidden: '+passwordHash' },
  { name: 'posts', model: Post, selectHidden: '' },
  { name: 'comments', model: Comment, selectHidden: '' },
  { name: 'contacts', model: Contact, selectHidden: '' },
  { name: 'notifications', model: Notification, selectHidden: '' },
  { name: 'counters', model: Counter, selectHidden: '' },
];

async function run() {
  await connectDB();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const { name, model, selectHidden } of COLLECTIONS) {
    const docs = await model.find().select(selectHidden).lean();
    fs.writeFileSync(path.join(OUT_DIR, `${name}.json`), JSON.stringify(docs, null, 2), 'utf8');
    console.log(`[export] ${name}.json (${docs.length} bản ghi)`);
  }

  console.log(`[export] Hoàn tất -> ${OUT_DIR}`);
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('[export] error:', err);
  process.exit(1);
});
