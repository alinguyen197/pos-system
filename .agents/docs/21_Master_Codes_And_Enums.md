# Master Codes, Enums & System Constants

| Hạng mục  | Nội dung |
| :--- | :--- |
| Hệ thống | Sky Coffee Management System |
| Quản lý | Master Code Standard |
| Phiên bản | v1.0 |

---

## 1. Nguyên tắc Chuẩn hóa (Master Code Principle)
1. **Lưu trữ CSDL Tập trung (Database Table `master_codes`)**:
   - Tất cả giá trị Master Code, Nhóm Category và Display Label Tiếng Việt được lưu trữ tập trung tại bảng `master_codes` trong CSDL PostgreSQL.
   - Frontend không hardcode danh sách dropdown mà gọi API `GET /api/master-codes?category=...` để lấy dữ liệu động.
2. **Không so sánh chuỗi Tiếng Việt hiển thị (Display Label) ở Tầng Backend/Service**:
   - ❌ **Không dùng:** `categoryName === 'Tất cả'` hoặc `status === 'An toàn'`.
   - ✅ **Phải dùng:** `code === 'all'` hoặc `status === 'safe'`.
3. **Cấu trúc Bảng `master_codes`**:
   - `id`: PK (Integer)
   - `group_category`: Nhóm danh mục (`INGREDIENT_CATEGORY`, `PRODUCT_CATEGORY`, `STOCK_STATUS`, `PRODUCT_STATUS`, `USER_ROLE`, `COMMON_FILTER`)
   - `code`: Mã nhận diện duy nhất trong nhóm (VD: `coffee_beans`, `safe`, `all`)
   - `label`: Nhãn hiển thị Tiếng Việt (VD: `Cà phê hạt`, `An toàn`, `Tất cả`)
   - `sort_order`: Thứ tự hiển thị
   - `is_active`: Trạng thái hoạt động (true/false)

---

## 2. Danh mục Master Codes hệ thống

### 2.1. Danh mục lọc chung (Common Filters)
| Master Code | Key | Display Label (Tiếng Việt) |
| :--- | :--- | :--- |
| `all` | `ALL` | Tất cả |

### 2.2. Master Codes Danh mục Sản phẩm (Product Categories)
| Master Code | Key | Display Label |
| :--- | :--- | :--- |
| `coffee` | `COFFEE` | Cà phê |
| `tea` | `TEA` | Trà |
| `cake` | `CAKE` | Bánh ngọt |

### 2.3. Master Codes Nguyên liệu kho (Ingredient Categories)
| Master Code | Key | Display Label |
| :--- | :--- | :--- |
| `coffee_beans` | `COFFEE_BEANS` | Cà phê hạt |
| `milk_cream` | `MILK_CREAM` | Sữa & Kem |
| `syrup_sugar` | `SYRUP_SUGAR` | Siro & Đường |
| `packaging` | `PACKAGING` | Đóng gói |

### 2.4. Trạng thái Tồn kho (Stock Status Enums)
| Master Code | Key | Display Label | CSS Tag Style |
| :--- | :--- | :--- | :--- |
| `safe` | `SAFE` | An toàn | `bg-[#c9edb5]/60 text-[#326824]` |
| `need_import` | `NEED_IMPORT` | Cần nhập | `bg-[#ffe082]/50 text-[#8c6b00]` |
| `near_empty` | `NEAR_EMPTY` | Gần hết | `bg-[#ffe082]/50 text-[#8c6b00]` |
| `very_low` | `VERY_LOW` | Rất thấp | `bg-[#ffdad6] text-[#ba1a1a]` |
| `out_of_stock` | `OUT_OF_STOCK` | Đã hết | `bg-[#ffdad6] text-[#ba1a1a]` |

### 2.5. Trạng thái Kinh doanh Sản phẩm (Product Business Status)
| Master Code | Key | Display Label |
| :--- | :--- | :--- |
| `in_business` | `IN_BUSINESS` | Đang kinh doanh |
| `suspended` | `SUSPENDED` | Tạm ngừng |

### 2.6. Phân quyền Người dùng (User Roles)
| Master Code | Key | Display Label |
| :--- | :--- | :--- |
| `admin` | `ADMIN` | Quản trị viên |
| `manager` | `MANAGER` | Quản lý cửa hàng |
| `staff` | `STAFF` | Nhân viên thu ngân / Pha chế |
| `viewer` | `VIEWER` | Người xem |

