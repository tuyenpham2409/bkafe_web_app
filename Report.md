# BÁO CÁO TÓM TẮT — BKafe: Nền tảng Hỏi đáp trực tuyến cho sinh viên HUST

## 0. Thông tin chung

| | |
|---|---|
| **Tên đề tài** | BKafe — Website & Mobile app hỏi đáp học tập cho sinh viên Đại học Bách khoa Hà Nội |
| **Thành viên** | Lê Hà Hải Vân — 20233886 |
| | Phạm Minh Tuyên — 20233885 |
| **Kiến trúc** | 3 thành phần độc lập, giao tiếp qua REST API |

```
server/   Backend Express + MongoDB (Mongoose)        ← nơi duy nhất chạm database
web/      Web client (Express + EJS + Vanilla CSS/JS)  ← BFF (Backend-for-Frontend), gọi API
mobile/   App di động (React Native + Expo)             ← gọi cùng API
```

**Tuyên bố về việc không copy/dùng thư viện sẵn**: Toàn bộ giao diện (toast, modal xác nhận, lightbox ảnh, popover đánh giá sao, icon SVG, thanh trạng thái, khung chat bình luận lồng nhau...) đều tự viết tay bằng vanilla CSS/JS (web) và `View/Text/StyleSheet` thuần của React Native (mobile) — không dùng CSS framework (Bootstrap, Tailwind), không dùng UI kit dựng sẵn (NativeBase, React Native Paper, Ant Design...), không copy template có sẵn. Các package trong `package.json` của cả 3 phần chỉ gồm framework hạ tầng bắt buộc để chạy nền tảng (Express, EJS, Mongoose, React, React Native, Expo, React Navigation) và các tiện ích xử lý HTTP/bảo mật cấp thấp (multer, bcryptjs, jsonwebtoken, cors, dotenv) — không có thư viện nào triển khai sẵn nghiệp vụ được chấm điểm trong bài.

---

## 1. Danh sách chức năng chi tiết

### 1.1. Xác thực & tài khoản

| Chức năng | Web | Mobile | Yêu cầu BTL liên quan | Mức độ hoàn thiện |
|---|---|---|---|---|
| Đăng ký tài khoản (username = MSSV, email, mật khẩu) | ✅ | ✅ | — | Hoàn thiện |
| Đăng nhập bằng username (MSSV) hoặc email + mật khẩu, JWT | ✅ | ✅ | *Website:* "Có chức năng đăng nhập, đăng xuất... (phân biệt 2 loại người dùng: admin, user)" | Hoàn thiện |
| Đăng xuất | ✅ | ✅ | *(như trên)* | Hoàn thiện |
| Phân quyền admin / user | ✅ | ✅ | *(như trên)* | Hoàn thiện |
| Đổi mật khẩu (khi đã đăng nhập, yêu cầu mật khẩu hiện tại) | ✅ | ✅ | — | Hoàn thiện |
| Đổi username — chỉ được đổi **1 lần duy nhất** | ✅ | ✅ | — | Hoàn thiện |
| Ẩn/hiện mật khẩu khi nhập | ✅ | ✅ | — | Hoàn thiện |

### 1.2. Nội dung (câu hỏi / bài viết) — "trang hiển thị nội dung khác nhau theo mã của nội dung"

