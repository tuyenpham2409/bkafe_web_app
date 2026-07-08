# BKafe - Website Hỏi đáp học tập trực tuyến cho sinh viên HUST

Dự án **BKafe** là nền tảng trao đổi, hỏi đáp và chia sẻ tài liệu học tập dành riêng cho sinh viên Đại học Bách khoa Hà Nội (HUST). Đây là phần **web client** được phát triển bằng **Node.js, Express, EJS, và Vanilla CSS/JS**, giao tiếp với backend riêng `../server` (Express + MongoDB/Mongoose) qua REST API thông qua kiến trúc BFF (Backend-for-Frontend) bảo mật.

> [!IMPORTANT]
> Toàn bộ giao diện web được xây dựng thuần túy không phụ thuộc các thư viện UI ăn sẵn (như TailwindCSS, Bootstrap) hay framework client-side nặng nề (như React, Angular, Vue) nhằm tuân thủ quy định tối giản mã nguồn của bài tập lớn.

## Kiến trúc tổng thể

```
bkafe_web_app/          (repo)
├── server/              Backend Express + MongoDB (Mongoose) — API dùng chung
├── web/                 ← bạn đang ở đây (web client / Express BFF + EJS)
└── mobile/              App di động (React Native/Expo), gọi cùng API
```

## Tính năng chính
- Đăng nhập/đăng ký bằng **MSSV (username) hoặc email**, phân quyền admin/user, đổi/quên mật khẩu, đổi username 1 lần.
- Câu hỏi phân theo **4 chủ đề**, mỗi câu hỏi là 1 trang riêng, hỗ trợ đính kèm ảnh/video.
- Bình luận + trả lời + đánh giá sao (0–5) cho cả bài viết và bình luận.
- Popup quảng cáo sau 1 phút ở trang chủ, ẩn vĩnh viễn qua cookie thuần khi đã đóng.
- Trang Giới thiệu & Liên hệ (form góp ý; hỗ trợ đính kèm file chứng minh).
- Trang quản trị: thống kê lượt xem/người dùng trực tuyến, duyệt/từ chối bài (kèm lý do + thông báo), CRUD người dùng, quản lý bài viết và bình luận.
- Tìm kiếm + sắp xếp (mới/cũ, điểm đánh giá) + lọc theo chủ đề.
- Giao diện responsive 3 ngưỡng tương thích tốt trên điện thoại (< 800px) và máy tính (> 1200px).

## Chạy thử local

Cần **backend đang chạy** trước (xem [`../server/README.md`](../server/README.md)):
```bash
# 1) MongoDB + backend — ở thư mục server/
cd ../server
npm start                  # http://localhost:5000

# 2) Web client — ở thư mục này
cd ../web
npm install
npm run dev                # http://localhost:3000
```

Web đọc địa chỉ API từ biến môi trường `VITE_API_URL` trong `.env` (mặc định trỏ tới `http://localhost:5000/api`).

## Tài khoản mẫu (mật khẩu chung `Abc123@`)
`admin` · `20233885` · `20230001` · `20230002` · `20230003` (đăng nhập bằng username=MSSV hoặc email; tạo qua `npm run seed` trong `server/`).

## Cấu trúc thư mục của Web Client
```
web/
├── public/                # Tài nguyên tĩnh
│   ├── css/
│   │   └── style.css      # CSS thuần của ứng dụng
│   └── js/
│       ├── main.js        # Logic toggle menu, dropdown, lightbox
│       ├── notifications.js # Polling thông báo qua AJAX
│       ├── ad-popup.js    # Popup ưu đãi kèm quản lý cookie
│       └── media-preview.js # Hiển thị tên file đính kèm
├── src/                   # Source code backend BFF
│   ├── config/env.js      # Nạp cấu hình từ .env
│   ├── lib/
│   │   ├── apiClient.js   # HTTP Client giao tiếp REST API
│   │   └── cookies.js     # Parser cookies thủ công
│   ├── middlewares/       # Middleware phân quyền và nạp dữ liệu toàn cục
│   ├── routes/            # Khai báo các router Express
│   ├── app.js             # Cấu hình Express app
│   └── server.js          # Khởi động server HTTP
└── views/                 # View EJS Templates
    ├── errors/            # View thông báo lỗi (404, 500)
    ├── pages/             # Các trang chính (home, login, profile, admin, about)
    └── partials/          # Header, footer, sidebar, icons SVG dùng chung
```
