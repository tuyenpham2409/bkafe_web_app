import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';
import Topic from '../models/Topic.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Contact from '../models/Contact.js';
import Notification from '../models/Notification.js';
import Counter from '../models/Counter.js';

const TOPICS = [
  { slug: 'hoc-tap', name: 'Học tập', description: 'Hỏi đáp bài vở, môn học, kinh nghiệm ôn thi.', order: 1 },
  { slug: 'tai-lieu', name: 'Tài liệu', description: 'Chia sẻ & xin tài liệu, đề thi, slide.', order: 2 },
  { slug: 'doi-song', name: 'Đời sống', description: 'Đời sống sinh viên, ký túc xá, ăn ở đi lại.', order: 3 },
  { slug: 'viec-lam', name: 'Việc làm & CLB', description: 'Việc làm thêm, thực tập, câu lạc bộ.', order: 4 },
];

const RAW_STUDENTS = [
  { username: '20233888', displayName: 'Hoàng Tiểu Yến' },
  { username: '20233886', displayName: 'Lê Hà Hải Vân' },
  { username: '20233884', displayName: 'Nguyễn Quang Tùng' },
  { username: '20233882', displayName: 'Phạm Kiều Trang' },
  { username: '20233880', displayName: 'Nguyễn Thị Anh Thơ' },
  { username: '20233878', displayName: 'Ngô Thu Thảo' },
  { username: '20233876', displayName: 'Bùi Thanh Thảo' },
  { username: '20233874', displayName: 'Bùi Thái Sơn' },
  { username: '20233872', displayName: 'Nguyễn Yến Nhi' },
  { username: '20233870', displayName: 'Nguyễn Thành Nam' },
  { username: '20233868', displayName: 'Vũ Đức Minh' },
  { username: '20233866', displayName: 'Bùi Tuấn Minh' },
  { username: '20233864', displayName: 'Trần Văn Long' },
  { username: '20233862', displayName: 'Đoàn Ngọc Linh' },
  { username: '20233860', displayName: 'Nguyễn Anh Kiệt' },
  { username: '20233858', displayName: 'Lê Xuân Kiên' },
  { username: '20233856', displayName: 'Vũ Ngọc Đăng Khoa' },
  { username: '20233854', displayName: 'Nguyễn Thị Thúy Huyền' },
  { username: '20233852', displayName: 'Nguyễn Minh Huy' },
  { username: '20233850', displayName: 'Phạm Huy Hoàng' },
  { username: '20233848', displayName: 'Nguyễn Thị Thu Hà' },
  { username: '20233846', displayName: 'Phạm Bắc Đại Dương' },
  { username: '20233844', displayName: 'Phạm Danh Tuấn Dũng' },
  { username: '20233842', displayName: 'Lưu Trí Dũng' },
  { username: '20233840', displayName: 'Trương Công Đức' },
  { username: '20233838', displayName: 'Lê Duy Đức' },
  { username: '20233836', displayName: 'Nguyễn Tiến Đạt' },
  { username: '20233834', displayName: 'Nguyễn Thị Mai Chinh' },
  { username: '20233832', displayName: 'Vũ Xuân Anh' },
  { username: '20233830', displayName: 'Trần Phan Anh' },
  { username: '20233828', displayName: 'Nguyễn Phan Anh' },
  { username: '20233826', displayName: 'Đoàn Duy Anh' },
  { username: '20233825', displayName: 'Phạm Nguyễn Tùng An' },
  { username: '20233827', displayName: 'Mai Việt Anh' },
  { username: '20233829', displayName: 'Nguyễn Vương Thục Anh' },
  { username: '20233831', displayName: 'Trần Thị Vân Anh' },
  { username: '20233833', displayName: 'Bùi Hoàng Bảo' },
  { username: '20233837', displayName: 'Đỗ Đại Doanh' },
  { username: '20233841', displayName: 'Hà Trung Dũng' },
  { username: '20233843', displayName: 'Nguyễn Quang Dũng' },
  { username: '20233845', displayName: 'Bùi Nam Dương' },
  { username: '20233835', displayName: 'Lưu Tiến Đạt' },
  { username: '20233839', displayName: 'Tạ Minh Đức' },
  { username: '20233847', displayName: 'Nguyễn Đình Hoàng Hà' },
  { username: '20233849', displayName: 'Nguyễn Lê Trung Hiếu' },
  { username: '20233851', displayName: 'Hà Duyên Hùng' },
  { username: '20233853', displayName: 'Trần Gia Huy' },
  { username: '20233857', displayName: 'Dương Văn Kiên' },
  { username: '20233859', displayName: 'Trần Trung Kiên' },
  { username: '20233855', displayName: 'Hồng Minh Khang' },
  { username: '20233861', displayName: 'Trần Nguyễn Hà Lan' },
  { username: '20233863', displayName: 'Trần Diệu Linh' },
  { username: '20233865', displayName: 'Đào Hữu Mão' },
  { username: '20233867', displayName: 'Nguyễn Bình Minh' },
  { username: '20233869', displayName: 'Nguyễn Diệu My' },
  { username: '20233873', displayName: 'Trần Thế Ninh' },
  { username: '20233871', displayName: 'Trần Phú Nghĩa' },
  { username: '20233885', displayName: 'Phạm Minh Tuyên' },
  { username: '20233875', displayName: 'Bùi Duy Thái' },
  { username: '20233877', displayName: 'Lê Thị Thảo' },
  { username: '20233879', displayName: 'Nguyễn Hương Thảo' },
  { username: '20233881', displayName: 'Hà Huyền Thu' },
  { username: '20233883', displayName: 'Vũ Hải Trung' },
  { username: '20233887', displayName: 'Lê Nguyễn Cẩm Vy' }
];