| Chức năng | Web | Mobile | Yêu cầu BTL liên quan | Mức độ hoàn thiện |
|---|---|---|---|---|
| Trang chủ: danh sách bài viết, lọc theo **4 chủ đề** (Học tập, Tài liệu, Đời sống, Việc làm & CLB) | ✅ | ✅ | *Website:* trang chủ | Hoàn thiện |
| Tìm kiếm bài viết + người dùng | ✅ | ✅ | — | Hoàn thiện |
| Sắp xếp kết quả (mới nhất/cũ nhất/đánh giá cao→thấp/thấp→cao/lượt xem) | ✅ | ✅ | — | Hoàn thiện |
| Trang chi tiết bài viết theo mã `/post/:id` | ✅ | ✅ | *Website:* "Có trang hiển thị nội dung khác nhau theo mã của nội dung" | Hoàn thiện |
| Đăng bài mới (chọn chủ đề, nội dung bắt buộc, **tiêu đề không bắt buộc**, tối đa 5 ảnh/video) | ✅ | ✅ | — | Hoàn thiện |
| Sửa bài viết — chủ bài (nếu chưa duyệt/chưa bị từ chối tuỳ nền tảng) **hoặc admin sửa bài của bất kỳ ai**; admin sửa thì giữ nguyên trạng thái và tự động gửi thông báo cho tác giả | ✅ | ✅ | *Website (Trang quản trị):* "Cho phép cập nhật thông tin ở các trang nội dung" | Hoàn thiện |
| Xoá bài viết — chủ bài hoặc admin (admin xoá bài người khác phải nhập lý do, tự động gửi thông báo) | ✅ | ✅ | — | Hoàn thiện |
| Duyệt / Từ chối bài viết (admin, từ chối bắt buộc nhập lý do, tự động thông báo cho tác giả) | ✅ | ✅ | — | Hoàn thiện |
| Đếm lượt xem — tăng đúng **1 lần cho mỗi lượt xem thực sự** (không tăng khi polling nền hoặc khi quay lại từ hành động khác) | ✅ | ✅ | *Website (Trang quản trị):* "Hiển thị số lượng view của toàn bộ Website" (một phần của cùng cơ chế đếm view) | Hoàn thiện |
| Chia sẻ bài viết — copy liên kết vào clipboard, hiện thông báo xác nhận, **chặn tăng lượt chia sẻ trùng lặp** khi bấm nhiều lần (lưu cờ theo thiết bị: `localStorage` ở web, `AsyncStorage` ở mobile) | ✅ | ✅ | — | Hoàn thiện |
| Xem ảnh/video đính kèm dạng lightbox toàn màn hình | ✅ | ✅ | — | Hoàn thiện |
| Upload ảnh/video (multer, giới hạn số lượng & dung lượng) | ✅ | ✅ | — | Hoàn thiện |

### 1.3. Bình luận & Đánh giá — "form bình luận và đánh giá cho nội dung đang xem"

| Chức năng | Web | Mobile | Yêu cầu BTL liên quan | Mức độ hoàn thiện |
|---|---|---|---|---|
| Viết bình luận (yêu cầu đăng nhập; nội dung + đính kèm ảnh/video) | ✅ | ✅ | *Website:* "Có form bình luận và đánh giá... với các thông tin tên người, email, nội dung bình luận, điểm đánh giá" | **Hoàn thiện có điều chỉnh** — xem ghi chú bên dưới |
| Trả lời bình luận (lồng nhau nhiều cấp) | ✅ | ✅ | *(như trên)* | Hoàn thiện |
| Sửa / xoá bình luận (chủ bình luận hoặc admin) | ✅ | ✅ | — | Hoàn thiện |
| Bình luận hiển thị công khai ngay sau khi gửi | ✅ | ✅ | *Website:* "Các bình luận và đánh giá sau khi gửi sẽ được hiển thị công khai" | Hoàn thiện |
| Đánh giá sao (0–5) cho bài viết, tách thành thao tác riêng (popover chọn sao) | ✅ | ✅ | *(cùng mục form bình luận/đánh giá)* | Hoàn thiện |
| Đánh giá sao (0–5) cho từng bình luận | ✅ | ✅ | — | Hoàn thiện |
| **"Ai đã đánh giá"** — xem danh sách người đã đánh giá kèm avatar, tên, số sao; danh sách tự cập nhật theo thời gian thực bằng polling (`fetch`/`api.get` + `setInterval` mỗi ~3 giây khi đang mở), không dùng thư viện realtime/websocket | ✅ | ✅ | *(bổ sung nâng cao cho mục đánh giá)* | Hoàn thiện |

> **Ghi chú tự đánh giá về mục "tên người, email, nội dung bình luận, điểm đánh giá":** Nhóm chọn thiết kế bắt buộc đăng nhập để bình luận/đánh giá (thay vì form khách vãng lai nhập tay tên/email), nên tên và email được lấy tự động, đáng tin cậy từ tài khoản đã xác thực thay vì để người dùng tự gõ (tránh giả mạo danh tính, đúng tinh thần bảo mật hơn). Toàn bộ 4 trường dữ liệu (tên người, email, nội dung, điểm đánh giá) **vẫn được lưu đầy đủ trong database cho mỗi bình luận/đánh giá** và hiển thị công khai — chỉ khác ở chỗ 2 trường tên/email không phải ô nhập tay riêng trong form mà được điền tự động từ phiên đăng nhập. Đánh giá sao được tách thành thao tác riêng (không nằm chung form với ô nhập bình luận) và được bổ sung thêm tính năng xem "ai đã đánh giá" cập nhật thời gian thực để tăng tính minh bạch/tương tác.

