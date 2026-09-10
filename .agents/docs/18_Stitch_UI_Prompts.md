# Google Stitch — UI Prompts

## Các prompt bên dưới dùng để paste vào **Google Stitch** (stitch.withgoogle.com) để generate UI cho hệ thống Coffee Shop Management.

## Prompt 1: Layout chung + Sidebar

```
Design a modern coffee shop management web application with a clean, professional UI.
Layout:
- Left sidebar (240px width, dark brown #3E2723 background, white text) with:
  - Logo area at top: coffee cup icon + "COFFEE SHOP" text
  - Navigation menu items with icons:
    1. Dashboard (chart icon)
    2. Bán hàng (shopping cart icon)
    3. Sản phẩm (coffee cup icon)
    4. Kho nguyên liệu (warehouse icon)
    5. Nhập kho (truck icon)
    6. Người dùng (people icon)
    7. Phân quyền (shield icon)
    8. Thông báo (bell icon with red badge "3")
  - Active menu item has lighter brown #5D4037 background with left border accent #FF9800
  - User info at bottom: avatar circle + name "Nguyễn Văn A" + role "Quản lý" + logout icon
- Top header bar (64px height, white background, bottom shadow):
  - Left: Breadcrumb "Dashboard > Tổng quan"
  - Right: Notification bell icon with red dot, user avatar dropdown
- Main content area: light gray #F5F5F5 background with 24px padding
Color palette: Primary brown #5D4037, Accent orange #FF9800, Success green #4CAF50, Error red #F44336, Background #F5F5F5, Cards white #FFFFFF.
Font: Inter or Roboto, Vietnamese language support.
```

---

## Prompt 2: Màn hình Dashboard

```
Design a Dashboard page for a coffee shop management system. Vietnamese language. Clean modern UI with brown/orange color scheme.
Top row - 4 summary cards in a horizontal grid:
- Card 1: "Doanh thu hôm nay" with large number "4,350,000 ₫", green up arrow "+12% so với hôm qua", icon: dollar sign on orange circle
- Card 2: "Số đơn hàng" with large number "47", green up arrow "+5", icon: receipt on blue circle
- Card 3: "Số ly đã bán" with large number "126", icon: coffee cup on brown circle
- Card 4: "Tồn kho thấp" with large number "3" in red, icon: warning triangle on red circle
Second row - 2 columns:
- Left (60%): Line chart "Doanh thu 30 ngày gần nhất" with x-axis dates, y-axis VND amounts. Orange line with gradient fill below. Hover tooltip showing date + revenue.
- Right (40%): Doughnut/Pie chart "Doanh thu theo danh mục" with segments: Cà phê (45% brown), Trà (25% green), Sinh tố (15% orange), Nước ép (10% yellow), Khác (5% gray). Legend below.
Third row - 2 columns:
- Left (50%): Table "Top 10 sản phẩm bán chạy" with columns: #, Tên sản phẩm, Danh mục, Số lượng bán, Doanh thu. Sample rows: 1. Cà phê sữa đá - Cà phê - 45 ly - 1,305,000₫. Horizontal bar indicator for quantity.
- Right (50%): Card "Cảnh báo tồn kho" listing items with red/yellow warning badges: "Cà phê hạt Robusta: còn 2kg (tối thiểu 5kg)" with red badge, "Sữa tươi TH: còn 8 lít (tối thiểu 10 lít)" with yellow badge, "Trân châu đen: còn 1kg (tối thiểu 3kg)" with red badge. Each item has a "Nhập kho" button.
All cards have white background, 8px border-radius, subtle shadow, 16px padding.
```

---

## Prompt 3: Màn hình Bán hàng (POS) - Toàn diện 2.0

