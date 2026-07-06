# BKafe - Website Hỏi đáp học tập trực tuyến cho sinh viên HUST

Dự án **BKafe** là nền tảng trao đổi, hỏi đáp và chia sẻ tài liệu học tập dành riêng cho sinh viên Đại học Bách khoa Hà Nội (HUST). Website được thiết kế tối ưu, trực quan và tích hợp cơ sở dữ liệu thời gian thực Firestore.

---

## 🚀 Các Tính Năng Đã Hoàn Thiện

### 1. Giao diện & Bố cục Phân trang Responsive (Tailwind CSS)
- **Desktop (>= 1280px)**: Giao diện **3 cột chuẩn hiện đại**:
  - *Cột trái*: Danh mục điều hướng nhanh (Trang chủ, Tin nhắn, Danh mục, Lịch học, Quản trị viên).
  - *Cột giữa*: Bảng tin bài viết/câu hỏi chính.
  - *Cột phải*: Thống kê hệ thống thời gian thực (Lượt xem website, câu hỏi, bình luận) và Danh sách tài nguyên HUST (Cổng thông tin SIS, Bản đồ HUST, Thư viện Tạ Quang Bửu).
- **Tablet (>= 768px & < 1280px)**: Ẩn cột thống kê bên phải, hiển thị **2 cột** (cột điều hướng bên trái và cột tin tức ở giữa).
- **Mobile (< 768px)**: Tối giản hóa thành **1 cột** bảng tin duy nhất. Thanh tìm kiếm được gom gọn, xuất hiện nút Menu Hamburger góc trên phải để mở rộng các lối tắt điều hướng qua ngăn kéo trượt (Mobile Drawer).

### 2. Hệ thống Xác thực Tài khoản Linh hoạt (Dual-Mode Auth)
- Hỗ trợ đăng ký và đăng nhập tài khoản bằng **Tên đăng nhập (username) độc nhất** hoặc **Email**.
- **Cơ chế Dual-Mode (Hai chế độ)**:
  - **Chế độ Mock Auth (Mặc định)**: Tự động chạy khi dự án kết nối với Project Sandbox của AI Studio (nơi tính năng Email/Password bị vô hiệu hóa). Cho phép trải nghiệm đăng ký, đăng nhập lưu trạng thái tại `localStorage` và kết nối với Firestore bình thường.
  - **Chế độ Real Firebase Auth**: Tự động kích hoạt khi bạn cấu hình thông tin dự án Firebase của riêng mình trong `src/lib/firebase.ts`.

### 3. Chi tiết Câu hỏi & Hệ thống Bình luận kiểu Facebook Bubble
- **Đánh giá câu hỏi**: Hiển thị điểm đánh giá trung bình từ 1★ đến 5★ của câu hỏi (được tính toán động từ tổng điểm đánh giá của các bình luận bên dưới).
- **Bình luận Bong bóng (Facebook Bubbles)**:
  - Hiển thị khung bình luận bo góc tròn kèm màu nền xám nhạt làm nổi bật nội dung phản hồi.
  - Gắn kèm nhãn Vai trò (ví dụ: `Tác giả`, `Quản trị viên`, `Vãng lai` - đối với bình luận ẩn danh).
  - Hỗ trợ **Đánh giá ẩn danh**: Người dùng chưa đăng nhập vẫn có thể bình luận bằng cách điền Họ tên + Email và gửi kèm đánh giá số sao (0 - 5★) cho bài viết.
- **Popover Đánh giá phản hồi**: Rê chuột (hoặc chạm điện thoại) vào nút "Đánh giá" dưới mỗi bình luận để mở bảng sao nổi (0-5★), cho phép chấm điểm mức độ hữu ích của đáp án đó.

### 4. Tìm kiếm Toàn diện & Trang Cá nhân
- **Tìm kiếm**: Thanh tìm kiếm thông minh hỗ trợ tìm kiếm bài viết theo từ khóa tiêu đề/nội dung và tìm kiếm người dùng theo Họ tên/Tên đăng nhập (username).
- **Trang cá nhân**: Hiển thị ảnh đại diện, họ tên, tên đăng nhập dạng `@username` và tiểu sử (biography) của sinh viên.
- **Hoạt động**: Chia làm 2 Tab rõ ràng: "Câu hỏi đã đăng" và "Bình luận & Đáp án" giúp dễ dàng xem lại lịch sử hoạt động. Chủ tài khoản có thể chỉnh sửa trực tiếp thông tin cá nhân.

