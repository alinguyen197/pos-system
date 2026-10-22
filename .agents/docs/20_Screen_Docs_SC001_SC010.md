# 📋 Tài liệu Màn hình - Project Sky

> **Dự án:** Project Sky **Phiên bản:** 1.0.0 **Cập nhật:** 2026-08-28 **Base URL Backend:** http://localhost:3000/api **Base URL Frontend:** http://localhost:5173

---

## Danh sách màn hình

| Mã    | Tên màn hình                         | Route Frontend        |
| ----- | ------------------------------------ | --------------------- |
| SC001 | Dashboard - Tổng quan                | /                     |
| SC002 | Bán hàng (POS) - Cập nhật Order & QR | /pos                  |
| SC003 | Quản lý sản phẩm                     | /products             |
| SC004 | Thêm sản phẩm & Tính Cost 3D         | /products/new         |
| SC005 | Quản lý kho nguyên liệu              | /ingredients          |
| SC006 | Thêm nguyên liệu mới                 | /ingredients/new      |
| SC007 | Tạo đơn nhập kho mới                 | /warehouse/import/new |
| SC008 | Báo cáo bán hàng (Sales Report)      | /reports/sales        |
| SC009 | Quản lý người dùng                   | /users                |
| SC010 | Thêm người dùng mới                  | /users/new            |
| SC011 | Quản lý Chi tiêu & Dòng tiền         | /expenditures         |
| SC012 | Quản lý Khuyến mãi & Chiến dịch      | /promotions           |

---

## SC001 - Dashboard - Tổng quan

**Mô tả:** Màn hình tổng quan hệ thống, hiển thị KPI chính, biểu đồ doanh thu và trạng thái hoạt động. **Route Frontend:** GET /

| Phương thức | Endpoint | Mô tả | Auth |
|-------------|----------|-------|------|
| GET | /api/dashboard/summary | Lấy tổng quan KPI (doanh thu hôm nay, trend %, đơn hàng, số ly, tồn kho thấp) | ✅ |
| GET | /api/dashboard/revenue-chart | Dữ liệu biểu đồ doanh thu theo thời gian | ✅ |
| GET | /api/dashboard/category-revenue | Doanh thu & tỷ trọng % theo danh mục sản phẩm | ✅ |
| GET | /api/dashboard/top-products | Danh sách top sản phẩm bán chạy nhất | ✅ |
| GET | /api/dashboard/low-stock-alerts | Danh sách nguyên liệu tồn kho thấp hơn ngưỡng tối thiểu | ✅ |

Query params (revenue-chart): `?period=day|week|month&from=YYYY-MM-DD&to=YYYY-MM-DD`

---

## SC002 - Bán hàng (POS) - Cập nhật Order & QR

**Mô tả:** Màn hình bán hàng tại quầy, hỗ trợ tạo đơn hàng đa tab nháp, áp dụng mã giảm giá, quét mã QR VietQR động, cập nhật trạng thái order, in hóa đơn, tự động trừ tồn kho theo công thức BOM, quản lý ca làm việc và kết ca bàn giao nhân viên. **Route Frontend:** GET /pos

**Nghiệp vụ & Quy tắc chuẩn hóa:**
1. **Phân chia Ca làm việc & Nhân viên đang trực:**
   - Ngày có 2 ca chuẩn: **Ca sáng** (06:00 – 14:00, `morning`) & **Ca chiều** (14:00 – 22:00, `afternoon`).
   - Top Banner hiển thị rõ: `Ca sáng (06:00 - 14:00)` / `Ca chiều (14:00 - 22:00)` và `NV: [Tên nhân viên đăng nhập]`.
   - Doanh thu, số đơn và số ly bán được tự động lọc theo **đúng khung giờ ca hiện tại**.
