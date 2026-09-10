# Cấu trúc Project chuẩn

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

## 1. Tổng quan Kiến trúc

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Vue.js 3   │──────▶│  Node.js     │──────▶│  PostgreSQL  │
│   (TypeScript) REST  │ (Express + TS)  ORM  │  Database    │
│   Port 5173  │  API  │  Port 4000   │       │  Port 5432   │
└──────────────┘       └──────────────┘       └──────────────┘
```

---

## 2. Cấu trúc Backend (Node.js + Express)

```
coffee-trade-api/
├── src/
│   ├── config/                 # Cấu hình hệ thống
│   │   ├── database.js         # Kết nối DB (Sequelize)
│   │   ├── redis.js            # Kết nối Redis
│   │   ├── cors.js             # CORS policy
│   │   └── index.js            # Gom tất cả config, đọc env
│   │
│   ├── constants/              # Hằng số
│   │   ├── messages.js         # Message codes + nội dung
│   │   ├── enums.js            # Enum giá trị (status, role...)
│   │   └── index.js
│   │
│   ├── exceptions/             # Custom Error Classes
│   │   └── index.js            # AppError, ValidationError, NotFoundError...
│   │
│   ├── middlewares/            # Express middlewares
│   │   ├── auth.js             # Xác thực JWT
│   │   ├── authorize.js        # Phân quyền theo role
│   │   ├── validate.js         # Validation middleware (Joi)
│   │   ├── errorHandler.js     # Global error handler
│   │   ├── rateLimiter.js      # Giới hạn request
│   │   └── upload.js           # Xử lý file upload (multer)
│   │
│   ├── models/                 # Sequelize Models
│   │   ├── index.js            # Khởi tạo Sequelize, load models
│   │   ├── user.model.js
│   │   ├── product.model.js
│   │   ├── order.model.js
│   │   └── ...
│   │
│   ├── routes/                 # Route definitions
│   │   ├── index.js            # Gom tất cả routes
│   │   ├── auth.routes.js
│   │   ├── product.routes.js
│   │   ├── order.routes.js
│   │   └── ...
│   │
│   ├── controllers/            # Request handlers
│   │   ├── auth.controller.js
│   │   ├── product.controller.js
│   │   ├── order.controller.js
│   │   └── ...
│   │
│   ├── services/               # Business logic
│   │   ├── auth.service.js
│   │   ├── product.service.js
│   │   ├── order.service.js
│   │   └── ...
│   │
│   ├── validations/            # Joi schemas
│   │   ├── product.validation.js
│   │   ├── order.validation.js
│   │   └── ...
│   │
│   ├── helpers/                # Utility functions
│   │   ├── response.helper.js  # Response builder
│   │   ├── query.helper.js     # Pagination/Sort builder
│   │   ├── token.helper.js     # JWT helper
│   │   └── ...
│   │
│   ├── utils/                  # Shared utilities
│   │   ├── logger.js           # Winston logger
│   │   └── ...
│   │
│   └── app.js                  # Express app setup
│
├── migrations/                 # DB migrations (Sequelize CLI)
├── seeders/                    # Seed data
├── tests/                      # Test files
│   ├── unit/
│   └── integration/
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── package.json
└── server.js                   # Entry point
```

### 2.1. Luồng xử lý Request

```
Request
  → Route (định tuyến)
    → Middleware Auth (xác thực token)
    → Middleware Authorize (kiểm tra quyền)
    → Middleware Validate (kiểm tra input)
    → Controller (nhận request, gọi service)
      → Service (xử lý nghiệp vụ)
        → Model (truy vấn DB)
      ← Trả kết quả
    ← Response Helper (format response)
  → Global Error Handler (nếu có lỗi)
