# Smart Bookmark - Nền tảng Lưu trữ & Quản lý Bookmark Tài liệu Thông minh

Ứng dụng web trực quan, hiện đại bằng tiếng Việt giúp người dùng lưu trữ, phân loại và quản lý các tài liệu, bài viết và công cụ trên Internet với khả năng tự động trích xuất metadata website và đồng bộ hóa qua Firebase Firestore.

## User Review & Critical Decisions

> [!IMPORTANT]
> Dưới đây là các quyết định thiết kế và công nghệ đã được xác nhận sau quá trình trao đổi:

- **Phương thức trích xuất thông tin website**: Sử dụng endpoint proxy máy chủ `/api/metadata` kết hợp với thẻ OpenGraph / meta tags và Google Favicon API để tự động lấy tiêu đề, ảnh thumbnail preview, mô tả và favicon khi người dùng dán link.
- **Dữ liệu khởi tạo ban đầu**: Nạp sẵn các thư mục tài liệu thực tế (ví dụ: *Lập trình & Dev*, *Công cụ AI & Tiện ích*, *Tài nguyên Học tập*, *Tin tức & Bài viết*) kèm bookmark mẫu để người dùng trải nghiệm ngay lập tức.
- **Xác thực và phân quyền dữ liệu**: Sử dụng Firebase Anonymous Authentication (`signInAnonymously`) chạy ngầm tự động. Người dùng không cần tạo tài khoản hay đăng nhập, nhưng mỗi phiên truy cập vẫn được cấp một UID bảo mật riêng biệt trong Firestore, dữ liệu thuộc về riêng họ và có thể xuất/nhập JSON để sao lưu.
- **Phong cách giao diện**: Hiện đại tối giản theo tiêu chuẩn SaaS Dashboard với tông màu slate thanh lịch, điểm nhấn xanh ngọc (emerald/indigo), bo góc mềm mại, typography tiếng Việt sắc nét và hỗ trợ chuyển đổi Sáng / Tối (Dark / Light Mode) mượt mà.

---

## 1. Overview & Core Concept

- **Mục tiêu sản phẩm**: Cung cấp một "bộ não số thứ hai" cho các đường link và tài liệu nghiên cứu. Giải quyết tình trạng bookmark trình duyệt bị lộn xộn, khó tìm và thiếu ngữ cảnh ghi chú.
- **Đối tượng sử dụng**: Lập trình viên, sinh viên, nhà nghiên cứu và người dùng internet cần tổ chức tài liệu học tập, công cụ làm việc và bài đọc hàng ngày.
- **Giá trị cốt lõi**:
  - Dán URL là có ngay card tài liệu đẹp mắt kèm hình ảnh preview và tóm tắt ngắn.
  - Phân loại trực quan bằng hệ thống Thư mục cha - con (Nested Categories/Folders).
  - Tìm kiếm tức thì theo tiêu đề, URL, danh mục và tag.
  - Cảnh báo trùng lặp thông minh để tránh lưu 2 lần cùng một liên kết.
  - Xuất / nhập dữ liệu JSON đơn giản, an toàn.

---

## 2. User Experience & Visual Design

### Luồng trải nghiệm người dùng (User Flows)
1. **Khởi động ứng dụng**: Tự động kích hoạt Firebase Anonymous Auth, tải cấu trúc danh mục và danh sách bookmark.
2. **Thêm liên kết mới**:
   - Nhấn nút **"+ Thêm link"** (hoặc phím tắt `Ctrl + K` / `Cmd + K`).
   - Dán URL vào ô nhập $\rightarrow$ Hệ thống tự động kích hoạt truy vấn trích xuất dữ liệu (fetching Title, Description, Favicon, Image).
   - Kiểm tra xem URL đã tồn tại trong bộ sưu tập hay chưa; nếu có, hiển thị cảnh báo trùng lặp với tùy chọn xem lại link cũ hoặc tiếp tục lưu.
   - Chọn Thư mục / Thư mục con, gắn tags, thêm ghi chú cá nhân (Notes) và nhấn **Lưu bookmark**.