2. **Quy trình Kết ca (Shift Handover):**
   - Nút **"Kết ca"** trên banner POS mở Dialog Báo cáo Bàn giao Ca làm việc.
   - Hiển thị phân rã chi tiết doanh thu theo Tiền mặt (`Cash`), Quét QR/Chuyển khoản (`QR/Bank`), Thẻ (`Card`), Tổng giảm giá và Tổng doanh thu thực tế.
   - Hỗ trợ **In phiếu kết ca** và **Xác nhận Kết ca & Đăng xuất** để bàn giao cho nhân viên ca sau.
3. **Quy tắc Đơn hàng (Khóa Hủy & Khóa Xóa):**
   - **Đơn hàng đã Hoàn thành (`status = completed`) KHÔNG THỂ HỦY**: Nút Hủy đơn bị ẩn/vô hiệu hóa. Backend từ chối đổi trạng thái `completed` -> `cancelled`.
   - **Không cho phép xóa lịch sử đơn hàng**: Xóa bỏ toàn bộ nút/tính năng Xóa đơn khỏi màn hình Lịch sử đơn hàng.
4. **Tự động trừ tồn kho BOM:**
   - Khi tạo đơn hàng thành công (`POST /api/orders`), hệ thống tự động kiểm tra `product_recipes` và trừ tương ứng số lượng nguyên liệu trong `stock_items.quantity`.
5. **Khóa chọn sản phẩm Tạm ngừng kinh doanh:**
   - Trên giao diện POS: Sản phẩm có trạng thái `status = 'Tạm ngừng'` hoặc `statusCode = 'suspended'` sẽ bị khóa chọn hoàn toàn (làm mờ `opacity-50`, gắn `pointer-events-none`, đổi nút `+` thành icon khóa `block`, không nhận bất kỳ tương tác click nào).
   - Tại Backend: API `POST /api/orders` kiểm tra và từ chối tạo đơn nếu bất kỳ món nào có trạng thái `Tạm ngừng` hoặc `isActive = false`.
6. **Chế độ Nhập Bán Bù Sự Cố (Retroactive Order Entry / Incident Backdate Mode):**
   - **Mục đích:** Khắc phục sự cố mất điện, mất internet hoặc lỗi hệ thống khiến thu ngân phải dùng giấy bút ghi chép; sang ngày hôm sau Quản lý / Admin có thể nhập bổ sung vào máy với ngày phát sinh bán thực tế thay vì bị tính lệch sang ngày hôm sau.
   - **Phân quyền nghiêm ngặt (RBAC):** Chỉ `admin` và `manager` mới có quyền kích hoạt chế độ và gửi `orderDate` hồi tố. Nhân viên (`staff`) bị chặn để chống gian lận số liệu ca trực.
   - **Giao diện & Luồng trải nghiệm POS:**
     - Nút bật/tắt `⚡ Nhập bán bù sự cố` trên thanh điều khiển POS.
     - Banner điều khiển nổi bật màu cam `#FFF8E1` / viền `#FF9800` chọn Ngày bán thực tế, Giờ bán, Phím tắt nhanh (`Hôm qua`, `2 ngày trước`, `Hôm nay`), Lý do sự cố và Checkbox duy trì chế độ theo xấp giấy (Batch mode).
     - Badge cảnh báo màu cam trong Giỏ hàng, nút Thanh toán, Modal Lịch sử đơn hàng, Modal Chi tiết đơn và Phiếu in Hóa đơn bán hàng.
   - **Cơ chế Backend (`POST /api/orders`):**
     - Nhận `orderDate`, `isRetroactive`, `retroactiveReason`.
     - Tự động sinh `orderNumber` theo ngày phát sinh thực tế (VD: `DH20261021-001`).
     - Lưu vết kiểm toán (Audit trail) trong `note`: `[NHẬP BÙ SỰ CỐ - Ngày bán: DD/MM/YYYY HH:mm - Lý do: ...]`.
     - Trừ tồn kho nguyên liệu BOM theo công thức bình thường.
     - Toàn bộ Báo cáo Bán hàng (`/reports/sales`) và Dashboard tự động cập nhật chính xác 100% doanh thu theo ngày sự cố đó.

