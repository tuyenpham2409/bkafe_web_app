import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';
import Topic from '../models/Topic.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';

const TOPICS = [
  { slug: 'hoc-tap', name: 'Học tập', description: 'Hỏi đáp bài vở, môn học, kinh nghiệm ôn thi.', order: 1 },
  { slug: 'tai-lieu', name: 'Tài liệu', description: 'Chia sẻ & xin tài liệu, đề thi, slide.', order: 2 },
  { slug: 'doi-song', name: 'Đời sống', description: 'Đời sống sinh viên, ký túc xá, ăn ở đi lại.', order: 3 },
  { slug: 'viec-lam', name: 'Việc làm & CLB', description: 'Việc làm thêm, thực tập, câu lạc bộ.', order: 4 },
];

// username = MSSV (student id)
const USERS = [
  { username: 'admin', displayName: 'Quản trị BKafe', email: 'admin@bkafe.hust.edu.vn', role: 'admin' },
  { username: '20233885', displayName: 'Phạm Minh Tuyên', email: 'tuyen.pm233885@sis.hust.edu.vn', role: 'user' },
  { username: '20230001', displayName: 'Lê Hà Hải Vân', email: 'van.lhh230001@sis.hust.edu.vn', role: 'user' },
  { username: '20230002', displayName: 'Nguyễn Hải Dương', email: 'duong.nh230002@sis.hust.edu.vn', role: 'user' },
  { username: '20230003', displayName: 'Ngọc Lan', email: 'lan.n230003@sis.hust.edu.vn', role: 'user' },
];

async function upsertUser(data) {
  let user = await User.findOne({ username: data.username });
  if (!user) {
    user = new User(data);
    await user.setPassword(env.seedPassword);
    await user.save();
    console.log(`  + user ${data.username} (${data.displayName})`);
  }
  return user;
}

async function run() {
  await connectDB();

  console.log('[seed] topics...');
  for (const t of TOPICS) {
    await Topic.updateOne({ slug: t.slug }, { $set: t }, { upsert: true });
  }

  console.log('[seed] users (default password = ' + env.seedPassword + ')...');
  const users = {};
  for (const u of USERS) users[u.username] = await upsertUser(u);

  const postCount = await Post.countDocuments();
  if (postCount === 0) {
    console.log('[seed] sample posts & comments...');
    const p1 = await Post.create({
      title: 'Kinh nghiệm học Đại số Tuyến tính',
      content:
        'Mọi người có tài liệu hay tips nào để học tốt môn Đại số tuyến tính không ạ? Sắp thi cuối kỳ mà em thấy hoang mang quá 😢',
      topic: 'hoc-tap',
      author: users['20230002']._id,
      status: 'approved',
      views: 124,
      shares: 5,
    });
    const p2 = await Post.create({
      title: 'Xin tài liệu ôn thi Giải tích 1 thầy Hoàng',
      content: 'Em đang tìm file đề thi giữa kỳ Giải tích 1 các năm trước của thầy Hoàng. Bác nào có link Drive share em với ạ!',
      topic: 'tai-lieu',
      author: users['20230001']._id,
      status: 'approved',
      views: 88,
    });
    await Post.create({
      title: 'Tìm phòng trọ gần Bách Khoa dưới 2 triệu',
      content: 'Có anh chị nào biết phòng trọ khu Tạ Quang Bửu / Trần Đại Nghĩa giá tốt không ạ? Em cảm ơn!',
      topic: 'doi-song',
      author: users['20233885']._id,
      status: 'pending',
      views: 3,
    });

    await Comment.create({
      post: p1._id,
      author: users['20230003']._id,
      authorName: 'Ngọc Lan',
      authorEmail: users['20230003'].email,
      content: 'Cậu thử lên thư viện mượn quyển bài tập của thầy Trần Đình Phùng nhé, rất bám đề thi.',
    });
    await Comment.create({
      post: p2._id,
      author: users['20230002']._id,
      authorName: 'Nguyễn Hải Dương',
      authorEmail: users['20230002'].email,
      content: 'Mình có bộ đề 3 năm gần nhất, để gửi bạn qua mail nhé.',
    });
  }

  console.log('[seed] done.');
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] error:', err);
  process.exit(1);
});