3. **Quản lý danh mục & Thư mục con**:
   - Sidebar bên trái hiển thị cây thư mục phân cấp với biểu tượng chuyên biệt và bộ đếm số lượng link.
   - Thao tác nhanh: Thêm thư mục mới, thêm thư mục con bên trong thư mục cha, đổi tên, đổi màu sắc/biểu tượng, hoặc xóa.
4. **Xem và tìm kiếm**:
   - Chuyển đổi giữa chế độ **Lưới (Grid View)** với thumbnail ảnh trực quan và **Danh sách (List View)** gọn gàng cho thao tác nhanh.
   - Thanh tìm kiếm thông minh kết hợp bộ lọc nhanh: Lọc theo Yêu thích, Lọc theo Tag, Lọc theo Thư mục.
5. **Sao lưu & Hướng dẫn**:
   - Nút Xuất JSON tải về máy toàn bộ cây danh mục và bookmark.
   - Nút Nhập JSON khôi phục dữ liệu hoặc hợp nhất dữ liệu từ máy khác.
   - Modal hướng dẫn chi tiết cách chạy ứng dụng trên máy tính cục bộ (`npm install`, `npm run dev`).

### Định hướng thẩm mỹ & Hệ thống màu sắc
- **Bố cục**: Cấu trúc Workspace 3 khu vực chuẩn mực:
  - Sidebar bên trái ($260\text{px}$) gồm Bộ sưu tập, Thư mục phân cấp, Thẻ Tags và Chuyển đổi giao diện.
  - Header trên cùng gồm Thanh tìm kiếm toàn cục, Nút chuyển chế độ xem Grid/List, Nút Xuất/Nhập và Nút hành động chính **"+ Thêm link"**.
  - Không gian nội dung chính hiển thị các thẻ bookmark với padding thoải mái, không lồng card-trong-card, sử dụng hairline border tinh tế (`border-slate-200 dark:border-slate-800`).
- **Bảng màu (Tỷ lệ 60-30-10)**:
  - 60% Canvas: Nền sáng (`bg-slate-50 / bg-white`), nền tối (`bg-slate-950 / bg-slate-900`).
  - 30% Bề mặt & Viền: Card nền `bg-white dark:bg-slate-900/80`, viền `border-slate-200/80 dark:border-slate-800`, chữ phụ `text-slate-500 dark:text-slate-400`.
  - 10% Điểm nhấn: Indigo / Emerald (`bg-indigo-600 hover:bg-indigo-700 text-white`, `text-indigo-600 dark:text-indigo-400`).
- **Typography & Chống "Pill Slop"**:
  - Tiêu đề dùng font sans hiện đại, rõ nét.
  - Metadata (thời gian lưu, tên miền nguồn, thư mục) hiển thị dạng chữ phẳng ngăn cách bởi dấu chấm tinh tế (`·`) thay vì đóng khung pill badge rực rỡ dày đặc.

---

## 3. Key Product Decisions & Trade-Offs

- **Trích xuất Metadata qua Backend Express Proxy**:
  - *Lý do*: Trình duyệt chặn CORS nếu client trực tiếp `fetch()` URL từ các website khác. Endpoint máy chủ `/api/metadata?url=...` phân tích thẻ `<title>`, `<meta property="og:title">`, `<meta property="og:image">`, `<meta property="og:description">` một cách an toàn và trả về JSON chuẩn hóa.
  - *Dự phòng*: Nếu website đích chặn crawler hoặc timeout, client tự động tạo fallback với favicon từ Google Favicon API (`https://www.google.com/s2/favicons?domain=...&sz=128`) và tên miền chính.
- **Phát hiện liên kết trùng lặp (Duplicate Detection)**:
  - Chuẩn hóa URL (bỏ trailing slash, chuyển hostname về chữ thường, loại bỏ tham số tracking như `utm_*`) trước khi đối chiếu với cơ sở dữ liệu hiện có để phát hiện trùng lặp chính xác.