### 5. Trang Quản trị (Admin Dashboard) & Dữ liệu Mẫu (Seeding)
- **Thống kê Lượt xem**: Theo dõi tổng số lượt truy cập (Page Views) của website một cách trực quan.
- **Duyệt bài**: Hỗ trợ Admin duyệt các câu hỏi mới gửi lên (`Chờ duyệt` -> `Đã duyệt`) hoặc xóa bài viết vi phạm.
- **Quản lý bình luận**: Hỗ trợ xóa các bình luận spam trực tiếp từ dashboard.
- **Khởi tạo dữ liệu mẫu (Seed Data)**: Tích hợp nút **"Thiết lập dữ liệu mẫu chuẩn"** giúp tự động tạo sẵn 3 tài khoản sinh viên tiêu biểu (Ngọc Lan, Trung Le, Nguyễn Hải Dương) cùng các câu hỏi thảo luận về Đại số tuyến tính, lập trình OOP Java để chấm điểm dự án nhanh chóng.

---

## 🛠️ Hướng dẫn Chạy ứng dụng

### 1. Cài đặt các gói phụ thuộc
Trong thư mục `bkafe_web_app`, chạy lệnh sau để phục hồi các thư viện:
```bash
npm install
```

### 2. Khởi chạy Local Server
Chạy lệnh sau để khởi động dự án ở môi trường cục bộ:
```bash
npm run dev
```
Truy cập ứng dụng tại địa chỉ: [http://localhost:3000/](http://localhost:3000/)

---

## ☁️ Hướng dẫn Kết nối với Firebase cá nhân của bạn

Để chuyển ứng dụng sang chạy hoàn toàn trên Firebase thật do bạn làm chủ, hãy thực hiện theo các bước sau:

### Bước 1: Tạo dự án Firebase
1. Truy cập [Firebase Console](https://console.firebase.google.com/) và đăng nhập bằng tài khoản Google.
2. Nhấp vào **Add project** (Thêm dự án), đặt tên là `bkafe` và hoàn thành các bước tạo dự án.

### Bước 2: Đăng ký Ứng dụng Web & Lấy Cấu hình
1. Tại màn hình tổng quan dự án, nhấp vào biểu tượng **Web (</>)** để tạo ứng dụng mới.
2. Đặt tên gợi nhớ (ví dụ: `bkafe-web`) rồi nhấn **Register app**.
3. Copy đoạn mã cấu hình `firebaseConfig` hiển thị trên màn hình. Nó sẽ có dạng như sau:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.firebasestorage.app",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

### Bước 3: Cấu hình lại mã nguồn ứng dụng
1. Mở file `src/lib/firebase.ts` trong mã nguồn dự án.
2. Thay thế đối tượng `firebaseConfig` mặc định bằng đối tượng cấu hình bạn vừa copy ở Bước 2.
3. Trong dòng khởi tạo Firestore:
   ```typescript
   export const db = getFirestore(app); // Hãy xóa đối số databaseId thứ 2 đi nếu bạn dùng database mặc định (Default)
   ```

### Bước 4: Bật tính năng Đăng nhập Email/Mật khẩu trên Firebase Console
1. Trên thanh điều hướng trái của Firebase Console, chọn **Build** > **Authentication**.
2. Nhấp vào tab **Sign-in method**, sau đó chọn **Email/Password**.
3. Bật tùy chọn **Email/Password** (Enable) và nhấn **Save**.

### Bước 5: Tạo Firestore Database & Thiết lập Security Rules
1. Chọn **Build** > **Firestore Database** trên thanh điều hướng trái.
2. Nhấp vào **Create database**. Chọn vị trí lưu trữ máy chủ (khuyên dùng `asia-southeast1` ở Singapore để tốc độ tải nhanh nhất) và nhấn Next.
3. Chọn chế độ bắt đầu (Start in **test mode** hoặc production mode).
4. Nhấp vào tab **Rules** ở đầu trang Firestore, dán toàn bộ nội dung của file `firestore.rules` có trong dự án của bạn vào đây, sau đó nhấn **Publish**.
