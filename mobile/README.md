# BKafe Mobile (React Native + Expo)

App di động cho BKafe, giao tiếp với **cùng một REST API** đang phục vụ web (`server/`) — không có logic backend nào nằm trong app, đúng yêu cầu "giao tiếp với website bằng API".

## Cấu trúc project

```
mobile/
├── App.js                     # Providers gốc (Auth, LoginGate) + NavigationContainer
├── src/
│   ├── api/
│   │   ├── client.js          # fetch wrapper, tự suy ra IP LAN của máy chủ API
│   │   └── storage.js         # lưu JWT bằng AsyncStorage
│   ├── context/
│   │   ├── AuthContext.js     # đăng nhập/đăng ký/đăng xuất/refresh
│   │   └── LoginGate.js       # popup "Yêu cầu đăng nhập" dùng chung toàn app
│   ├── navigation/
│   │   ├── RootNavigator.js   # Stack: MainTabs, Login, Register, PostDetail, CreatePost
│   │   └── MainTabs.js        # Bottom tabs: Trang chủ · Liên hệ · Cá nhân
│   ├── screens/                # Home, Login, Register, PostDetail, CreatePost, Contact, Profile
│   ├── components/             # StarRating, Avatar, PasswordInput, PostCard, Required
│   └── theme/colors.js         # bảng màu dùng chung, đồng bộ giao diện với web
```

Không dùng UI kit dựng sẵn (không NativeBase/Paper/Tamagui...) — toàn bộ giao diện tự dựng bằng `View/Text/StyleSheet` của React Native. Chỉ dùng các module hạ tầng chính thức của Expo (navigation, lưu trữ, chọn ảnh) tương đương `react-router-dom`/`js-cookie` đã dùng ở bản web.

## Màn hình (đúng theo yêu cầu BTL)

| Màn hình | Mô tả |
|---|---|
| **Màn hình chính** | Danh sách câu hỏi, lọc theo 4 chủ đề, tìm kiếm, popup quảng cáo sau 1 phút (ẩn vĩnh viễn qua AsyncStorage ~ cookie) |
| **Màn hình đăng nhập** | Đăng nhập bằng MSSV/email + mật khẩu (ẩn/hiện), quên mật khẩu, liên kết đăng ký |
| **Màn hình hiển thị nội dung** | Chi tiết câu hỏi + ảnh/video đính kèm + **bình luận, trả lời, đánh giá sao** (chỉ khi đăng nhập — khách vãng lai bị chặn bởi popup yêu cầu đăng nhập dùng chung) |
| **Màn hình ý kiến & liên hệ** | Form gửi góp ý, tự điền tên/email nếu đã đăng nhập |

Ngoài ra có thêm **Đăng bài** (chọn chủ đề + upload ảnh/video) và **Cá nhân** (avatar, đổi mật khẩu, đổi username 1 lần, đăng xuất) để hoàn thiện vòng đời tài khoản.

## Chạy thử

1. Đảm bảo **backend đang chạy** (xem `../server/README.md`) và **điện thoại/máy ảo cùng mạng Wi-Fi** với máy tính.
2. ```bash
   cd mobile
   npm install
   npm start
   ```
3. Quét mã QR bằng ứng dụng **Expo Go** (Android/iOS) — hoặc nhấn `a` để mở Android emulator, `w` để mở bản web.

> Địa chỉ API được tự suy ra từ địa chỉ Expo dev server đang phục vụ bundle (`Constants.expoConfig.hostUri`), nên **không cần sửa code** khi đổi máy — miễn là điện thoại và máy tính cùng mạng LAN. Android emulator dùng bí danh `10.0.2.2` tự động.

## Tài khoản thử nghiệm
Dùng chung với web: `admin`, `20233885`, `20230001`, `20230002`, `20230003` — mật khẩu `Abc123@`.
