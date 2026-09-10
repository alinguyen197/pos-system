# Database Convention

| Hạng mục  | Nội dung                      |
| :-------- | :---------------------------- |
| Hệ thống  | Coffee Shop Management System |
| Phiên bản | 1.1                           |
| Ngày tạo  | 2026-08-26                    |
| Database  | PostgreSQL 16                 |
| ORM       | Sequelize 6                   |

### Lịch sử phiên bản

| Ver | Ngày       | Nội dung thay đổi                                          | Người thực hiện |
| :-: | :--------- | :--------------------------------------------------------- | :-------------- |
| 1.0 | 2026-08-26 | Tạo mới                                                    | KhoaNA15        |
| 1.1 | 2026-08-26 | Đồng bộ ERD với 14_Database_Design_v1 (Coffee Shop domain) | KhoaNA15        |

---

## 1. Quy tắc đặt tên

| Đối tượng         | Convention               | Ví dụ                                         |
| :---------------- | :----------------------- | :-------------------------------------------- |
| Table             | snake_case, **số nhiều** | `products`, `order_items`, `stock_items`      |
| Column            | snake_case               | `product_name`, `unit_price`, `created_at`    |
| Primary Key       | `id` (UUID)              | `id`                                          |
| Foreign Key       | `[bảng_số_ít]_id`        | `product_id`, `order_id`                      |
| Index             | `idx_[table]_[columns]`  | `idx_products_name`, `idx_orders_status_date` |
| Unique Constraint | `uq_[table]_[columns]`   | `uq_products_code`                            |

---

## 2. Cột bắt buộc (Mọi bảng)

Tất cả bảng **phải** có các cột sau: | Cột | Kiểu | Mô tả | |:--|:--|:--| | `id` | UUID | Primary key, tự sinh | | `created_at` | TIMESTAMP WITH TIME ZONE | Thời điểm tạo | | `created_by` | UUID | User ID người tạo | | `updated_at` | TIMESTAMP WITH TIME ZONE | Thời điểm cập nhật cuối | | `updated_by` | UUID | User ID người cập nhật | | `is_deleted` | BOOLEAN | Soft delete flag. Default: `false` |

### 2.1. Soft Delete

- **Không xóa vật lý** dữ liệu. Luôn dùng soft delete (`is_deleted = true`).
- Tất cả query **phải** có điều kiện `WHERE is_deleted = false` (trừ report/admin đặc biệt).
- Sequelize default scope:

```javascript
// Trong model definition
{
  defaultScope: {
    where: { isDeleted: false },
  },
  scopes: {
    withDeleted: { where: {} }, // Bao gồm cả bản ghi đã xóa
  },
}
```

---

## 3. Kiểu dữ liệu chuẩn

| Loại dữ liệu        | PostgreSQL Type          | Sequelize Type          | Ghi chú                       |
| :------------------ | :----------------------- | :---------------------- | :---------------------------- |
| ID                  | UUID                     | DataTypes.UUID          | `defaultValue: UUIDV4`        |
| Tên, mô tả ngắn     | VARCHAR(n)               | DataTypes.STRING(n)     | Chỉ định max length           |
| Mô tả dài           | TEXT                     | DataTypes.TEXT          | Không giới hạn                |
| Số nguyên           | INTEGER                  | DataTypes.INTEGER       |                               |
| Số thập phân (tiền) | DECIMAL(15,2)            | DataTypes.DECIMAL(15,2) | **Không dùng FLOAT cho tiền** |
| Số lượng (kg)       | DECIMAL(10,3)            | DataTypes.DECIMAL(10,3) |                               |
| Boolean             | BOOLEAN                  | DataTypes.BOOLEAN       |                               |
| Ngày giờ            | TIMESTAMP WITH TIME ZONE | DataTypes.DATE          | Luôn dùng timezone            |
| Chỉ ngày            | DATE                     | DataTypes.DATEONLY      |                               |
| Enum/Status         | VARCHAR(20)              | DataTypes.STRING(20)    | Giá trị lưu trong constants   |
| JSON                | JSONB                    | DataTypes.JSONB         | Khi cần dữ liệu linh hoạt     |

## > **Quan trọng:** Không dùng `FLOAT` hoặc `DOUBLE` cho dữ liệu tiền tệ. Luôn dùng `DECIMAL`.

## 4. Thiết kế bảng chính

### 4.1. ERD tổng quan (các bảng cốt lõi)

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐
│  users   │     │   products   │     │ categories  │
│──────────│     │──────────────│     │─────────────│
│ id (PK)  │     │ id (PK)      │     │ id (PK)     │
│ email    │     │ code         │◀────│ name        │
│ password │     │ name         │     │ sort_order  │
│ name     │     │ category_id  │     └─────────────┘
│ role     │     │ selling_price│
└──────────┘     │ unit         │
      │          └──────────────┘
      │                 │
      ▼                 ▼
