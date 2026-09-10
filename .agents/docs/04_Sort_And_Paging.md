# Xử lý Sắp xếp & Phân trang

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

## Tài liệu này chuẩn hóa luồng xử lý **Sắp xếp (Sort)** và **Phân trang (Paging)** cho tất cả danh sách/bảng trong hệ thống. Áp dụng cho cả Backend lẫn Frontend.

## 2. Cấu trúc Request Body chuẩn

Mọi API tìm kiếm/danh sách **phải** sử dụng cấu trúc request body sau:

```json
{
  "searchConditions": {},
  "sortConditions": [],
  "pagination": {}
}
```

| Trường                       | Kiểu             | Bắt buộc | Mô tả                                                   |
| :--------------------------- | :--------------- | :------: | :------------------------------------------------------ |
| `searchConditions`           | Object           |          | Điều kiện tìm kiếm. Cấu trúc tùy theo từng API          |
| `sortConditions`             | Array of Objects |          | Điều kiện sắp xếp                                       |
| `sortConditions[].sortBy`    | String           |    ✓     | Tên cột sắp xếp (physical name)                         |
| `sortConditions[].sortOrder` | String           |    ✓     | `asc` hoặc `desc`                                       |
| `pagination`                 | Object           |    ●     | Thông tin phân trang                                    |
| `pagination.page`            | Integer          |    ●     | Trang hiện tại. Default: `1`                            |
| `pagination.pageSize`        | Integer          |    ●     | Số bản ghi/trang. Default: `20`. Options: `20, 50, 100` |

### Ví dụ đầy đủ:

```json
{
  "searchConditions": {
    "productName": "Arabica",
    "origin": "Brazil",
    "status": "active"
  },
  "sortConditions": [{ "sortBy": "productName", "sortOrder": "asc" }],
  "pagination": {
    "page": 1,
    "pageSize": 20
  }
}
```

---

## 3. Cấu trúc Response chuẩn

```json
{
  "success": true,
  "code": "",
  "message": "",
  "data": {
    "items": [],
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

## 4. Luồng xử lý Sắp xếp

### 4.1. Hành vi người dùng

Click header cột → chuyển đổi theo chu trình:

```
Không sắp xếp → ASC (▲) → DESC (▼) → ASC (▲) → ...
```

### 4.2. Luồng xử lý FE khi Sort & Search

```
1. Xác định sortBy + sortOrder mới hoặc searchConditions từ Form
2. Giữ nguyên searchConditions/sortConditions hiện tại
3. Reset page = 1 (QUAN TRỌNG)
4. Giữ nguyên pageSize
5. Gọi API khi bấm nút "Tìm kiếm" hoặc nhấn phím Enter (KHÔNG gọi API khi gõ từ khóa hoặc khi nhấn nút "Đặt lại")
6. Cập nhật danh sách + icon sort trên header cột
```

### 4.3. Quy tắc Form Tìm kiếm (Search Form)

- **Label mô tả các trường**: Form tìm kiếm phải có nhãn tiêu đề rõ ràng phía trên từng trường nhập (ví dụ: *"TỪ KHÓA TÌM KIẾM"*, *"PHÂN LOẠI KHO"*).
- **Bộ lọc Phân loại dạng Dropdown (Filterable Select)**: Bộ lọc phân loại nằm gọn bên trong Form Search sử dụng component Select hỗ trợ tìm kiếm bên trong (`filter`).
- **Nút Tìm kiếm**: Bấm nút *"Tìm kiếm"* (hoặc phím Enter) mới thực thi gọi API. Tuyệt đối không gắn event `@input` gõ phím call API liên tục gây quá tải server.
- **Nút Đặt lại**: Nút *"Đặt lại"* chỉ làm sạch thông tin trên form (`searchKeyword = ''`, `selectedCategoryCode = 'all'`) và **KHÔNG tự động gọi API**.
- khi thay đổi sort → luôn reset `page = 1`.
- Chỉ hỗ trợ sort 1 cột tại một thời điểm (mảng `sortConditions` chỉ có 1 phần tử).
- Nếu `sortConditions` rỗng → BE sắp xếp theo thứ tự mặc định (thường là `createdAt DESC`).

---

## 5. Luồng xử lý Phân trang

### 5.1. Các hành động người dùng

| Hành động             | Xử lý `page` | Xử lý `pageSize` |
| :-------------------- | :----------- | :--------------- |
| Nhấn **Next**         | `page + 1`   | Giữ nguyên       |
| Nhấn **Previous**     | `page - 1`   | Giữ nguyên       |
| Thay đổi **pageSize** | Reset = `1`  | Giá trị mới      |

### 5.2. Luồng xử lý FE khi Paging

```
1. Giữ nguyên searchConditions
2. Giữ nguyên sortConditions
3. Cập nhật page / pageSize theo hành động
4. Gọi API
5. Cập nhật danh sách + trạng thái phân trang
```

---

## 6. Triển khai Backend (Node.js)

### 6.1. Service Helper

```javascript
// src/helpers/query.helper.js
/**
 * Xây dựng options cho Sequelize findAndCountAll
 */
const buildListQuery = ({
  searchConditions = {},
  sortConditions = [],
  pagination = {},
}) => {
  const page = pagination.page || 1;
  const pageSize = pagination.pageSize || 20;
  const query = {
    offset: (page - 1) * pageSize,
    limit: pageSize,
  };
  // Sort
  if (sortConditions.length > 0) {
    query.order = sortConditions.map((s) => [
      s.sortBy,
      s.sortOrder.toUpperCase(),
    ]);
  } else {
    query.order = [["createdAt", "DESC"]]; // Default sort
  }
  return query;
};
/**
 * Xây dựng response pagination
 */
