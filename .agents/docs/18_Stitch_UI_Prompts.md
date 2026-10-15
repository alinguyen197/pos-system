# Google Stitch — UI Prompts (Đồng bộ UI v2.0 - XUXI Management)

Tài liệu tập hợp các **Stitch Prompts chuẩn hóa** dùng để paste vào **Google Stitch** (stitch.withgoogle.com) nhằm generate hoặc tái hiện giao diện cho hệ thống **Mì Trộn Cô Xi (XUXI Management System)**, hỗ trợ đa nền tảng Responsive (Desktop, iPad/Tablet, Điện thoại di động).

---

## 🎨 Thông số Thiết kế & Bảng màu Chuẩn (Design System & Branding)

- **Thương hiệu:** Mì Trộn Cô Xi — XUXI Management System
- **Bảng màu chủ đạo:**
  - **Primary Brand (Đỏ Nâu Mì Trộn):** `#8E3E2F` (Hover: `#6E281C`, Surface tint: `#F2ECE4`)
  - **Success / Revenue (Xanh Lá Cây):** `#326824` (Hover: `#254f1b`, Light: `#c9edb5` / `#f0fdf4`)
  - **Accent / Warning (Cam Đất):** `#C46D28` (Light: `#fff7ed`)
  - **Danger / Error (Đỏ Đậm):** `#ba1a1a` (Light: `#ffdad6`)
  - **Background Canvas:** `#F9F6F0`
  - **Card / Surface:** `#FFFFFF`, Border: `#E2D7CC` (hoặc `rgba(193, 201, 185, 0.7)`)
  - **Text Main:** `#1e1b1b` / `#2A1C16`, **Text Muted:** `#72796c` / `#6E584D`
- **Typography:** `Be Vietnam Pro`, `Manrope`, `Inter` (Hỗ trợ tiếng Việt 100%).
- **Bo góc & Hiệu ứng:** `rounded-xl` (12px), `rounded-2xl` (16px), shadow mịn màng, hiệu ứng chuyển động Spring Animation và Ripple.

---

## Prompt 1: Layout Chung, Header & Responsive Sidebar Drawer

```
Design a modern restaurant & coffee management web application layout for "Mì Trộn Cô Xi - XUXI Management". Clean, warm, premium F&B aesthetic. Vietnamese language.

1. Responsive Sidebar Navigation:
- Desktop (>= 1024px): 240px width, brand brown-red #8E3E2F background, white text.
- Tablet (768px - 1023px): Collapsible icon-only mode (72px width).
- Mobile Phone (< 768px): Off-Canvas slide-in Drawer (280px width) with dark backdrop scrim (blur 4px, background rgba(30, 27, 27, 0.65)), top brand logo area with close button (✕), auto-closing on route navigation.
- Sidebar Content:
  - Top Brand Box: Circular logo avatar + "Mì Trộn Cô Xi" bold title + "XUXI Management" subtitle.
  - Navigation Items with emojis/icons:
    1. 🏪 Tổng quan quán (/)
    2. 🥢 Bán hàng (POS) (/pos)
    3. 🍜 Thực đơn món (/products)
    4. 🥬 Kho nguyên liệu (/ingredients)
    5. 📦 Nhập hàng kho (/stock-imports/create)
    6. 💸 Quản lý chi tiêu (/expenditures)
    7. 👨‍🍳 Quản lý nhân viên (/users)
    8. 📊 Báo cáo doanh số (/reports/sales)
  - Active Item Style: Background rgba(255, 255, 255, 0.25), bold white text, elevated shadow.

2. Top Header Bar (56px height, background #8E3E2F, sticky top):
- Left: Hamburger button (toggles mobile drawer on phone, collapses sidebar on desktop) + Breadcrumb title (e.g., "Dashboard > Tổng quan", auto-truncates on mobile to "Tổng quan").
- Right: Notification Bell icon with badge + User Profile Pill (Avatar circle + Staff name + Role badge like "Super Admin" / "Quản lý"). Clicking opens user profile popover with account status and logout button.

3. Main Content Viewport:
- Background: #F9F6F0, height: 100dvh, padding: 0.65rem (mobile) / 1rem (tablet) / 1.25rem (desktop), smooth vertical scrolling.
```

---

## Prompt 2: Màn hình Tổng quan Quán (Dashboard)

