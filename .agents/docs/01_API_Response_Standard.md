# Chuẩn hóa API Response

| Hạng mục   | Nội dung                                      |
| :--------- | :-------------------------------------------- |
| Hệ thống   | Coffee Trade Management System                |
| Phiên bản  | 1.0                                           |
| Ngày tạo   | 2026-08-26                                    |
| Tech Stack | Backend: Node.js (Express) / Frontend: Vue.js |

### Lịch sử phiên bản

| Ver | Ngày       | Nội dung thay đổi | Người thực hiện |
| :-: | :--------- | :---------------- | :-------------- |
| 1.0 | 2026-08-26 | Tạo mới           | KhoaNA15        |

---

## 1. Tổng quan

## Tài liệu này định nghĩa cấu trúc chuẩn cho **tất cả** response từ API. Mọi developer phải tuân thủ để đảm bảo tính nhất quán trên toàn hệ thống.

## 2. Cấu trúc Response thành công (`200 OK`)

| Trường    | Kiểu dữ liệu          | Bắt buộc | Mô tả                                                 |
| :-------- | :-------------------- | :------: | :---------------------------------------------------- |
| `success` | Boolean               |    ●     | Luôn là `true` khi thành công                         |
| `code`    | String                |    ●     | Mã message code (VD: `MSG_SUC_001`)                   |
| `message` | String                |    ●     | Nội dung thông báo                                    |
| `data`    | Object / Array / null |    ●     | Dữ liệu nghiệp vụ. `null` nếu không có dữ liệu trả về |

```json
{
  "success": true,
  "code": "MSG_SUC_001",
  "message": "Thao tác thành công.",
  "data": {
    "id": "abc-123",
    "name": "Cà phê Robusta"
  }
}
```

### 2.1. Response danh sách có phân trang

Khi API trả về danh sách có phân trang, trường `data` sẽ bao gồm cả thông tin pagination. | Trường | Kiểu dữ liệu | Mô tả | |:--|:--|:--| | `data.items` | Array | Mảng chứa các bản ghi | | `data.pagination.page` | Integer | Trang hiện tại | | `data.pagination.pageSize` | Integer | Số bản ghi mỗi trang | | `data.pagination.totalRecords` | Integer | Tổng số bản ghi | | `data.pagination.totalPages` | Integer | Tổng số trang |

```json
{
  "success": true,
  "code": "",
  "message": "",
  "data": {
    "items": [
      { "id": 1, "name": "Cà phê Arabica", "origin": "Brazil" },
      { "id": 2, "name": "Cà phê Robusta", "origin": "Vietnam" }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalRecords": 150,
      "totalPages": 8
    }
  }
}
```

---

## 3. Cấu trúc Response lỗi Validation (`400 Bad Request`)

Đây là trường hợp **duy nhất** API trả về body chứa chi tiết lỗi. | Trường | Kiểu dữ liệu | Bắt buộc | Mô tả | |:--|:--|:--:|:--| | `success` | Boolean | ● | Luôn là `false` | | `code` | String | ● | Mã lỗi chung | | `message` | String | ● | Thông báo lỗi chung | | `errors` | Array of Objects | | Danh sách lỗi chi tiết theo từng trường | | `errors[].field` | String | ✓ | Tên trường bị lỗi | | `errors[].messageCode` | String | ✓ | Mã lỗi cụ thể | | `errors[].message` | String | ✓ | Nội dung lỗi cụ thể |

```json
{
  "success": false,
  "code": "MSG_ERR_VALIDATION",
  "message": "Dữ liệu không hợp lệ.",
  "errors": [
    {
      "field": "productName",
      "messageCode": "MSG_ERR_REQUIRED",
      "message": "Tên sản phẩm là bắt buộc."
    },
    {
      "field": "price",
      "messageCode": "MSG_ERR_MIN",
      "message": "Giá phải lớn hơn 0."
    }
  ]
}
```

---

## 4. Các lỗi khác — Body rỗng

