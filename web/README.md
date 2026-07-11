# BKafe - Website Hỏi đáp học tập trực tuyến cho sinh viên HUST

Dự án **BKafe** là nền tảng trao đổi, hỏi đáp và chia sẻ tài liệu học tập dành riêng cho sinh viên Đại học Bách khoa Hà Nội (HUST). Đây là phần **web client** được phát triển bằng **Node.js, Express, EJS, và Vanilla CSS/JS**, giao tiếp với backend riêng `../server` (Express + MongoDB/Mongoose) qua REST API thông qua kiến trúc BFF (Backend-for-Frontend).

> [!IMPORTANT]
> Toàn bộ giao diện web được xây dựng thuần túy không phụ thuộc các thư viện UI ăn sẵn (như TailwindCSS, Bootstrap) hay framework client-side nặng nề (như React, Angular, Vue) nhằm tuân thủ quy định tối giản mã nguồn của bài tập lớn. Toast, modal xác nhận, lightbox ảnh, popup đánh giá sao, và toàn bộ icon (SVG viết tay trong `views/partials/icons.ejs`) đều tự dựng bằng vanilla JS/CSS, không dùng thư viện ngoài.

## Kiến trúc tổng thể

```
bkafe_web_app/          (repo)
├── server/              Backend Express + MongoDB (Mongoose) — API dùng chung
├── web/                 ← bạn đang ở đây (web client / Express BFF + EJS)
└── mobile/              App di động (React Native/Expo), gọi cùng API
```

## Tính năng chính
- Đăng nhập/đăng ký bằng **MSSV (username) hoặc email**, phân quyền admin/user, đổi mật khẩu, đổi username 1 lần.
- Câu hỏi phân theo **4 chủ đề**, mỗi câu hỏi là 1 trang riêng, hỗ trợ đính kèm ảnh/video.
- Bình luận + trả lời cho bài viết, hiển thị công khai ngay sau khi gửi.
- Đánh giá sao (0–5) cho bài viết và bình luận; bấm vào tổng điểm đánh giá của bài viết để xem "Ai đã đánh giá" — danh sách này tự cập nhật theo thời gian thực bằng `fetch` + `setInterval` (polling thuần, không dùng thư viện realtime/websocket nào).
- Trang cá nhân: xem/sửa tên hiển thị, bio, avatar; bài viết đang chờ duyệt/bị từ chối của chính mình hiển thị kèm badge trạng thái (người khác chỉ thấy bài đã duyệt).
- Popup quảng cáo sau 1 phút ở trang chủ, ẩn vĩnh viễn qua cookie (không phải localStorage) khi đã đóng.
- Trang Giới thiệu & Liên hệ (form góp ý; hỗ trợ đính kèm file chứng minh).
- Trang quản trị: thống kê lượt xem/người dùng/bài viết/bình luận, duyệt/từ chối bài (kèm lý do + thông báo), **sửa nội dung bất kỳ bài viết nào của người dùng** (tự động gửi thông báo cho tác giả), CRUD người dùng, xem/xoá danh sách bình luận toàn site.
- Tìm kiếm + sắp xếp (mới/cũ, điểm đánh giá) + lọc theo chủ đề.
- Giao diện responsive 3 ngưỡng đúng theo mốc `800px` và `1200px` (xem biến `--breakpoint-md`/`--breakpoint-lg` trong `public/css/style.css`).

## Chạy thử local

Cần **backend đang chạy** trước (xem [`../server/README.md`](../server/README.md)):
```bash
# 1) MongoDB + backend — ở thư mục server/
cd ../server
npm start                  # http://localhost:5000

# 2) Web client — ở thư mục này
cd ../web
npm install
cp .env.example .env       # PORT=3000, API_URL=http://localhost:5000/api
npm run dev                # http://localhost:3000
```

Web đọc địa chỉ API từ biến môi trường `API_URL` trong `.env` (mặc định trỏ tới `http://localhost:5000/api`) — xem `src/config/env.js`.

## Tài khoản mẫu (mật khẩu chung `Abc123@`)
`admin` (email `admin@bkafe.hust.edu.vn`) và các tài khoản sinh viên mẫu (username = MSSV) được tạo qua `npm run seed` trong `server/`.

## Cấu trúc thư mục của Web Client
```
web/
├── public/                # Tài nguyên tĩnh
│   ├── css/
│   │   └── style.css      # CSS thuần của ứng dụng (design token + 3 ngưỡng responsive)
│   └── js/
│       ├── main.js        # Toggle menu/dropdown, toast, lightbox, popover đánh giá, modal "ai đã đánh giá" (polling)
│       ├── notifications.js # Polling thông báo qua AJAX
│       ├── ad-popup.js    # Popup ưu đãi kèm quản lý cookie
│       └── media-preview.js # Hiển thị tên file đính kèm
├── src/                   # Source code backend BFF
│   ├── config/env.js      # Nạp cấu hình từ .env
│   ├── lib/
│   │   ├── apiClient.js   # HTTP Client giao tiếp REST API
│   │   └── cookies.js     # Parser cookies thủ công
│   ├── middlewares/       # Middleware phân quyền và nạp dữ liệu toàn cục
│   ├── routes/            # Khai báo các router Express (posts, comments, profile, admin, auth, search, about, api)
│   ├── app.js             # Cấu hình Express app
│   └── server.js          # Khởi động server HTTP
└── views/                 # View EJS Templates
    ├── errors/            # View thông báo lỗi (404, 500)
    ├── pages/             # Các trang chính (home, login, profile, admin, admin-posts, admin-comments, admin-users, about)
    └── partials/          # Header, footer, sidebar, icons SVG dùng chung
```
