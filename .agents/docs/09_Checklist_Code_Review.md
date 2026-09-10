# Checklist Review Code

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

## Cách sử dụng

- **Developer** tự review trước khi tạo PR (Self-Review).
- **Reviewer** dùng khi review PR.
- Đánh dấu `[x]` cho mỗi mục đã kiểm tra. Nếu không áp dụng → ghi `[N/A]`.

---

## 1. Checklist Backend (Node.js)

### 1.1. Cấu trúc & Phân tầng

|  #  | Mục kiểm tra                                                                  |  ✓  |
| :-: | :---------------------------------------------------------------------------- | :-: |
| B01 | Code đặt đúng tầng? (Route → Controller → Service → Model)                    |  ☐  |
| B02 | Controller KHÔNG chứa logic nghiệp vụ, chỉ gọi service và trả response?       |  ☐  |
| B03 | Service KHÔNG truy cập `req`, `res`?                                          |  ☐  |
| B04 | Model KHÔNG chứa logic nghiệp vụ?                                             |  ☐  |
| B05 | File đặt đúng folder theo convention? (services/, controllers/, routes/, ...) |  ☐  |

### 1.2. API Response

|  #  | Mục kiểm tra                                                                           |  ✓  |
| :-: | :------------------------------------------------------------------------------------- | :-: |
| B06 | Response thành công sử dụng helper `success(res, { data })`?                           |  ☐  |
| B07 | Response lỗi validation trả `400` với cấu trúc `{ success, code, message, errors[] }`? |  ☐  |
| B08 | Các lỗi khác (401, 403, 404, 409, 500) trả body rỗng?                                  |  ☐  |
| B09 | Danh sách có phân trang trả đúng cấu trúc `data.items` + `data.pagination`?            |  ☐  |

### 1.3. Validation

|  #  | Mục kiểm tra                                                   |  ✓  |
| :-: | :------------------------------------------------------------- | :-: |
| B10 | Có Joi schema cho tất cả input?                                |  ☐  |
| B11 | Pagination validate: `page` ≥ 1, `pageSize` ≥ 1 và ≤ 100?      |  ☐  |
| B12 | Path variable được validate trước khi query DB?                |  ☐  |
| B13 | File upload kiểm tra số lượng (≤ 10) và dung lượng (≤ 50MB)?   |  ☐  |
| B14 | Tất cả trường bắt buộc đã khai báo `.required()` trong schema? |  ☐  |

### 1.4. Error Handling

|  #  | Mục kiểm tra                                                                    |  ✓  |
| :-: | :------------------------------------------------------------------------------ | :-: |
| B15 | Controller có `try/catch` và gọi `next(err)`?                                   |  ☐  |
| B16 | Throw đúng exception class? (ValidationError, NotFoundError, ForbiddenError...) |  ☐  |
| B17 | KHÔNG có `res.status().json()` trực tiếp trong catch block?                     |  ☐  |
| B18 | Lỗi được log đầy đủ (message, stack, URL, method, userId)?                      |  ☐  |

### 1.5. Bảo mật

|  #  | Mục kiểm tra                                                 |  ✓  |
| :-: | :----------------------------------------------------------- | :-: |
| B19 | Route có gắn middleware `authenticate`?                      |  ☐  |
| B20 | Route có gắn middleware `authorize(roles)` phù hợp?          |  ☐  |
| B21 | KHÔNG có SQL injection (dùng ORM/parameterized query)?       |  ☐  |
| B22 | KHÔNG hardcode secret, password, API key?                    |  ☐  |
| B23 | KHÔNG log thông tin nhạy cảm (password, token, card number)? |  ☐  |
| B24 | Input user KHÔNG được dùng trực tiếp trong query/command?    |  ☐  |

### 1.6. Database

|  #  | Mục kiểm tra                                                                                       |  ✓  |
| :-: | :------------------------------------------------------------------------------------------------- | :-: |
| B25 | Tên bảng/cột đúng convention snake_case?                                                           |  ☐  |
| B26 | Có đủ 6 cột bắt buộc? (`id`, `created_at`, `created_by`, `updated_at`, `updated_by`, `is_deleted`) |  ☐  |
| B27 | Dùng soft delete (`is_deleted`), KHÔNG delete vật lý?                                              |  ☐  |
| B28 | Tiền tệ dùng `DECIMAL`, KHÔNG dùng `FLOAT`?                                                        |  ☐  |
| B29 | Migration có cả `up` và `down`?                                                                    |  ☐  |
| B30 | Foreign key có index?                                                                              |  ☐  |

### 1.7. Code Quality

