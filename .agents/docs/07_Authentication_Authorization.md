# Authentication & Authorization

| Hạng mục  | Nội dung                       |
| :-------- | :----------------------------- |
| Hệ thống  | Coffee Trade Management System |
| Phiên bản | 1.0                            |
| Ngày tạo  | 2026-08-26                     |

### Lịch sử phiên bản

| Ver | Ngày       | Nội dung thay đổi                                                                  | Người thực hiện |
| :-: | :--------- | :--------------------------------------------------------------------------------- | :-------------- |
| 1.0 | 2026-08-26 | Tạo mới                                                                            | KhoaNA15        |
| 1.1 | 2026-08-26 | Thêm Token Rotation, Reuse Detection, Cron Job, Email, Secure Cookies, Audit Trail | KhoaNA15        |

---

## 1. Tổng quan

Hệ thống sử dụng **JWT (JSON Web Token)** cho xác thực và phân quyền dựa trên **Role-Based Access Control (RBAC)**.

```
Login → Access Token (15 phút) + Refresh Token (7 ngày)
  → Mỗi request gửi Access Token trong header
  → Token hết hạn → dùng Refresh Token để lấy token mới
  → Refresh Token hết hạn → buộc đăng nhập lại
```

---

## 2. Luồng xác thực

### 2.1. Đăng nhập

```
[Client]                         [Server]
   │                                │
   │  POST /api/auth/login          │
   │  { email, password }           │
   │──────────────────────────────▶ │
   │                                │ Validate credentials
   │                                │ Generate Access Token + Refresh Token
   │  { accessToken, refreshToken,  │
   │    user: { id, name, role } }  │
   │ ◀──────────────────────────────│
   │                                │
   │  Lưu tokens vào memory/cookie  │
```

### 2.2. Gọi API có xác thực

```
Mỗi request gửi kèm header:
Authorization: Bearer <accessToken>
```

### 2.3. Refresh Token (Token Rotation)

Mỗi lần refresh sẽ **tạo token mới và revoke token cũ** (rotation). Nếu phát hiện token cũ bị dùng lại → revoke tất cả sessions của user (đề phòng token bị đánh cắp).

```
[Client]                         [Server]
   │                                │
   │  Access Token hết hạn (401)    │
   │ ◀──────────────────────────────│
   │                                │
   │  POST /api/auth/refresh        │
   │  { refreshToken }              │
   │──────────────────────────────▶ │
   │                                │ 1. Hash token → lookup DB
   │                                │ 2. Kiểm tra: đã revoke? hết hạn?
   │                                │ 3. Nếu token đã revoke → REUSE DETECTED
   │                                │    → Revoke ALL tokens của user
   │                                │    → Gửi security alert email
   │                                │    → Trả về 401
   │                                │ 4. Nếu hợp lệ:
   │                                │    → Revoke token cũ (set is_revoked=true)
   │                                │    → Tạo refresh token mới
   │                                │    → Gắn replaced_by = new token id
   │                                │    → Tạo access token mới
   │  { accessToken, refreshToken } │
   │ ◀──────────────────────────────│
   │                                │
   │  Lưu tokens mới, retry request  │
```

---

## 3. JWT Configuration

| Tham số           | Giá trị                           | Mô tả                            |
| :---------------- | :-------------------------------- | :------------------------------- |
| Access Token TTL  | 15 phút                           | Thời gian sống ngắn, giảm rủi ro |
| Refresh Token TTL | 7 ngày                            | Cho phép duy trì phiên đăng nhập |
| Algorithm         | HS256                             | HMAC SHA-256                     |
| Secret Key        | Env variable `JWT_SECRET`         | **Không hardcode**               |
| Refresh Secret    | Env variable `JWT_REFRESH_SECRET` | Khác với JWT_SECRET              |

### 3.1. Bảng `refresh_tokens` (Lưu trong DB)