```
Design a real-time Analytics Dashboard page for "Mì Trộn Cô Xi". Vietnamese language. Modern Bento Grid layout with warm brown #8E3E2F and green #326824 theme.

Top Header Banner:
- Title "Tổng quan cửa hàng" + Subtitle "Báo cáo tình hình kinh doanh & tồn kho thời gian thực"
- Responsive Actions: Refresh data button (spin icon), "Bán hàng POS" primary button (#8E3E2F), "Nhập kho NVL" secondary button (#F2ECE4). Auto-wrapping on mobile.

Row 1 - 4 KPI Summary Cards (Grid: 1 col mobile, 2 cols tablet, 4 cols desktop):
- Card 1: "Doanh thu hôm nay" with large bold currency "4,350,000 ₫", trend "+12% so với hôm qua", icon: payments on green circle #c9edb5.
- Card 2: "Số đơn hàng" with large number "47", trend "+5 đơn so với hôm qua", icon: receipt_long.
- Card 3: "Số phần đã bán" with large number "126", trend "Hôm nay", icon: restaurant.
- Card 4: "Tồn kho thấp" with large number "2", trend "Cần bổ sung kho ngay", warning icon with red/peach background #ffdad6.

Row 2 - Charts Grid (1 col mobile, 3 cols desktop):
- Left (2 cols): Line Chart "Doanh thu 30 ngày gần nhất" with curved tension, green line #326824, translucent fill below. Real-time badge in header.
- Right (1 col): Doughnut Chart "Doanh thu theo danh mục" (Mì trộn, Topping, Đồ uống, Khác) with clean bottom legend.

Row 3 - Tables Grid (1 col mobile, 2 cols desktop):
- Left: "Top sản phẩm bán chạy" with columns: #, Tên sản phẩm, Số phần bán, Doanh thu. "Xem tất cả" link.
- Right: "Cảnh báo tồn kho NVL" listing low-stock items with red badges, current quantity vs min threshold, and 1-click "Nhập hàng" button.

All cards: White background, 16px border-radius, border #E2D7CC, subtle shadow.
```

---

## Prompt 3: Màn hình Bán hàng POS (Responsive cho Mobile & iPad)

```
Design a Point-of-Sale (POS) order taking screen for "Mì Trộn Cô Xi". Vietnamese language. Ultra-responsive for both Desktop, iPad (tabletop POS), and Staff Mobile Phones.

Responsive Layout Modes:
- Desktop & iPad Landscape (>= 1024px): Side-by-side 2 panels (Left: Products 60%, Right: Cart & Checkout 40%).
- Mobile Phone (< 768px):
  - Top Segmented View Switcher: [ 🍜 Thực đơn món ] and [ 🛒 Giỏ hàng (N món) ].
  - When in Menu view: Grid of products (2 columns) with a Floating Sticky Cart Bar at the bottom ("🛒 Đơn #1042 (N món) • [Total VNĐ] | Xem giỏ & Thanh toán ➔") clicking switches to cart.
  - When in Cart view: Full cart breakdown with a top "← Tiếp tục chọn món" button.

LEFT PANEL - Thực đơn món:
1. Top Shift Summary Bar:
   - Chip: "Ca sáng (06:00 - 14:00)" or "Ca chiều (14:00 - 22:00)" in green #326824.
   - Current Staff name: "NV: Nguyễn Văn A".
   - Real-time stats: Doanh thu ca | Đơn hàng | Số phần bán.
   - Actions: "Kết ca" (opens shift handover dialog) + "Xem báo cáo" button.
2. Search & Filter Bar:
   - Search input: "Tìm kiếm sản phẩm theo tên hoặc mã SP..."
   - "Lịch sử đơn" button next to search.
   - Category filter pills: "Tất cả" (active #8E3E2F), "Mì trộn", "Topping", "Đồ uống", "Ăn kèm".
3. Product Cards Grid (2 cols mobile, 3 cols tablet, 4 cols desktop):
   - Square food photo (fallback bowl icon if no image).
   - Category chip top-left, quick "+" add button top-right (#326824).
   - Product name + Bold price (e.g., "35,000 ₫").
   - Out of Stock handling: When out of stock, dimmed with badge "Hết nguyên liệu" - clicking opens Missing Ingredients popup showing which ingredients ran out.
   - Suspended item handling: Dimmed with "Tạm ngừng" badge and blocked from selection.

RIGHT PANEL - Giỏ hàng & Thanh toán:
1. Order Tabs: "Đơn #1042" (active), "Đơn #1043", "+" create new draft tab button.
2. Order Info & Clear: "Đơn hàng #1042 | Khách lẻ - Bàn 04", trash delete button.
3. Promo Code Section: Input "Nhập mã giảm giá" + "Áp dụng" button + Suggestion chips "GIAM10K", "FREESHIP".
4. Cart Items List (with smooth enter/exit animations):
   - Item row: Name, price, [-] [qty input] [+] controls, subtotal.
   - Per-item note input: "Ghi chú món (VD: ít cay, nhiều tương...)".
5. Financial Summary:
   - Tạm tính (N món)
   - Giảm giá (-10,000 ₫)
   - Tổng cộng thanh toán (Large bold green font #326824)
6. Payment Method Selector: 4 toggle buttons "Tiền mặt", "Quét QR", "Chuyển khoản", "Thẻ".
7. Large Checkout Button: "THANH TOÁN 85,000 ₫" (Green #326824, full-width).

DIALOGS:
- VietQR Dynamic Payment Modal: QR Code image with amount and transfer syntax "XUXI DH1042".
- Shift End / Handover Modal: Detailed breakdown of cash, transfer, card revenue, print shift report, and logout.
- Order History Modal: Searchable list of past orders with expandable item details.
```

