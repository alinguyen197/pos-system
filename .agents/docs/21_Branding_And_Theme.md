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
