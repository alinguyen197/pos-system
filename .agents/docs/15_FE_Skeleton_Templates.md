# Skeleton Templates — Frontend Components (Vue 3 + TS + PrimeVue)

| Hạng mục   | Nội dung                                                         |
| :--------- | :--------------------------------------------------------------- |
| Hệ thống   | Coffee Trade Management System                                   |
| Phiên bản  | 1.1                                                              |
| Tech Stack | Vue.js 3 (Composition API) + TypeScript + Vite + PrimeVue & SCSS |

---

## 1. Tổng quan

Các **skeleton template** chuẩn cho Frontend bằng **TypeScript, PrimeVue & SCSS**. Áp dụng chuẩn **Modular Layout (1 file `.vue` + 1 file `.scss` tương ứng)**: style được định nghĩa trong `[Component].scss` và import vào `.vue` qua `<style scoped lang="scss" src="./[Component].scss"></style>`.

---

## 2. Trang danh sách (`ListView.vue`)

Dùng cho: `src/views/[module]/[Module]ListView.vue`

```vue
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Card from 'primevue/card'
import { useListQuery } from '@/composables/useListQuery'
import { search[MODULE_NAME] } from '@/api/[module].api'

const searchForm = reactive({ keyword: '', category: 'all' })
const categoryOptions = ref([
  { label: 'Tất cả phân loại', code: 'all' },
  { label: 'Cà phê hạt', code: 'coffee_beans' },
])

const { items, pagination, loading, fetchList, handleSort, handlePageChange } = useListQuery(search[MODULE_NAME])

onMounted(() => fetchList(searchForm))
const onSearch = () => {
  pagination.page = 1
  fetchList(searchForm)
}
const onReset = () => {
  // Chỉ xóa form search, KHÔNG gọi API tự động ở đây
  searchForm.keyword = ''
  searchForm.category = 'all'
}
</script>

<template>
  <div class="page-container">
    <Card class="mb-4">
      <template #content>
        <form @submit.prevent="onSearch" class="search-form flex items-end gap-3">
          <div>
            <label class="block text-xs font-bold text-[#42493d] uppercase mb-1">Từ khóa tìm kiếm</label>
            <InputText v-model="searchForm.keyword" placeholder="Nhập từ khóa..." class="p-inputtext-sm" />
          </div>
          <div>
            <label class="block text-xs font-bold text-[#42493d] uppercase mb-1">Phân loại</label>
            <Select v-model="searchForm.category" :options="categoryOptions" optionLabel="label" optionValue="code" filter placeholder="Tất cả phân loại" class="p-inputtext-sm" />
          </div>
          <div class="flex items-center gap-2">
            <Button type="submit" label="Tìm kiếm" icon="pi pi-search" :loading="loading" />
            <Button type="button" label="Đặt lại" icon="pi pi-refresh" severity="secondary" @click="onReset" />
          </div>
        </form>
      </template>
    </Card>

    <Card>
      <template #content>
        <DataTable :value="items" :loading="loading" lazy paginator :rows="pagination.pageSize" :totalRecords="pagination.totalRecords" @page="(e) => handlePageChange(e.page + 1, searchForm)">
          <Column field="name" header="Tên" sortable></Column>
          <Column field="createdAt" header="Ngày tạo" sortable></Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<style scoped lang="scss">
.search-form {
  display: flex;
  gap: 0.75rem;
}
</style>
```

---

## 3. Trang tạo mới / chỉnh sửa (`FormView.vue`)

Dùng cho: `src/views/[module]/[Module]CreateView.vue`

```vue
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Card from 'primevue/card'
import { useValidation } from '@/composables/useValidation'
import { create[MODULE_NAME] } from '@/api/[module].api'

const router = useRouter()
const loading = ref(false)
const { fieldErrors, clearErrors, setErrors } = useValidation()

const form = reactive({ name: '', code: '' })

const handleSubmit = async () => {
  clearErrors()
  loading.value = true
  try {
    await create[MODULE_NAME](form)
    router.push({ name: '[MODULE_NAME]List' })
  } catch (err: any) {
    if (err.errors) setErrors(err.errors)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <Card>
      <template #title>Tạo mới [MODULE_DESCRIPTION]</template>
      <template #content>
        <form @submit.prevent="handleSubmit" class="form-grid">
          <div class="field">
            <label for="name">Tên</label>
            <InputText id="name" v-model="form.name" :class="{ 'p-invalid': fieldErrors.name }" />
            <small v-if="fieldErrors.name" class="p-error">{{ fieldErrors.name }}</small>
          </div>
          <div class="actions">
            <Button type="submit" label="Lưu" icon="pi pi-check" :loading="loading" />
            <Button type="button" label="Hủy" severity="secondary" @click="router.back()" />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<style scoped lang="scss">
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
```

---

## 4. Trang chi tiết (`DetailView.vue`)

Dùng cho: `src/views/[module]/[Module]DetailView.vue`

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import { get[MODULE_NAME]ById } from '@/api/[module].api'

const route = useRoute()
const router = useRouter()
const detail = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await get[MODULE_NAME]ById(route.params.id as string)
    detail.value = res.data
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-container">
    <Card v-if="detail">
      <template #title>Chi tiết [MODULE_DESCRIPTION]</template>
      <template #content>
        <div class="detail-info">
          <p><strong>Tên:</strong> {{ detail.name }}</p>
        </div>
        <Button label="Quay lại" icon="pi pi-arrow-left" severity="secondary" @click="router.back()" />
      </template>
    </Card>
  </div>
</template>
```

---

## 5. Reusable Component (`AppButton.vue`)

```vue
<script setup lang="ts">
import Button from 'primevue/button'

defineProps<{ label: string; icon?: string; loading?: boolean }>()
defineEmits<{ (e: 'click'): void }>()
</script>

<template>
  <Button :label="label" :icon="icon" :loading="loading" @click="$emit('click')" />
</template>
```

---

## 6. Composable (`useListQuery.ts`)

```typescript
import { ref, reactive } from 'vue'

export function useListQuery(apiFn: Function) {
  const items = ref<any[]>([])
  const pagination = reactive({ page: 1, pageSize: 20, totalRecords: 0 })
  const loading = ref(false)

  const fetchList = async (searchConditions = {}) => {
    loading.value = true
    try {
      const res = await apiFn({ searchConditions, pagination })
      items.value = res.data.items
      Object.assign(pagination, res.data.pagination)
    } finally {
      loading.value = false
    }
  }

  const handlePageChange = (newPage: number, searchConditions: any) => {
    pagination.page = newPage
    fetchList(searchConditions)
  }

  return { items, pagination, loading, fetchList, handlePageChange }
}
```

---

## 7. API Service (`module.api.ts`)

```typescript
import http from './http'

const BASE_URL = '/[module-plural]'

export const search[MODULE_NAME] = (params: any) => http.post(`${BASE_URL}/search`, params)
export const get[MODULE_NAME]ById = (id: string) => http.get(`${BASE_URL}/${id}`)
export const create[MODULE_NAME] = (data: any) => http.post(BASE_URL, data)
export const update[MODULE_NAME] = (id: string, data: any) => http.put(`${BASE_URL}/${id}`, data)
export const delete[MODULE_NAME] = (id: string) => http.delete(`${BASE_URL}/${id}`)
```

---

## 8. Vue Router Definition

```typescript
{
  path: '/[module-plural]',
  name: '[MODULE_NAME]List',
  component: () => import('@/views/[module]/[MODULE_NAME]ListView.vue'),
  meta: { requiresAuth: true, roles: ['admin', 'manager'] }
}
```