| Cột           | Kiểu         | Null | Default            | Mô tả                                                  |
| :------------ | :----------- | :--: | :----------------- | :----------------------------------------------------- |
| `id`          | UUID         |  NO  | uuid_generate_v4() | PK                                                     |
| `user_id`     | UUID         |  NO  |                    | FK → `users.id`                                        |
| `token_hash`  | VARCHAR(64)  |  NO  |                    | SHA-256 hash của refresh token                         |
| `device_info` | VARCHAR(255) | YES  |                    | User-Agent / device identifier                         |
| `ip_address`  | VARCHAR(45)  | YES  |                    | IP của client                                          |
| `is_revoked`  | BOOLEAN      |  NO  | `false`            | Đã bị thu hồi chưa                                     |
| `replaced_by` | UUID         | YES  |                    | FK → `refresh_tokens.id` — token thế chỗ (audit trail) |
| `expires_at`  | TIMESTAMPTZ  |  NO  |                    | Thời điểm hết hạn                                      |
| `created_at`  | TIMESTAMPTZ  |  NO  | NOW()              |                                                        |

**Index:**

- `idx_refresh_tokens_token_hash` — UNIQUE on `token_hash` (lookup nhanh)
- `idx_refresh_tokens_user_id` — on `user_id` (lấy tất cả tokens của user)
- `idx_refresh_tokens_expires_at` — on `expires_at` (cron cleanup) > **Token Hashing:** Refresh token **KHONG BAO GIỊ** lưu plaintext. Luôn hash SHA-256 trước khi lưu vào DB. Khi client gửi lên, hash lại rồi so sánh.

### 3.2. Access Token Payload

```json
{
  "sub": "user-uuid-123",
  "email": "user@example.com",
  "role": "manager",
  "iat": 1693000000,
  "exp": 1693000900
}
```

## > **Lưu ý bảo mật:** Không đặt thông tin nhạy cảm (password, credit card) vào JWT payload.

## 4. Phân quyền (RBAC)

### 4.1. Định nghĩa Role

| Role      | Mô tả         | Quyền chính                                             |
| :-------- | :------------ | :------------------------------------------------------ |
| `admin`   | Quản trị viên | Toàn quyền hệ thống                                     |
| `manager` | Quản lý       | Quản lý sản phẩm, đơn hàng, xuất nhập khẩu, xem báo cáo |
| `staff`   | Nhân viên     | Tạo/sửa đơn hàng, xem sản phẩm                          |
| `viewer`  | Chỉ xem       | Chỉ xem dữ liệu, không thao tác                         |

### 4.2. Ma trận quyền

| Chức năng              | admin | manager | staff | viewer |
| :--------------------- | :---: | :-----: | :---: | :----: |
| Quản lý người dùng     |  ✅   |   ❌    |  ❌   |   ❌   |
| CRUD Sản phẩm          |  ✅   |   ✅    |  Xem  |  Xem   |
| CRUD Đơn hàng          |  ✅   |   ✅    |  ✅   |  Xem   |
| Quản lý xuất/nhập khẩu |  ✅   |   ✅    |  ❌   |  Xem   |
| Xem báo cáo            |  ✅   |   ✅    |  ❌   |   ✅   |
| Cấu hình hệ thống      |  ✅   |   ❌    |  ❌   |   ❌   |

### 4.3. Ma trận Phân quyền truy cập Màn hình & Render Sidebar Menu (Cập nhật 2026-08-31)

| Đường dẫn (Route) | Màn hình (Screen ID) | Admin (`admin`) | Quản lý (`manager`) | Nhân viên (`staff`) | Người xem (`viewer`) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `/` | SC001 - Dashboard | ✅ | ✅ | ✅ | ✅ |
| `/reports/sales` | SC009 - Báo cáo Doanh số | ✅ | ✅ | ✅ | ✅ |
| `/pos` | SC002 - Bán hàng POS | ✅ | ✅ | ✅ | ❌ |
| `/products` & `/products/create` | SC003 & SC004 - Sản phẩm | ✅ | ✅ | ❌ | ❌ |
| `/ingredients` & `/ingredients/create` | SC005 & SC006 - Kho Nguyên liệu | ✅ | ✅ | ❌ | ❌ |
| `/stock-imports/create` | SC007 - Nhập Kho Nguyên liệu | ✅ | ✅ | ❌ | ❌ |
| `/users` & `/users/create` | SC008 - Quản lý Người dùng | ✅ | ❌ | ❌ | ❌ |

