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

### 2.7. Đơn vị tính (Units of Measurement - `UNIT`)
| Master Code | Key | Display Label |
| :--- | :--- | :--- |
| `kg` | `KG` | kg |
| `g` | `GRAM` | g |
| `lit` | `LITER` | lít |
| `ml` | `ML` | ml |
| `hop` | `BOX` | hộp |
| `lon` | `CAN` | lon |
| `chai` | `BOTTLE` | chai |
| `goi` | `PACKET` | gói |
| `ly` | `CUP` | ly |
| `phan` | `PORTION` | phần |
| `cai` | `PIECE` | cái |
