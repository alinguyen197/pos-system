# Test Case Template & Ví dụ

| Hạng mục  | Nội dung                       |
| :-------- | :----------------------------- |
| Hệ thống  | Coffee Trade Management System |
| Phiên bản | 1.0                            |
| Ngày tạo  | 2026-08-26                     |

### Lịch sử phiên bản

| Ver | Ngày       | Nội dung thay đổi | Người thực hiện |
| :-: | :--------- | :---------------- | :-------------- |
| 1.0 | 2026-08-26 | Tạo mới           | KhoaNA15        |

---

## 1. Cấu trúc Test Case

### 1.1. Template Test Case cho API

| Cột                 | Mô tả                                    |
| :------------------ | :--------------------------------------- |
| **No.**             | Số thứ tự                                |
| **Category**        | Nhóm test (Normal / Abnormal / Boundary) |
| **Test Case**       | Mô tả kịch bản test                      |
| **Precondition**    | Điều kiện tiên quyết                     |
| **Input**           | Dữ liệu đầu vào                          |
| **Expected Status** | HTTP status code mong đợi                |
| **Expected Result** | Kết quả mong đợi                         |
| **Priority**        | High / Medium / Low                      |
| **Result**          | Pass ✅ / Fail ❌ / Not tested ⬜        |

### 1.2. Phân loại Test Category

| Category     | Mô tả                              | Tỷ lệ |
| :----------- | :--------------------------------- | :---: |
| **Normal**   | Luồng chính, dữ liệu hợp lệ        | ~30%  |
| **Abnormal** | Dữ liệu sai, thiếu, không hợp lệ   | ~50%  |
| **Boundary** | Giá trị biên (min, max, edge case) | ~20%  |

---

## 2. Ví dụ: Test Case API Tạo Sản phẩm

**API:** `POST /api/products` **Roles:** admin, manager

### 2.1. Normal Cases

| No. | Category | Test Case                                       | Precondition                   | Input                                                                                                                          | Expected Status | Expected Result                                      | Priority | Result |
| :-: | :------: | :---------------------------------------------- | :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------- | :-------------: | :--------------------------------------------------- | :------: | :----: |
|  1  |  Normal  | Tạo sản phẩm thành công với đầy đủ thông tin    | User đăng nhập (role: manager) | `{ "code": "CF001", "name": "Arabica Brazil", "categoryId": "uuid-1", "origin": "Brazil", "unitPrice": 250000, "unit": "kg" }` |       200       | `success: true`, product được lưu vào DB             |   High   |   ⬜   |
|  2  |  Normal  | Tạo sản phẩm thành công với thông tin tối thiểu | User đăng nhập (role: admin)   | `{ "code": "CF002", "name": "Robusta VN" }`                                                                                    |       200       | `success: true`, các trường optional để null/default |   High   |   ⬜   |

### 2.2. Abnormal Cases — Validation

| No. | Category | Test Case                    | Precondition               | Input                                                     | Expected Status | Expected Result                                                | Priority | Result |
| :-: | :------: | :--------------------------- | :------------------------- | :-------------------------------------------------------- | :-------------: | :------------------------------------------------------------- | :------: | :----: |
|  3  | Abnormal | Thiếu trường bắt buộc `code` | User đăng nhập             | `{ "name": "Test" }`                                      |       400       | `errors[].field = "code"`, `messageCode = "MSG_ERR_REQUIRED"`  |   High   |   ⬜   |
|  4  | Abnormal | Thiếu trường bắt buộc `name` | User đăng nhập             | `{ "code": "CF003" }`                                     |       400       | `errors[].field = "name"`, `messageCode = "MSG_ERR_REQUIRED"`  |   High   |   ⬜   |
|  5  | Abnormal | Thiếu cả 2 trường bắt buộc   | User đăng nhập             | `{ }`                                                     |       400       | `errors[]` chứa 2 lỗi cho `code` và `name`                     |   High   |   ⬜   |
|  6  | Abnormal | Mã sản phẩm đã tồn tại       | Đã có product code "CF001" | `{ "code": "CF001", "name": "Test" }`                     |       400       | `errors[].field = "code"`, `messageCode = "MSG_ERR_UNIQUE"`    |   High   |   ⬜   |
|  7  | Abnormal | `unitPrice` sai kiểu dữ liệu | User đăng nhập             | `{ "code": "CF004", "name": "Test", "unitPrice": "abc" }` |       400       | `errors[].field = "unitPrice"`, `messageCode = "MSG_ERR_TYPE"` |   High   |   ⬜   |
|  8  | Abnormal | `unitPrice` là số âm         | User đăng nhập             | `{ "code": "CF004", "name": "Test", "unitPrice": -100 }`  |       400       | `errors[].field = "unitPrice"`, `messageCode = "MSG_ERR_MIN"`  |  Medium  |   ⬜   |
|  9  | Abnormal | `unit` giá trị ngoài enum    | User đăng nhập             | `{ "code": "CF004", "name": "Test", "unit": "xyz" }`      |       400       | `errors[].field = "unit"`, `messageCode = "MSG_ERR_ENUM"`      |  Medium  |   ⬜   |

