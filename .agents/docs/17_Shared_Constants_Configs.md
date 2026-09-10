# Shared Constants, Configs & Common Templates

| Hạng mục  | Nội dung                      |
| :-------- | :---------------------------- |
| Hệ thống  | Coffee Shop Management System |
| Phiên bản | 1.0                           |
| Ngày tạo  | 2026-08-26                    |

### Lịch sử phiên bản

| Ver | Ngày       | Nội dung thay đổi | Người thực hiện |
| :-: | :--------- | :---------------- | :-------------- |
| 1.0 | 2026-08-26 | Tạo mới           | KhoaNA15        |

---

## 1. Message Constants

### 1.1. Success Messages (BE + FE)

```javascript
// src/constants/messages.js (Backend)
const SUCCESS_MESSAGES = {
  MSG_SUC_001: { message: "Thao tác thành công." },
  MSG_SUC_002: { message: "Cập nhật thành công." },
  MSG_SUC_003: { message: "Xóa thành công." },
  MSG_SUC_004: { message: "Nhập kho thành công." },
};
```

```javascript
// src/constants/messages.js (Frontend)
export const SUCCESS_MESSAGES = {
  MSG_SUC_001: "Thao tác thành công.",
  MSG_SUC_002: "Cập nhật thành công.",
  MSG_SUC_003: "Xóa thành công.",
  MSG_SUC_004: "Nhập kho thành công.",
};
```

### 1.2. Validation Error Messages (BE)

```javascript
// src/constants/messages.js (tiếp)
const VALIDATION_MESSAGES = {
  MSG_ERR_REQUIRED: "{field} là bắt buộc.",
  MSG_ERR_MAX_LENGTH: "{field} tối đa {max} ký tự.",
  MSG_ERR_MIN_LENGTH: "{field} tối thiểu {min} ký tự.",
  MSG_ERR_MIN: "{field} phải ≥ {min}.",
  MSG_ERR_MAX: "{field} phải ≤ {max}.",
  MSG_ERR_TYPE: "{field} phải là kiểu {expectedType}.",
  MSG_ERR_FORMAT: "{field} không đúng định dạng.",
  MSG_ERR_UNIQUE: "{field} đã tồn tại trong hệ thống.",
  MSG_ERR_ENUM: "{field} không hợp lệ.",
  MSG_ERR_DATE_RANGE: "Ngày bắt đầu phải trước ngày kết thúc.",
  MSG_ERR_FILE_COUNT: "Tối đa {max} file mỗi lần upload.",
  MSG_ERR_FILE_SIZE: "Tổng dung lượng tối đa {max}.",
  MSG_ERR_FILE_TYPE: "Định dạng file không được hỗ trợ.",
  MSG_ERR_VALIDATION: "Dữ liệu không hợp lệ.",
  MSG_ERR_NOT_FOUND: "Tài nguyên yêu cầu không tồn tại.",
  MSG_ERR_RATE_LIMIT: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
};
```

### 1.3. System Error Messages (FE — dùng cho ErrorPage + Interceptor)

```javascript
// src/constants/messages.js (Frontend)
export const ERROR_MESSAGES = {
  MSG_ERR_COM_00901: {
    title: "Lỗi hệ thống",
    message: "Đã xảy ra lỗi. Vui lòng liên hệ quản trị viên.",
  }, // 500
  MSG_ERR_COM_00902: {
    title: "Phiên hết hạn",
    message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  }, // 401
  MSG_ERR_COM_00903: {
    title: "Không có quyền",
    message: "Bạn không có quyền thực hiện thao tác này.",
  }, // 403
  MSG_ERR_COM_00904: {
    title: "Không tìm thấy",
    message: "Tài nguyên yêu cầu không tồn tại.",
  }, // 404
  MSG_ERR_COM_00905: {
    title: "Hết thời gian",
    message: "Yêu cầu đã hết thời gian chờ. Vui lòng thử lại.",
  }, // 408
  MSG_ERR_COM_00906: {
    title: "Xung đột dữ liệu",
    message: "Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại trang.",
  }, // 409
  MSG_ERR_COM_00907: {
    title: "Bảo trì",
    message: "Hệ thống đang bảo trì. Vui lòng quay lại sau.",
  }, // 503
  MSG_ERR_NETWORK: {
    title: "Mất kết nối",
    message: "Lỗi kết nối mạng. Vui lòng kiểm tra lại.",
  }, // Network Error
  MSG_ERR_RATE_LIMIT: {
    title: "Quá nhiều yêu cầu",
    message: "Vui lòng thử lại sau.",
  }, // 429
};
```

---

## 2. Enum Constants

```javascript
// src/constants/enums.js (Dùng chung BE + FE)
const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  VIEWER: "viewer",
};
const ORDER_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};
const PAYMENT_METHOD = {
  CASH: "cash",
  TRANSFER: "transfer",
  CARD: "card",
};
const PRODUCT_UNIT = {
  LY: "ly",
  CHAI: "chai",
  PHAN: "phần",
};
const STOCK_UNIT = {
  KG: "kg",
  LIT: "lít",
  HOP: "hộp",
  GOI: "gói",
  CHAI: "chai",
};
module.exports = {
  USER_ROLES,
  ORDER_STATUS,
  PAYMENT_METHOD,
  PRODUCT_UNIT,
  STOCK_UNIT,
};
// FE: export { USER_ROLES, ORDER_STATUS, PAYMENT_METHOD, PRODUCT_UNIT, STOCK_UNIT };
```