| Phương thức | Endpoint | Mô tả | Auth |
|-------------|----------|-------|------|
| GET | /api/orders | Lấy danh sách đơn hàng (hỗ trợ phân trang & tìm kiếm) | ✅ |
| GET | /api/orders/summary | Thống kê doanh thu ca hiện tại (Ca sáng/Chiều), phân rã PTTT, số đơn và số ly | ✅ |
| POST | /api/orders | Tạo đơn hàng mới & tự động trừ tồn kho nguyên liệu BOM | ✅ |
| GET | /api/orders/:id | Lấy chi tiết đơn hàng | ✅ |
| PUT | /api/orders/:id | Cập nhật trạng thái đơn (khóa từ chối nếu đơn đã completed) | ✅ |
| GET | /api/orders/:id/qr | Tạo mã VietQR động cho đơn hàng | ✅ |
| GET / POST | /api/products/search | Tìm kiếm sản phẩm để thêm vào đơn hàng POS | ✅ |

Query params (orders): ?status=pending|processing|completed|cancelled&page=1&limit=20

---

## SC003 - Quản lý sản phẩm

**Mô tả:** Danh sách tất cả sản phẩm, hỗ trợ tìm kiếm, lọc danh mục, phân trang, Single Screen 100vh layout (cuộn bảng nội bộ) và Modal chỉnh sửa sản phẩm kèm công thức BOM.

**Quy tắc Validation & Thông báo Lỗi:**
- Validation tại Client: Kiểm tra Tên sản phẩm, Giá bán > 0, danh sách BOM recipe >= 1 item, định lượng > 0. Hiển thị thông báo lỗi bằng **Inline Banner đỏ/vàng trên Form/Modal (`editError`)**, **KHÔNG bắn Toast**.
- Lỗi API / Server catch: Sử dụng **Toast Notification (`showError`)**.
- Tải nguyên liệu kho: Gọi `fetchIngredients({ pageSize: 1000 })` để đảm bảo tải 100% nguyên liệu kho CSDL mà không bị thiếu do phân trang.

| Phương thức | Endpoint | Mô tả | Auth |
|-------------|----------|-------|------|
| POST | /api/products/search | Lấy danh sách sản phẩm (hỗ trợ search, filter, paging) | ✅ |
| GET | /api/products/:id | Lấy chi tiết một sản phẩm | ✅ |
| PUT | /api/products/:id | Cập nhật sản phẩm & công thức BOM | ✅ |
| DELETE | /api/products/:id | Xoá sản phẩm | ✅ |
| GET | /api/categories | Lấy danh sách danh mục sản phẩm | ✅ |

---

## SC004 - Thêm sản phẩm & Tính Cost 3D & Trợ lý Smart F&B

**Mô tả:** Màn hình Form tạo sản phẩm mới, cuộn dọc nội bộ `flex-1 min-h-0 overflow-y-auto`, hỗ trợ cấu hình công thức BOM kèm chọn ĐVT tùy chỉnh (tự động quy đổi đơn giá vốn `ml`, `g`, `lít`, `kg`...), Trợ lý Smart F&B (Mô phỏng ly 3D theo tầng nguyên liệu, Rada dinh dưỡng Kcal/Caffeine/Đường, và Quy trình SOP Pha chế Barista chuẩn hóa).

**Quy tắc Validation & Thông báo Lỗi:**
- Validation tại Client: Bắt buộc nhập Tên sản phẩm, Chọn Phân loại, Giá bán > 0, Chọn ít nhất 1 nguyên liệu BOM có định lượng > 0. Lỗi được ghi vào `formError` và hiển thị trên **Khung cảnh báo Inline đỏ/vàng trên Form**, **KHÔNG sử dụng Toast**.
- Quy đổi ĐVT tự động: Khi chọn ĐVT BOM khác với ĐVT kho (ví dụ `lít` $\rightarrow$ `ml`), hệ thống tự động quy đổi đơn giá vốn (1 lít 1,000 ₫ $\rightarrow$ 1 ml = 1 ₫, 100 ml = 100 ₫) và quy đổi định lượng chuẩn khi lưu sản phẩm.
- Lỗi API / Server catch: Sử dụng **Toast Notification (`showError`)**.
- Tải nguyên liệu kho: Tự động gọi `fetchIngredients({ pageSize: 1000 })` lấy toàn bộ nguyên liệu CSDL kho (bao gồm các nguyên liệu mới vừa tạo).

