# BKafe — Hỏi đáp trực tuyến cho sinh viên HUST

Kiến trúc 3 phần, giao tiếp qua **REST API** (đúng yêu cầu "mobile giao tiếp với website bằng API"):

```
server/   Backend Express + MongoDB (Mongoose)  ← nơi duy nhất chạm DB
web/      Web client (React + Vite + Tailwind)   ← gọi API
mobile/   App di động (React Native + Expo)      ← gọi cùng API
```

## Chạy toàn bộ (local)

### 1. MongoDB (Docker)
```bash
docker run -d --name bkafe-mongo -p 27017:27017 -v bkafe-mongo-data:/data/db mongo:7
```

### 2. Backend API
```bash
cd server
npm install
cp .env.example .env      # đã trỏ sẵn tới Mongo local
npm run seed              # tạo chủ đề + tài khoản mẫu + dữ liệu mẫu
npm start                 # http://localhost:5000
```

### 3. Web client
```bash
cd web
npm install
npm run dev               # http://localhost:3000
```
> Web đọc địa chỉ API từ `VITE_API_URL` (mặc định `http://localhost:5000/api`).

### 4. Mobile app (Expo)
```bash
cd mobile
npm install
npm start                 # quét QR bằng Expo Go, hoặc phím a/w cho emulator/web
```
> Điện thoại/máy ảo cần **cùng mạng Wi-Fi** với máy chạy server — app tự suy ra IP LAN, không cần sửa code. Chi tiết: [mobile/README.md](mobile/README.md).

## Tài khoản mẫu (mật khẩu chung `Abc123@`)
`admin` · `20233885` · `20230001` · `20230002` · `20230003`
(đăng nhập bằng **username=MSSV** hoặc **email**; `admin@bkafe.hust.edu.vn` là quản trị)

## Đã hoàn thành theo yêu cầu BTL
- Database (MongoDB/Mongoose), đăng nhập/đăng xuất phân quyền admin/user (JWT)
- Trang nội dung theo mã (`/post/:id`), bình luận + đánh giá công khai, trả lời bình luận
- Popup quảng cáo sau 1 phút + cookie ẩn vĩnh viễn
- Giới thiệu & Liên hệ + form góp ý (prefill khi đã đăng nhập; admin xem hộp thư góp ý)
- Trang quản trị: view toàn site, CRUD bài/bình luận/**user**, duyệt & **từ chối kèm lý do + thông báo**
- Quản lý bài/bình luận **ngay trên trang bài viết** (menu ⋮)
- Chủ đề (4 tab) + chọn chủ đề khi đăng + **upload ảnh/video**
- Tìm kiếm + **sort/filter**; thông báo (chuông); đổi mật khẩu/quên mật khẩu; đổi username 1 lần
- Responsive 3 ngưỡng 800px/1200px; popup đăng nhập dùng chung; ẩn/hiện mật khẩu; dấu * bắt buộc
- **Mobile app (React Native/Expo)**: giao tiếp 100% qua API — Màn hình chính (chủ đề + tìm kiếm + popup quảng cáo), Đăng nhập/Đăng ký (quên mật khẩu, ẩn/hiện mật khẩu), Chi tiết nội dung (bình luận/trả lời/đánh giá sao + ảnh/video), Đăng bài (chọn chủ đề + upload media), Ý kiến & liên hệ (prefill khi đăng nhập), Cá nhân (avatar, đổi mật khẩu/username, đăng xuất)

Chi tiết API: xem [server/README.md](server/README.md). Chi tiết mobile: xem [mobile/README.md](mobile/README.md). Chi tiết web: xem [web/README.md](web/README.md).