---

## 5. Triển khai Backend

### 5.1. Auth Middleware

```javascript
// src/middlewares/auth.js
const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../exceptions");
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError();
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { sub, email, role }
    next();
  } catch (err) {
    throw new UnauthorizedError();
  }
};
module.exports = authenticate;
```

### 5.2. Authorize Middleware

```javascript
// src/middlewares/authorize.js
const { ForbiddenError } = require("../exceptions");
const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError();
    }
    next();
  };
module.exports = authorize;
```

### 5.3. Sử dụng trong Route

```javascript
const authenticate = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
// Chỉ admin và manager mới được tạo sản phẩm
router.post(
  "/products",
  authenticate,
  authorize("admin", "manager"),
  validate(createProductSchema),
  productController.create,
);
// Staff trở lên mới được xem danh sách
router.post(
  "/products/search",
  authenticate,
  authorize("admin", "manager", "staff", "viewer"),
  validate(searchProductSchema),
  productController.search,
);
```

### 5.4. Token Helper (Với Rotation + Hashing)

```javascript
// src/helpers/token.helper.js
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { RefreshToken } = require("../models");
const { UnauthorizedError } = require("../exceptions");
// Hash token bằng SHA-256 trước khi lưu DB
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");
const generateAccessToken = (user) => {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
};
const generateRefreshToken = (user) => {
  return jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};
module.exports = { hashToken, generateAccessToken, generateRefreshToken };
```

### 5.5. Auth Service (Token Rotation + Reuse Detection)

```javascript
// src/services/auth.service.js
const jwt = require("jsonwebtoken");
const { sequelize } = require("../models");
const { RefreshToken, User } = require("../models");
const {
  hashToken,
  generateAccessToken,
  generateRefreshToken,
} = require("../helpers/token.helper");
const { UnauthorizedError } = require("../exceptions");
const emailService = require("./email.service");
const MAX_ACTIVE_TOKENS = 5; // Giới hạn số device đăng nhập đồng thời
/**
 * Login: Tạo cặp token mới, cleanup tokens cũ nếu vượt giới hạn
 */
const login = async (user, deviceInfo, ipAddress) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  await sequelize.transaction(async (t) => {
    // Lưu refresh token (hashed) vào DB
    await RefreshToken.create(
      {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        deviceInfo,
        ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      { transaction: t },
    );
    // Auto cleanup: giữ tối đa MAX_ACTIVE_TOKENS, xóa token cũ nhất
    const activeTokens = await RefreshToken.findAll({
      where: { userId: user.id, isRevoked: false },
      order: [["createdAt", "DESC"]],
      transaction: t,
    });
    if (activeTokens.length > MAX_ACTIVE_TOKENS) {
      const tokensToRevoke = activeTokens.slice(MAX_ACTIVE_TOKENS);
      await RefreshToken.update(
        { isRevoked: true },
        { where: { id: tokensToRevoke.map((t) => t.id) }, transaction: t },
      );
    }
  });
  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role },
  };
};
/**
 * Refresh: Token Rotation + Reuse Detection
 */
const refresh = async (rawRefreshToken, deviceInfo, ipAddress) => {
  const tokenHash = hashToken(rawRefreshToken);
  return sequelize.transaction(async (t) => {
    const storedToken = await RefreshToken.findOne({
      where: { tokenHash },
      transaction: t,
      lock: t.LOCK.UPDATE, // Prevent race conditions
    });
    // Token không tồn tại trong DB
    if (!storedToken) {
      throw new UnauthorizedError();
    }
    // REUSE DETECTION: token đã bị revoke nhưng vẫn bị dùng lại
    if (storedToken.isRevoked) {
      // Thu hồi TẤT CẢ tokens của user này
      await RefreshToken.update(
        { isRevoked: true },
        { where: { userId: storedToken.userId }, transaction: t },
      );
      // Gửi security alert email
      const user = await User.findByPk(storedToken.userId, { transaction: t });
      if (user) {
        await emailService.sendSecurityAlert(user.email, {
          type: "TOKEN_REUSE_DETECTED",
          ipAddress,
          deviceInfo,
          timestamp: new Date(),
        });
      }
      throw new UnauthorizedError();
    }
    // Token hết hạn
    if (new Date() > storedToken.expiresAt) {
      await storedToken.update({ isRevoked: true }, { transaction: t });
      throw new UnauthorizedError();
    }
    // Verify JWT signature
    let decoded;
    try {
      decoded = jwt.verify(rawRefreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      await storedToken.update({ isRevoked: true }, { transaction: t });
      throw new UnauthorizedError();
    }
    const user = await User.findByPk(decoded.sub, { transaction: t });
    if (!user || !user.isActive) {
      throw new UnauthorizedError();
    }
    // ROTATION: Tạo token mới, revoke token cũ
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const newStoredToken = await RefreshToken.create(
      {
        userId: user.id,
        tokenHash: hashToken(newRefreshToken),
        deviceInfo,
        ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      { transaction: t },
    );
    // Audit trail: gắn replacedBy để trace chuỗi rotation
    await storedToken.update(
      {
        isRevoked: true,
        replacedBy: newStoredToken.id,
      },
      { transaction: t },
    );
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  });
};
/**
 * Logout: Revoke token hiện tại hoặc tất cả tokens
 */
const logout = async (rawRefreshToken) => {
  const tokenHash = hashToken(rawRefreshToken);
  await RefreshToken.update({ isRevoked: true }, { where: { tokenHash } });
};
const logoutAll = async (userId) => {
  await RefreshToken.update(
    { isRevoked: true },
    { where: { userId, isRevoked: false } },
  );
};
module.exports = { login, refresh, logout, logoutAll };
```

