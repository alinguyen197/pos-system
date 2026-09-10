# Chính sách Xử lý Lỗi API

| Hạng mục  | Nội dung                       |
| :-------- | :----------------------------- |
| Hệ thống  | Coffee Trade Management System |
| Phiên bản | 1.0                            |
| Ngày tạo  | 2026-08-26                     |

### Lịch sử phiên bản

| Ver | Ngày       | Nội dung thay đổi | Người thực hiện |
| :-: | :--------- | :---------------- | :-------------- |
| 1.0 | 2026-08-26 | Tạo mới           | KhoaNA15        |
| 1.1 | 2026-09-07 | Chuẩn hóa luồng 401 đá về Login, bổ sung mục 6: Luồng Xử lý Lỗi & Thành công (End-to-End Execution Flow), Sequence Diagrams và bảng phân luồng chi tiết | Antigravity     |

---

## 1. Tổng quan

Tài liệu này chuẩn hóa cách **Backend throw lỗi** và **Frontend xử lý lỗi** trên toàn hệ thống. Mục tiêu:

- Phân định rõ trách nhiệm BE vs FE.
- Đảm bảo UX nhất quán khi xảy ra lỗi.
- Tập trung hóa logic xử lý lỗi ở cả 2 phía.

---

## 2. Phân loại lỗi

| Loại             | HTTP Status | Hành vi FE                    | Ví dụ                      |
| :--------------- | :---------: | :---------------------------- | :------------------------- |
| Validation Error |     400     | Hiển thị lỗi tại chỗ (inline)    | Thiếu tên sản phẩm, giá âm |
| Auth Error       |     401     | Xóa session & Redirect → /login  | Token hết hạn              |
| Permission Error |     403     | Redirect → trang lỗi             | Không có quyền xóa         |
| Not Found        |     404     | Redirect → trang lỗi          | Resource không tồn tại     |
| Timeout          |     408     | Redirect → trang lỗi          | API không phản hồi         |
| Conflict         |     409     | Dialog cảnh báo               | Dữ liệu bị người khác sửa  |
| System Error     |     500     | Redirect → trang lỗi          | Lỗi DB, bug logic          |
| Maintenance      |     503     | Redirect → trang lỗi          | Hệ thống bảo trì           |
| Network Error    |      -      | Toast thông báo               | Mất kết nối mạng           |

---

## 3. Trách nhiệm Backend (Node.js)

### 3.1. Custom Exception Classes

Tạo file `src/exceptions/index.js`:

```javascript
class AppError extends Error {
  constructor(statusCode, message, code = "") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}
class ValidationError extends AppError {
  constructor(errors = [], message = "Dữ liệu không hợp lệ.") {
    super(400, message, "MSG_ERR_VALIDATION");
    this.errors = errors; // [{ field, messageCode, message }]
  }
}
class UnauthorizedError extends AppError {
  constructor() {
    super(401, "Unauthorized");
  }
}
class ForbiddenError extends AppError {
  constructor() {
    super(403, "Forbidden");
  }
}
class NotFoundError extends AppError {
  constructor() {
    super(404, "Not Found");
  }
}
class ConflictError extends AppError {
  constructor() {
    super(409, "Conflict");
  }
}
module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};
```

### 3.2. Global Error Handler Middleware

Tạo file `src/middlewares/errorHandler.js`:

```javascript
const { AppError, ValidationError } = require("../exceptions");
const logger = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
  // Log tất cả lỗi ra server log
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
  });
  // Lỗi Validation → trả body chi tiết
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      code: err.code,
      message: err.message,
      errors: err.errors,
    });
  }
  // Lỗi nghiệp vụ đã biết → trả status code, body rỗng
  if (err instanceof AppError) {
    return res.status(err.statusCode).end();
  }
  // Lỗi không xác định → 500, body rỗng
  return res.status(500).end();
};
module.exports = errorHandler;
```

### 3.3. Sử dụng trong Service/Controller

```javascript
const {
  ValidationError,
  NotFoundError,
  ConflictError,
} = require("../exceptions");
const updateProduct = async (id, data) => {
  // Kiểm tra resource tồn tại
  const product = await Product.findByPk(id);
  if (!product) {
    throw new NotFoundError();
  }
  // Kiểm tra conflict (optimistic locking)
  if (product.updatedAt.getTime() !== new Date(data.updatedAt).getTime()) {
    throw new ConflictError();
  }
  // Validation nghiệp vụ
  const errors = [];
  if (!data.name) {
    errors.push({
      field: "name",
      messageCode: "MSG_ERR_REQUIRED",
      message: "Tên sản phẩm là bắt buộc.",
    });
  }
  if (data.price <= 0) {
    errors.push({
      field: "price",
      messageCode: "MSG_ERR_MIN_VALUE",
      message: "Giá phải lớn hơn 0.",
    });
  }
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
  return Product.update(data, { where: { id } });
};
```