const buildPaginationResponse = (totalRecords, page, pageSize) => ({
  page,
  pageSize,
  totalRecords,
  totalPages: Math.ceil(totalRecords / pageSize),
});
module.exports = { buildListQuery, buildPaginationResponse };
```

### 6.2. Sử dụng trong Service

```javascript
// src/services/product.service.js
const { Op } = require("sequelize");
const {
  buildListQuery,
  buildPaginationResponse,
} = require("../helpers/query.helper");
const searchProducts = async (body) => {
  const { searchConditions, sortConditions, pagination } = body;
  const query = buildListQuery({ sortConditions, pagination });
  // Xây dựng where clause từ searchConditions
  const where = {};
  if (searchConditions.productName) {
    where.productName = { [Op.like]: `%${searchConditions.productName}%` };
  }
  if (searchConditions.origin) {
    where.origin = searchConditions.origin;
  }
  if (searchConditions.status) {
    where.status = searchConditions.status;
  }
  const { count, rows } = await Product.findAndCountAll({ where, ...query });
  return {
    items: rows,
    pagination: buildPaginationResponse(
      count,
      pagination.page || 1,
      pagination.pageSize || 20,
    ),
  };
};
```

---

## 7. Triển khai Frontend (Vue.js)

### 7.1. Composable quản lý List

```javascript
// src/composables/useListQuery.js
import { ref, reactive } from "vue";
export function useListQuery(
  apiFn,
  defaultSort = { sortBy: "createdAt", sortOrder: "desc" },
) {
  const items = ref([]);
  const pagination = reactive({
    page: 1,
    pageSize: 20,
    totalRecords: 0,
    totalPages: 0,
  });
  const sortConditions = ref(defaultSort ? [defaultSort] : []);
  const loading = ref(false);
  const fetchList = async (searchConditions = {}) => {
    loading.value = true;
    try {
      const res = await apiFn({
        searchConditions,
        sortConditions: sortConditions.value,
        pagination: { page: pagination.page, pageSize: pagination.pageSize },
      });
      items.value = res.data.items;
      Object.assign(pagination, res.data.pagination);
    } finally {
      loading.value = false;
    }
  };
  const handleSort = (sortBy, searchConditions) => {
    const current = sortConditions.value[0];
    let newOrder = "asc";
    if (current && current.sortBy === sortBy) {
      newOrder = current.sortOrder === "asc" ? "desc" : "asc";
    }
    sortConditions.value = [{ sortBy, sortOrder: newOrder }];
    pagination.page = 1; // Reset page khi sort
    fetchList(searchConditions);
  };
  const handlePageChange = (newPage, searchConditions) => {
    pagination.page = newPage;
    fetchList(searchConditions);
  };
  const handlePageSizeChange = (newSize, searchConditions) => {
    pagination.pageSize = newSize;
    pagination.page = 1; // Reset page khi thay đổi pageSize
    fetchList(searchConditions);
  };
  return {
    items,
    pagination,
    sortConditions,
    loading,
    fetchList,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
  };
}
```

### 7.2. Sử dụng trong Component

```vue
<script setup>
import { reactive, onMounted } from "vue";
import { useListQuery } from "@/composables/useListQuery";
import { searchProducts } from "@/api/product";
const searchForm = reactive({ productName: "", origin: "", status: "" });
const {
  items,
  pagination,
  sortConditions,
  loading,
  fetchList,
  handleSort,
  handlePageChange,
  handlePageSizeChange,
} = useListQuery(searchProducts);
onMounted(() => fetchList(searchForm));
const onSearch = () => {
  fetchList(searchForm);
};
</script>

<template>
  <!-- Search form -->

  <form @submit.prevent="onSearch">
    <input v-model="searchForm.productName" placeholder="Tên sản phẩm" />
    <button type="submit">Tìm kiếm</button>
  </form>
  <!-- Table -->

  <table>
    <thead>
      <tr>
        <th @click="handleSort('productName', searchForm)">
          Tên SP
          <span v-if="sortConditions[0]?.sortBy === 'productName'">
            {{ sortConditions[0].sortOrder === "asc" ? "▲" : "▼" }}
          </span>
        </th>

        <th @click="handleSort('price', searchForm)">Giá</th>

        <th @click="handleSort('origin', searchForm)">Xuất xứ</th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="item in items" :key="item.id">
        <td>{{ item.productName }}</td>

        <td>{{ item.price }}</td>

        <td>{{ item.origin }}</td>
      </tr>
    </tbody>
  </table>
  <!-- Pagination -->

  <div class="pagination">
    <button
      :disabled="pagination.page <= 1"
      @click="handlePageChange(pagination.page - 1, searchForm)"
    >
      Trước
    </button>
    <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
    <button
      :disabled="pagination.page >= pagination.totalPages"
      @click="handlePageChange(pagination.page + 1, searchForm)"
    >
      Sau
    </button>
    <select
      :value="pagination.pageSize"
      @change="handlePageSizeChange(+$event.target.value, searchForm)"
    >
      <option :value="20">20</option>

      <option :value="50">50</option>

      <option :value="100">100</option>
    </select>
  </div>
</template>
```