### 1.4. Trang chủ & Popup quảng cáo

| Chức năng | Web | Mobile | Yêu cầu BTL liên quan | Mức độ hoàn thiện |
|---|---|---|---|---|
| Popup quảng cáo hiện sau đúng **1 phút** kể từ khi mở trang chủ | ✅ | ✅ | *Website:* "Ở trang chủ, sau 1' từ khi mở trang thì hiện quảng cáo một sản phẩm định trước dưới dạng popup" | Hoàn thiện |
| Đóng popup → lần sau mở trang **không hiện lại**, dùng **cookie** ở web (đúng yêu cầu, không dùng `localStorage`), dùng `AsyncStorage` tương đương ở mobile | ✅ | ✅ | *Website:* "sử dụng cookie" | Hoàn thiện |
| Đếm tổng lượt truy cập Website (Counter riêng, tăng khi tải trang chủ) | ✅ | ✅ (đọc số liệu ở trang quản trị) | *Website (Trang quản trị):* "Hiển thị số lượng view của toàn bộ Website" | Hoàn thiện |

### 1.5. Giới thiệu & Liên hệ

| Chức năng | Web | Mobile | Yêu cầu BTL liên quan | Mức độ hoàn thiện |
|---|---|---|---|---|
| Trang Giới thiệu (thông tin dự án) | ✅ | — *(không bắt buộc theo yêu cầu mobile)* | *Website:* "Trang giới thiệu và thông tin liên hệ" | Hoàn thiện |
| Form gửi ý kiến liên hệ (tự điền tên/email nếu đã đăng nhập, đính kèm file minh chứng) | ✅ | ✅ | *Website:* "Form gửi ý kiến liên hệ"; *Mobile:* "Màn hình ý kiến và liên hệ" | Hoàn thiện |
| Quản lý hộp thư liên hệ (admin: xem, đánh dấu đã xử lý, xoá) | ✅ | ✅ | — | Hoàn thiện |

### 1.6. Hồ sơ người dùng

| Chức năng | Web | Mobile | Yêu cầu BTL liên quan | Mức độ hoàn thiện |
|---|---|---|---|---|
| Xem/sửa hồ sơ cá nhân: tên hiển thị, tiểu sử (bio), ảnh đại diện | ✅ | ✅ | — | Hoàn thiện |
| Danh sách bài viết của chính mình — bao gồm **cả bài đang chờ duyệt/bị từ chối**, kèm badge trạng thái | ✅ | ✅ | — | Hoàn thiện |
| Xem hồ sơ công khai của người dùng khác (bio, ngày tham gia, số bài đã duyệt, số bình luận, danh sách bài đã duyệt) — chỉ hiển thị nội dung đã duyệt | ✅ | ✅ | — | Hoàn thiện |

### 1.7. Thông báo

| Chức năng | Web | Mobile | Yêu cầu BTL liên quan | Mức độ hoàn thiện |
|---|---|---|---|---|
| Thông báo trong ứng dụng: bài được duyệt/từ chối/xoá/sửa bởi admin, bài/bình luận được đánh giá, có bài chờ duyệt mới (gửi admin), tài khoản bị khoá quyền, có liên hệ mới (gửi admin) | ✅ | ✅ | — | Hoàn thiện |
| Cập nhật số thông báo/liên hệ chưa đọc theo thời gian thực bằng polling (không dùng socket.io) | ✅ | ✅ | — | Hoàn thiện |

### 1.8. Trang quản trị — "Trang quản trị"

