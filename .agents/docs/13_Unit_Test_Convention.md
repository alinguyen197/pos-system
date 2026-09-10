# Unit Test Convention

| Hạng mục   | Nội dung                       |
| :--------- | :----------------------------- |
| Hệ thống   | Coffee Trade Management System |
| Phiên bản  | 1.0                            |
| Ngày tạo   | 2026-08-26                     |
| BE Testing | Jest                           |
| FE Testing | Vitest + Vue Test Utils        |

### Lịch sử phiên bản

| Ver | Ngày       | Nội dung thay đổi | Người thực hiện |
| :-: | :--------- | :---------------- | :-------------- |
| 1.0 | 2026-08-26 | Tạo mới           | KhoaNA15        |

---

## 1. Nguyên tắc chung

|  #  | Nguyên tắc               | Mô tả                                                                         |
| :-: | :----------------------- | :---------------------------------------------------------------------------- |
|  1  | **AAA Pattern**          | Mỗi test chia 3 phần: Arrange (chuẩn bị) → Act (thực thi) → Assert (kiểm tra) |
|  2  | **1 test = 1 assertion** | Mỗi test chỉ kiểm tra 1 behavior                                              |
|  3  | **Test độc lập**         | Không phụ thuộc thứ tự chạy, không share state giữa các test                  |
|  4  | **Tên test mô tả rõ**    | `should [expected behavior] when [condition]`                                 |
|  5  | **Mock external**        | Mock DB, API bên ngoài, file system. Không mock logic nội bộ                  |
|  6  | **Coverage ≥ 80%**       | Tối thiểu 80% line coverage cho service layer                                 |

---

## 2. Cấu trúc file test

### 2.1. Backend

```
tests/
├── unit/
│   ├── services/
│   │   ├── product.service.test.js
│   │   ├── order.service.test.js
│   │   └── auth.service.test.js
│   ├── middlewares/
│   │   ├── auth.test.js
│   │   ├── authorize.test.js
│   │   └── validate.test.js
│   └── helpers/
│       ├── response.helper.test.js
│       └── query.helper.test.js
├── integration/
│   ├── product.api.test.js
│   └── order.api.test.js
└── fixtures/
├── product.fixture.js
└── user.fixture.js
```

### 2.2. Frontend

```
src/
├── composables/
│   ├── useListQuery.js
│   └── _*tests*_/
│       └── useListQuery.test.js
├── components/
│   ├── common/
│   │   ├── AppPagination.vue
│   │   └── _*tests*_/
│   │       └── AppPagination.test.js
└── views/
├── product/
│   ├── ProductListView.vue
│   └── _*tests*_/
│       └── ProductListView.test.js
```

### 2.3. Naming Convention

| Đối tượng         | Convention                | Ví dụ                                                   |
| :---------------- | :------------------------ | :------------------------------------------------------ |
| File test         | `[source-file].test.js`   | `product.service.test.js`                               |
| `describe` block  | Tên module/class/function | `describe('ProductService')`                            |
| Nested `describe` | Tên method hoặc context   | `describe('create')`                                    |
| `it` / `test`     | `should ... when ...`     | `it('should throw ValidationError when name is empty')` |

---

## 3. Ví dụ: Unit Test Backend (Jest)

### 3.1. Test Service

