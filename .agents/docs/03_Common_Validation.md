# Cơ chế Validation Chung

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

## 1. Tổng quan

Tài liệu này định nghĩa cơ chế validation chung áp dụng cho **tất cả API** trong hệ thống. Mục tiêu:

- Tái sử dụng logic validation (DRY principle).
- Trả lỗi theo chuẩn `400 Bad Request` đã định nghĩa tại `02_API_Error_Handling.md`.
- Validation chạy tại **2 tầng**: FE (UX nhanh) và BE (bảo mật, đáng tin cậy).

---

## 2. Thứ tự thực hiện Validation ở Backend

```
Request → [1. Common Validation Middleware] → [2. Business Validation in Service] → Process
```

1. **Common Validation (Middleware):** Kiểm tra các quy tắc chung (pagination, kiểu dữ liệu, path variable, file upload). Chạy trước khi vào controller.
2. **Business Validation (Service):** Kiểm tra nghiệp vụ cụ thể từng API. Chạy trong service layer.

---

## 3. Quy tắc Validation Chung

### 3.1. Validation Pagination

Áp dụng cho mọi API có phân trang. | Trường | Kiểu | Bắt buộc | Default | Quy tắc | Mã lỗi | |:--|:--|:--:|:--:|:--|:--| | `pagination.page` | Integer | ● | `1` | 1. Phải là số nguyên<br>2. Phải ≥ 1 | 1. `MSG_ERR_TYPE` → `{field}` phải là `{type}`<br>2. `MSG_ERR_MIN` → `{field}` phải ≥ 1 | | `pagination.pageSize` | Integer | ● | `20` | 1. Phải là số nguyên<br>2. Phải ≥ 1<br>3. Tối đa 100 | 1. `MSG_ERR_TYPE`<br>2. `MSG_ERR_MIN`<br>3. `MSG_ERR_MAX` → `{field}` tối đa `{max}` |

### 3.2. Validation File Upload

| Quy tắc                      |  Giới hạn  | Mã lỗi               | Nội dung                          |
| :--------------------------- | :--------: | :------------------- | :-------------------------------- |
| Số lượng file / lần upload   |     10     | `MSG_ERR_FILE_COUNT` | Tối đa {0} file mỗi lần upload.   |
| Tổng dung lượng / lần upload |    50MB    | `MSG_ERR_FILE_SIZE`  | Tổng dung lượng tối đa {0}.       |
| Định dạng file cho phép      | (theo API) | `MSG_ERR_FILE_TYPE`  | Định dạng file không được hỗ trợ. |

### 3.3. Validation Path Variable

Kiểm tra tính hợp lệ của các ID trên URL (VD: `/api/products/:id`). | Quy tắc | HTTP Status | Mã lỗi | |:--|:--:|:--| | Path variable null hoặc resource không tồn tại | 404 | `MSG_ERR_NOT_FOUND` | | Path variable sai định dạng (VD: chờ UUID nhưng nhận "abc") | 400 | `MSG_ERR_TYPE` |

### 3.4. Validation Kiểu dữ liệu

Áp dụng cho tất cả các trường **không phải String**. | Quy tắc | Mã lỗi | Nội dung | |:--|:--|:--| | Sai kiểu dữ liệu so với định nghĩa API | `MSG_ERR_TYPE` | `{field}` phải là kiểu `{expectedType}`. |

---

## 4. Quy tắc Validation Nghiệp vụ phổ biến

Các quy tắc này áp dụng trong Service layer, tùy theo từng API. | Mã lỗi | Quy tắc | Nội dung | Ví dụ | |:--|:--|:--|:--| | `MSG_ERR_REQUIRED` | Trường bắt buộc bị thiếu | `{field}` là bắt buộc. | Tên sản phẩm | | `MSG_ERR_MAX_LENGTH` | Vượt quá độ dài tối đa | `{field}` tối đa `{max}` ký tự. | Ghi chú max 500 | | `MSG_ERR_MIN_LENGTH` | Dưới độ dài tối thiểu | `{field}` tối thiểu `{min}` ký tự. | Mật khẩu min 8 | | `MSG_ERR_MIN` | Giá trị quá nhỏ | `{field}` phải ≥ `{min}`. | Số lượng ≥ 1 | | `MSG_ERR_MAX` | Giá trị quá lớn | `{field}` phải ≤ `{max}`. | Giá ≤ 999,999,999 | | `MSG_ERR_FORMAT` | Sai định dạng | `{field}` không đúng định dạng. | Email, số điện thoại | | `MSG_ERR_UNIQUE` | Giá trị đã tồn tại | `{field}` đã tồn tại trong hệ thống. | Mã sản phẩm trùng | | `MSG_ERR_DATE_RANGE` | Ngày bắt đầu > ngày kết thúc | Ngày bắt đầu phải trước ngày kết thúc. | Lọc theo khoảng ngày | | `MSG_ERR_ENUM` | Giá trị nằm ngoài tập cho phép | `{field}` không hợp lệ. | Trạng thái đơn hàng |