### 5.6. Cron Job — Cleanup Expired Tokens

```javascript
// src/jobs/tokenCleanup.job.js
const cron = require("node-cron");
const { Op } = require("sequelize");
const { RefreshToken } = require("../models");
const logger = require("../utils/logger");
const emailService = require("../services/email.service");
// Chạy mỗi ngày lúc 2:00 AM
cron.schedule("0 2 * * *", async () => {
  try {
    const deleted = await RefreshToken.destroy({
      where: {
        [Op.or]: [
          { expiresAt: { [Op.lt]: new Date() } }, // Hết hạn
          {
            isRevoked: true,
            createdAt: {
              [Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            }, // Revoked > 30 ngày
          },
        ],
      },
    });
    logger.info(`[TokenCleanup] Deleted ${deleted} expired/revoked tokens`);
    // Thông báo admin nếu xóa nhiều bất thường
    if (deleted > 1000) {
      await emailService.sendAdminNotification({
        subject: "[Token Cleanup] Unusual volume",
        message: `Deleted ${deleted} tokens. Please review for potential security issues.`,
      });
    }
  } catch (err) {
    logger.error("[TokenCleanup] Failed:", err);
  }
});
```

### 5.7. Email Notifications

```javascript
// src/services/email.service.js
const nodemailer = require("nodemailer");
const logger = require("../utils/logger");
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
const sendSecurityAlert = async (email, details) => {
  const templates = {
    TOKEN_REUSE_DETECTED: {
      subject: "[Security Alert] Phát hiện truy cập bất thường",
      html: `
        <h2>⚠️ Cảnh báo bảo mật</h2>
        <p>Hệ thống phát hiện phiên đăng nhập của bạn có thể đã bị xâm phạm.</p>
        <p>Tất cả phiên đăng nhập đã bị đăng xuất. Vui lòng đăng nhập lại.</p>
        <ul>
          <li><strong>IP:</strong> ${details.ipAddress}</li>
          <li><strong>Thiết bị:</strong> ${details.deviceInfo}</li>
          <li><strong>Thời gian:</strong> ${details.timestamp.toISOString()}</li>
        </ul>
        <p>Nếu không phải bạn, hãy đổi mật khẩu ngay.</p>
      `,
    },
  };
  const tpl = templates[details.type];
  if (!tpl) return;
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: tpl.subject,
      html: tpl.html,
    });
  } catch (err) {
    logger.error("[Email] Send failed:", err);
  }
};
const sendAdminNotification = async ({ subject, message }) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.ADMIN_EMAIL,
      subject,
      html: `<p>${message}</p>`,
    });
  } catch (err) {
    logger.error("[Email] Admin notification failed:", err);
  }
};
module.exports = { sendSecurityAlert, sendAdminNotification };
```

