<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import { userApi, UserItem } from '@/api/user.api'
import { useAppToast } from '@/composables/useAppToast'
import { MASTER_CODES } from '@/constants/masterCodes'

const router = useRouter()
const { showSuccess, showWarning, showError } = useAppToast()

const searchKeyword = ref('')
const selectedRoleCode = ref('all')
const loading = ref(false)
const users = ref<UserItem[]>([])
const totalRecords = ref(0)

const roleFilterOptions = [
  { code: 'all', label: 'Tất cả' },
  { code: MASTER_CODES.USER_ROLE.ADMIN, label: 'Super Admin' },
  { code: MASTER_CODES.USER_ROLE.MANAGER, label: 'Quản lý cửa hàng' },
  { code: MASTER_CODES.USER_ROLE.STAFF, label: 'Thu ngân / Pha chế' },
  { code: MASTER_CODES.USER_ROLE.VIEWER, label: 'Người xem' },
]

const roleOptions = [
  { code: 'admin', label: 'Super Admin (Quản trị viên)' },
  { code: 'manager', label: 'Quản lý cửa hàng' },
  { code: 'staff', label: 'Nhân viên Thu ngân / Pha chế' },
  { code: 'viewer', label: 'Người xem (Chỉ đọc)' },
]

const statusOptions = [
  { code: 'active', label: 'Hoạt động (Active)' },
  { code: 'disabled', label: 'Đã khóa (Disabled)' },
]

const roleDisplayMap: Record<string, string> = {
  admin: 'Super Admin',
  manager: 'Quản lý cửa hàng',
  staff: 'Thu ngân / Pha chế',
  viewer: 'Người xem',
}

// Edit Modal State
const showEditModal = ref(false)
const editingUser = ref<UserItem | null>(null)
const editForm = ref({
  name: '',
  email: '',
  role: 'staff',
  status: 'active',
  password: '',
})
const savingEdit = ref(false)

// Delete Confirm Modal State
const showDeleteModal = ref(false)
const deletingUser = ref<UserItem | null>(null)
const deleting = ref(false)

const loadUsers = async () => {
  loading.value = true
  try {
    const res = await userApi.getUsers({
      search: searchKeyword.value,
      role: selectedRoleCode.value === 'all' ? undefined : selectedRoleCode.value,
    })
    users.value = res.items
    totalRecords.value = res.meta?.totalItems || res.items.length
  } catch (error: any) {
    console.error('Failed to load users:', error)
    showError('Không thể tải danh sách người dùng từ máy chủ')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadUsers()
})

let searchTimeout: any = null
watch(searchKeyword, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadUsers()
  }, 300)
})

watch(selectedRoleCode, () => {
  loadUsers()
})

const openEditModal = (user: UserItem) => {
  editingUser.value = user
  editForm.value = {
    name: user.name,
    email: user.email,
    role: user.role || 'staff',
    status: user.status || 'active',
    password: '',
  }
  showEditModal.value = true
}

const handleSaveEdit = async () => {
  if (!editingUser.value) return
  if (!editForm.value.name.trim() || !editForm.value.email.trim()) {
    showWarning('Vui lòng nhập đầy đủ tên và email')
    return
  }

  savingEdit.value = true
  try {
    const payload: any = {
      name: editForm.value.name.trim(),
      email: editForm.value.email.trim(),
      role: editForm.value.role,
      status: editForm.value.status,
    }
    if (editForm.value.password.trim()) {
      payload.password = editForm.value.password.trim()
    }

    await userApi.updateUser(editingUser.value.id, payload)
    showSuccess(`Cập nhật thông tin cho "${editForm.value.name}" thành công!`)
    showEditModal.value = false
    loadUsers()
  } catch (error: any) {
    console.error('Failed to update user:', error)
    showError(error?.response?.data?.message || 'Lỗi cập nhật thông tin người dùng')
  } finally {
    savingEdit.value = false
  }
}

const handleToggleStatus = async (user: UserItem) => {
  try {
    await userApi.toggleUserStatus(user.id)
    const isNowActive = user.status !== 'active' && user.status !== 'Hoạt động'
    showSuccess(`Đã ${isNowActive ? 'kích hoạt' : 'khóa'} tài khoản "${user.name}" thành công!`)
    loadUsers()
  } catch (error: any) {
    console.error('Failed to toggle status:', error)
    showError('Không thể đổi trạng thái tài khoản')
  }
}