---

## 5. Triển khai Backend (Node.js)

### 5.1. Validation Middleware với Joi

```javascript
// src/middlewares/validate.js
const Joi = require("joi");
const { ValidationError } = require("../exceptions");
// Schema pagination chung — tái sử dụng cho mọi API có phân trang
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
});
// Middleware factory: nhận schema, trả về middleware
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false, // Thu thập tất cả lỗi
    stripUnknown: true, // Bỏ các trường không khai báo
  });
  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join("."),
      messageCode: mapJoiTypeToCode(detail.type),
      message: detail.message,
    }));
    throw new ValidationError(errors);
  }
  req.body = value; // Gán giá trị đã validate + default
  next();
};
const mapJoiTypeToCode = (joiType) => {
  const map = {
    "any.required": "MSG_ERR_REQUIRED",
    "string.empty": "MSG_ERR_REQUIRED",
    "string.max": "MSG_ERR_MAX_LENGTH",
    "string.min": "MSG_ERR_MIN_LENGTH",
    "number.min": "MSG_ERR_MIN",
    "number.max": "MSG_ERR_MAX",
    "number.integer": "MSG_ERR_TYPE",
    "string.email": "MSG_ERR_FORMAT",
  };
  return map[joiType] || "MSG_ERR_VALIDATION";
};
module.exports = { validate, paginationSchema };
```

### 5.2. Ví dụ: Schema cho API tìm kiếm sản phẩm

```javascript
// src/validations/product.validation.js
const Joi = require("joi");
const { paginationSchema } = require("../middlewares/validate");
const searchProductSchema = Joi.object({
  searchConditions: Joi.object({
    productName: Joi.string().allow("").max(100),
    origin: Joi.string().allow("").max(50),
    status: Joi.string().valid("active", "inactive", ""),
  }).default({}),
  sortConditions: Joi.array()
    .items(
      Joi.object({
        sortBy: Joi.string().valid(
          "productName",
          "price",
          "origin",
          "createdAt",
        ),
        sortOrder: Joi.string().valid("asc", "desc").default("asc"),
      }),
    )
    .default([]),
  pagination: paginationSchema.default(),
});
module.exports = { searchProductSchema };
```

### 5.3. Áp dụng trong Router

```javascript
// src/routes/product.routes.js
const router = require("express").Router();
const { validate } = require("../middlewares/validate");
const { searchProductSchema } = require("../validations/product.validation");
const productController = require("../controllers/product.controller");
router.post(
  "/products/search",
  validate(searchProductSchema),
  productController.search,
);
```

---

## 6. Triển khai Frontend (Vue.js)

### 6.1. Composable Validation

```javascript
// src/composables/useValidation.js
import { ref } from "vue";
export function useValidation() {
  const fieldErrors = ref({});
  const clearErrors = () => {
    fieldErrors.value = {};
  };
  const setErrors = (errors) => {
    clearErrors();
    errors.forEach((e) => {
      fieldErrors.value[e.field] = e.message;
    });
  };
  const rules = {
    required: (value, fieldName) =>
      !value ? `${fieldName} là bắt buộc.` : null,
    maxLength: (value, fieldName, max) =>
      value && value.length > max ? `${fieldName} tối đa ${max} ký tự.` : null,
    minValue: (value, fieldName, min) =>
      value < min ? `${fieldName} phải ≥ ${min}.` : null,
    email: (value) =>
      value && !/^[^s@]+@[^s@]+.[^s@]+$/.test(value)
        ? "Email không đúng định dạng."
        : null,
  };
  return { fieldErrors, clearErrors, setErrors, rules };
}
```

### 6.2. Sử dụng trong Component

```vue
<script setup>
import { ref } from "vue";
import { useValidation } from "@/composables/useValidation";
import { createProduct } from "@/api/product";
const form = ref({ name: "", price: 0, origin: "" });
const { fieldErrors, clearErrors, setErrors, rules } = useValidation();
const validateForm = () => {
  clearErrors();
  const errors = [];
  const nameErr = rules.required(form.value.name, "Tên sản phẩm");
  if (nameErr) errors.push({ field: "name", message: nameErr });
  const priceErr = rules.minValue(form.value.price, "Giá", 1);
  if (priceErr) errors.push({ field: "price", message: priceErr });
  if (errors.length > 0) {
    setErrors(errors);
    return false;
  }
  return true;
};
const handleSubmit = async () => {
  if (!validateForm()) return;
  try {
    await createProduct(form.value);
  } catch (err) {
    if (err.errors) setErrors(err.errors); // Lỗi từ server
  }
};
</script>
```
