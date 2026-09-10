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

## SC007 - Tạo đơn nhập kho mới

**Mô tả:** Form tạo phiếu nhập kho, nhập nguyên liệu thực tế từ nhà cung cấp theo biến động thị trường (hỗ trợ quy cách đóng gói lẻ như 1 bình 2,1 kg = 57.000 ₫, tự động tính toán 2 chiều giữa Tổng tiền mua và Đơn giá vốn), cập nhật tồn kho tự động. **Route Frontend:** GET /stock-imports/create

| Phương thức | Endpoint | Mô tả | Auth |
|-------------|----------|-------|------|
| GET | /api/ingredients/search | Lấy danh sách nguyên liệu để chọn | ✅ |
| GET | /api/master-codes?type=UNIT | Lấy danh sách ĐVT nhập kho | ✅ |
| POST | /api/stock-imports | Tạo phiếu nhập kho mới & cập nhật tồn kho | ✅ |

Request body (POST /api/stock-imports):
`{ "supplier": "string", "warehouse": "string", "importDate": "YYYY-MM-DDTHH:mm", "note": "string", "items": [{ "ingredientId": "string", "dbId": number, "unit": "string", "qty": number, "unitPrice": number, "totalAmount": number }] }`

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

**Mô tả:** Form tạo tài khoản người dùng mới, gán vai trò và quyền hạn. **Route Frontend:** GET /users/new | Phương thức | Endpoint | Mô tả | Auth | Role | |-------------|----------|-------|------|------| | POST | /api/users | Tạo người dùng mới | ✅ | Admin | | GET | /api/roles | Lấy danh sách vai trò để gán | ✅ | Admin | Request body (POST /api/users): { "name": "string", "email": "string", "password": "string", "role": "admin|staff|manager", "phone": "string", "status": "active|inactive" }

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