┌──────────────┐  ┌──────────────────┐
│   orders     │  │   order_items    │
│──────────────│  │──────────────────│
│ id (PK)      │  │ id (PK)          │
│ order_number │  │ order_id (FK)    │
│ status       │  │ product_id (FK)  │
│ total_amount │  │ quantity         │
│ final_amount │  │ unit_price       │
│ payment      │  │ subtotal         │
└──────────────┘  └──────────────────┘
┌──────────────────┐     ┌────────────────────────┐
│   stock_items    │     │   stock_imports          │
│──────────────────│     │────────────────────────│
│ id (PK)          │     │ id (PK)                  │
│ code             │     │ import_code              │
│ name             │     │ import_date              │
│ unit             │     │ supplier                 │
│ quantity         │     │ total_amount             │
│ min_quantity     │     └────────────────────────┘
└──────────────────┘            │
        │                     ▼
        │            ┌────────────────────────┐
        └──────────▶│ stock_import_details   │
                     │────────────────────────│
                     │ stock_import_id (FK)   │
                     │ stock_item_id (FK)     │
                     │ quantity               │
                     │ cost_per_unit          │
                     │ subtotal               │
                     └────────────────────────┘
```

> Chi tiết đầy đủ tại `14_Database_Design_v1.md`

### 4.2. Bảng Enum/Status

| Bảng         | Cột              | Giá trị cho phép                               |
| :----------- | :--------------- | :--------------------------------------------- |
| `users`      | `role`           | `admin`, `manager`, `staff`, `viewer`          |
| `orders`     | `status`         | `pending`, `completed`, `cancelled`            |
| `orders`     | `payment_method` | `cash`, `transfer`, `card`                     |
| `products`   | `unit`           | `ly`, `chai`, `phần`                           |
| `categories` | -                | Cà phê, Trà, Sinh tố, Nước ép, Đá xay, Topping |

---

## 5. Migration Convention

### 5.1. Quy tắc

- Mỗi migration giải quyết **1 thay đổi logic** (tạo bảng, thêm cột, thêm index...).
- **Không bao giờ** sửa migration đã chạy trên môi trường khác. Tạo migration mới.
- Mỗi migration **phải** có cả `up` và `down`.
- Tên file: `YYYYMMDDHHMMSS-description.js`

### 5.2. Ví dụ Migration

```javascript
"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("products", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      category_id: {
        type: Sequelize.UUID,
        references: { model: "categories", key: "id" },
      },
      origin: {
        type: Sequelize.STRING(100),
      },
      unit_price: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      unit: {
        type: Sequelize.STRING(20),
        defaultValue: "kg",
      },
      stock_qty: {
        type: Sequelize.DECIMAL(10, 3),
        defaultValue: 0,
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      created_by: {
        type: Sequelize.UUID,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_by: {
        type: Sequelize.UUID,
      },
    });
    await queryInterface.addIndex("products", ["code"], {
      name: "idx_products_code",
      unique: true,
    });
    await queryInterface.addIndex("products", ["category_id"], {
      name: "idx_products_category",
    });
    await queryInterface.addIndex("products", ["is_deleted"], {
      name: "idx_products_deleted",
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("products");
  },
};
```

---

## 6. Sequelize Model Convention

```javascript
// src/models/product.model.js
const { DataTypes } = require("sequelize");
module.exports = (sequelize) => {
  const Product = sequelize.define(
    "Product",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      categoryId: {
        type: DataTypes.UUID,
        field: "category_id",
      },
      origin: DataTypes.STRING(100),
      unitPrice: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        field: "unit_price",
      },
      unit: {
        type: DataTypes.STRING(20),
        defaultValue: "kg",
      },
      stockQty: {
        type: DataTypes.DECIMAL(10, 3),
        defaultValue: 0,
        field: "stock_qty",
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: "is_deleted",
      },
    },
    {
      tableName: "products",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      defaultScope: {
        where: { isDeleted: false },
      },
    },
  );
  Product.associate = (models) => {
    Product.belongsTo(models.Category, { foreignKey: "categoryId" });
    Product.hasMany(models.OrderItem, { foreignKey: "productId" });
  };
  return Product;
};
```

---

## 7. Index Strategy

| Khi nào tạo Index               | Ví dụ                          |
| :------------------------------ | :----------------------------- |
| Foreign Key                     | `idx_order_items_order_id`     |
| Cột thường xuyên trong WHERE    | `idx_products_category_id`     |
| Cột thường xuyên trong ORDER BY | `idx_orders_created_at`        |
| Cột tìm kiếm LIKE               | GIN index cho full-text search |
| Soft delete flag                | `idx_[table]_is_deleted`       |
| Composite cho query phức tạp    | `idx_orders_status_created_at` |
