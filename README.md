# BKafe - Website Hỏi đáp học tập trực tuyến cho sinh viên HUST

Dự án **BKafe** là nền tảng trao đổi, hỏi đáp và chia sẻ tài liệu học tập dành riêng cho sinh viên Đại học Bách khoa Hà Nội (HUST). Đây là phần **web client** (React + Vite + Tailwind), giao tiếp với backend riêng `../server` (Express + MongoDB/Mongoose) qua REST API — không dùng dịch vụ backend dựng sẵn (Firebase, Supabase...).

## Kiến trúc tổng thể

```
bkafe/
├── server/          Backend Express + MongoDB (Mongoose) — API dùng chung
├── bkafe_web_app/    ← bạn đang ở đây (web client)
└── mobile/           App di động (React Native/Expo), gọi cùng API
```

## Tính năng chính
- Đăng nhập/đăng ký bằng **MSSV (username) hoặc email**, phân quyền admin/user, đổi/quên mật khẩu, đổi username 1 lần.
- Câu hỏi phân theo **4 chủ đề**, mỗi câu hỏi là 1 trang riêng, hỗ trợ đính kèm ảnh/video.
- Bình luận + trả lời + đánh giá sao (0–5) cho cả bài viết và bình luận — công khai ngay sau khi gửi.
- Popup quảng cáo sau 1 phút ở trang chủ, ẩn vĩnh viễn qua cookie khi đã đóng.
- Trang Giới thiệu & Liên hệ (form góp ý; admin xem hộp thư góp ý thay vì gửi).
- Trang quản trị: thống kê (bấm để cuộn tới mục), duyệt/từ chối bài (kèm lý do + thông báo), CRUD người dùng, quản lý bình luận, quản lý bài viết ngay trên trang chi tiết (menu ⋮).
- Tìm kiếm + sắp xếp (mới/cũ, điểm đánh giá) + lọc theo chủ đề.
- Giao diện responsive 3 ngưỡng: < 800px / 800–1200px / > 1200px.

## Chạy thử local

Cần **backend đang chạy** trước (xem [`../server/README.md`](../server/README.md)):
```bash
# 1) MongoDB (Docker) + backend — ở thư mục server/
docker start bkafe-mongo   # hoặc docker run ... nếu chưa tạo container
cd ../server && npm start  # http://localhost:5000

# 2) Web client — ở thư mục này
npm install
npm run dev                # http://localhost:3000
```

Web đọc địa chỉ API từ biến môi trường `VITE_API_URL` trong `.env` (mặc định trỏ tới `http://localhost:5000/api`).

## Tài khoản mẫu (mật khẩu chung `Abc123@`)
`admin` · `20233885` · `20230001` · `20230002` · `20230003` (đăng nhập bằng username=MSSV hoặc email; tạo qua `npm run seed` trong `server/`).

## Cấu trúc thư mục
```
src/
├── main.tsx, App.tsx        # điểm khởi động + định tuyến (react-router-dom)
├── lib/api.ts                # fetch wrapper gọi BKafe API + lưu JWT
├── contexts/                 # AuthContext (JWT), LoginGate (popup yêu cầu đăng nhập dùng chung)
├── components/                # Layout, PasswordInput, ...
└── pages/                     # Home, Login, Register, PostDetail, CreatePost, Profile, Admin, AboutContact, Search
```