```
Design a Point-of-Sale (POS) screen for a coffee shop. Vietnamese language. Optimized for quick order taking by staff.
Split layout - 2 panels:

TOP BANNER:
- Shift Summary Bar: "Doanh thu ca hiện tại: 4,250,000 ₫ (47 đơn • 126 ly)" in green text #326824 with trending icon.

LEFT PANEL (60% width) - Menu sản phẩm:
- Top Search & Header:
  - Search input with placeholder "Tìm kiếm sản phẩm theo tên hoặc mã SP..."
  - "Lịch sử đơn" button with history icon next to search bar.
- Category pills horizontally scrollable: "Tất cả" (active, green background #326824), "Cà phê", "Trà", "Sinh tố", "Bánh ngọt".
- Below: Grid of product cards (4 columns), each card contains:
  - Product image (square, rounded corners)
  - Category tag in small brown uppercase text
  - Product name: "Cà phê sữa đá"
  - Price: "29,000 ₫" in bold green #326824
  - Add icon button "+" to add to cart
- Status indicator: "Tạm ngừng" red badge for inactive items.

RIGHT PANEL (40% width) - Quản lý giỏ hàng & Đơn hàng:
- Order Tabs Header:
  - Scrollable tabs: "Đơn #1042" (active, brown background #8D6749), "Đơn #1043", and "+" button to add new draft order tabs.
- Active Order Info Bar:
  - "Đơn hàng #1042" | "Khách lẻ - Bàn 04" | Red Trash icon button to clear cart.
- Order items list, each item row:
  - Product name + Unit price aligned left
  - Quantity control buttons (- / quantity / +)
  - Subtotal aligned right
  - Per-item text input field: "Ghi chú món (VD: ít đường, đá riêng...)"
- Promo code input section:
  - Text input placeholder "Nhập mã giảm giá (VD: GIAM10K)" + "Áp dụng" button.
  - Preset suggestion chips: "GIAM10K", "FREESHIP".
- Summary section:
  - "Tạm tính (3 món): 93,000 ₫"
  - "Giảm giá: -10,000 ₫"
  - "Tổng cộng thanh toán: 83,000 ₫" in large bold green font.
- Payment method selector: 4 toggle buttons "Tiền mặt" (active), "Quét QR", "Chuyển khoản", "Thẻ".
- Large green button "THANH TOÁN 83,000 ₫" (full width, 48px height, arrow icon).

MODAL & POPUP DIALOGS:
1. VietQR Payment Dialog:
   - Header "Thanh toán VietQR / Chuyển khoản"
   - Centered VietQR Code image with amount "83,000 ₫" and transfer content "SKY DH1042".
   - "Xác nhận Đã thu tiền" green button.
2. Order History Modal:
   - Header "Lịch sử đơn hàng gần đây"
   - Data table columns: Mã đơn | Thời gian | Tổng tiền | PTTT | Trạng thái | Thao tác (Eye icon, Print icon, Cancel icon).
   - Expandable Rows (>): Click expander arrow to view nested sub-table listing all sold products (image, product name, qty x unit price, subtotal, item notes).
3. Order Details Modal:
   - Header "Chi tiết đơn hàng #DH20260831-001"
   - Header summary card + detailed list of products sold with images, unit prices, subtotals, item notes, payment summary, Print Bill button, and Cancel Order button.

Color palette: Primary Green #326824, Warm Brown #8D6749, Soft Gray #F5ECEB, White Cards #FFFFFF.
Font: Inter or Roboto, Vietnamese language support.
```

---

## Prompt 4: Màn hình Quản lý SSearch/Filter area (form layout with field labels):
- Form with explicit field labels above inputs:
  - Label "TỪ KHÓA TÌM KIẾM": Input "Tìm tên sản phẩm, mã SP..."
  - Label "DANH MỤC SẢN PHẨM": Filterable Select Dropdown (with search input inside, options: Tất cả danh mục, Cà phê, Trà, Bánh ngọt)
- Action buttons: "Tìm kiếm" (primary brown button with search icon, executes API query), "Đặt lại" (secondary light button with refresh icon, clears form inputs without calling API)
Data table with columns:
- Mã SP (sortable) | Tên sản phẩm (sortable) | Danh mục | Giá bán (sortable, right-aligned) | Cost NVL | % Lãi gộp | Trạng thái | Thao tác
- Sample rows:
  - SP-001 | Cà phê Robusta Đậm Đà | Cà phê | 29,000₫ | 8,500₫ | 70.7% | Green badge "Đang kinh doanh" | Edit/Delete icons
  - SP-002 | Cà phê Arabica Thơm Nhẹ | Cà phê | 35,000₫ | 11,200₫ | 68.0% | Green badge "Đang kinh doanh" | Edit/Delete icons
  - SP-005 | Matcha Latte Thượng Hạng | Trà | 45,000₫ | 15,500₫ | 65.6% | Red badge "Tạm ngừng" | Edit/Delete icons