function cleanAccents(str) {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();
}

function generateEmail(username, displayName) {
  const parts = cleanAccents(displayName).split(/\s+/);
  const name = parts[parts.length - 1]; 
  let abbreviations = '';
  for (let i = 0; i < parts.length - 1; i++) {
    abbreviations += parts[i].charAt(0);
  }
  return `${name}.${abbreviations}${username}@sis.hust.edu.vn`;
}

async function run() {
  await connectDB();

  console.log('[seed] clearing database...');
  await Post.deleteMany({});
  await Comment.deleteMany({});
  await User.deleteMany({});
  await Contact.deleteMany({});
  await Notification.deleteMany({});
  await Counter.deleteMany({});

  console.log('[seed] creating view counter...');
  await Counter.create({ key: 'totalViews', value: 3456 });

  console.log('[seed] topics...');
  for (const t of TOPICS) {
    await Topic.updateOne({ slug: t.slug }, { $set: t }, { upsert: true });
  }

  console.log('[seed] users...');
  const users = {};

  
  const adminUser = new User({
    username: 'admin',
    displayName: 'Quản trị BKafe',
    email: 'admin@bkafe.hust.edu.vn',
    role: 'admin'
  });
  await adminUser.setPassword(env.seedPassword);
  await adminUser.save();
  users['admin'] = adminUser;

  
  for (const s of RAW_STUDENTS) {
    const email = generateEmail(s.username, s.displayName);
    const user = new User({
      username: s.username,
      displayName: s.displayName,
      email,
      role: 'user',
      bio: `Sinh viên K68 chương trình Truyền thông số & Kỹ thuật đa phương tiện. MSSV: ${s.username}.`
    });
    await user.setPassword(env.seedPassword);
    await user.save();
    users[s.username] = user;
    console.log(`  + user ${s.username} - ${s.displayName}`);
  }

  console.log('[seed] creating posts & comments...');

  
  
  
  const p1 = await Post.create({
    title: 'Xin tài liệu Giải tích số',
    content: 'Ai cứu em giải tích số fami với, em học lần 3 mà như lần đầu, không biết làm sao để được 3 điểm nữa, ai có tài liệu j cho em xin với',
    topic: 'tai-lieu',
    author: users['20233884']._id, 
    status: 'approved',
    views: 142,
    shares: 4,
  });
  p1.ratings.set(String(users['20233886']._id), 4);
  p1.ratings.set(String(users['20233882']._id), 5);
  p1.recomputeRating();
  await p1.save();

  await Comment.create({
    post: p1._id,
    author: users['20233886']._id, 
    authorName: users['20233886'].displayName,
    authorEmail: users['20233886'].email,
    content: 'Ib mình kèm b gtich dso b nhé',
  });
  await Comment.create({
    post: p1._id,
    author: users['20233882']._id, 
    authorName: users['20233882'].displayName,
    authorEmail: users['20233882'].email,
    content: 'Giải tích số vs phương pháp số, 2 môn ám ảnh',
  });
  await Comment.create({
    post: p1._id,
    author: users['20233885']._id, 
    authorName: users['20233885'].displayName,
    authorEmail: users['20233885'].email,
    content: 'Anh nhận gia sư giải tích đại số vật lý đại cương nha',
  });

  
  const p2 = await Post.create({
    title: 'Ôn triết theo tài liệu CLB học tập hỗ trợ thi cử',
    content: 'Mng cho mình hỏi là ôn tài liệu triết có clbhtht có ổn không ạ , mình thấy tài liệu clbhtht dễ học hơn tài liệu cô cho , tài liệu cô cho dài quá',
    topic: 'tai-lieu',
    author: users['20233880']._id, 
    status: 'approved',
    views: 250,
    shares: 11,
  });

  const c2_1 = await Comment.create({
    post: p2._id,
    author: users['20233878']._id, 
    authorName: users['20233878'].displayName,
    authorEmail: users['20233878'].email,
    content: 'K liên quan nma các bác ơi cho em hỏi phòng lab 2 của thư viện là phòng nào vậy ạ, danh sách thi ghi lab 2 mà e chưa biết phòng nào',
  });
  await Comment.create({
    post: p2._id,
    parent: c2_1._id,
    author: users['20233876']._id, 
    authorName: users['20233876'].displayName,
    authorEmail: users['20233876'].email,
    content: 'tầng 2 thư viện chỗ gần cầu thang hay sao ý, hồi mình thi tadv là vậy. Bạn nên hỏi lại bác bảo vệ cho yên tâm',
  });

  await Comment.create({
    post: p2._id,
    author: users['20233874']._id, 
    authorName: users['20233874'].displayName,
    authorEmail: users['20233874'].email,
    content: 'Học ai thì ng đó chấm nên tài liệu của cô của b là chuẩn nhất',
  });
  await Comment.create({
    post: p2._id,
    author: users['20233872']._id, 
    authorName: users['20233872'].displayName,
    authorEmail: users['20233872'].email,
    content: 'Tôi học mấy môn triết với hỏi ý kiến thầy cô + quan điểm cá nhân tôi thấy clb diễn giải hơi dài dòng, dùng để tham khảo cô đọng lại thành từng ý chuẩn nhất. Nó vừa có style riêng bản thân chứ theo clb bài nào cũng giống bài nào r sau khi điểm lên lại bảo làm y nguyên mà ko đc như ý',
  });

  
  const p3 = await Post.create({
    title: 'Xin tài liệu ôn thi cuối kỳ kỹ năng mềm',
    content: 'ac cho em xin tài liệu ôn ck knm được k ạ, em ch biết phải ôn gì ạ🥲🥲',
    topic: 'tai-lieu',
    author: users['20233870']._id, 
    status: 'approved',
    views: 65,
    shares: 1,
  });
  await Comment.create({
    post: p3._id,
    author: users['20233868']._id, 
    authorName: users['20233868'].displayName,
    authorEmail: users['20233868'].email,
    content: 'Knm ôn file trắc nghiệm thầy cô cho với ở trên lms là mắc điểm r kĩ trên lms nữa',
  });


  

  
  const p4 = await Post.create({
    title: 'Lấy gốc Giải tích 3 aim 3 điểm kịp không?',
    content: 'anh chị ơi giờ lấy gốc giải tích 3 kịp không ạ em aim 3đ ạ nên ôn trọng tâm phần nào nhất ạ',
    topic: 'hoc-tap',
    author: users['20233866']._id, 
    status: 'approved',
    views: 198,
    shares: 5,
  });

  await Comment.create({
    post: p4._id,
    author: users['20233864']._id, 
    authorName: users['20233864'].displayName,
    authorEmail: users['20233864'].email,
    content: '3₫ thì ôn mỗi cái ht,pk,với miền ht là được rồi với thêm tí ptvp',
  });
  await Comment.create({
    post: p4._id,
    author: users['20233862']._id, 
    authorName: users['20233862'].displayName,
    authorEmail: users['20233862'].email,
    content: 'Chắc ôn chương 1 chương 2, chương 3 nhiều điểm nhưng mà t thấy khó vào đầu lắm :))',
  });
  await Comment.create({
    post: p4._id,
    author: users['20233860']._id, 
    authorName: users['20233860'].displayName,
    authorEmail: users['20233860'].email,
    content: 'Giờ mà mất gốc thì đến trước giờ thi e cứ nghe a. Ko phải đi thi. Cứ luộc 1 con gà lên, không cần chặt, e lấy nước luộc gà e pha nước chấm rồi e xé gà ăn để cảm nhận nó thú vị như thế nào.',
  });

  
  const p5 = await Post.create({
    title: 'Còn 3 ngày thi GT3 nên làm lại đề hay làm thêm?',
    content: 'Cho em hỏi là em đã ôn được 5 đề giải tích 3 gần đây nhất thì còn 3 ngày em nên làm lại 5 đề hay làm thêm ạ',
    topic: 'hoc-tap',
    author: users['20233858']._id, 
    status: 'approved',
    views: 145,
    shares: 3,
  });

  await Comment.create({
    post: p5._id,
    author: users['20233856']._id, 
    authorName: users['20233856'].displayName,
    authorEmail: users['20233856'].email,
    content: 'Ôn lại bạn ạ. Bạn nắm chắc cách làm phần chuỗi vs ptvp. Motip đề khác nó cx chỉ có vậy. Bạn thuộc cái cthuc maclau cho chuỗi hay chép cthuc cx được. Làm câu laplace quen tay. Làm lại đề thấy mượt thì làm đề mới ôn tiếp. Thắp hương cầu các cụ phù hộ cho nữa',
  });

  const c5_2 = await Comment.create({
    post: p5._id,
    author: users['20233854']._id, 
    authorName: users['20233854'].displayName,
    authorEmail: users['20233854'].email,
    content: 'H bắt đầu học lại từ đầu c2 , c2 c3 chưa học gì , 3 tuần nữa quay lại xem đc bao nhiêu điểm,, hẻeee',
  });
  await Comment.create({
    post: p5._id,
    parent: c5_2._id,
    author: users['20233852']._id, 
    authorName: users['20233852'].displayName,
    authorEmail: users['20233852'].email,
    content: 'Nam_g h tôi cx ms học, đề điếc chưa đụng vô luôn:)',
  });
  await Comment.create({
    post: p5._id,
    parent: c5_2._id,
    author: users['20233850']._id, 
    authorName: users['20233850'].displayName,
    authorEmail: users['20233850'].email,
    content: 'tôi cũng thế này:))',
  });

  await Comment.create({
    post: p5._id,
    author: users['20233848']._id, 
    authorName: users['20233848'].displayName,
    authorEmail: users['20233848'].email,
    content: 'Làm 5 đề nhưng còn nhớ đề kh, nếu quên đề rồi thì làm lại, chứ còn nhớ đề thì ôn công thức nhé',
  });
  await Comment.create({
    post: p5._id,
    author: users['20233846']._id, 
    authorName: users['20233846'].displayName,
    authorEmail: users['20233846'].email,
    content: 'thật ra học kĩ tca các phần k cần làm đề cũng dc',
  });


  

  
  const p6 = await Post.create({
    title: 'CLB ở HUST có giống trên phim anime không?',
    content: 'Các senpai cho em hỏi là clb của HUST có giống như trên phim cụ thể là anime không ạ :3 Kiểu như buổi sáng đến sinh hoạt clb xong mình có một nhóm bạn dễ thương và một chủ clb nghiêm túc,tài năng và hoàn hảo í ạ.',
    topic: 'doi-song',
    author: users['20233844']._id, 
    status: 'approved',
    views: 312,
    shares: 20,
  });

  await Comment.create({
    post: p6._id,
    author: users['20233842']._id, 
    authorName: users['20233842'].displayName,
    authorEmail: users['20233842'].email,
    content: 'Anh có vợ rồi nhưng vợ chồng anh không hạnh phúc. Anh ở với vợ cũng chỉ là vì con cái mà thôi. Nếu em chấp nhận một người có gia đình, có con như anh. Em bỏ hết tất cả mọi thứ ở đây đi, anh vay lãi nợ em ra, đón em về xây tổ ấm với anh. Mai anh về anh bắt vợ anh ký giấy ly hôn luôn. Anh đi đóng cốp pha công trình xây dựng quanh xã, anh xin cho em vào làm cty may ở thôn bên của bà chị anh. Chiều anh về sớm đón con đi chợ rồi qua chỗ làm chở em về. Anh về nấu cơm còn em tắm rửa, anh dạy con học em rửa bát, quét nhà giúp anh. Chỉ vậy thôi, giàu nghèo với anh bây giờ nó vô nghĩa lắm, chỉ mong bản thân khỏe mạnh để làm chỗ dựa cho em và con',
  });
  await Comment.create({
    post: p6._id,
    author: users['20233840']._id, 
    authorName: users['20233840'].displayName,
    authorEmail: users['20233840'].email,
    content: 'Anh bảo mày này. Một ngày có 24 tiếng, mình ngủ một đêm chỉ được có mấy tiếng thôi. Đêm mình đi ngủ, sáng ra mở mắt biết là mình sống, là mình biết là một đêm mình đã sống. Có khi ngồi nói chuyện như này nhưng mà đêm mình đi thì sao ? Nên là cứ sống ngày nào biết ngày đấy em.\nCòn con người mình hay cai đầu của em trông không khác gì một quả trứng em a, nó vỡ lúc nào thì biết lức đấy thôi, mình không nói trước được cái gì ý cả.\nMã đà nói ra là phải chuẩn, thì mới có cuộc ngồi ngày hôm nay. Anh chỉ nói đơn giản như thế cho em tự hiểu.',
  });

  const c6_3 = await Comment.create({
    post: p6._id,
    author: users['20233838']._id, 
    authorName: users['20233838'].displayName,
    authorEmail: users['20233838'].email,
    content: 'Chủ nhiệm không nghiêm túc nhưng thân thiện cuti được khum em??',
  });
  await Comment.create({
    post: p6._id,
    parent: c6_3._id,
    author: users['20233836']._id, 
    authorName: users['20233836'].displayName,
    authorEmail: users['20233836'].email,
    content: 'Ko, duyệt đơn t đi',
  });

  
  const p7 = await Post.create({
    title: 'Đạt 67 điểm thi Đánh giá tư duy đặt nguyện vọng',
    content: 'Em dc 67 tsa đặt nv như này đã ổn chưa ạ',
    topic: 'doi-song',
    author: users['20233834']._id, 
    status: 'approved',
    views: 180,
    shares: 2,
  });

  await Comment.create({
    post: p7._id,
    author: users['20233832']._id, 
    authorName: users['20233832'].displayName,
    authorEmail: users['20233832'].email,
    content: 'Điểm này bỏ bk đi em\nSang điện tự động hóa đại học công nghiệp ngon luôn\nHọc ck nếu đông như kiến. Lực học e 67đ khó cạnh tranh lắm. Ra trường làm vất lương thì 10tr đến 20tr thôi\nĐiện tự động hóa lúc nào cũng mâm trên em nhé',
  });
  await Comment.create({
    post: p7._id,
    author: users['20233830']._id, 
    authorName: users['20233830'].displayName,
    authorEmail: users['20233830'].email,
    content: '67 thì yên tâm cơ khí rồi, còn điện thì chênh vênh lắm',
  });


  

  
  const p8 = await Post.create({
    title: 'CLB thể thao hoặc học thuật đang tuyển thành viên',
    content: 'Hiện tại có clb thể thao hay học thuật tuyển tv kh ạ',
    topic: 'viec-lam',
    author: users['20233828']._id, 
    status: 'approved',
    views: 92,
    shares: 0,
  });

  const c8_1 = await Comment.create({
    post: p8._id,
    author: users['20233826']._id, 
    authorName: users['20233826'].displayName,
    authorEmail: users['20233826'].email,
    content: 'Thôi thì chờ đầu năm học thui cậu ạ',
  });
  await Comment.create({
    post: p8._id,
    parent: c8_1._id,
    author: users['20233825']._id, 
    authorName: users['20233825'].displayName,
    authorEmail: users['20233825'].email,
    content: ')))) bao h thì phỏng vấn nhỉ',
  });

  await Comment.create({
    post: p8._id,
    author: users['20233827']._id, 
    authorName: users['20233827'].displayName,
    authorEmail: users['20233827'].email,
    content: 'tiện cho em hỏi clb yêu sách bk bao giờ xuất hiện ạ, em muốn trả sách mà 2 tuần nay không thấy',
  });

  const c8_3 = await Comment.create({
    post: p8._id,
    author: users['20233829']._id, 
    authorName: users['20233829'].displayName,
    authorEmail: users['20233829'].email,
    content: 'giữa kỳ như này thì làm gì có CLB nào mở bạn ơi=)) ngta phải đón đầu chứ ai đón giữa',
  });
  await Comment.create({
    post: p8._id,
    parent: c8_3._id,
    author: users['20233831']._id, 
    authorName: users['20233831'].displayName,
    authorEmail: users['20233831'].email,
    content: 'dạ vâng ạ',
  });

  
  const p9 = await Post.create({
    title: 'Học Kỹ thuật cơ khí cơ hội việc làm cao không?',
    content: 'học kỹ thuật cơ khí có cơ hội việc làm cao ko ạ?',
    topic: 'viec-lam',
    author: users['20233833']._id, 
    status: 'approved',
    views: 130,
    shares: 2,
  });
  await Comment.create({
    post: p9._id,
    author: users['20233837']._id, 
    authorName: users['20233837'].displayName,
    authorEmail: users['20233837'].email,
    content: 'Cao chứ em! Gì chứ cái này mình tự tin nói luôn là cao 😁',
  });
  await Comment.create({
    post: p9._id,
    author: users['20233841']._id, 
    authorName: users['20233841'].displayName,
    authorEmail: users['20233841'].email,
    content: 'Vua của mọi nghề mà, ko phải lo thiếu việc đâu',
  });
  await Comment.create({
    post: p9._id,
    author: users['20233843']._id, 
    authorName: users['20233843'].displayName,
    authorEmail: users['20233843'].email,
    content: 'Méo bao giờ thất nghiệp được, lương muốn cao thì cần kinh nghiệm, ngắn gọn vậy thôi :))',
  });

  
  const p10 = await Post.create({
    title: 'Cơ hội việc làm và mức lương ngành cơ khí sau khi ra trường',
    content: 'cho em hỏi về ngành cơ khí về cơ hội việc làm sau khi ra trg mức lương như nào ạ',
    topic: 'viec-lam',
    author: users['20233845']._id, 
    status: 'approved',
    views: 125,
    shares: 3,
  });
  await Comment.create({
    post: p10._id,
    author: users['20233835']._id, 
    authorName: users['20233835'].displayName,
    authorEmail: users['20233835'].email,
    content: 'Học cơ khí k cần lo về việc làm. Kiếm đc bnh tùy thuộc vào mình. Học tốt ngoại ngữ, trau dồi nhiều kỹ năng chuyên môn sẽ có nhiều cơ hội và lợi thế hơn',
  });
  await Comment.create({
    post: p10._id,
    author: users['20233839']._id, 
    authorName: users['20233839'].displayName,
    authorEmail: users['20233839'].email,
    content: 'Ở đâu có máy móc, sản xuất. Ở đó có cơ khí -> về quê làm vẫn có việc',
  });
  await Comment.create({
    post: p10._id,
    author: users['20233847']._id, 
    authorName: users['20233847'].displayName,
    authorEmail: users['20233847'].email,
    content: 'theo năng lực nhé cố học tốt ngoại ngữ chuyên môn nx',
  });

  

  
  await Post.create({
    title: 'Cần xin tài liệu thí nghiệm Vật lý 1',
    content: 'Ai có file báo cáo mẫu thí nghiệm Vật lý 1 HUST gửi em xin tham khảo với ạ.',
    topic: 'hoc-tap',
    author: users['20233849']._id, 
    status: 'pending',
    views: 4,
    shares: 0,
  });

  
  await Post.create({
    title: 'Mất gốc Giải tích 2 cứu em với!',
    content: 'Mất gốc hoàn toàn Giải tích 2 cứu em với các bác ơiiii.',
    topic: 'tai-lieu',
    author: users['20233851']._id, 
    status: 'rejected',
    rejectReason: 'Nội dung bài viết quá ngắn, không cụ thể.',
    views: 12,
    shares: 0,
  });

  
  const p13 = await Post.create({
    title: 'Review căng tin nhà B10 HUST',
    content: 'Hôm nay mình sẽ làm một bài review chân thực nhất về chất lượng đồ ăn và thái độ phục vụ tại căng tin nhà B10 nhé.',
    topic: 'doi-song',
    author: users['20233853']._id, 
    status: 'approved',
    views: 64,
    shares: 3,
  });
  p13.ratings.set(String(users['20233885']._id), 5); 
  p13.ratings.set(String(users['20233886']._id), 4); 
  p13.ratings.set(String(users['20233888']._id), 3); 
  p13.recomputeRating();
  await p13.save();

  
  await Post.create({
    title: 'Tuyển cộng tác viên gia sư Giải tích/Đại số',
    content: 'CLB đang cần tuyển thêm 5 bạn sinh viên có kết quả học tập xuất sắc môn Giải tích hoặc Đại số tuyến tính để cộng tác kèm học.',
    topic: 'viec-lam',
    author: users['20233857']._id, 
    status: 'approved',
    views: 98,
    shares: 5,
  });

  
  await Post.create({
    title: 'Cần tìm bạn ghép phòng trọ khu K9',
    content: 'Mình đang ở phòng trọ khu K9 gần trường, muốn tìm thêm 1 bạn nam ở ghép chia đôi tiền phòng. Inbox nhé.',
    topic: 'doi-song',
    author: users['20233859']._id, 
    status: 'approved',
    views: 45,
    shares: 1,
  });

  console.log('[seed] creating feedback submissions...');
  await Contact.create({
    name: 'Bùi Tuấn Minh',
    email: 'minh.bt20233866@sis.hust.edu.vn',
    message: 'Nền tảng BKafe chạy mượt mà quá nhóm ơi! Mong nhóm bổ sung thêm tính năng thông báo trực tiếp trên web.',
    user: users['20233866']._id,
    handled: false
  });
  await Contact.create({
    name: 'Trần Văn Long',
    email: 'long.tv20233864@sis.hust.edu.vn',
    message: 'Giao diện mobile app rất đẹp mắt, chúc nhóm đạt điểm tuyệt đối môn học nhé!',
    user: users['20233864']._id,
    handled: true
  });

  console.log('[seed] done.');
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] error:', err);
  process.exit(1);
});