---

## Prompt 4: Màn hình Quản lý Thực đơn & Sản phẩm (Product List)

```
Design a Product Management screen for "Mì Trộn Cô Xi". Vietnamese language. Single-viewport card table layout.

Top Header:
- Title "Quản lý Sản phẩm" + Subtitle "Danh sách thực đơn, định mức nguyên liệu BOM và trừ kho POS".
- Action: "+ Thêm sản phẩm mới" primary button (#8E3E2F).

Search & Filter Bar (Form layout with explicit labels):
- Label "TỪ KHÓA TÌM KIẾM": Input "Tìm tên sản phẩm, mã SP..."
- Label "DANH MỤC SẢN PHẨM": Searchable Select Dropdown ("Tất cả danh mục", "Mì trộn", "Topping", "Đồ uống"...)
- Action buttons: "Tìm kiếm" (primary brown #8E3E2F) and "Đặt lại" (secondary light #F2ECE4).

Data Table:
- Columns: Mã SP (sortable) | Sản phẩm (image + name + category) | Giá bán (sortable, right aligned) | Giá vốn BOM | % Lãi gộp | Trạng thái (Green "Đang kinh doanh" / Red "Tạm ngừng") | Thao tác (Edit pencil, Clone copy, Delete trash).
- Alternating subtle rows, hover highlight #FBF1F1.
- Responsive horizontal scrolling for tablet & mobile.
- Bottom Paginator: Page numbers, "Hiển thị 1 đến 10 trong tổng số...", rows per page dropdown (10, 20, 50).

Edit Product Dialog:
- Edit basic info (Name, Price, Category, Status, Image file upload).
- BOM Recipe Editor: Add ingredients from stock with amount and auto unit conversion, live cost & gross profit calculation.
```

---

## Prompt 5: Màn hình Thêm Sản Phẩm & Tính Cost 3D (Product Create)

```
Design a Create Product page with 3D BOM Recipe Costing for "Mì Trộn Cô Xi". Vietnamese language.

Header:
- Title "Thêm sản phẩm & Tính Cost 3D" + Subtitle "Khai báo thông tin món và cấu hình định mức nguyên liệu (BOM)".
- Actions: "Hủy bỏ" secondary button + "Lưu sản phẩm" primary button (#8E3E2F).

Bento Grid Section 1 - Thông tin cơ bản (Grid: 1 col mobile, 3 cols desktop):
- Upload Card: Drag & drop image picker with live preview, upload status, file size validation (max 5MB).
- General Info Card (2 cols):
  - Tên sản phẩm * (Text input)
  - Giá bán (VNĐ) * (Number input)
  - Danh mục * (Searchable Select dropdown with "+ Nhập danh mục mới" toggle)
  - Trạng thái kinh doanh toggle switch (Active / Inactive)

Bento Grid Section 2 - Định mức nguyên liệu BOM (Grid: 1 col mobile, 3 cols desktop):
- BOM Costing Form (2 cols):
  - Ingredient select from warehouse stock
  - Input amount & unit (auto conversion e.g. g -> kg, ml -> lít)
  - Table of added recipe ingredients with unit cost and delete button
- Real-time Cost Summary Card (1 col):
  - Total Cost price (VNĐ)
  - Selling price (VNĐ)
  - Gross profit margin % with visual progress meter.
```