|  #  | Mục kiểm tra                                                   |  ✓  |
| :-: | :------------------------------------------------------------- | :-: |
| B31 | Dùng `async/await`, KHÔNG dùng `.then().catch()`?              |  ☐  |
| B32 | KHÔNG có `console.log`? Dùng logger thay thế?                  |  ☐  |
| B33 | KHÔNG có code bị comment?                                      |  ☐  |
| B34 | KHÔNG có hardcode giá trị magic number/string? Dùng constants? |  ☐  |
| B35 | Tên biến/hàm tự mô tả, không viết tắt?                         |  ☐  |
| B36 | Hàm không quá 50 dòng? Nếu dài hơn đã tách?                    |  ☐  |
| B37 | Không duplicate logic đã có trong helper/service khác?         |  ☐  |

---

## 2. Checklist Frontend (Vue.js)

### 2.1. Cấu trúc Component

|  #  | Mục kiểm tra                                                                                           |  ✓  |
| :-: | :----------------------------------------------------------------------------------------------------- | :-: |
| F01 | Dùng `<script setup>` + Composition API?                                                               |  ☐  |
| F02 | Thứ tự trong `<script setup>`: imports → props/emits → state → computed → watch → methods → lifecycle? |  ☐  |
| F03 | `<style scoped>` cho tất cả component?                                                                 |  ☐  |
| F04 | File đặt đúng folder? (views/ cho page, components/ cho reusable)                                      |  ☐  |
| F05 | Component name đúng PascalCase? View có suffix `View`?                                                 |  ☐  |

### 2.2. API & State

|  #  | Mục kiểm tra                                                              |  ✓  |
| :-: | :------------------------------------------------------------------------ | :-: |
| F06 | Gọi API qua file trong `api/`, KHÔNG gọi axios trực tiếp trong component? |  ☐  |
| F07 | Xử lý lỗi 400: map `errors[]` vào từng trường hiển thị inline?            |  ☐  |
| F08 | Các lỗi khác đã được interceptor xử lý, component KHÔNG catch lại?        |  ☐  |
| F09 | Có loading state khi gọi API?                                             |  ☐  |
| F10 | Danh sách sử dụng composable `useListQuery`?                              |  ☐  |

### 2.3. Validation phía Client

|  #  | Mục kiểm tra                                           |  ✓  |
| :-: | :----------------------------------------------------- | :-: |
| F11 | Validate trước khi gọi API (required, format, length)? |  ☐  |
| F12 | Clear lỗi cũ trước khi validate lại?                   |  ☐  |
| F13 | Hiển thị lỗi inline ngay dưới trường input?            |  ☐  |
| F14 | Disable nút submit khi đang loading?                   |  ☐  |

### 2.4. Sort & Paging

|  #  | Mục kiểm tra                                        |  ✓  |
| :-: | :-------------------------------------------------- | :-: |
| F15 | Khi sort → reset `page = 1`?                        |  ☐  |
| F16 | Khi thay đổi `pageSize` → reset `page = 1`?         |  ☐  |
| F17 | Giữ nguyên `searchConditions` khi sort/paging?      |  ☐  |
| F18 | Hiển thị icon sort (▲/▼) trên header cột đang sort? |  ☐  |

### 2.5. Routing & Auth

|  #  | Mục kiểm tra                                          |  ✓  |
| :-: | :---------------------------------------------------- | :-: |
| F19 | Route có `meta.requiresAuth` cho trang cần đăng nhập? |  ☐  |
| F20 | Route có `meta.roles` phù hợp?                        |  ☐  |
| F21 | Ẩn/disable UI element theo role người dùng?           |  ☐  |
| F22 | Lazy load component với `() => import(...)`?          |  ☐  |

### 2.6. Code Quality

|  #  | Mục kiểm tra                                       |  ✓  |
| :-: | :------------------------------------------------- | :-: |
| F23 | KHÔNG có `console.log`?                            |  ☐  |
| F24 | KHÔNG có code bị comment?                          |  ☐  |
| F25 | Props có khai báo type + required/default?         |  ☐  |
| F26 | Emits có khai báo rõ ràng?                         |  ☐  |
| F27 | `v-for` có `:key` duy nhất?                        |  ☐  |
| F28 | KHÔNG dùng `v-if` + `v-for` trên cùng element?     |  ☐  |
| F29 | KHÔNG hardcode text? Dùng constants?               |  ☐  |
| F30 | Logic dùng ≥ 2 nơi đã trích xuất thành composable? |  ☐  |

---

## 3. Checklist chung (Cả BE và FE)

|  #  | Mục kiểm tra                                                       |  ✓  |
| :-: | :----------------------------------------------------------------- | :-: |
| G01 | ESLint pass (0 error, 0 warning)?                                  |  ☐  |
| G02 | Prettier format đúng?                                              |  ☐  |
| G03 | Branch name đúng convention? (`feature/CT-xxx-description`)        |  ☐  |
| G04 | Commit message đúng convention? (`feat:`, `fix:`, `refactor:` ...) |  ☐  |
| G05 | PR chỉ giải quyết 1 ticket/issue?                                  |  ☐  |
| G06 | Không thay đổi file không liên quan đến ticket?                    |  ☐  |
| G07 | Unit test đã viết cho logic mới?                                   |  ☐  |
| G08 | Test pass 100%?                                                    |  ☐  |