### 2.3. Abnormal Cases — Auth & Permission

| No. | Category | Test Case                    | Precondition                  | Input                                         | Expected Status | Expected Result | Priority | Result |
| :-: | :------: | :--------------------------- | :---------------------------- | :-------------------------------------------- | :-------------: | :-------------- | :------: | :----: |
| 10  | Abnormal | Không có token               | Chưa đăng nhập                | Dữ liệu hợp lệ, không có Authorization header |       401       | Body rỗng       |   High   |   ⬜   |
| 11  | Abnormal | Token hết hạn                | Token expired                 | Dữ liệu hợp lệ, token hết hạn                 |       401       | Body rỗng       |   High   |   ⬜   |
| 12  | Abnormal | Token sai format             | -                             | Authorization: `Bearer invalid-token`         |       401       | Body rỗng       |  Medium  |   ⬜   |
| 13  | Abnormal | Role không có quyền (staff)  | User đăng nhập (role: staff)  | Dữ liệu hợp lệ                                |       403       | Body rỗng       |   High   |   ⬜   |
| 14  | Abnormal | Role không có quyền (viewer) | User đăng nhập (role: viewer) | Dữ liệu hợp lệ                                |       403       | Body rỗng       |   High   |   ⬜   |

### 2.4. Boundary Cases

| No. | Category | Test Case                          | Precondition   | Input                                                            | Expected Status | Expected Result                               | Priority | Result |
| :-: | :------: | :--------------------------------- | :------------- | :--------------------------------------------------------------- | :-------------: | :-------------------------------------------- | :------: | :----: |
| 15  | Boundary | `code` đúng max length (20 ký tự)  | User đăng nhập | `{ "code": "12345678901234567890", "name": "Test" }`             |       200       | Tạo thành công                                |  Medium  |   ⬜   |
| 16  | Boundary | `code` vượt max length (21 ký tự)  | User đăng nhập | `{ "code": "123456789012345678901", "name": "Test" }`            |       400       | `errors[].messageCode = "MSG_ERR_MAX_LENGTH"` |  Medium  |   ⬜   |
| 17  | Boundary | `name` đúng max length (200 ký tự) | User đăng nhập | `{ "code": "CF005", "name": "A" × 200 }`                         |       200       | Tạo thành công                                |  Medium  |   ⬜   |
| 18  | Boundary | `name` vượt max length (201 ký tự) | User đăng nhập | `{ "code": "CF005", "name": "A" × 201 }`                         |       400       | `errors[].messageCode = "MSG_ERR_MAX_LENGTH"` |  Medium  |   ⬜   |
| 19  | Boundary | `unitPrice` = 0                    | User đăng nhập | `{ "code": "CF006", "name": "Test", "unitPrice": 0 }`            |       200       | Tạo thành công (giá 0 hợp lệ)                 |   Low    |   ⬜   |
| 20  | Boundary | `unitPrice` = 999999999.99 (max)   | User đăng nhập | `{ "code": "CF007", "name": "Test", "unitPrice": 999999999.99 }` |       200       | Tạo thành công                                |   Low    |   ⬜   |

---

## 3. Ví dụ: Test Case API Tìm kiếm Sản phẩm

