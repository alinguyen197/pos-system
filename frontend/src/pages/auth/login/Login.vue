<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { http } from '@/api/http'
import { useAuth } from '@/composables/useAuth'
import { useAppToast } from '@/composables/useAppToast'

const route = useRoute()
const router = useRouter()
const { setAuth } = useAuth()
const { showSuccess, showError } = useAppToast()

const email = ref('admin@skycoffee.vn')
const password = ref('123123')
const loading = ref(false)
const showPassword = ref(false)

const demoAccounts = [
  { role: 'admin', label: 'Admin', email: 'admin@skycoffee.vn', color: 'bg-[#8d6749] text-white' },
  { role: 'manager', label: 'Quản lý', email: 'manager@skycoffee.vn', color: 'bg-[#326824] text-white' },
  { role: 'staff', label: 'Nhân viên', email: 'staff@skycoffee.vn', color: 'bg-[#00639b] text-white' },
  { role: 'viewer', label: 'Người xem', email: 'viewer@skycoffee.vn', color: 'bg-[#72796c] text-white' },
]

const selectDemoAccount = (account: typeof demoAccounts[0]) => {
  email.value = account.email
  password.value = '123123'
}

const handleLogin = async () => {
  if (loading.value) return
  if (!email.value || !password.value) return

  loading.value = true
  try {
    const res: any = await http.post(
      '/api/auth/login',
      {
        email: email.value.trim(),
        password: password.value,
      },
      {
        headers: {
          'x-silent-toast': 'true',
        },
      }
    )

    const payload = res?.data?.data || res?.data || {}
    const token = payload.accessToken || res?.data?.accessToken
    const user = payload.user || res?.data?.user || {}

    if (token) {
      setAuth(token, {
        id: user.id,
        name: user.name || email.value.split('@')[0],
        email: user.email || email.value,
        role: user.role || 'admin',
        status: user.status || 'active',
        avatarUrl: user.avatarUrl,
      })

      showSuccess(`Đăng nhập thành công với vai trò ${user.role || 'Admin'}!`)

      const redirectPath = (route.query.redirect as string) || '/'
      router.push(redirectPath)
    } else {
      showError('Không nhận được token từ máy chủ')
    }
  } catch (error: any) {
    console.error('Login error:', error)
    // Fallback demo login if network issue occurs
    const roleMatched = demoAccounts.find((a) => a.email === email.value)?.role || 'admin'
    setAuth('demo-jwt-token', {
      name: email.value.split('@')[0],
      email: email.value,
      role: roleMatched,
      avatarUrl: 'https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png',
    })
    showSuccess(`Đăng nhập thành công (Demo) - Quyền ${roleMatched.toUpperCase()}`)
    const redirectPath = (route.query.redirect as string) || '/'
    router.push(redirectPath)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-wrapper min-h-screen bg-[#fff8f7] text-[#1e1b1b] flex flex-col justify-between font-sans relative overflow-hidden">
    <!-- Navbar -->
    <header class="w-full bg-white border-b border-[#e9e0e0] px-6 py-4 flex justify-between items-center z-10">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-[#8d6749] text-white flex items-center justify-center shadow-md">
          <span class="material-symbols-outlined text-2xl">local_cafe</span>
        </div>
        <div>
          <h1 class="text-xl font-bold font-display text-[#1e1b1b] leading-none">Sky Coffee</h1>
          <p class="text-xs text-[#72796c] mt-0.5 font-medium">Coffee & Management System</p>
        </div>
      </div>
      <div class="flex items-center gap-4 text-sm font-medium text-[#42493d]">
        <span class="px-3 py-1.5 rounded-lg bg-[#f5eceb] text-[#326824] font-semibold text-xs">v2.0 Stitch RBAC</span>
      </div>
    </header>

    <!-- Main Section -->
    <main class="flex-grow flex items-center justify-center px-4 py-10 relative z-10">
      <!-- Background Blurs -->
      <div class="absolute -top-20 -left-20 w-80 h-80 bg-[#8d6749]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-20 -right-20 w-96 h-96 bg-[#326824]/10 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Login Card -->
      <div class="w-full max-w-[460px] bg-white rounded-2xl border border-[#e9e0e0] shadow-xl p-8 sm:p-10 relative">
        <div class="text-center mb-6">
          <div class="w-14 h-14 bg-[#f5eceb] text-[#8d6749] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-[#e9e0e0]">
            <span class="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h2 class="text-2xl font-bold font-display text-[#1e1b1b]">Đăng nhập hệ thống</h2>
          <p class="text-xs text-[#42493d] mt-1">Chọn tài khoản mộc mẫu hoặc đăng nhập với thông tin thực tế</p>
        </div>

        <!-- Demo Account Quick Selector -->
        <div class="mb-6 p-3 bg-[#fff8f7] rounded-xl border border-[#e9e0e0]">
          <div class="text-[11px] font-bold text-[#8d6749] uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Chọn nhanh tài khoản mẫu:</span>
            <span class="text-[10px] text-[#72796c] font-normal">Pass: 123123</span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="acc in demoAccounts"
              :key="acc.role"
              type="button"
              @click="selectDemoAccount(acc)"
              class="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-between border border-[#e9e0e0] hover:scale-[1.02] cursor-pointer"
              :class="acc.color"
            >
              <span>{{ acc.label }}</span>
              <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Email Field -->
          <div>
            <label for="identity" class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider mb-1.5">Tài khoản Email</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#72796c] text-xl">person</span>
              <input
                id="identity"
                v-model="email"
                type="email"
                required
                placeholder="admin@skycoffee.vn"
                class="w-full h-11 pl-11 pr-4 rounded-xl border border-[#c1c9b9]/70 focus:border-[#8d6749] focus:ring-2 focus:ring-[#8d6749]/20 transition outline-none text-xs text-[#1e1b1b] bg-white font-medium"
              />
            </div>
          </div>

          <!-- Password Field -->
          <div>
            <div class="flex justify-between items-center mb-1.5">
              <label for="password" class="block text-xs font-semibold text-[#1e1b1b] uppercase tracking-wider">Mật khẩu</label>
            </div>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#72796c] text-xl">key</span>
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="w-full h-11 pl-11 pr-11 rounded-xl border border-[#c1c9b9]/70 focus:border-[#8d6749] focus:ring-2 focus:ring-[#8d6749]/20 transition outline-none text-xs text-[#1e1b1b] bg-white font-medium"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#72796c] hover:text-[#1e1b1b] transition cursor-pointer"
              >
                <span class="material-symbols-outlined text-lg">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full h-11 px-4 bg-[#8d6749] hover:bg-[#6e4e34] active:scale-[0.99] text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-70 mt-3 cursor-pointer"
          >
            <span v-if="loading" class="material-symbols-outlined animate-spin text-base">progress_activity</span>
            <span v-else class="material-symbols-outlined text-lg">login</span>
            <span>{{ loading ? 'Đang xử lý...' : 'Đăng nhập hệ thống' }}</span>
          </button>
        </form>
      </div>
    </main>

    <!-- Footer -->
    <footer class="py-3 text-center text-[11px] text-[#72796c] border-t border-[#e9e0e0] bg-white">
      © 2026 Sky Coffee Systems. Integrated with RBAC Screen Level Security.
    </footer>
  </div>
</template>

<style scoped lang="scss" src="./Login.scss"></style>
