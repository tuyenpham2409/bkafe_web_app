# BKafe API (Express + MongoDB / Mongoose)

REST API dùng chung cho **web (React)** và **mobile (React Native)**. Đây là nơi **duy nhất** chạm cơ sở dữ liệu — client chỉ giao tiếp qua HTTP/JSON.

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

## Tài khoản mẫu (mật khẩu chung: `Abc123@`)

| username (MSSV) | vai trò | tên |
|---|---|---|
| `admin` | admin | Quản trị BKafe |
| `20233885` | user | Phạm Minh Tuyên |
| `20230001` | user | Lê Hà Hải Vân |
| `20230002` | user | Nguyễn Hải Dương |
| `20230003` | user | Ngọc Lan |

> Đăng nhập được bằng **username (MSSV)** hoặc **email**. Email `admin@bkafe.hust.edu.vn` tự động là admin.

## Các nhóm endpoint chính (prefix `/api`)

- **auth**: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/password`, `PUT /auth/username` (đổi 1 lần), `POST /auth/forgot`, `POST /auth/reset`
- **posts**: `GET /posts?topic=&q=&sort=&status=&author=`, `GET /posts/:id`, `POST /posts` (multipart, kèm media), `PUT /posts/:id`, `DELETE /posts/:id`, `PATCH /posts/:id/approve|reject`, `POST /posts/:id/rate|share`
- **comments**: `GET/POST /posts/:postId/comments`, `POST /comments/:id/reply|rate`, `DELETE /comments/:id`, `GET /comments` (admin)
- **users**: `GET /users/:id`, `PUT /users/me`, và CRUD admin `GET/POST /users`, `PUT/DELETE /users/:id`
- **topics**: `GET /topics`, `GET /topics/counts`, `PUT /topics/:slug` (admin)
- **notifications**: `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`
- **contacts**: `POST /contacts` (công khai), `GET /contacts` (admin), `PATCH /contacts/:id/handled`, `DELETE /contacts/:id`
- **stats**: `POST /stats/view` (đếm lượt xem), `GET /stats` (admin)

## Vì sao React Native không dùng Mongoose trực tiếp?

Mongoose chạy trên Node.js và mở kết nối TCP tới MongoDB (cần `net`/`tls`/`dns`) — runtime của React Native không có; ngoài ra nhúng credential DB vào app là lỗ hổng bảo mật. Vì vậy **cả web và mobile đều gọi API này** qua HTTPS. Đúng yêu cầu "mobile giao tiếp với website bằng API".