- Sortable column headers with ▲▼ arrows
- Alternating row background colors
Pagination bar at bottom:
- Left: "Hiển thị 1 đến 10 trong tổng số 45 sản phẩm"
- Right: "‹ Trước | 1 / 5 | Sau ›" + Dropdown "10 / trang" (options: 10, 20, 50)
Table has white background, subtle borders, 16px border-radius on the card container.
```

---

## Prompt 5: Form Thêm/Sửa Sản phẩm (Dialog & 3D BOM Recipe Editor)

```
Design a product management dialog and create screen with 3D BOM recipe costing and live image upload for a coffee shop management system. Vietnamese language.
Layout specs:
- Single Screen Viewport Layout (100vh): No main page body scroll. Header, search bar & pagination fixed, only internal data table body scrolls (`scrollable scrollHeight="flex"`).
- Image Upload: Drag-drop & click file picker card (PNG, JPG max 5MB), live image preview, server upload endpoint `POST /api/upload`.
- BOM Recipe Editor in Edit Product Dialog:
  - Add ingredients from inventory stock with searchable Select dropdown
  - Editable amount inputs per ingredient
  - Real-time Cost NVL and Gross Profit Margin % calculation
  - Saves recipe items to `product_recipes` table for automatic POS inventory deduction (`stockItem.quantity -= recipe.amount * soldQty`).
- Global Toast Notifications: Un-scoped CSS `z-index: 999999999 !important` ensuring success/error toasts float strictly above all overlays.
```

---

## Prompt 6: Màn hình Quản lý Kho

```
Design an Inventory Management page for a coffee shop. Vietnamese language.
Top section:
- Page title: "Quản lý kho nguyên liệu"
- Buttons: "+ Thêm nguyên liệu mới" (brown), "Tạo phiếu nhập kho" (green outline button)
Search area (Form search layout with field labels):
- Label "TỪ KHÓA TÌM KIẾM": Input "Tìm tên nguyên liệu, mã NL..."
- Label "PHÂN LOẠI KHO": Filterable Select Dropdown (with search input inside, options: Tất cả phân loại, Cà phê hạt, Sữa & Kem, Siro & Đường, Đóng gói)
- Action buttons: "Tìm kiếm" (primary brown button, executes query), "Đặt lại" (secondary light button, clears form inputs only)
Data table columns:
- Mã NL (sortable) | Tên nguyên liệu (sortable) | Phân loại | Tồn kho / Ngưỡng min | ĐVT | Đơn giá vốn | Trạng thái kho | Thao tác
Sample rows with status indicators:
- NL-001 | Cà phê Robusta Hạt | Cà phê hạt | 15.5 / 5 | kg | 180,000 ₫ | 🟢 Green badge "Bình thường" | Edit/Delete icons
- NL-002 | Cà phê Arabica Hạt | Cà phê hạt | 1.5 / 5 | kg | 260,000 ₫ | 🔴 Red badge "Cần nhập gấp" | Edit/Delete icons
- NL-003 | Sữa tươi thanh trùng 1L | Sữa & Kem | 2 / 10 | hộp | 34,000 ₫ | 🟡 Yellow badge "Sắp hết" | Edit/Delete icons
Progress bar in "Tồn kho" column: visual bar showing quantity relative to min_quantity. Red when below min, green when above.
Server-side Pagination at bottom (lazy mode: page, pageSize, totalRecords).
```

---

## Prompt 8: Cute Coffee Pouring Loading Overlay (Global UI Loading)

```
Design a cute coffee pouring loading overlay for a coffee shop management web application. Vietnamese language.
Full-screen modal backdrop overlay:
- Fixed full-screen position, z-index 999999
- Backdrop blur effect: backdrop-filter: blur(5px); background: rgba(30, 27, 27, 0.45);
- Complete interaction lock: pointer-events: auto (blocks all user mouse/keyboard clicks on underlying screen while API calls execute).
Centered white rounded glassmorphism card (280px width, 24px padding, shadow 2xl):
- Animated Cute SVG Coffee Pouring Illustration:
  - Top: Brown coffee filter dripper pot #8d6749
  - Middle: Continuous dark coffee stream #5D4037 pouring downwards into cup
  - Cute ceramic coffee cup with rounded handle #8d6749
  - Rising liquid fill animation: Dark brown coffee liquid #5D4037 filling up from bottom to top with a smooth waving cream foam layer #FFE0B2 on top
  - 3 steam lines wiggling and floating upwards from the cup
- Text indicator below illustration:
  - Title: "Đang pha cà phê..." in bold dark text with subtle pulse effect
  - Subtitle: "Vui lòng chờ trong giây lát" in soft gray text
```ác
Sample rows with status indicators:
- NL001 | Cà phê hạt Robusta | kg | 2.000 | 5.000 | 🔴 Red badge "Sắp hết" | 180,000₫/kg | Edit icon
- NL002 | Sữa đặc Ông Thọ | hộp | 25 | 20 | 🟢 Green badge "Đủ" | 28,000₫/hộp | Edit icon
- NL003 | Đường cát trắng | kg | 12.500 | 10.000 | 🟢 Green badge "Đủ" | 22,000₫/kg | Edit icon
- NL004 | Sữa tươi TH | lít | 8.000 | 10.000 | 🟡 Yellow badge "Sắp hết" | 32,000₫/lít | Edit icon
Progress bar in "Tồn kho" column: visual bar showing quantity relative to min_quantity. Red when below min, green when above.
Pagination at bottom.
```

