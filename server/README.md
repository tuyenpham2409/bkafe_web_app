# BKafe API (Express + MongoDB / Mongoose)

REST API dùng chung cho **web (Express + EJS)** và **mobile (React Native/Expo)**. Đây là nơi **duy nhất** chạm cơ sở dữ liệu — client chỉ giao tiếp qua HTTP/JSON.

## Cấu trúc project

```
server/
├── src/
│   ├── server.js            # điểm khởi động: kết nối DB rồi listen
│   ├── app.js               # khởi tạo Express, middleware, mount /api
│   ├── config/              # env.js (đọc .env), db.js (kết nối Mongoose)
│   ├── models/              # User, Topic, Post, Comment, Contact, Notification, Counter
│   ├── middlewares/         # auth (JWT), isAdmin, upload (multer), errorHandler
│   ├── controllers/         # auth, post, comment, contact, topic, user, notification, stats
│   ├── routes/              # *Routes.js + index.js (gom về /api)
│   └── utils/               # token.js, serialize.js, seed.js
└── uploads/                 # ảnh/video người dùng đăng (được phục vụ tĩnh tại /uploads)
```

## Chạy local

1. **MongoDB** (qua Docker):
   ```bash
   docker run -d --name bkafe-mongo -p 27017:27017 -v bkafe-mongo-data:/data/db mongo:7
   ```
2. **Cấu hình**: `cp .env.example .env` (mặc định đã trỏ tới Mongo local).
3. **Cài & seed & chạy**:
   ```bash
   npm install
   npm run seed     # tạo 4 chủ đề, tài khoản admin + tài khoản mẫu, dữ liệu mẫu
   npm start        # API tại http://localhost:5000
   ```

## Dữ liệu mẫu

Vì dùng MongoDB/Mongoose (không có file `.sql` để đính kèm), dữ liệu mẫu được cung cấp theo 2 hình thức:

1. **Script tái tạo** (nguồn gốc thật, đáng tin cậy nhất): `npm run seed` — xoá sạch rồi tạo lại từ đầu 4 chủ đề, tài khoản admin + ~64 tài khoản sinh viên, 15 bài viết (đủ trạng thái approved/pending/rejected, có đánh giá sao), ~34 bình luận (kể cả trả lời lồng nhau), 2 góp ý liên hệ, và bộ đếm lượt xem. Xem `src/utils/seed.js`.
2. **Bản export JSON** (để nộp bài kèm code mà không cần chạy MongoDB): `npm run export-sample-data` — xuất toàn bộ dữ liệu **đang có** trong MongoDB ra thư mục `../sample-data/*.json` ở gốc repo (mỗi collection 1 file, dùng để người chấm xem trực tiếp mà không cần cài đặt gì). File này chỉ để **tham khảo/kiểm tra**, không phải nguồn phục hồi chuẩn (ObjectId bị chuyển thành chuỗi hex khi xuất JSON thuần) — muốn có một CSDL hoạt động đầy đủ và đúng kiểu dữ liệu, hãy chạy `npm run seed`.

## Tài khoản mẫu (mật khẩu chung: `Abc123@`)

- `admin` (email `admin@bkafe.hust.edu.vn`) — tài khoản quản trị viên duy nhất.
- ~60 tài khoản sinh viên mẫu khác (username = MSSV, email sinh tự động từ tên) — xem danh sách đầy đủ trong `src/utils/seed.js`.

> Đăng nhập được bằng **username (MSSV)** hoặc **email**.

## Các nhóm endpoint chính (prefix `/api`)

- **auth**: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/password`, `PUT /auth/username` (đổi 1 lần)
- **posts**: `GET /posts?topic=&q=&sort=&status=&author=` (`status=mine` trả về bài của chính người gọi ở mọi trạng thái, dùng cho trang cá nhân), `GET /posts/:id`, `POST /posts` (multipart, kèm media), `PUT /posts/:id` (chủ bài hoặc **admin sửa bài của bất kỳ ai**, admin sửa thì không đổi trạng thái và gửi thông báo cho tác giả), `DELETE /posts/:id`, `PATCH /posts/:id/approve|reject`, `POST /posts/:id/rate|share`, `GET /posts/:id/raters` (danh sách người đã đánh giá + số sao, public)
- **comments**: `GET/POST /posts/:postId/comments`, `POST /comments/:id/reply|rate`, `DELETE /comments/:id`, `GET /comments` (admin)
- **users**: `GET /users/:id`, `PUT /users/me`, và CRUD admin `GET/POST /users`, `PUT/DELETE /users/:id`
- **topics**: `GET /topics`, `GET /topics/counts`, `PUT /topics/:slug` (admin)
- **notifications**: `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`
- **contacts**: `POST /contacts` (công khai), `GET /contacts` (admin), `PATCH /contacts/:id/handled`, `DELETE /contacts/:id`
- **stats**: `POST /stats/view` (đếm lượt xem), `GET /stats` (admin)

## Vì sao React Native không dùng Mongoose trực tiếp?

Mongoose chạy trên Node.js và mở kết nối TCP tới MongoDB (cần `net`/`tls`/`dns`) — runtime của React Native không có; ngoài ra nhúng credential DB vào app là lỗ hổng bảo mật. Vì vậy **cả web và mobile đều gọi API này** qua HTTPS. Đúng yêu cầu "mobile giao tiếp với website bằng API".