Tất cả các mã lỗi khác `400` **phải trả về body rỗng**. Client chỉ dựa vào HTTP Status Code để xử lý. | HTTP Status | Tên | Khi nào xảy ra | |:--|:--|:--| | 401 | Unauthorized | Token không hợp lệ / hết hạn / thiếu | | 403 | Forbidden | Không có quyền thực hiện chức năng | | 404 | Not Found | Resource không tồn tại | | 408 | Request Timeout | API không phản hồi trong thời gian quy định | | 409 | Conflict | Xung đột dữ liệu (optimistic lock) | | 429 | Too Many Requests | Vượt giới hạn rate limit | | 500 | Internal Server Error | Lỗi hệ thống không xác định | | 503 | Service Unavailable | Hệ thống bảo trì | > **Ngoại lệ:** `429 Too Many Requests` trả về body `{ success: false, code, message }` để client hiển thị thông báo rate limit.

---

## 5. Triển khai phía Backend (Node.js)

### 5.1. Response Helper

Tạo file `src/helpers/response.helper.js`:

```javascript
// Trả về response thành công
const success = (res, { data = null, code = "", message = "" } = {}) => {
  return res.status(200).json({
    success: true,
    code,
    message,
    data,
  });
};
// Trả về response lỗi validation
const validationError = (
  res,
  {
    code = "MSG_ERR_VALIDATION",
    message = "Dữ liệu không hợp lệ.",
    errors = [],
  } = {},
) => {
  return res.status(400).json({
    success: false,
    code,
    message,
    errors,
  });
};
// Trả về các lỗi khác (body rỗng)
const error = (res, statusCode) => {
  return res.status(statusCode).end();
};
module.exports = { success, validationError, error };
```

### 5.2. Ví dụ sử dụng trong Controller

```javascript
const {
  success,
  validationError,
  error,
} = require("../helpers/response.helper");
// GET /api/products — dùng kết quả từ service (đã format sẵn bởi query.helper)
const getProducts = async (req, res, next) => {
  try {
    const result = await productService.search(req.body);
    return success(res, { data: result });
  } catch (err) {
    next(err);
  }
};
```

---

## 6. Triển khai phía Frontend (Vue.js)

### 6.1. Axios Response Interceptor

```javascript
import axios from "axios";
import router from "@/router";
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});
apiClient.interceptors.response.use(
  (response) => response.data, // unwrap, trả về { success, code, message, data }
  (error) => {
    if (!error.response) {
      // Network Error
      showToast("Lỗi kết nối mạng. Vui lòng kiểm tra lại.");
      return Promise.reject(error);
    }
    const status = error.response.status;
    if (status === 400) {
      // Trả về error data để component tự xử lý hiển thị lỗi tại chỗ
      return Promise.reject(error.response.data);
    }
    if (status === 409) {
      // Hiển thị dialog conflict với message code chuẩn
      showDialog({
        code: "MSG_ERR_COM_00906",
        message:
          "Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại trang.",
      });
      return Promise.reject(error);
    }
    if (status === 429) {
      // Hiển thị toast rate limit
      showToast(
        error.response.data?.message ||
          "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
      );
      return Promise.reject(error);
    }
    // 401, 403, 404, 408, 500, 503 → chuyển hướng màn hình lỗi
    const errorMessages = {
      401: {
        code: "MSG_ERR_COM_00902",
        message: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.",
      },
      403: {
        code: "MSG_ERR_COM_00903",
        message: "Bạn không có quyền thực hiện thao tác này.",
      },
      404: {
        code: "MSG_ERR_COM_00904",
        message: "Không tìm thấy tài nguyên yêu cầu.",
      },
      408: {
        code: "MSG_ERR_COM_00905",
        message: "Yêu cầu đã hết thời gian chờ.",
      },
      500: {
        code: "MSG_ERR_COM_00901",
        message: "Lỗi hệ thống. Vui lòng liên hệ quản trị viên.",
      },
      503: { code: "MSG_ERR_COM_00907", message: "Hệ thống đang bảo trì." },
    };
    const errInfo = errorMessages[status] || errorMessages[500];
    router.push({ name: "ErrorPage", query: { code: errInfo.code } });
    return Promise.reject(error);
  },
);
export default apiClient;
```