```

### 2.2. Quy tắc phân tầng

| Tầng           | Trách nhiệm                                  | KHÔNG được làm        |
| :------------- | :------------------------------------------- | :-------------------- |
| **Route**      | Định nghĩa endpoint, gắn middleware          | Chứa logic            |
| **Controller** | Nhận req/res, gọi service, trả response      | Truy vấn DB trực tiếp |
| **Service**    | Xử lý nghiệp vụ, validation nghiệp vụ        | Truy cập req/res      |
| **Model**      | Định nghĩa schema, quan hệ                   | Chứa logic nghiệp vụ  |
| **Middleware** | Cross-cutting concerns (auth, validate, log) | Chứa logic nghiệp vụ  |

---

## 3. Cấu trúc Frontend (Vue.js 3 + Vite + TypeScript)

Áp dụng cấu trúc **Modular (1 file `.vue` + 1 file `.scss` tương ứng)** cho tất cả Views/Pages và Components để quản lý style tách biệt, sạch sẽ.

```
coffee-trade-web/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/                    # API service layer (TypeScript)
│   │   ├── http.ts             # Axios instance + interceptors
│   │   ├── auth.api.ts
│   │   ├── product.api.ts
│   │   └── order.api.ts
│   │
│   ├── assets/                 # Static assets & global SCSS
│   │   ├── images/
│   │   └── styles/
│   │       ├── variables.scss
│   │       ├── mixins.scss
│   │       └── main.scss
│   │
│   ├── components/             # Reusable UI components (Phân nhóm module & sub-folder)
│   │   ├── common/             # UI dùng chung
│   │   │   ├── button/
│   │   │   │   ├── AppButton.vue
│   │   │   │   └── AppButton.scss
│   │   │   └── table/
│   │   │       ├── AppTable.vue
│   │   │       └── AppTable.scss
│   │   └── layout/             # Layout hệ thống
│   │       ├── header/
│   │       │   ├── Header.vue
│   │       │   └── Header.scss
│   │       ├── navbar/
│   │       │   ├── Navbar.vue
│   │       │   └── Navbar.scss
│   │       └── footer/
│   │           ├── Footer.vue
│   │           └── Footer.scss
│   │
│   ├── composables/            # Vue composables (TypeScript)
│   │   ├── useAuth.ts
│   │   ├── useListQuery.ts
│   │   └── useValidation.ts
│   │
│   ├── constants/              # Frontend constants
│   │   ├── messages.ts
│   │   ├── enums.ts
│   │   └── routes.ts
│   │
│   ├── routers/                # Vue Router (TypeScript)
│   │   ├── index.ts
│   │   └── guards.ts
│   │
│   ├── stores/                 # Pinia stores
│   │   ├── auth.store.ts
│   │   └── app.store.ts
│   │
│   ├── pages/                  # Page components (Phân nhóm module & sub-folder tính năng)
│   │   ├── auth/
│   │   │   └── login/
│   │   │       ├── Login.vue
│   │   │       └── Login.scss
│   │   ├── dashboard/
│   │   │   ├── Dashboard.vue
│   │   │   └── Dashboard.scss
│   │   ├── pos/
│   │   │   ├── Pos.vue
│   │   │   └── Pos.scss
│   │   ├── product/
│   │   │   ├── list/
│   │   │   │   ├── ProductList.vue
│   │   │   │   └── ProductList.scss
│   │   │   └── create/
│   │   │       ├── ProductCreate.vue
│   │   │       └── ProductCreate.scss
│   │   ├── ingredient/
│   │   │   ├── list/
│   │   │   │   ├── IngredientList.vue
│   │   │   │   └── IngredientList.scss
│   │   │   └── create/
│   │   │       ├── IngredientCreate.vue
│   │   │       └── IngredientCreate.scss
│   │   ├── stockImport/
│   │   │   └── create/
│   │   │       ├── StockImportCreate.vue
│   │   │       └── StockImportCreate.scss
│   │   ├── user/
│   │   │   ├── list/
│   │   │   │   ├── UserList.vue
│   │   │   │   └── UserList.scss
│   │   │   └── create/
│   │   │       ├── UserCreate.vue
│   │   │       └── UserCreate.scss
│   │   ├── report/
│   │   │   └── sales/
│   │   │       ├── SalesReport.vue
│   │   │       └── SalesReport.scss
│   │   └── error/
│   │       └── notFound/
│   │           ├── NotFoundPage.vue
│   │           └── NotFoundPage.scss
│   │
│   ├── App.vue
│   ├── App.scss
│   └── main.ts
│
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── vite.config.ts
├── package.json
└── index.html
```

> **Quy tắc Thư mục Màn hình (Symmetrical Sub-feature Structure):**
> 1. Mỗi nhóm tính năng nằm trong folder module riêng dưới `src/pages/` (ví dụ `product/`, `ingredient/`, `user/`).
> 2. Các màn hình con/chức năng (như `list/`, `create/`, `login/`, `sales/`, `notFound/`) đều có sub-folder tương ứng đồng nhất.
> 3. Mỗi màn hình luôn đi kèm cặp file song song `[ScreenName].vue` và `[ScreenName].scss`.

### 3.1. Quy tắc phân tầng

| Tầng             | Trách nhiệm                            | KHÔNG được làm               |
| :--------------- | :------------------------------------- | :--------------------------- |
| **pages/views**  | Trang giao diện (cặp .vue + .scss)     | Chứa logic phức tạp          |
| **components/**  | UI tái sử dụng (cặp .vue + .scss)      | Gọi API trực tiếp            |
| **composables/** | Logic tái sử dụng (state + methods TS) | Thao tác DOM trực tiếp       |
| **api/**         | Gọi API HTTP, trả typed data           | Chứa logic nghiệp vụ         |
| **stores/**      | State management toàn cục (Pinia)      | Gọi API trực tiếp (trừ auth) |
| **routers/**     | Định tuyến, navigation guards          | Chứa logic nghiệp vụ         |

---

## 4. Naming Convention

### 4.1. File & Folder

| Đối tượng                   | Convention                 | Ví dụ                                   |
| :-------------------------- | :------------------------- | :-------------------------------------- |
| **BE** - Tất cả file/folder | camelCase hoặc kebab-case  | `product.service.js`, `query.helper.js` |
| **FE** - Components         | PascalCase                 | `AppButton.vue`, `ProductListView.vue`  |
| **FE** - Composables        | camelCase, prefix `use`    | `useListQuery.js`, `useAuth.js`         |
| **FE** - API files          | camelCase, suffix `.api`   | `product.api.js`                        |
| **FE** - Store files        | camelCase, suffix `.store` | `auth.store.js`                         |
| **FE** - Views              | PascalCase, suffix `View`  | `ProductListView.vue`                   |
| **DB** - Tables             | snake_case, số nhiều       | `products`, `order_items`               |
| **DB** - Columns            | snake_case                 | `product_name`, `created_at`            |

### 4.2. Code

| Đối tượng        | Convention                   | Ví dụ                                |
| :--------------- | :--------------------------- | :----------------------------------- |
| Biến, hàm        | camelCase                    | `getProducts`, `totalRecords`        |
| Class, Component | PascalCase                   | `ProductService`, `AppTable`         |
| Constant         | UPPER_SNAKE_CASE             | `MAX_FILE_SIZE`, `DEFAULT_PAGE_SIZE` |
| Env variable     | UPPER_SNAKE_CASE             | `DB_HOST`, `JWT_SECRET`              |
| API endpoint     | kebab-case, danh từ số nhiều | `/api/products`, `/api/order-items`  |

---

## 5. Tech Stack chi tiết

| Layer            | Công nghệ                  | Phiên bản                |
| :--------------- | :------------------------- | :----------------------- |
| Language         | TypeScript                 | 5.x                      |
| Frontend         | Vue.js 3 (Composition API) | 3.x                      |
| Build tool       | Vite                       | 6.x                      |
| UI Library       | PrimeVue + SCSS            | 4.x                      |
| State Management | Pinia                      | 3.x                      |
| HTTP Client      | Axios                      | 0.19.x                   |
| Router           | Vue Router                 | 4.x                      |
| Backend          | Node.js + Express (TS)     | Node 20 LTS, Express 5.x |
| ORM              | Sequelize (TypeScript)     | 6.x                      |
| Validation       | Joi (BE) + Vuelidate (FE)  | 17.x / 2.x               |
| Auth             | JWT (jsonwebtoken)         | 9.x                      |
| Logger           | Winston                    | 3.x                      |
| Database         | PostgreSQL                 | 16.x                     |
| File Storage     | MinIO hoặc local disk      | -                        |
| Testing          | Jest (BE) + Vitest (FE)    | -                        |
| Linting          | ESLint + Prettier          | -                        |
