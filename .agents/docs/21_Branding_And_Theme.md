# Hướng dẫn Thương hiệu & Bảng màu Giao diện (Branding & Theme)

## 1. Thông tin Thương hiệu
- **Tên thương hiệu:** Mì Trộn Cô Xi (XUXI)
- **Hệ thống:** Mì Trộn Cô Xi — Hệ thống Quản lý (XUXI Management)
- **Tệp Logo chính thức:** `frontend/public/logo.png` (sao chép từ `C:\Users\PC\Desktop\Tuc_Anh\brand\logo.png`)
- **Font chữ:** Be Vietnam Pro, Inter, Manrope

---

## 2. Bảng màu Giảm rực rỡ (Subdued Culinary Palette)

Để tránh gây mỏi mắt khi sử dụng hàng ngày và tạo phong cách ẩm thực cao cấp, ấm áp và ngon miệng:

| Token Name | Mã Hex | Ý nghĩa & Vị trí ứng dụng |
| :--- | :--- | :--- |
| `primary` / `brand-xuxi` | `#8E3E2F` | Đỏ gạch / terracotta trầm ấm (Sidebar, Header, Button chính, Badge active) |
| `primary-container` | `#6E281C` | Nâu đỏ trầm nhấn sâu (Hover button, sidebar active item) |
| `surface-bright` / `canvas` | `#F9F6F0` | Kem ngà ấm dịu (Nền ứng dụng toàn hệ thống, nền Login) |
| `surface` | `#FFFFFF` | Trắng tinh khiết (Nền thẻ Card, Panel, Modal) |
| `surface-container` | `#F2ECE4` | Vải lanh nhạt (Thẻ phụ, nền input disabled, dropdown hover) |
| `outline-variant` | `#E2D7CC` | Cát ấm trung tính (Đường viền các thẻ, input, divider) |
| `secondary` / `accent` | `#C46D28` | Hổ phách ấm (Nút thao tác phụ, điểm nhấn vàng cam nhẹ) |
| `on-surface` | `#2A1C16` | Nâu espresso đậm (Tiêu đề, text chính, số liệu) |
| `on-surface-variant` | `#6E584D` | Nâu đá trầm (Text phụ, placeholder, nhãn ghi chú) |

---

## 3. Quy cách Tích hợp Logo
- **Thanh điều hướng Sidebar (`Navbar.vue`):** Logo hình tròn 40x40px, có viền `border-2 border-white/45`, bo tròn hoàn toàn `border-radius: 50%`, đổ bóng nhẹ `box-shadow: 0 2px 6px rgba(0,0,0,0.18)`.
- **Màn hình Đăng nhập (`Login.vue`):**
  - Header: Logo tròn 48x48px đặt cạnh tên thương hiệu.
  - Thẻ đăng nhập trung tâm: Logo tròn 64x64px nằm trong khung viền tròn nổi bật, mang lại cảm giác thân thiện, uy tín.
- **Favicon (`index.html`):** `<link rel="icon" type="image/png" href="/logo.png" />`.

---

## 4. Hệ thống Biểu tượng Ẩm thực Dễ thương (Culinary Icons)
- **Menu Sidebar:**
  - `🏪` Tổng quan quán (`/`)
  - `🥢` Bán hàng POS (`/pos`)
  - `🍜` Thực đơn món (`/products`)
  - `🥬` Kho nguyên liệu (`/ingredients`)
  - `📦` Nhập hàng kho (`/stock-imports/create`)
  - `👨‍🍳` Quản lý nhân viên (`/users`)
  - `📊` Báo cáo doanh số (`/reports/sales`)
- **Màn hình Báo cáo Doanh số:**
  - Tab `📅 Chi tiết theo Ngày`
  - Tab `🍱 Theo Danh mục` (icon `lunch_dining`)
  - Tab `🍜 Theo Món ăn` (icon `ramen_dining`)
  - Tab `💳 PTTT` (icon `credit_card`)
  - Tab `👨‍🍳 Theo Nhân viên` (icon `badge`)
- **Màn hình Quản lý Sản phẩm:** Avatar mặc định chuyển thành icon `ramen_dining`.

---

## 5. Hiệu ứng Tải trang Dĩa Mì Trộn (Noodle Plate Loading Animation)
- Thay thế hoàn toàn hình ảnh ly cà phê phin nhỏ giọt.
- **Hình họa:** Dĩa sứ sâu lòng với mì trộn vàng óng, trứng ốp la lòng đào, cải xanh, lát ớt sa tế cay nồng.
- **Hoạt họa (Animation):**
  - Đôi đũa gỗ gắp từng sợi mì nâng lên hạ xuống nhịp nhàng (`noodleLift`).
  - Làn khói nóng nghi ngút bốc lên từ đĩa mì tươi ngon (`steamRise`).
- **Thông điệp:** `Đang trộn mì... 🍜` và `Mì Trộn Cô Xi • Vui lòng chờ trong giây lát`.

---

## 6. Hệ thống Animation & Chuyển động PrimeVue (Animations & Transitions)
Tuân thủ tài liệu hướng dẫn chuyển động chính thức của PrimeVue: `https://primevue.dev/guides/animations/`.

1. **Hiệu ứng Ripple (Gợn sóng chạm):**
   - Cấu hình toàn cục trong `main.ts` với `ripple: true` và `app.directive('ripple', Ripple)`.
   - Màu sắc lan tỏa êm dịu phù hợp bảng màu terracotta (`rgba(142, 62, 47, 0.22)`).

2. **Chuyển cảnh Định tuyến Trang (Page Transitions):**
   - Sử dụng `<RouterView v-slot="{ Component, route }"><transition name="page-fade" mode="out-in">` trong `App.vue`.
   - Thời gian: 220ms `cubic-bezier(0.16, 1, 0.3, 1)` kết hợp fade và trượt nhẹ translateY(6px).

3. **Hộp thoại Modal & Dialog (Spring Zoom & Backdrop Blur):**
   - Mask: Fade-in nền mờ tinh tế (220ms).
   - Body Modal: Phóng to đàn hồi nhẹ nhàng từ `scale(0.92)` với đường cong `cubic-bezier(0.34, 1.56, 0.64, 1)`.

4. **Lớp phủ Dropdown / Select Overlays (`.p-connected-overlay`):**
   - Trượt xuống và mờ dần trong 200ms `cubic-bezier(0.16, 1, 0.3, 1)`.

5. **Thông báo Toast Notifications:**
   - Trượt vào từ cạnh phải với hiệu ứng bung nhẹ (`translateX(100%) -> translateX(0)`), trượt ra thanh thoát khi kết thúc thời gian hiển thị.

6. **Danh sách Động & Giỏ hàng POS (`cart-item` / `list-fade`):**
   - Dùng `<TransitionGroup>` cho giỏ hàng POS: Thêm món mới trượt nhẹ từ trái sang, xoá món trượt ra phải êm ái, các món còn lại dồn vị trí mượt mà với `transition: transform`.

7. **Micro-interactions trên Card & Nút bấm:**
   - Card: Nâng nhẹ và đổ bóng mịn khi hover (`box-shadow: 0 8px 18px -4px rgba(0,0,0,0.08)`).
   - Button: Thu nhỏ đàn hồi khi bấm `:active { transform: scale(0.96) }`.