```javascript
// tests/unit/services/product.service.test.js
const productService = require("../../../src/services/product.service");
const { Product } = require("../../../src/models");
const { ValidationError, NotFoundError } = require("../../../src/exceptions");
// Mock model
jest.mock("../../../src/models");
describe("ProductService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe("create", () => {
    it("should create product successfully when data is valid", async () => {
      // Arrange
      const input = { code: "CF001", name: "Arabica", unitPrice: 250000 };
      Product.findOne.mockResolvedValue(null); // code chưa tồn tại
      Product.create.mockResolvedValue({ id: "uuid-1", ...input });
      // Act
      const result = await productService.create(input);
      // Assert
      expect(result.id).toBe("uuid-1");
      expect(result.code).toBe("CF001");
      expect(Product.create).toHaveBeenCalledWith(input);
    });
    it("should throw ValidationError when code already exists", async () => {
      // Arrange
      const input = { code: "CF001", name: "Test" };
      Product.findOne.mockResolvedValue({ id: "existing-id", code: "CF001" });
      // Act & Assert
      await expect(productService.create(input)).rejects.toThrow(ValidationError);
      expect(Product.create).not.toHaveBeenCalled();
    });
    it("should throw ValidationError when name is empty", async () => {
      // Arrange
      const input = { code: "CF002", name: "" };
      // Act & Assert
      await expect(productService.create(input)).rejects.toThrow(ValidationError);
    });
  });
  describe("getById", () => {
    it("should return product when found", async () => {
      // Arrange
      const mockProduct = { id: "uuid-1", code: "CF001", name: "Arabica" };
      Product.findByPk.mockResolvedValue(mockProduct);
      // Act
      const result = await productService.getById("uuid-1");
      // Assert
      expect(result).toEqual(mockProduct);
    });
    it("should throw NotFoundError when product not found", async () => {
      // Arrange
      Product.findByPk.mockResolvedValue(null);
      // Act & Assert
      await expect(productService.getById("nonexistent")).rejects.toThrow(NotFoundError);
    });
  });
  describe("search", () => {
    it("should return paginated results", async () => {
      // Arrange
      const input = {
        searchConditions: { productName: "Arabica" },
        sortConditions: [{ sortBy: "productName", sortOrder: "asc" }],
        pagination: { page: 1, pageSize: 20 },
      };
      Product.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: [
          { id: "1", name: "Arabica A" },
          { id: "2", name: "Arabica B" },
        ],
      });
      // Act
      const result = await productService.search(input);
      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.pagination.totalRecords).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });
    it("should return empty items when no match", async () => {
      // Arrange
      Product.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      // Act
      const result = await productService.search({
        searchConditions: { productName: "NOTEXIST" },
        pagination: { page: 1, pageSize: 20 },
      });
      // Assert
      expect(result.items).toHaveLength(0);
      expect(result.pagination.totalRecords).toBe(0);
    });
  });
});
```

### 3.2. Test Middleware

```javascript
// tests/unit/middlewares/auth.test.js
const authenticate = require("../../../src/middlewares/auth");
const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../../../src/exceptions");
describe("authenticate middleware", () => {
  let req, res, next;
  beforeEach(() => {
    req = { headers: {} };
    res = {};
    next = jest.fn();
  });
  it("should call next() when token is valid", () => {
    // Arrange
    const payload = { sub: "user-1", email: "test@mail.com", role: "admin" };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "test-secret");
    req.headers.authorization = `Bearer ${token}`;
    // Act
    authenticate(req, res, next);
    // Assert
    expect(next).toHaveBeenCalled();
    expect(req.user.sub).toBe("user-1");
  });
  it("should throw UnauthorizedError when no token", () => {
    // Act & Assert
    expect(() => authenticate(req, res, next)).toThrow(UnauthorizedError);
  });
  it("should throw UnauthorizedError when token is invalid", () => {
    // Arrange
    req.headers.authorization = "Bearer invalid-token";
    // Act & Assert
    expect(() => authenticate(req, res, next)).toThrow(UnauthorizedError);
  });
});
```

---

## 4. Ví dụ: Unit Test Frontend (Vitest)

### 4.1. Test Composable

```javascript
// src/composables/_*tests*_/useListQuery.test.js
import { describe, it, expect, vi } from "vitest";
import { useListQuery } from "../useListQuery";
describe("useListQuery", () => {
  const mockApi = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("should initialize with default values", () => {
    const { items, pagination, loading } = useListQuery(mockApi);
    expect(items.value).toEqual([]);
    expect(pagination.page).toBe(1);
    expect(pagination.pageSize).toBe(20);
    expect(loading.value).toBe(false);
  });
  it("should fetch list and update state", async () => {
    // Arrange
    mockApi.mockResolvedValue({
      data: {
        items: [{ id: 1, name: "Product A" }],
        pagination: { page: 1, pageSize: 20, totalRecords: 1, totalPages: 1 },
      },
    });
    const { items, pagination, fetchList } = useListQuery(mockApi);
    // Act
    await fetchList();
    // Assert
    expect(items.value).toHaveLength(1);
    expect(pagination.totalRecords).toBe(1);
  });
  it("should reset page to 1 when sort changes", async () => {
    // Arrange
    mockApi.mockResolvedValue({
      data: { items: [], pagination: { page: 1, pageSize: 20, totalRecords: 0, totalPages: 0 } },
    });
    const { pagination, handleSort } = useListQuery(mockApi);
    pagination.page = 3;
    // Act
    await handleSort("productName", {});
    // Assert
    expect(pagination.page).toBe(1);
  });
  it("should reset page to 1 when pageSize changes", async () => {
    // Arrange
    mockApi.mockResolvedValue({
      data: { items: [], pagination: { page: 1, pageSize: 50, totalRecords: 0, totalPages: 0 } },
    });
    const { pagination, handlePageSizeChange } = useListQuery(mockApi);
    pagination.page = 5;
    // Act
    await handlePageSizeChange(50, {});
    // Assert
    expect(pagination.page).toBe(1);
    expect(pagination.pageSize).toBe(50);
  });
});
```

