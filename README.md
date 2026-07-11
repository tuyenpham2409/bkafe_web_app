# BKafe — Hỏi đáp trực tuyến cho sinh viên HUST

Kiến trúc 3 phần, giao tiếp qua **REST API** (đúng yêu cầu "mobile giao tiếp với website bằng API"):

```
server/       Backend Express + MongoDB (Mongoose)        ← nơi duy nhất chạm DB
web/          Web client (Express + EJS + Vanilla CSS/JS)  ← BFF, gọi API
mobile/       App di động (React Native + Expo)            ← gọi cùng API
sample-data/  Bản export JSON của dữ liệu mẫu (xem mục "Dữ liệu mẫu" bên dưới)
Report.md     Báo cáo tóm tắt nộp bài (chức năng, mức độ hoàn thiện, phân công, hướng dẫn)
```

> [!IMPORTANT]
> Không dùng CSS/UI framework (Bootstrap, Tailwind...), không dùng UI kit dựng sẵn cho mobile (NativeBase, React Native Paper...), và không copy template có sẵn. Toast, modal xác nhận, lightbox ảnh, sao đánh giá, icon (SVG viết tay) đều tự xây dựng thủ công ở cả web lẫn mobile — tuân thủ quy định "không copy hoặc dùng thư viện sẵn" của BTL. Chỉ dùng các thư viện hạ tầng bắt buộc phải có để chạy nền tảng (Express, EJS, Mongoose, React Native, Expo, React Navigation).

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
npm run seed              # tạo chủ đề + tài khoản admin + danh sách sinh viên mẫu
npm start                 # http://localhost:5000
```

## Dữ liệu mẫu

Dự án dùng MongoDB/Mongoose nên dữ liệu mẫu không phải là file `.sql` mà gồm:
- **`server/src/utils/seed.js`** — script tái tạo toàn bộ dữ liệu mẫu (chủ đề, tài khoản, bài viết, bình luận, góp ý liên hệ...) vào MongoDB, chạy bằng `npm run seed`.
- **`sample-data/*.json`** — bản export sẵn của đúng dữ liệu trên (mỗi collection MongoDB một file JSON) để xem/kiểm tra trực tiếp mà không cần cài đặt hay chạy MongoDB. Tạo lại bằng `npm run export-sample-data` trong `server/` sau khi đã seed.

### 3. Web client
```bash
cd web
npm install
cp .env.example .env      # PORT=3000, API_URL=http://localhost:5000/api
npm run dev                # http://localhost:3000
```

### 4. Mobile app (Expo)
```bash
cd mobile
npm install
npm start                 # quét QR bằng Expo Go, hoặc phím a/w cho emulator/web
```
> Điện thoại/máy ảo cần **cùng mạng Wi-Fi** với máy chạy server — app tự suy ra IP LAN, không cần sửa code. Chi tiết: [mobile/README.md](mobile/README.md).

## Tài khoản mẫu (mật khẩu chung `Abc123@`)
- `admin` (email `admin@bkafe.hust.edu.vn`) — quản trị viên.
- ~60 tài khoản sinh viên mẫu được tạo tự động khi `npm run seed` (username = MSSV, email sinh tự động).
- Đăng nhập bằng **username (MSSV) hoặc email**.

## Đã hoàn thành theo yêu cầu BTL

**Website**
- Lưu trữ dữ liệu bằng MongoDB/Mongoose.
- Đăng nhập/đăng xuất, phân biệt quyền admin/user (JWT).
- Trang nội dung theo mã (`/post/:id`): bình luận + trả lời + đánh giá sao, hiển thị công khai ngay sau khi gửi. Đánh giá tách riêng thành popup sao kèm mục "Xem ai đã đánh giá" (cập nhật theo thời gian thực bằng polling JS thuần, không dùng thư viện realtime nào).
- Popup quảng cáo hiện sau 1 phút ở trang chủ, đóng thì lưu cookie để lần sau không hiện lại.
- Trang Giới thiệu & Liên hệ kèm form gửi ý kiến.
- Trang quản trị: xem tổng lượt truy cập, duyệt/từ chối bài (kèm lý do + thông báo), **sửa nội dung bất kỳ bài viết nào** (gửi thông báo cho tác giả), xem/xoá danh sách bình luận, quản lý người dùng (khoá quyền, đổi vai trò, xoá).
- Responsive 3 ngưỡng theo đúng mốc 800px / 1200px.
- Chủ đề (4 nhóm) + chọn chủ đề khi đăng bài + upload ảnh/video.
- Tìm kiếm + sắp xếp; thông báo (chuông, polling); đổi mật khẩu; đổi username 1 lần.

**Mobile app (React Native/Expo)** — giao tiếp 100% qua API, không có logic backend nào trong app:
- Màn hình chính: chủ đề + tìm kiếm + sắp xếp + popup quảng cáo (dùng AsyncStorage tương đương cookie).
- Màn hình đăng nhập/đăng ký.
- Màn hình chi tiết nội dung: bình luận/trả lời/đánh giá sao + ảnh/video, mục "Ai đã đánh giá" cập nhật bằng polling.
- Màn hình ý kiến & liên hệ.
- Ngoài ra: đăng bài (chọn chủ đề + upload media, tiêu đề không bắt buộc), hồ sơ cá nhân (avatar, bio, đổi mật khẩu/username), xem hồ sơ công khai của người dùng khác, trang quản trị (thống kê, duyệt bài, quản lý bình luận, quản lý người dùng).

Chi tiết API: xem [server/README.md](server/README.md). Chi tiết web: xem [web/README.md](web/README.md). Chi tiết mobile: xem [mobile/README.md](mobile/README.md).