| Phương thức | Endpoint | Mô tả | Auth |
|-------------|----------|-------|------|
| POST | /api/products | Tạo sản phẩm mới kèm danh sách recipeItems BOM | ✅ |
| GET | /api/ingredients/search | Lấy toàn bộ danh sách nguyên liệu kho (`pageSize: 1000`) | ✅ |
| GET | /api/categories | Lấy danh sách danh mục sản phẩm | ✅ |
| POST | /api/upload | Upload hình ảnh sản phẩm | ✅ |

---

## SC005 - Quản lý kho nguyên liệu

**Mô tả:** Danh sách tồn kho nguyên liệu, thẻ KPI tổng giá trị kho (`totalValue`), hiển thị cột Tổng giá trị tồn từng loại nguyên liệu (`stock * costPerUnit`), cảnh báo tồn kho (an toàn, cần nhập, đã hết hàng), tìm kiếm & lọc phân loại. **Route Frontend:** GET /ingredients

| Phương thức | Endpoint | Mô tả | Auth |
|-------------|----------|-------|------|
| GET / POST | /api/ingredients/search | Lấy danh sách nguyên liệu, tồn kho & thống kê summary KPI (tổng giá trị kho `totalValue`) | ✅ |
| GET | /api/ingredients/:id | Lấy chi tiết nguyên liệu | ✅ |
| PUT | /api/ingredients/:id | Cập nhật thông tin nguyên liệu & đơn vị nhập kho | ✅ |
| DELETE | /api/ingredients/:id | Xoá nguyên liệu | ✅ |

---

## SC006 - Thêm nguyên liệu mới

**Mô tả:** Form khai báo danh mục nguyên liệu mới vào hệ thống kho (tên nguyên liệu, phân loại kho, đơn vị tính lưu kho, mức tồn tối thiểu và tồn kho ban đầu). Đơn giá vốn không bắt buộc nhập tại đây mà được tự động xác định và cập nhật chính xác qua các phiếu nhập kho thực tế từ Nhà cung cấp. **Route Frontend:** GET /ingredients/create

| Phương thức | Endpoint | Mô tả | Auth |
|-------------|----------|-------|------|
| POST | /api/ingredients | Tạo nguyên liệu mới | ✅ |
| GET | /api/master-codes?type=UNIT | Lấy danh sách đơn vị tính (kg, lít, cái, hộp, bình, lon...) | ✅ |
| GET | /api/master-codes?type=INGREDIENT_CATEGORY | Lấy danh sách phân loại kho nguyên liệu | ✅ |

Request body (POST /api/ingredients):
`{ "name": "string", "category": "string", "unit": "string", "minStock": number, "initialStock"?: number, "costPrice"?: number }`

---

## SC007 - Quản lý & Tạo đơn nhập kho mới

**Mô tả:** Màn hình kết hợp Lập phiếu nhập kho nguyên liệu (tính toán quy cách đóng gói lẻ 2 chiều và tự động cập nhật tồn kho) cùng Bảng theo dõi & Quản lý Lịch sử các lần nhập hàng phía dưới. **Route Frontend:** GET /stock-imports/create

**Nghiệp vụ & Quy tắc UI:**
1. **Thông tin phiếu nhập** (Nhà cung cấp, Kho nhập): Là `<input type="text">` thuần cho phép nhập tự do, không ràng buộc danh sách cố định.
2. **Chế độ nhập số lượng**:
   - **Nhập trực tiếp** (mặc định): Nhập thẳng số lượng theo ĐVT kho (VD: 4.2 kg).
   - **Nhập theo quy cách đóng gói** (bật toggle): Người dùng nhập 3 trường:
     - `Số lượng mua` (packCount): Số đơn vị đóng gói mua về (VD: 2 bình)
     - `Loại đóng gói` (packUnit): bình, hộp, lon, gói... (editable Select)
     - `Quy cách` (packSize): Dung tích/cân nặng mỗi đơn vị theo ĐVT kho (VD: 2.1 kg/bình)
     - Hệ thống tự tính: `qty = packCount × packSize` (VD: 2 × 2.1 = 4.2 kg)
     - Badge quy cách được lưu và hiển thị trên dòng chi tiết nguyên liệu.