---

## Prompt 6: Màn hình Quản lý Kho Nguyên liệu (Ingredient List)

```
Design an Inventory Stock Management page for "Mì Trộn Cô Xi". Vietnamese language.

Header:
- Title "Quản lý Kho Nguyên liệu" + Subtitle "Theo dõi tồn kho thực tế, định mức cảnh báo và đơn giá vốn".
- Actions: "Nhập kho NVL" button (#F2ECE4) + "Thêm nguyên liệu" primary button (#8E3E2F).

Stock Status KPI Cards (Grid: 1 col mobile, 2 cols tablet, 5 cols desktop):
1. Tổng nguyên liệu (e.g., 24 loại)
2. Tổng giá trị kho (e.g., 18,500,000 ₫)
3. An toàn (Green badge, e.g., 19 loại)
4. Cần nhập / Sắp hết (Yellow badge, e.g., 3 loại)
5. Đã hết hàng (Red badge, e.g., 2 loại)

Search Toolbar:
- Input "Từ khóa tìm kiếm" + Select "Phân loại kho" (Tất cả, Thịt & Hải sản, Mì & Bột, Rau củ, Gia vị...) + "Tìm kiếm" & "Đặt lại" buttons.

Data Table:
- Columns: Mã NL | Tên nguyên liệu | Phân loại | Tồn kho thực tế / Ngưỡng min | ĐVT | Đơn giá vốn | Trạng thái kho (🟢 An toàn / 🟡 Sắp hết / 🔴 Hết hàng) | Thao tác (Sửa, Xóa).
- Progress bar indicator showing remaining stock ratio against minimum safe threshold.
```

---

## Prompt 7: Màn hình Tạo Đơn Nhập Kho (Stock Import Create)

```
Design a Stock Import Creation & History page for "Mì Trộn Cô Xi". Vietnamese language.

Header:
- Title "Quản lý & Nhập hàng kho" + Actions: "Về kho" button + "Lưu đơn nhập" primary button.

Bento Grid Form:
- Left: General Info Card (Nhà cung cấp, Kho nhập, Thời gian nhập, Ghi chú).
- Right: Item Adding & Calculator (Searchable ingredient, custom packaging unit e.g. 5 thùng x 24 gói x 85g, 2-way price calculator: Tổng tiền mua <-> Đơn giá tính ra, "+ Thêm vào đơn" button).
- Detail Table: List of added import items with quantities, units, prices, subtotals, and delete actions.
- Grand total amount card in bold green font.

Bottom Section:
- Data table of recent stock import history with expander row to view invoice line items, edit and delete actions.
```

---

## Prompt 8: Màn hình Quản lý Chi tiêu & Dòng tiền (Expenditure Management)

```
Design a Financial Cashflow & Expenditure Management page for "Mì Trộn Cô Xi". Vietnamese language. Modern financial dashboard.

Header:
- Title "Quản lý Chi tiêu & Dòng tiền" + Subtitle "Kiểm soát chi phí vận hành, tái cấu trúc mua sắm thiết bị và theo dõi tiền lời ròng thực tế".
- Quick Period Selection Pills: "Hôm nay", "7 ngày qua", "Tháng này" (active #8E3E2F), "Quý này", "Tùy chọn" (with date range inputs).
- Refresh button + "Lập phiếu chi mới" primary button (#8E3E2F).

Real-time Financial KPI Cards (Grid: 1 col mobile, 2 cols tablet, 5 cols desktop):
1. Tổng Thu Bán Hàng: Large bold number (Doanh thu POS hoàn thành) with green trending icon.
2. Chi Nhập Kho NVL: Total ingredient purchase costs with brown inventory icon.
3. Chi Phí Vận Hành & CSVC: Total operating and capital expenses with red receipt icon.
4. Tiền Lời Ròng (Còn lại): Extra-large bold text with dynamic card styling:
   - Green background #f0fdf4 if profitable: "🟢 LÃI DÒNG TIỀN = Thu - Tổng Chi"
   - Red background #fff1f2 if deficit: "🔴 THÂM HỤT"
5. Tỷ lệ Chi/Thu: Percentage metric (e.g., 42.5%) with blue pie chart icon.

Filter & Search Toolbar:
- Search input (Tiêu đề, mã phiếu, người nhận) + Phân loại dropdown (Tất cả, Tái đầu tư & CSVC, Vận hành, Mặt bằng, Lương & Thưởng, Marketing, Sửa chữa, Khác) + Phương thức thanh toán (Tiền mặt, Chuyển khoản, Thẻ).

Expenditure Data Table:
- Columns: Mã phiếu | Ngày chi | Phân loại (with category emoji) | Tiêu đề khoản chi | Số tiền chi (Bold red font) | PTTT | Người nhận / NCC | Người lập | Thao tác (Chi tiết, Sửa, Xóa).
- Server-side pagination and sorting.

Create/Edit Expenditure Modal:
- Form fields: Phân loại, Tiêu đề khoản chi *, Số tiền (VNĐ) *, Ngày giờ chi, Phương thức thanh toán, Người nhận tiền / Đơn vị cung cấp, Ghi chú chi tiết, Đính kèm hình ảnh hóa đơn/chứng từ.
```