| Chức năng | Web | Mobile | Yêu cầu BTL liên quan | Mức độ hoàn thiện |
|---|---|---|---|---|
| Thống kê tổng quan: lượt xem web, số bài đã duyệt/chờ duyệt, số thành viên, số bình luận, số người đang truy cập | ✅ | ✅ | *Website:* "Hiển thị số lượng view của toàn bộ Website" | Hoàn thiện |
| Quản lý bài viết: xem tất cả/chờ duyệt/đã duyệt, tìm kiếm theo tiêu đề/tác giả, sắp xếp, duyệt/từ chối, **sửa nội dung bài của bất kỳ ai** | ✅ | ✅ | *Website:* "Cho phép cập nhật thông tin ở các trang nội dung" | Hoàn thiện |
| Quản lý bình luận: xem toàn bộ bình luận trên hệ thống, tìm kiếm, xoá | ✅ | ✅ | *Website:* "Cho phép hiện danh sách, xoá bình luận của người dùng" | Hoàn thiện |
| Quản lý người dùng: tìm kiếm, sắp xếp, khoá quyền đăng bài/bình luận kèm lý do, đổi vai trò admin/user, xoá tài khoản | ✅ | ✅ | — | Hoàn thiện |
| Tạo tài khoản mới từ trang quản trị | ✅ | ❌ | — | **Còn thiếu ở mobile** |
| Đặt lại mật khẩu cho người dùng khác (admin) | ✅ | ❌ | — | **Còn thiếu ở mobile** |

### 1.9. Giao diện & Responsive

| Chức năng | Web | Mobile | Yêu cầu BTL liên quan | Mức độ hoàn thiện |
|---|---|---|---|---|
| Giao diện responsive theo đúng 3 ngưỡng `< 800px` (điện thoại) / `800–1200px` (máy tính bảng) / `> 1200px` (desktop) | ✅ | *(không áp dụng — mobile chỉ chạy trên thiết bị di động)* | *Website:* "Giao diện responsive cho phép tuỳ chỉnh layout với 3 ngưỡng phân biệt bởi các giá trị 800px, 1200px" | Hoàn thiện |
| Dấu `*` đánh dấu trường bắt buộc trong form | ✅ | ✅ | — | Hoàn thiện |
| Toast thông báo, modal xác nhận, dropdown, popover — tự viết tay bằng vanilla CSS/JS (web) và component RN thuần (mobile) | ✅ | ✅ | *"Copy hoặc dùng các thư viện sẵn (penalty)"* — tránh vi phạm | Hoàn thiện |

---

## 2. Bảng đối chiếu mức độ hoàn thiện theo đúng cấu trúc "Yeu cau BTL.pdf"

### Website

| Yêu cầu trong đề bài | Trạng thái | Ghi chú |
|---|---|---|
| Lưu trữ dữ liệu bằng database | ✅ Đạt | MongoDB + Mongoose, dùng chung cho web & mobile |
| Đăng nhập, đăng xuất, phân biệt admin/user | ✅ Đạt | JWT, username/email + password |
| Trang hiển thị nội dung khác nhau theo mã của nội dung | ✅ Đạt | `/post/:id` |
| — Form bình luận và đánh giá (tên, email, nội dung, điểm đánh giá) | ⚠️ Đạt có điều chỉnh | Danh tính (tên/email) lấy từ tài khoản đăng nhập thay vì ô nhập tay; đủ 4 trường dữ liệu được lưu & hiển thị — xem ghi chú mục 1.3 |
| — Bình luận/đánh giá hiển thị công khai sau khi gửi | ✅ Đạt | |
| Popup quảng cáo sau 1 phút | ✅ Đạt | |
| — Đóng popup thì không hiện lại (dùng cookie) | ✅ Đạt | Dùng `document.cookie`, đúng yêu cầu |
| Trang giới thiệu và thông tin liên hệ | ✅ Đạt | |
| — Form gửi ý kiến liên hệ | ✅ Đạt | |
| Trang quản trị | ✅ Đạt | |
| — Hiển thị số lượng view của toàn bộ Website | ✅ Đạt | |
| — Cho phép cập nhật thông tin ở các trang nội dung | ✅ Đạt | Admin sửa được nội dung mọi bài viết, tự động thông báo tác giả |
| — Cho phép hiện danh sách, xoá bình luận của người dùng | ✅ Đạt | Trang quản lý bình luận riêng |
| Giao diện responsive 3 ngưỡng 800px/1200px | ✅ Đạt | |
| Thiết kế và trình bày giao diện | ✅ Đạt | Bộ màu/token CSS nhất quán, tự thiết kế |
| Tổ chức project | ✅ Đạt | Tách biệt `server/`, `web/`, `mobile/`; mỗi phần có cấu trúc `routes/controllers/models` (server), `routes/views` (web) rõ ràng |
| **Copy hoặc dùng các thư viện sẵn (penalty)** | ✅ **Không vi phạm** | Không CSS/UI framework, mọi widget nghiệp vụ tự viết tay (xem mục 0) |