### 2.7. Đơn vị tính (Units of Measurement - `UNIT`) & Quy đổi tự động
| Master Code | Key | Display Label | Nhóm đơn vị | Quy đổi chuẩn |
| :--- | :--- | :--- | :--- | :--- |
| `kg` | `KG` | kg | Khối lượng | Base = 1000g |
| `g` | `GRAM` | g | Khối lượng | Base = 1g |
| `mg` | `MILLIGRAM` | mg | Khối lượng | Base = 0.001g |
| `lang` | `LANG` | lạng | Khối lượng | Base = 100g (0.1kg) |
| `lit` | `LITER` | lít | Thể tích | Base = 1000ml |
| `ml` | `ML` | ml | Thể tích | Base = 1ml |
| `cl` | `CL` | cl | Thể tích | Base = 10ml |
| `oz` | `OZ` | oz | Thể tích | Base = 30ml |
| `shot` | `SHOT` | shot | Thể tích | Base = 30ml |
| `cai` | `PIECE` | cái | Đếm/Cái | 1:1 tương đương |
| `qua` | `EGG_PIECE` | quả | Đếm/Cái | 1:1 tương đương `cái`, `trái`, `hột` |
| `trai` | `FRUIT_PIECE`| trái | Đếm/Cái | 1:1 tương đương `cái`, `quả` |
| `hot` | `SEED_PIECE` | hột | Đếm/Cái | 1:1 tương đương `cái`, `quả` |
| `vien` | `BALL_PIECE` | viên | Đếm/Cái | 1:1 tương đương `cái` (Gà popcorn ~20g) |
| `lat` | `SLICE` | lát | Đếm/Cái | 1:1 tương đương `cái` (Phô mai lát ~20g) |
| `goi` | `PACKET` | gói | Đếm/Đóng gói | Mì gói = 60g |
| `hop` | `BOX` | hộp | Đóng gói/Đếm | Hộp kraft = 1 cái; Hộp trứng = 10 quả |
| `lon` | `CAN` | lon | Đóng gói/Đếm | Sữa đặc = 380g / 380ml |
| `chai` | `BOTTLE` | chai | Đóng gói/Đếm | Trích xuất dung tích từ tên (VD 700ml, 1L) |
| `ly` | `CUP` | ly | Đồ uống | 1 cái |
| `coc` | `GLASS` | cốc | Đồ uống | 1 cái |
| `phan` | `PORTION` | phần | Suất ăn | 1 cái |
| `vi` | `BLISTER` | vỉ | Multi-pack | 10 quả/cái |
| `khay` | `TRAY` | khay | Multi-pack | 30 quả/cái |
| `chuc` | `TEN_PACK` | chục | Multi-pack | 10 quả/cái |
| `ta` | `DOZEN` | tá | Multi-pack | 12 quả/cái |
| `thung` | `CARTON` | thùng | Multi-pack | 24 - 30 cái |

### 2.8. Phân loại Chi tiêu & Tái đầu tư (Expense Categories - `EXPENSE_CATEGORY`)
| Master Code | Key | Display Label | Mục đích & Nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `reinvestment` | `REINVESTMENT` | Tái đầu tư & Thiết bị CSVC | Mua sắm chén, dĩa, ly tách, máy pha cà phê, bàn ghế, tủ kệ mới |
| `operation` | `OPERATION` | Vận hành (Điện, Nước, Gas, Net) | Chi phí tiện ích cố định hàng tháng của quán |
| `premises` | `PREMISES` | Thuê mặt bằng | Tiền thuê mặt bằng, cọc mặt bằng định kỳ |
| `salary` | `SALARY` | Lương & Thưởng nhân viên | Chi trả lương, phụ cấp, thưởng cho nhân viên thu ngân/pha chế |
| `marketing` | `MARKETING` | Quảng cáo & Khuyến mại | Chi phí chạy ads, in ấn tờ rơi, banner sự kiện |
| `repair` | `REPAIR` | Sửa chữa & Bảo trì | Sửa chữa máy pha cà phê, máy lạnh, điện nước bị hỏng hóc |
| `other` | `OTHER` | Chi phí khác | Các khoản chi phí linh tinh, đột xuất khác |

### 2.9. Phương thức Thanh toán Chi tiêu (Payment Methods - `PAYMENT_METHOD`)
| Master Code | Key | Display Label |
| :--- | :--- | :--- |
| `cash` | `CASH` | Tiền mặt |
| `bank_transfer` | `BANK_TRANSFER` | Chuyển khoản ngân hàng |
| `other` | `OTHER` | Khác |