- **Firebase Anonymous Auth kết hợp Rules bảo mật**:
  - Cho phép người dùng trải nghiệm tức thì không có rào cản đăng nhập, đồng thời đảm bảo quy tắc `request.auth.uid == resource.data.userId` để dữ liệu được bảo vệ an toàn trên Firestore.

---

## 4. Technical Architecture & Data Strategy

### Sơ đồ kiến trúc hệ thống

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Trình duyệt Người dùng                         │
│                                                                        │
│  ┌───────────────────────┐   ┌──────────────────────────────────────┐  │
│  │   Sidebar Phân cấp    │   │           Header & Tìm kiếm          │  │
│  │ - Tất cả / Yêu thích  │   │ - Ô tìm kiếm live (Debounced)        │  │
│  │ - Thư mục cha & con   │   │ - Toggle Grid / List                 │  │
│  │ - Danh sách Tags      │   │ - Xuất/Nhập JSON & Hướng dẫn cài đặt │  │
│  │ - Toggle Sáng/Tối     │   │ - Nút nổi bật "+ Thêm link"         │  │
│  └───────────┬───────────┘   └──────────────────┬───────────────────┘  │
│              │                                  │                      │
│              ▼                                  ▼                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Khu vực Nội dung Chính                       │  │
│  │ - Thẻ Bookmark (Card/Row): Favicon, Title, Description, Tags     │  │
│  │ - Nút Yêu thích, Chỉnh sửa, Sao chép link, Xóa                   │  │
│  │ - Hộp thoại Thêm/Sửa Link (có tính năng Auto-fetch & Duplicate)  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────▲───────────────────────────────▲────────────────────┘
                    │ Trích xuất URL                │ Đồng bộ Firestore & Auth
                    ▼                               ▼
       ┌────────────────────────┐      ┌────────────────────────┐
       │ Express Backend Server │      │   Firebase Firestore   │
       │ - GET /api/metadata    │      │ - categories (nested)  │
       │ - Trích xuất OpenGraph │      │ - bookmarks (indexed)  │
       │ - Google Favicon API   │      │ - Anonymous Auth (UID) │
       └────────────────────────┘      └────────────────────────┘
```

### Mô hình Dữ liệu (Firestore Collections)

1. **`categories` Collection**:
   - `id`: string (ID danh mục)
   - `userId`: string (ID phiên người dùng)
   - `name`: string (Tên thư mục, ví dụ: "Lập trình", "Frontend")
   - `parentId`: string | null (ID thư mục cha, hỗ trợ thư mục con đa cấp)
   - `icon`: string (Tên icon Lucide hoặc màu sắc)
   - `createdAt`: serverTimestamp
   - `updatedAt`: serverTimestamp

2. **`bookmarks` Collection**:
   - `id`: string
   - `userId`: string
   - `url`: string (URL gốc)
   - `cleanUrl`: string (URL đã chuẩn hóa để kiểm tra trùng lặp)
   - `title`: string (Tiêu đề trang)
   - `description`: string (Mô tả tóm tắt)
   - `favicon`: string (URL icon trang web)
   - `imageUrl`: string (Ảnh thumbnail OpenGraph)
   - `categoryId`: string (ID thư mục chứa)
   - `tags`: array of string (Danh sách từ khóa, tối đa 10 tag)
   - `notes`: string (Ghi chú cá nhân)
   - `isFavorite`: boolean (Đánh dấu yêu thích)
   - `createdAt`: serverTimestamp
   - `updatedAt`: serverTimestamp

### Xử lý lỗi & Bảo mật
- Tất cả các thao tác với Firestore được bọc qua hàm xử lý lỗi chuyên dụng theo cấu trúc chuẩn `FirestoreErrorInfo` để ghi nhận chính xác chi tiết lỗi nếu xảy ra.
- Firestore Security Rules thực thi nghiêm ngặt: Kiểm tra `request.auth != null`, chỉ cho phép đọc/ghi tài liệu có `userId == request.auth.uid`, xác thực cấu trúc dữ liệu và độ dài chuỗi hợp lệ.