3. **Tính đơn giá 2 chiều**: Nhập Tổng tiền mua → tự tính Đơn giá/ĐVT, hoặc nhập Đơn giá → tự tính Tổng tiền.
4. **Bảng Lịch sử các lần nhập hàng (History DataTable & Search Form)**:
   - **Form tìm kiếm & Bộ lọc:** Tìm theo Mã phiếu (`PNK-xxx`), Tên NCC, Ghi chú, lọc theo Kho nhập, lọc theo Khoảng thời gian (Từ ngày - Đến ngày).
   - **Bảng dữ liệu:** Hiển thị Mã phiếu nhập, Thời gian nhập, Nhà cung cấp, Kho nhập, Số mặt hàng, Tổng tiền phiếu (format 2 số thập phân), Ghi chú.
   - **Thao tác:** Nút "Chi tiết" mở Dialog xem toàn bộ danh sách nguyên liệu, quy cách đóng gói, đơn giá và tổng giá trị phiếu.
   - Khi bấm **Lưu đơn nhập**, hệ thống tạo phiếu thành công và tự động reload bảng lịch sử ngay lập tức.

| Phương thức | Endpoint | Mô tả | Auth |
|-------------|----------|-------|------|
| GET | /api/ingredients/search | Lấy danh sách nguyên liệu để chọn | ✅ |
| GET | /api/master-codes?type=UNIT | Lấy danh sách ĐVT nhập kho | ✅ |
| POST | /api/stock-imports | Tạo phiếu nhập kho mới, lưu vào CSDL & cập nhật tồn kho | ✅ |
| GET / POST | /api/stock-imports/search | Lấy danh sách lịch sử phiếu nhập kho (hỗ trợ search, filter kho, date range, phân trang) | ✅ |
| GET | /api/stock-imports/:id | Lấy thông tin chi tiết một phiếu nhập kho | ✅ |


---

## SC008 - Báo cáo bán hàng (Sales Report)

**Mô tả:** Báo cáo doanh thu, phân tích theo ngày, sản phẩm, danh mục, phương thức thanh toán và nhân viên. Hỗ trợ lọc khoảng thời gian tùy chọn và xuất file CSV. **Route Frontend:** GET /reports/sales

| Phương thức | Endpoint | Mô tả | Auth |
|-------------|----------|-------|------|
| GET | /api/reports/sales | Báo cáo doanh thu tổng hợp KPI & giá trị đơn trung bình (AOV) | ✅ |
| GET | /api/reports/sales/by-date | Doanh thu chi tiết theo ngày bán được (kèm thứ, số đơn, số ly, lợi nhuận) | ✅ |
| GET | /api/reports/sales/by-payment-method | Thống kê doanh thu theo Phương thức thanh toán (Tiền mặt, VietQR, Thẻ) | ✅ |
| GET | /api/reports/sales/by-category | Doanh thu & lợi nhuận theo danh mục sản phẩm | ✅ |
| GET | /api/reports/sales/by-product | Doanh thu & lợi nhuận theo từng sản phẩm | ✅ |
| GET | /api/reports/sales/by-staff | Doanh số & số đơn tạo theo nhân viên | ✅ |
| GET | /api/reports/sales/export | Xuất báo cáo tổng hợp & phân rã ra file CSV | ✅ |

Query params: `?period=today|7days|this_month|this_quarter|custom&from=YYYY-MM-DD&to=YYYY-MM-DD`

---

## SC009 - Quản lý người dùng