---

## 3. Environment Variables (`.env.example`)

```env
# ─── Server ───
NODE_ENV=development
PORT=3000
# ─── Database ───
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coffee_shop
DB_USER=postgres
DB_PASS=your_password_here
# ─── JWT ───
JWT_SECRET=your_jwt_secret_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_here_min_32_chars
# ─── CORS ───
CORS_ORIGIN=http://localhost:5173
# ─── Email (SMTP) ───
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Coffee Shop <noreply@coffeeshop.com>"
ADMIN_EMAIL=admin@coffeeshop.com
# ─── File Upload ───
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=50
MAX_FILE_COUNT=10
```

```env
# Frontend (.env.example)
VITE_API_BASE_URL=http://localhost:4000/api
```

---

## 4. Logger Configuration (Winston)

```typescript
// src/utils/logger.ts
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "coffee-shop-api" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, stack }) =>
            `${timestamp} [${level}]: ${stack || message}`,
        ),
      ),
    }),
  );
}

export default logger;
```

---

## 5. Database Configuration (Sequelize TypeScript)

```typescript
// src/config/database.ts
import dotenv from "dotenv";
dotenv.config();

export const dbConfig = {
  development: {
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASS || "postgres",
    database: process.env.DB_NAME || "coffee_shop",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    dialect: "postgres" as const,
    logging: false,
  },
};
```

## 7. Common FE Composables

### 7.1. `useDialog`

```javascript
// src/composables/useDialog.js
import { ref } from "vue";
const dialogVisible = ref(false);
const dialogData = ref({ title: "", message: "", onConfirm: null });
export function useDialog() {
  const showDialog = ({
    title = "Thông báo",
    message = "",
    onConfirm = null,
  } = {}) => {
    dialogData.value = { title, message, onConfirm };
    dialogVisible.value = true;
  };
  const closeDialog = () => {
    dialogVisible.value = false;
    dialogData.value = { title: "", message: "", onConfirm: null };
  };
  const confirmDialog = () => {
    if (dialogData.value.onConfirm) {
      dialogData.value.onConfirm();
    }
    closeDialog();
  };
  return { dialogVisible, dialogData, showDialog, closeDialog, confirmDialog };
}
```

### 7.2. `useToast`

```javascript
// src/composables/useToast.js
import { ref } from "vue";
const toasts = ref([]);
let toastId = 0;
export function useToast() {
  const showToast = (message, type = "error", duration = 5000) => {
    const id = ++toastId;
    toasts.value.push({ id, message, type });
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, duration);
  };
  const showSuccess = (message) => showToast(message, "success");
  const showError = (message) => showToast(message, "error");
  return { toasts, showToast, showSuccess, showError };
}
```

---

## 8. Common FE Components

### 8.1. `AppDialog`

```vue
<!-- src/components/common/AppDialog.vue -->

<script setup>
import { useDialog } from "@/composables/useDialog";
const { dialogVisible, dialogData, closeDialog, confirmDialog } = useDialog();
</script>

<template>
  <teleport to="body">
    <div v-if="dialogVisible" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog-content">
        <h3>{{ dialogData.title }}</h3>

        <p>{{ dialogData.message }}</p>

        <div class="dialog-actions">
          <button v-if="dialogData.onConfirm" @click="closeDialog">Hủy</button>
          <button @click="confirmDialog">OK</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.dialog-content {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  min-width: 360px;
  max-width: 480px;
}
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
</style>
```

### 8.2. `AppToast`

```vue
<!-- src/components/common/AppToast.vue -->

<script setup>
import { useToast } from "@/composables/useToast";
const { toasts } = useToast();
</script>

<template>
  <teleport to="body">
    <div class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['toast', `toast--${toast.type}`]"
      >
        {{ toast.message }}
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.toast {
  padding: 12px 20px;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.toast--error {
  background: #e74c3c;
}
.toast--success {
  background: #27ae60;
}
</style>
```

### 8.3. `AppPagination`

```vue
<!-- src/components/common/AppPagination.vue -->

<script setup>
const props = defineProps({
  page: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  totalRecords: { type: Number, required: true },
  totalPages: { type: Number, required: true },
});
const emit = defineEmits(["page-change", "page-size-change"]);
</script>

<template>
  <div class="pagination">
    <span class="pagination-info"> Tổng: {{ totalRecords }} bản ghi </span>
    <button
      data-test="prev-btn"
      :disabled="page <= 1"
      @click="emit('page-change', page - 1)"
    >
      ‹ Trước
    </button>
    <span class="pagination-current">{{ page }} / {{ totalPages }}</span>
    <button
      data-test="next-btn"
      :disabled="page >= totalPages"
      @click="emit('page-change', page + 1)"
    >
      Sau ›
    </button>
    <select
      data-test="page-size-select"
      :value="pageSize"
      @change="emit('page-size-change', +$event.target.value)"
    >
      <option :value="20">20 / trang</option>

      <option :value="50">50 / trang</option>

      <option :value="100">100 / trang</option>
    </select>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
}
.pagination-info {
  margin-right: auto;
  color: #666;
  font-size: 14px;
}
.pagination-current {
  min-width: 60px;
  text-align: center;
}
</style>
```
