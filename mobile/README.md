# BKafe Mobile (React Native + Expo)

App di động cho BKafe, giao tiếp với **cùng một REST API** đang phục vụ web (`server/`) — không có logic backend nào nằm trong app, đúng yêu cầu "giao tiếp với website bằng API".

## Cấu trúc project

```
mobile/
├── App.js                     # Providers gốc (Auth, LoginGate, Badge) + NavigationContainer
├── src/
│   ├── api/
│   │   ├── client.js          # fetch wrapper, tự suy ra IP LAN của máy chủ API và của web (chia sẻ liên kết)
│   │   └── storage.js         # lưu JWT bằng AsyncStorage
│   ├── context/
│   │   ├── AuthContext.js     # đăng nhập/đăng ký/đăng xuất/refresh
│   │   ├── LoginGate.js       # popup "Yêu cầu đăng nhập" dùng chung toàn app
│   │   └── BadgeContext.js    # polling số thông báo/liên hệ chưa đọc cho badge trên tab
│   ├── navigation/
│   │   ├── RootNavigator.js   # Stack: MainTabs, Login, Register, PostDetail, CreatePost, AdminDashboard, UserProfile
│   │   └── MainTabs.js        # Bottom tabs: Trang chủ · Thông báo · Liên hệ · Cá nhân
│   ├── screens/                # Home, Login, Register, PostDetail, CreatePost, Contact, Profile, UserProfile, Notification, AdminDashboard
│   ├── components/             # StarRating, Avatar, PasswordInput, PostCard, Required
│   └── theme/colors.js         # bảng màu dùng chung, đồng bộ giao diện với web
```

Không dùng UI kit dựng sẵn (không NativeBase/Paper/Tamagui...) — toàn bộ giao diện tự dựng bằng `View/Text/StyleSheet` của React Native. Chỉ dùng các module hạ tầng chính thức của Expo (navigation, lưu trữ, chọn ảnh, clipboard) — không có thư viện business-logic nào (toast, modal, star-rating, admin dashboard đều tự viết).

## Màn hình (đúng theo yêu cầu BTL)

| Màn hình | Mô tả |
|---|---|
| **Màn hình chính** | Danh sách câu hỏi, lọc theo 4 chủ đề, tìm kiếm (câu hỏi + người dùng), sắp xếp (mới/cũ, đánh giá), popup quảng cáo sau 1 phút (ẩn vĩnh viễn qua AsyncStorage tương đương cookie) |
| **Màn hình đăng nhập** | Đăng nhập bằng MSSV/email + mật khẩu (ẩn/hiện), liên kết đăng ký |
| **Màn hình hiển thị nội dung** | Chi tiết câu hỏi + ảnh/video đính kèm + **bình luận, trả lời, đánh giá sao** (chỉ khi đăng nhập — khách vãng lai bị chặn bởi popup yêu cầu đăng nhập dùng chung). Bấm vào điểm đánh giá trung bình để xem "Ai đã đánh giá" — danh sách tự cập nhật bằng polling (`setInterval` gọi API mỗi ~3s khi modal đang mở), không dùng thư viện realtime nào |
| **Màn hình ý kiến & liên hệ** | Form gửi góp ý, tự điền tên/email nếu đã đăng nhập |

Ngoài ra có thêm:
- **Đăng bài**: chọn chủ đề + upload ảnh/video (tiêu đề không bắt buộc, khớp quy tắc bên web); thông báo và điều hướng khác nhau tuỳ bài được duyệt tự động hay đang chờ duyệt.
- **Cá nhân**: avatar, bio, đổi mật khẩu/username 1 lần, danh sách bài của chính mình (kể cả bài đang chờ duyệt/bị từ chối kèm badge trạng thái), đăng xuất.
- **Hồ sơ công khai**: xem thông tin, bio, số bài/bình luận và danh sách bài đã duyệt của người dùng khác (bấm vào tên/avatar ở bất kỳ đâu trong app).
- **Thông báo**: danh sách thông báo (duyệt/từ chối/xoá/sửa bài, đánh giá...), polling để cập nhật badge chưa đọc trên tab.
- **Trang quản trị** (chỉ admin): thống kê (lượt xem, bài, bình luận, thành viên, đang truy cập), duyệt/từ chối/tìm-sắp xếp bài viết, **sửa nội dung bài viết của bất kỳ ai** (tự động thông báo cho tác giả), xem/xoá bình luận toàn site, quản lý người dùng (khoá quyền đăng bài/bình luận, đổi vai trò, xoá, sắp xếp).

## Chạy thử

1. Đảm bảo **backend đang chạy** (xem `../server/README.md`) và **điện thoại/máy ảo cùng mạng Wi-Fi** với máy tính.
2. ```bash
   cd mobile
   npm install
   npm start
   ```
3. Quét mã QR bằng ứng dụng **Expo Go** (Android/iOS) — hoặc nhấn `a` để mở Android emulator, `w` để mở bản web.

> Địa chỉ API (`API_URL`, cổng 5000) và địa chỉ web (`WEB_URL`, cổng 3000, dùng khi copy liên kết chia sẻ bài viết) được tự suy ra từ địa chỉ Expo dev server đang phục vụ bundle (`Constants.expoConfig.hostUri`), nên **không cần sửa code** khi đổi máy — miễn là điện thoại và máy tính cùng mạng LAN. Android emulator dùng bí danh `10.0.2.2` tự động.

## Tài khoản thử nghiệm
Dùng chung với web/server: `admin` (email `admin@bkafe.hust.edu.vn`) và các tài khoản sinh viên mẫu (username = MSSV) — mật khẩu `Abc123@`.