---

## Prompt 7: Màn hình Nhập kho (Tạo đơn nhập kho)

```
Design a Stock Import form page for a coffee shop. Vietnamese language.
Page title: "Tạo đơn nhập kho mới"
Top info section (card):
- Row: "Nhà cung cấp" (searchable dropdown / text), "Kho nhập" (dropdown), "Thời gian nhập" (datetime picker, default now)
- Row: "Ghi chú" textarea
Item adding & calculator section (card):
- Searchable ingredient dropdown, custom import unit selector (bình, chai, lon, kg, lít, hộp, thùng...), decimal quantity input (e.g. 2.1)
- 2-way price calculator: "Tổng tiền mua" (e.g. 57,000₫) <-> "Đơn giá tính ra" (e.g. 27,143₫/kg)
- Preview formula chip: "2.1 kg × 27,143₫ = 57,000₫"
- "+ Thêm vào đơn" button
Detail table section:
- Header: "Danh sách nguyên liệu nhập" with total item badge
- Editable table columns:
  - # | Tên nguyên liệu | ĐVT nhập (editable) | Số lượng (number input) | Đơn giá nhập (number input) | Thành tiền (number input) | Xóa
- Sample rows:
  - 1 | Tương cà Cholimex | bình | [2.1] | [27,143] | 57,000₫
  - 2 | Cà phê hạt Robusta | kg | [5.0] | [180,000] | 900,000₫
- Summary card: "Tổng tiền đơn nhập: 957,000₫" green bold text
Footer/Header actions:
- "Hủy bỏ" (gray outline button)
- "Lưu đơn nhập" (brown solid button, check icon)
```

---

## Prompt 8: Màn hình Quản lý User

```
Design a User Management page for a coffee shop system. Vietnamese language.
Page title: "Quản lý người dùng"
Action: "+ Thêm người dùng" orange button
Search area:
- Input "Họ tên / Email", Dropdown "Vai trò" (Tất cả, Quản trị viên, Quản lý, Nhân viên, Chỉ xem), Dropdown "Trạng thái" (Tất cả, Hoạt động, Đã khóa)
- "Tìm kiếm" button
Data table columns:
- Avatar | Họ tên | Email | Số điện thoại | Vai trò | Trạng thái | Ngày tạo | Thao tác
Sample rows:
- [Avatar circle "NA"] | Nguyễn Văn A | a.nguyen@email.com | 0901234567 | Blue badge "Quản trị viên" | Green dot "Hoạt động" | 26/08/2026 | Edit/Lock/Delete icons
- [Avatar circle "TB"] | Trần Thị B | b.tran@email.com | 0907654321 | Orange badge "Quản lý" | Green dot "Hoạt động" | 26/08/2026 | Edit/Lock/Delete icons
- [Avatar circle "LC"] | Lê Văn C | c.le@email.com | 0912345678 | Gray badge "Nhân viên" | Green dot "Hoạt động" | 26/08/2026 | Edit/Lock/Delete icons
- [Avatar circle "PD"] | Phạm Văn D | d.pham@email.com | 0918765432 | Light gray badge "Chỉ xem" | Red dot "Đã khóa" | 26/08/2026 | Edit/Unlock/Delete icons
Role badges have different colors. Status shown as colored dots.
Pagination at bottom.
```

---

## Prompt 9: Màn hình Thông báo

```
Design a Notifications page for a coffee shop management system. Vietnamese language.
Page title: "Thông báo" with badge count "(5 chưa đọc)"
Filter tabs: "Tất cả" (active), "Chưa đọc (5)", "Đã đọc"
Right side: "Đánh dấu tất cả đã đọc" text button (blue)
Notification list (card-based, vertical stack):
Each notification card has:
- Left: Icon circle (color by type)
- Center: Title (bold if unread) + Content text (gray) + Timestamp "2 phút trước"
- Right: Blue dot indicator if unread
Sample notifications (newest first):
1. 🔴 [stock_alert] UNREAD - "Cảnh báo tồn kho" / "Cà phê hạt Robusta còn 2kg, dưới mức tối thiểu 5kg" / "5 phút trước" — Click navigates to stock detail
2. 🟢 [order_new] UNREAD - "Đơn hàng mới" / "Đơn hàng DH20260826-047 đã được tạo - 93,000₫" / "15 phút trước"
3. 🔵 [system] UNREAD - "Thông báo hệ thống" / "Hệ thống sẽ bảo trì từ 2:00 - 4:00 sáng ngày 27/08" / "1 giờ trước"
4. 🟡 [security] READ - "Cảnh báo bảo mật" / "Phát hiện đăng nhập bất thường từ IP 192.168.1.100" / "3 giờ trước"
5. 🟢 [order_new] READ - "Đơn hàng mới" / "Đơn hàng DH20260826-046 đã được tạo - 58,000₫" / "5 giờ trước"
Unread cards have light orange-tinted left border and slightly different background.
Read cards have normal white background.
Pagination or "Tải thêm" button at bottom.
```