### Mobile app

| Yêu cầu trong đề bài | Trạng thái | Ghi chú |
|---|---|---|
| Giao tiếp với website bằng API | ✅ Đạt | Gọi thẳng cùng REST API với web, không có logic backend nào trong app |
| Màn hình chính | ✅ Đạt | Danh sách, lọc chủ đề, tìm kiếm, sắp xếp, popup quảng cáo |
| Màn hình đăng nhập | ✅ Đạt | |
| Màn hình hiển thị nội dung | ✅ Đạt | |
| — Cho phép người dùng bình luận, đánh giá nội dung | ✅ Đạt | Bình luận, trả lời, đánh giá sao + xem ai đã đánh giá |
| Màn hình ý kiến và liên hệ | ✅ Đạt | |
| Thiết kế và trình bày giao diện | ✅ Đạt | Đồng bộ bảng màu với web, tự dựng bằng `StyleSheet` |
| Tổ chức project | ✅ Đạt | Tách `api/ context/ navigation/ screens/ components/ theme/` rõ ràng |
| **Copy hoặc dùng các thư viện sẵn (penalty)** | ✅ **Không vi phạm** | Không UI kit dựng sẵn, chỉ dùng module hạ tầng Expo chính thức (điều hướng, lưu trữ, chọn ảnh, clipboard) |

**Kết luận chung:** Không có rủi ro bị áp dụng mức phạt "Copy hoặc dùng các thư viện sẵn" ở cả web và mobile. Hai điểm chưa hoàn thiện 100% là (1) mobile thiếu 2 thao tác quản trị phụ (tạo tài khoản mới, đặt lại mật khẩu người dùng khác — cả hai đã có sẵn ở web) và (2) quyết định thiết kế dùng danh tính tài khoản thay vì ô nhập tay tên/email trong form bình luận.

---

## 3. Phân công nhiệm vụ

Công việc được chia đều theo **chức năng** (mỗi người phụ trách toàn bộ một nhóm chức năng xuyên suốt cả web, mobile và phần backend liên quan — không chia theo kiểu tách riêng frontend/backend).

### 3.1. Lê Hà Hải Vân — 20233886

| Nhóm chức năng phụ trách |
|---|
| **Xác thực & tài khoản**: đăng ký, đăng nhập/đăng xuất, phân quyền admin/user, đổi mật khẩu, đổi username, ẩn/hiện mật khẩu |
| **Hồ sơ người dùng**: xem/sửa hồ sơ cá nhân (tên, bio, avatar), xem hồ sơ công khai người khác, danh sách bài viết của chính mình (kèm badge trạng thái) |
| **Nội dung (bài viết)**: trang chủ, tìm kiếm & sắp xếp, trang chi tiết, đăng bài, sửa/xoá bài viết (kể cả quyền sửa của admin), upload ảnh/video, lightbox, đếm lượt xem, chia sẻ bài viết |
| **Bình luận & đánh giá**: viết/trả lời/sửa/xoá bình luận, đánh giá sao bài viết & bình luận, tính năng "ai đã đánh giá" cập nhật thời gian thực |

### 3.2. Phạm Minh Tuyên — 20233885