**API:** `POST /api/products/search` **Roles:** admin, manager, staff, viewer

### 3.1. Normal Cases

| No. | Category | Test Case                           | Input                                                                           | Expected Status | Expected Result                                       | Priority | Result |
| :-: | :------: | :---------------------------------- | :------------------------------------------------------------------------------ | :-------------: | :---------------------------------------------------- | :------: | :----: |
|  1  |  Normal  | Tìm kiếm không điều kiện (load all) | `{ "pagination": { "page": 1, "pageSize": 20 } }`                               |       200       | Trả về max 20 items + pagination info                 |   High   |   ⬜   |
|  2  |  Normal  | Tìm kiếm theo tên                   | `{ "searchConditions": { "productName": "Arabica" }, ... }`                     |       200       | Chỉ trả về sản phẩm có tên chứa "Arabica"             |   High   |   ⬜   |
|  3  |  Normal  | Tìm kiếm kết hợp nhiều điều kiện    | `{ "searchConditions": { "productName": "Arabica", "origin": "Brazil" }, ... }` |       200       | Trả về sản phẩm thỏa cả 2 điều kiện                   |   High   |   ⬜   |
|  4  |  Normal  | Không có kết quả                    | `{ "searchConditions": { "productName": "XYZNOTEXIST" }, ... }`                 |       200       | `data.items = []`, `data.pagination.totalRecords = 0` |  Medium  |   ⬜   |
|  5  |  Normal  | Sort theo tên ASC                   | `{ "sortConditions": [{ "sortBy": "productName", "sortOrder": "asc" }], ... }`  |       200       | Items được sắp xếp A → Z                              |   High   |   ⬜   |
|  6  |  Normal  | Sort theo giá DESC                  | `{ "sortConditions": [{ "sortBy": "unitPrice", "sortOrder": "desc" }], ... }`   |       200       | Items sắp xếp giá cao → thấp                          |  Medium  |   ⬜   |
|  7  |  Normal  | Phân trang — trang 2                | `{ "pagination": { "page": 2, "pageSize": 20 } }`                               |       200       | Trả về items từ bản ghi 21-40                         |   High   |   ⬜   |
|  8  |  Normal  | Phân trang — pageSize 50            | `{ "pagination": { "page": 1, "pageSize": 50 } }`                               |       200       | Trả về max 50 items                                   |  Medium  |   ⬜   |

### 3.2. Abnormal & Boundary Cases — Pagination

| No. | Category | Test Case                     | Input                                                 |                   Expected Status                   | Expected Result                                         |                        Priority                         | Result |
| :-: | :------: | :---------------------------- | :---------------------------------------------------- | :-------------------------------------------------: | :------------------------------------------------------ | :-----------------------------------------------------: | :----: | --- |
|  9  | Abnormal | `page` sai kiểu (string)      | `{ "pagination": { "page": "abc", "pageSize": 20 } }` |                         400                         | `errors[].field = "pagination.page"`, `MSG_ERR_TYPE`    |                          High                           |   ⬜   |
| 10  | Abnormal | `page` = 0                    | `{ "pagination": { "page": 0, "pageSize": 20 } }`     |                         400                         | `errors[].field = "pagination.page"`, `MSG_ERR_MIN`     |                          High                           |   ⬜   |
| 11  | Abnormal | `page` âm                     | `{ "pagination": { "page": -1, "pageSize": 20 } }`    |                         400                         | `errors[].field = "pagination.page"`, `MSG_ERR_MIN`     |                         Medium                          |   ⬜   |
| 12  | Abnormal | `pageSize` = 0                | `{ "pagination": { "page": 1, "pageSize": 0 } }`      |                         400                         | `errors[].field = "pagination.pageSize"`, `MSG_ERR_MIN` |                          High                           |   ⬜   |
| 13  | Boundary | `pageSize` = 100 (max)        | `{ "pagination": { "page": 1, "pageSize": 100 } }`    |                         200                         | Trả về max 100 items                                    |                         Medium                          |   ⬜   |
| 14  | Boundary | `pageSize` = 101 (exceed max) | `{ "pagination": { "page": 1, "pageSize": 101 } }`    |                         400                         | `errors[].field = "pagination.pageSize"`, `MSG_ERR_MAX` |                         Medium                          |   ⬜   |
| 15  | Boundary | `page` vượt quá tổng số trang | Có 50 records, pageSize=20                            | `{ "pagination": { "page": 999, "pageSize": 20 } }` | 200                                                     | `data.items = []`, pagination vẫn trả đúng totalRecords | Medium | ⬜  |