---

## Prompt 10: Màn hình Login

```
Design a login page for a coffee shop management system. Vietnamese language. Warm, inviting design.
Full-screen split layout:
- Left half (50%): Large background image of a cozy coffee shop interior with warm lighting. Dark overlay gradient.
  - Centered white text: Large "COFFEE SHOP" logo/text
  - Subtitle: "Hệ thống quản lý quán cà phê"
  - Small tagline: "Quản lý hiệu quả, phục vụ tận tâm"
- Right half (50%): White background, centered login form card (400px width):
  - "Đăng nhập" heading (24px, dark brown)
  - Subtext: "Vui lòng nhập thông tin tài khoản"
  - Email input field with envelope icon, placeholder "Email"
  - Password input field with lock icon, placeholder "Mật khẩu", show/hide toggle eye icon
  - "Ghi nhớ đăng nhập" checkbox
  - "Đăng nhập" full-width button (brown #5D4037 background, white text, 44px height, rounded)
  - Divider "hoặc"
  - "Quên mật khẩu?" link text centered
Color: Warm brown tones, orange accent. Professional but welcoming.
```

---

## Prompt 11: Màn hình Phân quyền

```
Design a Role-Screen Permission Management page for a coffee shop system. Vietnamese language.
Page title: "Phân quyền màn hình"
Description text: "Cấu hình quyền truy cập màn hình cho từng vai trò"
Layout: Matrix/Grid table
Columns: Màn hình | Admin | Quản lý | Nhân viên | Chỉ xem
Each role column is split into 2 sub-columns: "Xem" (checkbox) | "Sửa" (checkbox)
Rows (one per screen):
- SC001 - Dashboard          | ☑ Xem ☑ Sửa | ☑ Xem ☑ Sửa | ☐ Xem ☐ Sửa | ☑ Xem ☐ Sửa
- SC002 - Danh sách sản phẩm | ☑ Xem ☑ Sửa | ☑ Xem ☑ Sửa | ☑ Xem ☐ Sửa | ☑ Xem ☐ Sửa
- SC003 - Thêm/Sửa sản phẩm | ☑ Xem ☑ Sửa | ☑ Xem ☑ Sửa | ☐ Xem ☐ Sửa | ☐ Xem ☐ Sửa
- SC004 - Kho nguyên liệu    | ☑ Xem ☑ Sửa | ☑ Xem ☑ Sửa | ☑ Xem ☐ Sửa | ☑ Xem ☐ Sửa
- SC005 - Nhập kho            | ☑ Xem ☑ Sửa | ☑ Xem ☑ Sửa | ☐ Xem ☐ Sửa | ☐ Xem ☐ Sửa
- SC006 - Bán hàng (POS)      | ☑ Xem ☑ Sửa | ☑ Xem ☑ Sửa | ☑ Xem ☑ Sửa | ☐ Xem ☐ Sửa
- SC007 - Quản lý người dùng  | ☑ Xem ☑ Sửa | ☐ Xem ☐ Sửa | ☐ Xem ☐ Sửa | ☐ Xem ☐ Sửa
Admin column has all checkboxes checked and disabled (always full access).
Checked checkboxes are orange. Unchecked are gray.
Each checkbox change triggers auto-save with a small "Đã lưu" toast.
Footer: "Lưu thay đổi" orange button + "Khôi phục mặc định" outline button.
Table has sticky first column and sticky header. White card with subtle shadow.
```

---

## Ghi chú sử dụng

1. Copy từng prompt vào Google Stitch tại https://stitch.withgoogle.com
2. Sau khi generate, có thể tinh chỉnh bằng cách thêm yêu cầu bổ sung
3. Export code từ Stitch → tích hợp vào project Vue.js theo cấu trúc tại `15_FE_Skeleton_Templates.md`
4. Thay thế dữ liệu mẫu bằng API call thực tế