### 5.8. Rate Limiting cho Auth Endpoints

```javascript
// src/middlewares/rateLimiter.js
const rateLimit = require("express-rate-limit");
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 5, // Tối đa 5 lần / phút / IP
  message: {
    success: false,
    code: "MSG_ERR_RATE_LIMIT",
    message: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // Tối đa 10 lần / 15 phút / IP
  message: {
    success: false,
    code: "MSG_ERR_RATE_LIMIT",
    message: "Quá nhiều yêu cầu refresh. Vui lòng thử lại sau.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
module.exports = { loginLimiter, refreshLimiter };
```

### 5.9. Secure Cookie Configuration

```javascript
// src/helpers/cookie.helper.js
const COOKIE_OPTIONS = {
  httpOnly: true, // Không truy cập được từ JavaScript
  secure: process.env.NODE_ENV === "production", // Chỉ gửi qua HTTPS trên production
  sameSite: "strict", // Chống CSRF
  path: "/api/auth", // Chỉ gửi cho auth endpoints
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày (khớp với refresh token TTL)
};
const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
};
const clearRefreshTokenCookie = (res) => {
  res.clearCookie("refreshToken", COOKIE_OPTIONS);
};
module.exports = {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  COOKIE_OPTIONS,
};
```

### 5.10. Auth Routes (Tổng hợp)

```javascript
// src/routes/auth.routes.js
const router = require("express").Router();
const { loginLimiter, refreshLimiter } = require("../middlewares/rateLimiter");
const authenticate = require("../middlewares/auth");
const authController = require("../controllers/auth.controller");
router.post("/auth/login", loginLimiter, authController.login);
router.post("/auth/refresh", refreshLimiter, authController.refresh);
router.post("/auth/logout", authenticate, authController.logout);
router.post("/auth/logout-all", authenticate, authController.logoutAll);
module.exports = router;
```

---

## 6. Triển khai Frontend

### 6.1. Auth Store (Pinia)

```javascript
// src/stores/auth.store.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { login, refreshToken } from "@/api/auth.api";
export const useAuthStore = defineStore("auth", () => {
  const accessToken = ref(null);
  const refreshTokenValue = ref(null);
  const user = ref(null);
  const isAuthenticated = computed(() => !!accessToken.value);
  const userRole = computed(() => user.value?.role);
  const doLogin = async (credentials) => {
    const res = await login(credentials);
    accessToken.value = res.data.accessToken;
    refreshTokenValue.value = res.data.refreshToken;
    user.value = res.data.user;
  };
  // Token Rotation: server trả về cả accessToken + refreshToken mới
  const doRefresh = async () => {
    const res = await refreshToken({ refreshToken: refreshTokenValue.value });
    accessToken.value = res.data.accessToken;
    refreshTokenValue.value = res.data.refreshToken;
  };
  // Logout: revoke token trên server trước khi clear local
  const doLogout = async () => {
    try {
      await logoutApi({ refreshToken: refreshTokenValue.value });
    } catch {
      /* ignore */
    }
    accessToken.value = null;
    refreshTokenValue.value = null;
    user.value = null;
  };
  return {
    accessToken,
    user,
    isAuthenticated,
    userRole,
    doLogin,
    doRefresh,
    doLogout,
  };
});
```

### 6.2. Axios Interceptor — Auto Refresh

