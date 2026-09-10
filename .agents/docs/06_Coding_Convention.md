# Coding Convention

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

## 1. Quy tắc chung (Cả BE và FE)

### 1.1. Nguyên tắc cơ bản

- **Không hardcode** giá trị. Sử dụng constants/enums/env.
- **Không duplicate code**. Trích xuất thành helper/composable khi logic dùng ≥ 2 nơi.
- **Mỗi hàm chỉ làm 1 việc**. Nếu hàm dài hơn 50 dòng → cần tách.
- **Tên biến/hàm phải tự mô tả**. Tránh viết tắt không rõ nghĩa.
- **Không commit code bị comment**. Xóa trước khi tạo PR.
- **Không có `console.log` trong code production**. Sử dụng logger.

### 1.2. ESLint + Prettier

Toàn bộ project bắt buộc sử dụng ESLint + Prettier với config thống nhất.

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 120,
  "tabWidth": 2
}
```

---

## 2. Backend Convention (Node.js)

### 2.1. Cấu trúc Controller

```javascript
// ✅ ĐÚNG: Controller chỉ nhận request, gọi service, trả response
const getProducts = async (req, res, next) => {
  try {
    const result = await productService.search(req.body);
    return success(res, { data: result });
  } catch (err) {
    next(err); // Đẩy lỗi cho global error handler
  }
};
// ❌ SAI: Controller chứa logic nghiệp vụ, truy vấn DB
const getProducts = async (req, res) => {
  const products = await Product.findAll({ where: { status: "active" } });
  // ... xử lý logic phức tạp trong controller
};
```

### 2.2. Cấu trúc Service

```javascript
// ✅ ĐÚNG: Service chứa logic nghiệp vụ, throw exception khi lỗi
const createProduct = async (data) => {
  const existing = await Product.findOne({ where: { code: data.code } });
  if (existing) {
    throw new ValidationError([
      {
        field: "code",
        messageCode: "MSG_ERR_UNIQUE",
        message: "Mã sản phẩm đã tồn tại.",
      },
    ]);
  }
  return Product.create(data);
};
// ❌ SAI: Service trả res hoặc truy cập req
const createProduct = async (req, res) => {
  // ... KHÔNG bao giờ truyền req/res vào service
};
```

### 2.3. Error Handling

```javascript
// ✅ ĐÚNG: try/catch + next(err) trong controller
const handler = async (req, res, next) => {
  try {
    // ...
  } catch (err) {
    next(err);
  }
};
// ❌ SAI: try/catch + res.status() trong controller
const handler = async (req, res) => {
  try {
    // ...
  } catch (err) {
    res.status(500).json({ error: err.message }); // KHÔNG LÀM THẾ NÀY
  }
};
```

### 2.4. Async/Await

- Luôn dùng `async/await`, không dùng `.then().catch()`.
- Luôn có `try/catch` hoặc đẩy lỗi cho error handler middleware.

### 2.5. SQL Injection Prevention

- **Luôn** sử dụng parameterized queries hoặc ORM (Sequelize).
- **KHÔNG BAO GIỜ** nối chuỗi SQL trực tiếp.

```javascript
// ✅ ĐÚNG
const product = await Product.findOne({ where: { id: productId } });
// ❌ SAI — SQL Injection
const product = await sequelize.query(
  `SELECT * FROM products WHERE id = '${productId}'`,
);
```

### 2.6. Logging

- Sử dụng `winston` logger thống nhất.
- Log levels: `error` > `warn` > `info` > `debug`.
- Log **tất cả** lỗi ở error handler middleware.
- **KHÔNG** log thông tin nhạy cảm (password, token, credit card).

---

## 3. Frontend Convention (Vue.js)

### 3.1. Component Structure

```vue
<!-- Thứ tự các section trong .vue file -->

<script setup>
// 1. Imports
// 2. Props / Emits
// 3. Reactive state
// 4. Computed
// 5. Watch
// 6. Methods
// 7. Lifecycle hooks
</script>

<template>
  <!-- Template -->
</template>

<style scoped>
/* Styles — luôn scoped */
</style>
```

### 3.2. Composition API (Bắt buộc)

```javascript
// ✅ ĐÚNG: Composition API + script setup
<script setup>
import { ref, computed, onMounted } from 'vue';
const count = ref(0);
const doubled = computed(() => count.value * 2);
</script>
// ❌ SAI: Options API (không dùng trong project này)
export default {
  data() { return { count: 0 }; },
  computed: { doubled() { return this.count * 2; } },
};
```

### 3.3. Props & Events

```vue
<script setup>
// ✅ Props luôn định nghĩa type + required/default
const props = defineProps({
  title: { type: String, required: true },
  count: { type: Number, default: 0 },
  items: { type: Array, default: () => [] },
});
// ✅ Emits luôn khai báo rõ ràng
const emit = defineEmits(["update", "delete"]);
</script>
```

### 3.4. API Call

```javascript
// ✅ ĐÚNG: Tập trung trong folder api/
// src/api/product.api.js
import apiClient from "./client";
export const searchProducts = (params) =>
  apiClient.post("/products/search", params);
export const createProduct = (data) => apiClient.post("/products", data);
export const updateProduct = (id, data) =>
  apiClient.put(`/products/${id}`, data);
export const deleteProduct = (id) => apiClient.delete(`/products/${id}`);
// ❌ SAI: Gọi axios trực tiếp trong component
import axios from "axios";
const res = await axios.get("/api/products"); // KHÔNG LÀM THẾ NÀY
```

### 3.5. Router Guard

```javascript
// Bắt buộc kiểm tra auth trước khi vào trang protected
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: "Login" });
  } else {
    next();
  }
});
```

---

## 4. Git Convention

### 4.1. Branch Naming

```
feature/[ticket-id]-short-description
bugfix/[ticket-id]-short-description
hotfix/[ticket-id]-short-description
Ví dụ:
feature/CT-001-product-list
bugfix/CT-042-fix-order-total
```

### 4.2. Commit Message

```
[type]: [short description]
Types:
  feat:     Tính năng mới
  fix:      Sửa lỗi
  refactor: Refactor (không thêm feature, không sửa bug)
  docs:     Tài liệu
  style:    Format code (không ảnh hưởng logic)
  test:     Thêm/sửa test
  chore:    Thay đổi build, CI, config
Ví dụ:
  feat: add product search API
  fix: correct order total calculation
  docs: update API response standard
```

### 4.3. Pull Request

- Mỗi PR giải quyết **1 ticket/issue**.
- PR phải có description rõ ràng.
- Phải pass lint + test trước khi request review.
- Cần ít nhất **1 approval** trước khi merge.