### 3.3. Abnormal Cases — Sort

| No. | Category | Test Case                | Input                                                                            | Expected Status | Expected Result | Priority | Result |
| :-: | :------: | :----------------------- | :------------------------------------------------------------------------------- | :-------------: | :-------------- | :------: | :----: |
| 16  | Abnormal | `sortBy` không hợp lệ    | `{ "sortConditions": [{ "sortBy": "invalidColumn", "sortOrder": "asc" }], ... }` |       400       | Lỗi validation  |  Medium  |   ⬜   |
| 17  | Abnormal | `sortOrder` không hợp lệ | `{ "sortConditions": [{ "sortBy": "productName", "sortOrder": "xyz" }], ... }`   |       400       | Lỗi validation  |  Medium  |   ⬜   |

---

## 4. Ví dụ: Test Case Màn hình (Frontend)

**Màn hình:** Danh sách sản phẩm (ProductListView) | No. | Category | Test Case | Thao tác | Expected Result | Priority | Result | |:--:|:--:|:--|:--|:--|:--:|:--:| | 1 | Normal | Hiển thị danh sách khi vào trang | Mở trang `/products` | Danh sách hiển thị, pagination hiển thị đúng | High | ⬜ | | 2 | Normal | Tìm kiếm theo tên | Nhập "Arabica" → click Tìm kiếm | Danh sách filter, page reset về 1 | High | ⬜ | | 3 | Normal | Sort theo cột | Click header "Tên SP" | Icon ▲ hiển thị, danh sách sắp xếp A→Z, page reset về 1 | High | ⬜ | | 4 | Normal | Click sort lần 2 | Click header "Tên SP" lần nữa | Icon đổi thành ▼, sắp xếp Z→A | Medium | ⬜ | | 5 | Normal | Chuyển trang | Click "Sau" | Trang 2 hiển thị, searchConditions giữ nguyên | High | ⬜ | | 6 | Normal | Thay đổi pageSize | Chọn 50 từ dropdown | Page reset về 1, hiển thị max 50 items | High | ⬜ | | 7 | Normal | Loading state | Click Tìm kiếm | Hiển thị loading indicator, disable nút tìm kiếm | Medium | ⬜ | | 8 | Abnormal | Không có kết quả | Tìm kiếm "XYZNOTEXIST" | Hiển thị "Không có dữ liệu" | Medium | ⬜ | | 9 | Abnormal | API trả lỗi 500 | Server lỗi | Chuyển hướng đến trang lỗi ErrorPage | High | ⬜ | | 10 | Abnormal | Mất kết nối mạng | Ngắt mạng → click tìm kiếm | Hiển thị toast "Lỗi kết nối mạng" | Medium | ⬜ | | 11 | Boundary | Trang đầu tiên | Đang ở trang 1 | Nút "Trước" bị disable | Medium | ⬜ | | 12 | Boundary | Trang cuối cùng | Đang ở trang cuối | Nút "Sau" bị disable | Medium | ⬜ | | 13 | Abnormal | Không có quyền truy cập | Đăng nhập với role không có quyền | Chuyển hướng đến trang lỗi 403 | High | ⬜ |

---

## 5. Quy tắc viết Test Case

1. **Mỗi test case chỉ kiểm tra 1 điều kiện.** Không gộp nhiều scenario vào 1 case.
2. **Ưu tiên Abnormal > Normal.** Abnormal cases phát hiện bug nhiều hơn.
3. **Luôn có Boundary cases** cho các trường có min/max length/value.
4. **Test Case phải độc lập.** Kết quả test case A không ảnh hưởng test case B.
5. **Input cụ thể**, không viết chung chung "dữ liệu hợp lệ" mà liệt kê giá trị cụ thể.
6. **Expected Result rõ ràng**, có thể verify được (status code, message code, data cụ thể).