| Nhóm chức năng phụ trách |
|---|
| **Hạ tầng & kiến trúc hệ thống**: thiết kế database (Mongoose models), xây dựng REST API (Express), kiến trúc BFF cho web (Express + EJS), khởi tạo app mobile (React Native/Expo), cấu hình môi trường, giao diện responsive 3 ngưỡng |
| **Trang chủ & Popup quảng cáo**: popup quảng cáo sau 1 phút + lưu trạng thái đóng bằng cookie/AsyncStorage, đếm tổng lượt truy cập Website |
| **Giới thiệu & Liên hệ**: trang giới thiệu, form gửi ý kiến liên hệ, quản lý hộp thư liên hệ ở trang quản trị |
| **Thông báo hệ thống**: xây dựng cơ chế thông báo trong ứng dụng (duyệt/từ chối/xoá/sửa bài, đánh giá, liên hệ mới...) và polling cập nhật badge chưa đọc |
| **Trang quản trị**: thống kê tổng quan, quản lý bài viết (duyệt/từ chối/tìm kiếm/sắp xếp), quản lý bình luận toàn site, quản lý người dùng (khoá quyền, đổi vai trò, tạo mới, đặt lại mật khẩu, xoá) |

---

## 4. Hướng dẫn cài đặt và sử dụng

### 4.1. Yêu cầu môi trường
- Node.js ≥ 18
- MongoDB (khuyến nghị chạy bằng Docker)
- Expo Go (cài trên điện thoại Android/iOS) hoặc máy ảo Android/iOS, nếu muốn chạy thử mobile app

### 4.2. Khởi động MongoDB
```bash
docker run -d --name bkafe-mongo -p 27017:27017 -v bkafe-mongo-data:/data/db mongo:7
```

### 4.3. Khởi động Backend API (`server/`)
```bash
cd server
npm install
cp .env.example .env       # mặc định đã trỏ tới Mongo local, cổng 5000
npm run seed                # tạo 4 chủ đề, tài khoản admin + ~60 tài khoản sinh viên mẫu
npm start                   # API chạy tại http://localhost:5000
```

> **Về dữ liệu mẫu**: vì dùng MongoDB/Mongoose (không có file `.sql`), dữ liệu mẫu được cung cấp dưới 2 hình thức trong file nộp: script `server/src/utils/seed.js` (chạy `npm run seed` để tái tạo đầy đủ và chính xác nhất — 4 chủ đề, ~65 tài khoản, 15 bài viết đủ trạng thái, ~34 bình luận, góp ý liên hệ) và thư mục `sample-data/*.json` ở gốc repo — bản export JSON của đúng dữ liệu đó, để xem/kiểm tra trực tiếp mà không cần cài MongoDB (tạo lại bằng `npm run export-sample-data`).

### 4.4. Khởi động Web client (`web/`)
```bash
cd web
npm install
cp .env.example .env       # PORT=3000, API_URL=http://localhost:5000/api
npm run dev                 # http://localhost:3000
```

### 4.5. Khởi động Mobile app (`mobile/`)
```bash
cd mobile
npm install
npm start                   # mở Expo Dev Tools
```
- Quét mã QR bằng ứng dụng **Expo Go** trên điện thoại thật (điện thoại phải **cùng mạng Wi-Fi** với máy tính chạy server), hoặc
- Nhấn `a` để mở Android emulator, `w` để mở bản chạy trên trình duyệt.
- App tự nhận diện địa chỉ IP LAN của máy chạy server, không cần chỉnh sửa code khi đổi máy.

### 4.6. Tài khoản dùng thử (mật khẩu chung: `Abc123@`)
| Tài khoản | Vai trò |
|---|---|
| `admin` (email `admin@bkafe.hust.edu.vn`) | Quản trị viên |
| Các username dạng MSSV (ví dụ `20233886`, `20233885`, ...) được tạo tự động khi chạy `npm run seed` | Sinh viên (user) |

Đăng nhập được bằng **username (MSSV) hoặc email**.

### 4.7. Hướng dẫn sử dụng nhanh
1. **Người dùng thường**: đăng ký/đăng nhập → duyệt bài theo chủ đề hoặc tìm kiếm → đăng câu hỏi mới (chờ admin duyệt) → bình luận, đánh giá sao, chia sẻ bài viết → theo dõi thông báo khi bài được duyệt/có phản hồi.
2. **Quản trị viên**: đăng nhập bằng tài khoản `admin` → vào **Trang quản trị** để xem thống kê, duyệt/từ chối bài viết mới, sửa nội dung bài viết bất kỳ, kiểm duyệt/xoá bình luận, quản lý tài khoản người dùng (khoá quyền, đổi vai trò, tạo/xoá tài khoản), xử lý hộp thư góp ý.