### 4.2. Test Component

```javascript
// src/components/common/_*tests*_/AppPagination.test.js
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import AppPagination from "../AppPagination.vue";
describe("AppPagination", () => {
  const defaultProps = {
    page: 1,
    pageSize: 20,
    totalRecords: 100,
    totalPages: 5,
  };
  it("should render current page info", () => {
    const wrapper = mount(AppPagination, { props: defaultProps });
    expect(wrapper.text()).toContain("1 / 5");
  });
  it("should disable Previous button on first page", () => {
    const wrapper = mount(AppPagination, { props: { ...defaultProps, page: 1 } });
    const prevBtn = wrapper.find('[data-test="prev-btn"]');
    expect(prevBtn.attributes("disabled")).toBeDefined();
  });
  it("should disable Next button on last page", () => {
    const wrapper = mount(AppPagination, { props: { ...defaultProps, page: 5 } });
    const nextBtn = wrapper.find('[data-test="next-btn"]');
    expect(nextBtn.attributes("disabled")).toBeDefined();
  });
  it("should emit page-change when Next is clicked", async () => {
    const wrapper = mount(AppPagination, { props: { ...defaultProps, page: 2 } });
    await wrapper.find('[data-test="next-btn"]').trigger("click");
    expect(wrapper.emitted("page-change")?.[0]).toEqual([3]);
  });
  it("should emit page-size-change when pageSize is changed", async () => {
    const wrapper = mount(AppPagination, { props: defaultProps });
    await wrapper.find('[data-test="page-size-select"]').setValue(50);
    expect(wrapper.emitted("page-size-change")?.[0]).toEqual([50]);
  });
});
```

---

## 5. Test Fixtures / Factory

```javascript
// tests/fixtures/product.fixture.js
const buildProduct = (overrides = {}) => ({
  id: "uuid-test-1",
  code: "CF001",
  name: "Arabica Brazil",
  categoryId: "cat-uuid-1",
  origin: "Brazil",
  unitPrice: 250000,
  unit: "kg",
  stockQty: 100,
  isDeleted: false,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  ...overrides,
});
const buildProductList = (count = 5) => Array.from({ length: count }, (_, i) => buildProduct({ id: `uuid-${i}`, code: `CF${String(i + 1).padStart(3, "0")}` }));
module.exports = { buildProduct, buildProductList };
```

---

## 6. Phạm vi cần viết Unit Test

| Tầng              | Cần test                                   | Không cần test                     |
| :---------------- | :----------------------------------------- | :--------------------------------- |
| **Service**       | ✅ Logic nghiệp vụ, validation, edge cases |                                    |
| **Middleware**    | ✅ Auth, authorize, validate               |                                    |
| **Helper**        | ✅ Utility functions                       |                                    |
| **Controller**    | Không bắt buộc (test qua integration)      | ❌ Chỉ là glue code                |
| **Model**         | Không bắt buộc                             | ❌ ORM đã test                     |
| **Route**         | Không bắt buộc (test qua integration)      | ❌ Chỉ là config                   |
| **FE Composable** | ✅ Logic tái sử dụng                       |                                    |
| **FE Component**  | ✅ Component phức tạp, shared              | ❌ Component đơn giản chỉ hiển thị |
| **FE API layer**  | Không bắt buộc                             | ❌ Chỉ là wrapper axios            |

---

## 7. Script chạy test

```json
// package.json (Backend)
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --reporters=default --reporters=jest-junit"
  }
}
```

```json
// package.json (Frontend)
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ci": "vitest run --coverage --reporter=junit"
  }
}
```
