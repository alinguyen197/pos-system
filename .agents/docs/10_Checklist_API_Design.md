# Checklist Thiết kế API

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

## Dùng khi **thiết kế API mới** hoặc **review tài liệu thiết kế API**. Đảm bảo API tuân thủ chuẩn hệ thống trước khi bắt đầu coding.

## 1. Endpoint Design

|  #  | Mục kiểm tra                                                                                                      |  ✓  |
| :-: | :---------------------------------------------------------------------------------------------------------------- | :-: |
| A01 | URL dùng danh từ số nhiều, kebab-case? (`/api/products`, `/api/order-items`)                                      |  ☐  |
| A02 | HTTP method đúng ngữ nghĩa? (GET=đọc, POST=tạo/search, PUT=cập nhật toàn bộ, PATCH=cập nhật một phần, DELETE=xóa) |  ☐  |
| A03 | API search dùng `POST` (vì request body phức tạp)?                                                                |  ☐  |
| A04 | URL không chứa động từ? (`/api/products` thay vì `/api/getProducts`)                                              |  ☐  |
| A05 | Nested resource hợp lý? (`/api/orders/:orderId/items` thay vì `/api/order-items?orderId=x`)                       |  ☐  |
| A06 | Versioning nếu cần? (`/api/v1/products`)                                                                          |  ☐  |

## 2. Request Design

|  #  | Mục kiểm tra                                                                    |  ✓  |
| :-: | :------------------------------------------------------------------------------ | :-: |
| A07 | Tham số request có tên rõ ràng, camelCase?                                      |  ☐  |
| A08 | Kiểu dữ liệu mỗi tham số được định nghĩa?                                       |  ☐  |
| A09 | Trường bắt buộc vs tùy chọn được đánh dấu rõ?                                   |  ☐  |
| A10 | Giá trị default được ghi rõ cho trường tùy chọn?                                |  ☐  |
| A11 | API danh sách có cấu trúc `searchConditions` + `sortConditions` + `pagination`? |  ☐  |
| A12 | Enum values được liệt kê đầy đủ?                                                |  ☐  |
| A13 | Max length cho trường String được định nghĩa?                                   |  ☐  |

## 3. Response Design

|  #  | Mục kiểm tra                                                           |  ✓  |
| :-: | :--------------------------------------------------------------------- | :-: |
| A14 | Response 200 đúng cấu trúc `{ success, code, message, data }`?         |  ☐  |
| A15 | Response danh sách có `data.items[]` + `data.pagination`?              |  ☐  |
| A16 | Response 400 có `errors[]` với `field`, `messageCode`, `message`?      |  ☐  |
| A17 | Các status code khác (401, 403, 404, 409, 500) ghi rõ body rỗng?       |  ☐  |
| A18 | Tất cả trường response có tên + kiểu dữ liệu + mô tả?                  |  ☐  |
| A19 | Không trả thông tin nhạy cảm (password, token, internal ID không cần)? |  ☐  |

## 4. Validation Design

|  #  | Mục kiểm tra                                                            |  ✓  |
| :-: | :---------------------------------------------------------------------- | :-: |
| A20 | Mỗi trường input có bảng quy tắc validation?                            |  ☐  |
| A21 | Mỗi quy tắc validation có message code + nội dung message?              |  ☐  |
| A22 | Validation pagination dùng common check?                                |  ☐  |
| A23 | Path variable có validation (tồn tại, đúng format)?                     |  ☐  |
| A24 | Business validation được mô tả (unique, date range, status transition)? |  ☐  |

## 5. Error Scenarios

|  #  | Mục kiểm tra                                    |  ✓  |
| :-: | :---------------------------------------------- | :-: |
| A25 | Liệt kê đầy đủ các kịch bản lỗi có thể xảy ra?  |  ☐  |
| A26 | Mỗi kịch bản lỗi có HTTP status code tương ứng? |  ☐  |
| A27 | Mỗi kịch bản lỗi có message code?               |  ☐  |
| A28 | Xử lý conflict (409) cho các API update/delete? |  ☐  |
| A29 | Xử lý trường hợp resource not found (404)?      |  ☐  |

## 6. Auth & Permission

|  #  | Mục kiểm tra                                                           |  ✓  |
| :-: | :--------------------------------------------------------------------- | :-: |
| A30 | API yêu cầu xác thực (token)?                                          |  ☐  |
| A31 | Roles được phép gọi API được liệt kê?                                  |  ☐  |
| A32 | Phân biệt data scope theo role? (VD: staff chỉ thấy đơn hàng của mình) |  ☐  |

## 7. Performance

|  #  | Mục kiểm tra                                          |  ✓  |
| :-: | :---------------------------------------------------- | :-: |
| A33 | API danh sách có pagination (không trả toàn bộ data)? |  ☐  |
| A34 | Chỉ trả về các trường cần thiết (không SELECT \*)?    |  ☐  |
| A35 | Có index cho cột thường filter/sort?                  |  ☐  |
| A36 | N+1 query problem được xử lý (dùng include/join)?     |  ☐  |