---

## 4. Trách nhiệm Frontend (Vue.js)

### 4.1. Error Interceptor (Xem chi tiết tại `01_API_Response_Standard.md`)

Toàn bộ logic xử lý lỗi API được đóng gói trong Axios interceptor.

### 4.2. Xử lý lỗi 400 trong Component

```vue
<script setup>
import { ref } from "vue";
import { createProduct } from "@/api/product";
const form = ref({ name: "", price: 0 });
const fieldErrors = ref({});
const handleSubmit = async () => {
  fieldErrors.value = {};
  try {
    await createProduct(form.value);
    // Thành công → chuyển trang hoặc thông báo
  } catch (err) {
    if (err.errors) {
      // Map lỗi validation vào từng trường
      err.errors.forEach((e) => {
        fieldErrors.value[e.field] = e.message;
      });
    }
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <label>Tên sản phẩm</label> <input v-model="form.name" />
      <span class="error" v-if="fieldErrors.name">{{ fieldErrors.name }}</span>
    </div>

    <div>
      <label>Giá</label> <input v-model.number="form.price" type="number" />
      <span class="error" v-if="fieldErrors.price">{{
        fieldErrors.price
      }}</span>
    </div>
    <button type="submit">Lưu</button>
  </form>
</template>
```

### 4.3. Trang lỗi chung (ErrorPage)

```vue
<!-- src/views/ErrorPage.vue -->

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
const route = useRoute();
const errorMap = {
  MSG_ERR_COM_00901: {
    title: "Lỗi hệ thống",
    message: "Đã xảy ra lỗi. Vui lòng liên hệ quản trị viên.",
  },
  MSG_ERR_COM_00902: {
    title: "Phiên hết hạn",
    message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  },
  MSG_ERR_COM_00903: {
    title: "Không có quyền",
    message: "Bạn không có quyền thực hiện thao tác này.",
  },
  MSG_ERR_COM_00904: {
    title: "Không tìm thấy",
    message: "Tài nguyên yêu cầu không tồn tại.",
  },
  MSG_ERR_COM_00905: {
    title: "Hết thời gian",
    message: "Yêu cầu đã hết thời gian chờ. Vui lòng thử lại.",
  },
  MSG_ERR_COM_00907: {
    title: "Bảo trì",
    message: "Hệ thống đang bảo trì. Vui lòng quay lại sau.",
  },
};
const errorInfo = computed(() => {
  return errorMap[route.query.code] || errorMap["MSG_ERR_COM_00901"];
});
</script>

<template>
  <div class="error-page">
    <h1>{{ errorInfo.title }}</h1>

    <p>{{ errorInfo.message }}</p>
    <router-link to="/">Về trang chủ</router-link>
  </div>
</template>
```

---

## 5. Bảng Message Code

| No  | Message Code        | Loại  | Nội dung                                                         | HTTP Status |
| :-: | :------------------ | :---- | :--------------------------------------------------------------- | :---------: |
|  1  | `MSG_ERR_COM_00901` | Error | Đã xảy ra lỗi hệ thống. Vui lòng liên hệ quản trị viên.          |     500     |
|  2  | `MSG_ERR_COM_00902` | Error | Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.                 |     401     |
|  3  | `MSG_ERR_COM_00903` | Error | Bạn không có quyền thực hiện thao tác này.                       |     403     |
|  4  | `MSG_ERR_COM_00904` | Error | Tài nguyên yêu cầu không tồn tại.                                |     404     |
|  5  | `MSG_ERR_COM_00905` | Error | Yêu cầu đã hết thời gian chờ.                                    |     408     |
|  6  | `MSG_ERR_COM_00906` | Error | Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại trang. |     409     |
|  7  | `MSG_ERR_COM_00907` | Error | Hệ thống đang bảo trì. Vui lòng quay lại sau.                    |     503     |
|  8  | `MSG_ERR_NETWORK`   | Error | Lỗi kết nối mạng. Vui lòng kiểm tra lại.                         |      -      |