**Mô tả:** Danh sách tài khoản người dùng hệ thống, phân quyền, kích hoạt/vô hiệu hoá tài khoản. **Route Frontend:** GET /users | Phương thức | Endpoint | Mô tả | Auth | Role | |-------------|----------|-------|------|------| | GET | /api/users | Lấy danh sách người dùng | ✅ | Admin | | GET | /api/users/:id | Lấy chi tiết người dùng | ✅ | Admin | | PUT | /api/users/:id | Cập nhật thông tin người dùng | ✅ | Admin | | DELETE | /api/users/:id | Xoá người dùng | ✅ | Admin | | PATCH | /api/users/:id/status | Kích hoạt / vô hiệu hoá tài khoản | ✅ | Admin | | GET | /api/roles | Lấy danh sách vai trò | ✅ | Admin | Query params: ?keyword=&role=admin|staff|manager&status=active|inactive&page=1&limit=20

---

## SC010 - Thêm người dùng mới

---

## SC011 - Quản lý Chi tiêu & Dòng tiền (Expenditures & Cashflow)

**Mô tả:** Màn hình quản lý toàn diện các khoản chi phí phát sinh trong và ngoài kho (mua chén, dĩa, ly tách, máy móc thiết bị CSVC tái đầu tư, tiền điện nước, mặt bằng, lương nhân viên...). Tự động tổng hợp KPI dòng tiền: Tổng Thu (Doanh thu bán hàng) - Tổng Chi (Chi nhập hàng đi chợ/kho + Chi phí vận hành/tái đầu tư) = Tiền lời ròng thực tế (Net Realized Profit). Tích hợp ảnh chứng từ/hóa đơn, phân loại động theo Master Code `EXPENSE_CATEGORY`, và xuất báo cáo CSV chi tiết.

**Route Frontend:** GET `/expenditures` (và Tab 6 `💸 Dòng tiền & Lợi nhuận Ròng` tại `/reports/sales`)

| Phương thức | Endpoint | Mô tả | Auth | Role |
| :--- | :--- | :--- | :---: | :--- |
| `GET` | `/api/expenditures/summary` | Thống kê KPI Dòng tiền (Thu, Chi kho, Chi khác, Tiền lời ròng, Tỷ lệ chi phí, Phân rã nhóm chi) | ✅ | admin, manager, staff, viewer |
| `GET` | `/api/expenditures` | Lấy danh sách phiếu chi có phân trang, lọc theo kỳ (`period`, `fromDate`, `toDate`), phân loại (`category`), phương thức (`paymentMethod`), tìm kiếm | ✅ | admin, manager, staff, viewer |
| `POST` | `/api/expenditures` | Tạo mới phiếu chi (Mã tự sinh `PC-YYYYMMDD-XXX`) | ✅ | admin, manager, staff |
| `GET` | `/api/expenditures/:id` | Xem chi tiết phiếu chi | ✅ | admin, manager, staff, viewer |
| `PUT` | `/api/expenditures/:id` | Cập nhật phiếu chi | ✅ | admin, manager |
| `DELETE` | `/api/expenditures/:id` | Xóa mềm phiếu chi | ✅ | admin, manager |
| `GET` | `/api/reports/cashflow` | Báo cáo dòng tiền theo ngày, tỷ suất lợi nhuận ròng | ✅ | admin, manager, staff, viewer |
| `GET` | `/api/reports/cashflow/export` | Xuất báo cáo CSV Dòng tiền & Lợi nhuận ròng | ✅ | admin, manager |

**Request Body tạo phiếu chi (`POST /api/expenditures`):**
```json
{
  "title": "Mua 50 bộ chén đĩa và ly tách mới",
  "category": "reinvestment",
  "amount": 1500000,
  "paymentMethod": "cash",
  "spentAt": "2026-10-07T10:00:00.000Z",
  "recipient": "Cửa hàng Gốm Sứ Bát Tràng",
  "imageUrl": "https://...",
  "notes": "Bổ sung đồ dùng phục vụ mở rộng khu vực sân vườn"
}
```

---