const openDeleteModal = (user: UserItem) => {
  deletingUser.value = user
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!deletingUser.value) return
  deleting.value = true
  try {
    await userApi.deleteUser(deletingUser.value.id)
    showSuccess(`Đã xóa tài khoản "${deletingUser.value.name}" thành công`)
    showDeleteModal.value = false
    loadUsers()
  } catch (error: any) {
    console.error('Failed to delete user:', error)
    showError('Không thể xóa tài khoản người dùng này')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="user-list-page flex flex-col gap-6">
    <!-- Header Title & Action -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2D7CC]">
      <div>
        <h1 class="text-2xl font-bold font-display text-[#1e1b1b]">Quản lý Tài khoản & Người dùng</h1>
        <p class="text-xs text-[#42493d] mt-1 font-medium">Danh sách nhân viên cửa hàng, phân quyền vai trò và trạng thái truy cập</p>
      </div>
      <button
        @click="router.push('/users/create')"
        class="h-10 px-4 bg-[#8E3E2F] hover:bg-[#6E281C] text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
      >
        <span class="material-symbols-outlined text-lg">person_add</span>
        <span>Thêm người dùng mới</span>
      </button>
    </div>

    <!-- Main Card -->
    <div class="bg-white rounded-2xl border border-[#E2D7CC] shadow-sm overflow-hidden flex flex-col">
      <!-- Search & Filters -->
      <div class="p-5 border-b border-[#E2D7CC] flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#F9F6F0]">
        <div class="relative w-full sm:w-80">
          <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#72796c] text-xl">search</span>
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="Tìm tên, email hoặc ID..."
            class="w-full h-10 pl-11 pr-4 bg-white border border-[#c1c9b9]/70 rounded-xl focus:outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20 text-xs font-medium text-[#1e1b1b]"
          />
        </div>

        <div class="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            v-for="r in roleFilterOptions"
            :key="r.code"
            @click="selectedRoleCode = r.code"
            class="h-9 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center"
            :class="selectedRoleCode === r.code ? 'bg-[#8E3E2F] text-white shadow-sm' : 'bg-[#F2ECE4] text-[#42493d] hover:bg-[#E8DFD5]'"
          >
            {{ r.label }}
          </button>
        </div>
      </div>

      <!-- PrimeVue DataTable -->
      <DataTable
        :value="users"
        :loading="loading"
        tableStyle="min-width: 50rem"
        responsiveLayout="scroll"
        paginator
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} người dùng"
      >
        <template #empty>
          <div class="py-12 text-center text-[#72796c] flex flex-col items-center justify-center gap-2">
            <span class="material-symbols-outlined text-4xl text-[#c1c9b9]">person_search</span>
            <span class="text-xs font-bold text-[#1e1b1b]">Không tìm thấy tài khoản người dùng phù hợp</span>
            <span class="text-[11px] text-[#72796c]">Vui lòng thử từ khóa tìm kiếm hoặc bộ lọc vai trò khác</span>
          </div>
        </template>

        <Column header="Avatar" class="w-16">
          <template #body="slotProps">
            <div class="w-9 h-9 rounded-full bg-[#F2ECE4] overflow-hidden border border-[#E2D7CC] flex items-center justify-center">
              <img v-if="slotProps.data.avatarUrl" :src="slotProps.data.avatarUrl" :alt="slotProps.data.name" class="w-full h-full object-cover" />
              <span v-else class="material-symbols-outlined text-[#8E3E2F] text-xl">person</span>
            </div>
          </template>
        </Column>

        <Column field="id" header="ID NV" class="w-20">
          <template #body="slotProps">
            <span class="font-mono font-bold text-[#72796c]">NV-{{ String(slotProps.data.id).padStart(2, '0') }}</span>
          </template>
        </Column>

        <Column field="name" header="Họ và tên">
          <template #body="slotProps">
            <span class="font-bold text-[#1e1b1b]">{{ slotProps.data.name }}</span>
          </template>
        </Column>

        <Column field="email" header="Email đăng nhập">
          <template #body="slotProps">
            <span class="text-[#72796c] font-medium">{{ slotProps.data.email }}</span>
          </template>
        </Column>

        <Column field="role" header="Vai trò (Role)">
          <template #body="slotProps">
            <span
              class="px-2.5 py-1 rounded-md font-bold text-[11px] inline-block uppercase"
              :class="{
                'bg-[#8E3E2F]/10 text-[#8E3E2F]': slotProps.data.role === 'admin',
                'bg-[#326824]/10 text-[#326824]': slotProps.data.role === 'manager',
                'bg-[#00639b]/10 text-[#00639b]': slotProps.data.role === 'staff',
                'bg-[#72796c]/10 text-[#72796c]': slotProps.data.role === 'viewer',
              }"
            >
              {{ roleDisplayMap[slotProps.data.role] || slotProps.data.role }}
            </span>
          </template>
        </Column>

        <Column header="Trạng thái" bodyClass="text-center" headerClass="text-center">
          <template #body="slotProps">
            <span
              class="px-2.5 py-1 rounded-md font-bold text-[11px] inline-block"
              :class="slotProps.data.status === 'active' || slotProps.data.status === 'Hoạt động' ? 'bg-[#c9edb5]/60 text-[#326824]' : 'bg-[#ffdad6] text-[#ba1a1a]'"
            >
              {{ slotProps.data.status === 'active' || slotProps.data.status === 'Hoạt động' ? 'Hoạt động' : 'Đã khóa' }}
            </span>
          </template>
        </Column>

        <Column header="Thao tác" bodyClass="text-center" headerClass="text-center">
          <template #body="slotProps">
            <div class="flex items-center justify-center gap-1">
              <button
                @click="openEditModal(slotProps.data)"
                class="p-1.5 text-[#8E3E2F] hover:bg-[#F2ECE4] rounded-lg transition cursor-pointer"
                title="Sửa thông tin"
              >
                <span class="material-symbols-outlined text-lg">edit</span>
              </button>
              <button
                @click="handleToggleStatus(slotProps.data)"
                class="p-1.5 text-[#8E3E2F] hover:bg-[#F2ECE4] rounded-lg transition cursor-pointer"
                :title="slotProps.data.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'"
              >
                <span class="material-symbols-outlined text-lg">{{ slotProps.data.status === 'active' ? 'lock' : 'lock_open' }}</span>
              </button>
              <button
                @click="openDeleteModal(slotProps.data)"
                class="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition cursor-pointer"
                title="Xóa người dùng"
              >
                <span class="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Edit User Modal -->
    <Dialog v-model:visible="showEditModal" header="Chỉnh sửa thông tin người dùng" :modal="true" :style="{ width: '500px' }">
      <div class="space-y-4 pt-2">
        <div>
          <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-1">Họ và tên *</label>
          <input
            v-model="editForm.name"
            type="text"
            required
            class="w-full h-10 px-3.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
          />
        </div>
        <div>
          <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-1">Email đăng nhập *</label>
          <input
            v-model="editForm.email"
            type="email"
            required
            class="w-full h-10 px-3.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
          />
        </div>
        <div>
          <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-1">Vai trò truy cập (Role)</label>
          <Select
            v-model="editForm.role"
            :options="roleOptions"
            optionLabel="label"
            optionValue="code"
            class="w-full h-10 text-xs font-medium"
          />
        </div>
        <div>
          <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-1">Trạng thái tài khoản</label>
          <Select
            v-model="editForm.status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="code"
            class="w-full h-10 text-xs font-medium"
          />
        </div>
        <div>
          <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-1">Mật khẩu mới (Để trống nếu không đổi)</label>
          <input
            v-model="editForm.password"
            type="password"
            placeholder="••••••••"
            class="w-full h-10 px-3.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8E3E2F] focus:ring-2 focus:ring-[#8E3E2F]/20"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2 pt-3">
          <button
            @click="showEditModal = false"
            class="h-10 px-4 bg-[#F2ECE4] text-[#42493d] font-semibold text-xs rounded-xl hover:bg-[#E8DFD5] transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            @click="handleSaveEdit"
            :disabled="savingEdit"
            class="h-10 px-4 bg-[#8E3E2F] text-white font-semibold text-xs rounded-xl hover:bg-[#6E281C] transition flex items-center gap-1.5 disabled:opacity-70 cursor-pointer shadow-sm"
          >
            <span v-if="savingEdit" class="material-symbols-outlined animate-spin text-sm">progress_activity</span>
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </template>
    </Dialog>

    <!-- Delete Confirmation Modal -->
    <Dialog v-model:visible="showDeleteModal" header="Xác nhận xóa tài khoản" :modal="true" :style="{ width: '420px' }">
      <p class="text-xs text-[#42493d] py-2">
        Bạn có chắc chắn muốn xóa tài khoản <strong class="text-[#1e1b1b]">{{ deletingUser?.name }}</strong> ({{ deletingUser?.email }})? Hành động này không thể hoàn tác.
      </p>
      <template #footer>
        <div class="flex justify-end gap-2 pt-2">
          <button
            @click="showDeleteModal = false"
            class="h-10 px-4 bg-[#F2ECE4] text-[#42493d] font-semibold text-xs rounded-xl hover:bg-[#E8DFD5] transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            @click="confirmDelete"
            :disabled="deleting"
            class="h-10 px-4 bg-[#ba1a1a] text-white font-semibold text-xs rounded-xl hover:bg-[#93000a] transition flex items-center gap-1.5 disabled:opacity-70 cursor-pointer shadow-sm"
          >
            <span v-if="deleting" class="material-symbols-outlined animate-spin text-sm">progress_activity</span>
            <span>Xóa tài khoản</span>
          </button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped lang="scss" src="./UserList.scss"></style>
