<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Select from 'primevue/select'
import { fetchMasterCodes } from '@/api/masterCode.api'
import { userApi } from '@/api/user.api'
import { MASTER_CODES } from '@/constants/masterCodes'
import { useAppToast } from '@/composables/useAppToast'

const router = useRouter()
const { showSuccess, showWarning, showError } = useAppToast()

const fullName = ref('')
const email = ref('')
const password = ref('')
const role = ref<string>(MASTER_CODES.USER_ROLE.STAFF)
const submitting = ref(false)

const roleOptions = ref<{ code: string; label: string }[]>([
  { code: MASTER_CODES.USER_ROLE.ADMIN, label: 'Quản trị viên' },
  { code: MASTER_CODES.USER_ROLE.MANAGER, label: 'Quản lý cửa hàng' },
  { code: MASTER_CODES.USER_ROLE.STAFF, label: 'Nhân viên thu ngân / Pha chế' },
  { code: MASTER_CODES.USER_ROLE.VIEWER, label: 'Người xem' },
])

const loadMasterCodes = async () => {
  try {
    const data = await fetchMasterCodes('USER_ROLE')
    if (data.length > 0) {
      roleOptions.value = data.map((item) => ({
        code: item.code,
        label: item.label,
      }))
    }
  } catch (error) {
    console.error('Failed to load user role master codes:', error)
  }
}

onMounted(() => {
  loadMasterCodes()
})

const handleSubmit = async () => {
  if (!fullName.value.trim() || !email.value.trim() || !password.value.trim()) {
    showWarning('Vui lòng điền đầy đủ các thông tin bắt buộc')
    return
  }

  submitting.value = true
  try {
    await userApi.createUser({
      name: fullName.value.trim(),
      email: email.value.trim(),
      password: password.value.trim(),
      role: role.value,
      status: 'active',
    })

    showSuccess(`Đã khởi tạo tài khoản cho nhân viên "${fullName.value.trim()}" thành công!`)
    router.push('/users')
  } catch (error: any) {
    console.error('Failed to create user:', error)
    showError(error?.response?.data?.message || 'Không thể tạo mới tài khoản người dùng')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="user-create-page flex flex-col gap-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e9e0e0]">
      <div>
        <h1 class="text-2xl font-bold font-display text-[#1e1b1b]">Thêm người dùng mới</h1>
        <p class="text-xs text-[#42493d] mt-1 font-medium">Khởi tạo nhân sự mới và cấp quyền truy cập hệ thống Sky Coffee</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="router.back()"
          class="h-10 px-4 bg-[#f5eceb] hover:bg-[#efe6e6] text-[#42493d] font-semibold text-xs rounded-xl border border-[#c1c9b9]/60 transition cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          @click="handleSubmit"
          :disabled="submitting"
          class="h-10 px-5 bg-[#8d6749] hover:bg-[#6e4e34] text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-2 disabled:opacity-70 cursor-pointer"
        >
          <span v-if="submitting" class="material-symbols-outlined animate-spin text-lg">progress_activity</span>
          <span v-else class="material-symbols-outlined text-lg">check</span>
          <span>Khởi tạo tài khoản</span>
        </button>
      </div>
    </div>

    <!-- Form Container Card -->
    <div class="bg-white rounded-2xl border border-[#e9e0e0] shadow-sm p-6 sm:p-8">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="border-b border-[#e9e0e0] pb-4">
          <h2 class="text-base font-bold font-display text-[#1e1b1b]">Thông tin nhân sự & Phân quyền</h2>
          <p class="text-xs text-[#72796c] mt-0.5">Điền chính xác email công việc để kích hoạt tài khoản đăng nhập</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <!-- Full Name -->
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-2">Họ và tên nhân viên *</label>
            <input
              v-model="fullName"
              type="text"
              required
              placeholder="Nguyễn Văn A"
              class="w-full h-10 px-3.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8d6749] focus:ring-2 focus:ring-[#8d6749]/20"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-2">Email đăng nhập *</label>
            <input
              v-model="email"
              type="email"
              required
              placeholder="nhanvien@skycoffee.vn"
              class="w-full h-10 px-3.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8d6749] focus:ring-2 focus:ring-[#8d6749]/20"
            />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-2">Mật khẩu khởi tạo *</label>
            <input
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full h-10 px-3.5 bg-white border border-[#c1c9b9]/70 rounded-xl text-xs font-medium text-[#1e1b1b] outline-none focus:border-[#8d6749] focus:ring-2 focus:ring-[#8d6749]/20"
            />
          </div>

          <!-- Role (Searchable Dropdown) -->
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-2">Vai trò truy cập (Role) *</label>
            <Select
              v-model="role"
              :options="roleOptions"
              optionLabel="label"
              optionValue="code"
              filter
              placeholder="Tìm & chọn vai trò..."
              class="w-full h-10 text-xs font-medium"
            />
          </div>
        </div>

        <div class="p-4 bg-[#fff8f7] rounded-xl border border-[#e9e0e0] flex items-center gap-3 text-xs text-[#42493d]">
          <span class="material-symbols-outlined text-[#8d6749] text-xl">security</span>
          <span>Tài khoản mới sẽ được cấp quyền truy cập các màn hình tương ứng ngay sau khi khởi tạo thành công.</span>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./UserCreate.scss"></style>