## SC012 - Quản lý Khuyến mãi & Chiến dịch Sự kiện

**Mô tả:** Màn hình quản lý trọn gói các chương trình khuyến mãi, sự kiện ưu đãi, mã giảm giá (voucher), theo dõi tỷ lệ sử dụng, số tiền đã ưu đãi cho khách và tích hợp tự động với màn hình bán hàng POS.  
**Route Frontend:** GET `/promotions`  
**Phân quyền truy cập:** `admin`, `manager`

**Nghiệp vụ cốt lõi:**
1. **Thiết lập mã Voucher:**
   - Mã code duy nhất (tự động uppercase & trim, hỗ trợ sinh mã ngẫu nhiên dạng `SKY-XXXXX`).
   - Hình thức chiết khấu: Giảm theo phần trăm (`PERCENT`, có thể kèm hạn mức giảm trần tối đa `maxDiscountAmount`) hoặc Giảm theo số tiền cố định (`FIXED_AMOUNT`).
   - Ràng buộc: Giá trị đơn hàng tối thiểu (`minOrderAmount`), thời hạn áp dụng (`startDate` - `endDate`), giới hạn số lượt sử dụng toàn hệ thống (`usageLimit`).
2. **Tích hợp thời gian thực với Màn hình POS (SC002):**
   - Thu ngân chọn trực tiếp voucher từ Modal **"Khuyến mãi khả dụng"** hoặc nhập mã code thủ công.
   - Hệ thống tự động tính toán số tiền giảm và cảnh báo nếu đơn hàng chưa đủ điều kiện (hỗ trợ gợi ý upsell khách mua thêm).
   - Tự động gỡ mã nếu thu ngân bớt món trong giỏ hàng làm tổng tiền rớt xuống dưới mức tối thiểu.
   - Khi hoàn tất đơn hàng, hệ thống khóa dòng trong Transaction để chống race condition và tự động tăng `usedCount`.
3. **Lưu vết và In hóa đơn:**
   - Đơn hàng lưu `promotionId` và `discountCode` để phục vụ báo cáo và in bill chi tiết.

| Phương thức | Endpoint | Mô tả | Auth | Role |
| :--- | :--- | :--- | :---: | :--- |
| `GET` | `/api/promotions` | Lấy danh sách khuyến mãi, phân trang, tìm kiếm, lọc theo trạng thái và hình thức chiết khấu kèm KPI | ✅ | `admin`, `manager` |
| `POST` | `/api/promotions` | Tạo mới chiến dịch khuyến mãi / mã voucher | ✅ | `admin`, `manager` |
| `GET` | `/api/promotions/:id` | Xem chi tiết chiến dịch khuyến mãi | ✅ | `admin`, `manager` |
| `PUT` | `/api/promotions/:id` | Cập nhật cấu hình khuyến mãi | ✅ | `admin`, `manager` |
| `PATCH` | `/api/promotions/:id/status` | Bật / Tắt nhanh trạng thái chiến dịch (`active` <-> `inactive`) | ✅ | `admin`, `manager` |
| `DELETE` | `/api/promotions/:id` | Xóa mềm chiến dịch khuyến mãi | ✅ | `admin` |
| `GET` | `/api/promotions/active-list` | Lấy danh sách voucher đang hiệu lực cho Modal POS | ✅ | `admin`, `manager`, `staff` |
| `POST` | `/api/promotions/validate` | Kiểm tra tính hợp lệ của mã và tính tiền giảm cho đơn POS | ✅ | `admin`, `manager`, `staff` |

---

## Ghi chú chung

### Authentication

Tất cả endpoint (trừ /api/login) yêu cầu JWT Token: Authorization: Bearer <token>

### Endpoint xác thực hiện có

| Phương thức | Endpoint   | Mô tả                       |
| ----------- | ---------- | --------------------------- |
| POST        | /api/login | Đăng nhập, trả về JWT token |

### Response format chuẩn

{ "success": true, "message": "string", "data": {}, "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }

### Error format

{ "success": false, "message": "string", "errors": [] }