```javascript
// src/api/client.js (bổ sung vào interceptor)
import { useAuthStore } from "@/stores/auth.store";
apiClient.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.accessToken) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`;
  }
  return config;
});
// Auto refresh khi 401
let isRefreshing = false;
let failedQueue = [];
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const authStore = useAuthStore();
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => apiClient(originalRequest));
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        await authStore.doRefresh();
        failedQueue.forEach((p) => p.resolve());
        failedQueue = [];
        return apiClient(originalRequest);
      } catch (refreshErr) {
        failedQueue.forEach((p) => p.reject(refreshErr));
        failedQueue = [];
        authStore.doLogout();
        router.push({ name: "Login" });
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    // Xử lý các lỗi khác (xem 02_API_Error_Handling.md)
    return Promise.reject(error);
  },
);
```

### 6.3. Route Guard

```javascript
// src/router/guards.js
import { useAuthStore } from "@/stores/auth.store";
export const authGuard = (to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: "Login", query: { redirect: to.fullPath } });
  }
  if (to.meta.roles && !to.meta.roles.includes(authStore.userRole)) {
    return next({ name: "ErrorPage", query: { code: "MSG_ERR_COM_00903" } });
  }
  next();
};
```

### 6.4. Route Definition

```javascript
// src/router/index.js
{
  path: '/products',
  name: 'ProductList',
  component: () => import('@/views/product/ProductListView.vue'),
  meta: { requiresAuth: true, roles: ['admin', 'manager', 'staff', 'viewer'] },
},
{
  path: '/products/create',
  name: 'ProductCreate',
  component: () => import('@/views/product/ProductCreateView.vue'),
  meta: { requiresAuth: true, roles: ['admin', 'manager'] },
},
```

---

## 7. Bảo mật

|  #  | Quy tắc                      | Triển khai                                          | Mục      |
| :-: | :--------------------------- | :-------------------------------------------------- | :------- |
|  1  | Mật khẩu phải hash           | bcrypt, saltRounds = 12                             | 5.5      |
|  2  | HTTPS bắt buộc               | Tất cả môi trường (trừ local dev)                   | -        |
|  3  | Token Hashing                | SHA-256 hash trước khi lưu DB                       | 5.4      |
|  4  | Token Rotation               | Mỗi lần refresh tạo token mới, revoke cũ            | 5.5      |
|  5  | Reuse Detection              | Phát hiện reuse → revoke ALL sessions + email alert | 5.5      |
|  6  | Audit Trail                  | Trường `replaced_by` trace chuỗi rotation           | 3.1, 5.5 |
|  7  | Multi-device Support         | Lưu nhiều refresh tokens per user, max 5 active     | 5.5      |
|  8  | Auto Cleanup                 | Giới hạn 5 tokens active, tự động xóa cũ nhất       | 5.5      |
|  9  | Secure Logout                | Revoke token hiện tại hoặc tất cả (`/logout-all`)   | 5.5      |
| 10  | Rate Limiting (Login)        | Tối đa 5 lần / phút / IP                            | 5.8      |
| 11  | Rate Limiting (Refresh)      | Tối đa 10 lần / 15 phút / IP                        | 5.8      |
| 12  | Secure Cookies               | httpOnly, SameSite=strict, secure (production)      | 5.9      |
| 13  | Token không lưu localStorage | Sử dụng memory (ref) hoặc httpOnly cookie           | 5.9, 6.1 |
| 14  | Cron Job Cleanup             | Xóa expired tokens hàng ngày lúc 2:00 AM            | 5.6      |
| 15  | Email Security Alert         | Thông báo khi phát hiện token reuse                 | 5.7      |
| 16  | Transaction Safety           | Sequelize transaction cho token operations          | 5.5      |
| 17  | Database Indexes             | Index `token_hash`, `user_id`, `expires_at`         | 3.1      |
| 18  | CORS whitelist               | Chỉ cho phép domain FE                              | -        |
| 19  | TTL Management               | Access 15 phút, Refresh 7 ngày                      | 3        |