---

## Prompt 9: Màn hình Báo cáo Bán hàng & Dòng tiền (Sales & Cashflow Report)

```
Design a Comprehensive Sales & Cashflow Report page for "Mì Trộn Cô Xi". Vietnamese language.

Header:
- Title "Báo cáo Bán hàng & Doanh số" + Subtitle "Phân tích chi tiết doanh thu theo ngày, danh mục, sản phẩm và dòng tiền".
- Period Selection Pills: "Hôm nay", "7 ngày qua", "Tháng này", "Quý này", "Tùy chọn" + Export CSV button.

Summary KPI Cards:
- Tổng Doanh thu (VND) | Giá trị đơn TB (AOV) | Chi phí Nguyên liệu BOM (VND) | Lợi nhuận gộp & Tỷ lệ lãi gộp %.

Scrollable Tab Navigation Bar:
1. 📅 Chi tiết theo Ngày: Daily sales table with revenue, discount, cost, and gross profit.
2. 🍱 Theo Danh mục: Revenue breakdown by category with bar charts.
3. 🍜 Theo Món ăn: Searchable product performance table with total units sold and revenue.
4. 💳 PTTT: Payment method breakdown (Cash, QR VietQR, Bank Transfer, Card).
5. 👤 Theo Nhân viên: Staff sales performance table.
6. 💸 Dòng tiền & Lợi nhuận Ròng:
   - Dual Bar Chart: Comparing Monthly Total Revenue (Thu) vs Total Expenditure (Chi) vs Net Profit.
   - Category expense breakdown table & daily net profit cashflow tracking.
```

---

## Prompt 10: Màn hình Đăng nhập (Login Screen)

```
Design a Login page for "Mì Trộn Cô Xi - XUXI Management System". Vietnamese language. Clean, warm, appetizing aesthetic.

Top Navbar:
- Circular logo + "Mì Trộn Cô Xi" title + "XUXI • Hệ thống Quản lý" subtitle + "v2.0 RBAC" chip.

Centered Card (460px max-width, white card, rounded-2xl, border #E2D7CC, shadow-xl):
- Centered logo avatar + "Đăng nhập hệ thống" title.
- Quick Demo Account Selector (4 pills):
  - Admin (Super Admin - #8E3E2F)
  - Quản lý (Manager - #6E281C)
  - Nhân viên (Staff Cashier/Kitchen - #C46D28)
  - Người xem (Viewer - #6E584D)
- Form:
  - Email input with user icon (placeholder: admin@skycoffee.vn)
  - Password input with key icon & show/hide visibility toggle (default: 123123)
  - Full-width "Đăng nhập hệ thống" primary button (#8E3E2F).
- Background: Warm cream #F9F6F0 with soft blurred ambient glow accents.
```

---

## Ghi chú Triển khai & Tích hợp

1. Sao chép trực tiếp nội dung từng Prompt vào **Google Stitch** tại [stitch.withgoogle.com](https://stitch.withgoogle.com).
2. Toàn bộ mã màu, font chữ, bố cục lưới Bento Grid, hành vi Responsive (Mobile Drawer, Tab Switcher, Floating Cart Bar) đều đã được chuẩn hóa đồng nhất 100% với source code tại `frontend/src`.
