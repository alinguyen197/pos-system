<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import Toolbar from 'primevue/toolbar'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import Badge from 'primevue/badge'
import OverlayPanel from 'primevue/overlaypanel'
import Tag from 'primevue/tag'
import { useLayout } from '@/composables/useLayout'
import { useAuth } from '@/composables/useAuth'
import { useAppToast } from '@/composables/useAppToast'

const route = useRoute()
const { toggleSidebar } = useLayout()
const { currentUser, role, logout } = useAuth()
const { showSuccess } = useAppToast()

const op = ref()

const roleLabelMap: Record<string, string> = {
  admin: 'Super Admin',
  manager: 'Quản lý cửa hàng',
  staff: 'Nhân viên thu ngân / Pha chế',
  viewer: 'Người xem',
}

const roleSeverityMap: Record<string, 'danger' | 'success' | 'info' | 'warn' | 'secondary'> = {
  admin: 'danger',
  manager: 'success',
  staff: 'info',
  viewer: 'secondary',
}

const displayRoleName = computed(() => roleLabelMap[role.value] || role.value || 'Super Admin')
const displayRoleSeverity = computed(() => roleSeverityMap[role.value] || 'info')

const pageTitle = computed(() => {
  if (route.path === '/') return 'Dashboard > Tổng quan'
  if (route.path === '/pos') return 'Dashboard > Bán hàng (POS)'
  if (route.path.startsWith('/products')) return 'Dashboard > Quản lý Sản phẩm'
  if (route.path.startsWith('/ingredients')) return 'Dashboard > Kho Nguyên liệu'
  if (route.path.startsWith('/stock-imports')) return 'Dashboard > Nhập kho Nguyên liệu'
  if (route.path.startsWith('/users')) return 'Dashboard > Quản lý Người dùng'
  if (route.path.startsWith('/reports')) return 'Dashboard > Báo cáo Doanh số'
  return 'Dashboard'
})

const toggleUserMenu = (event: Event) => {
  if (op.value) {
    op.value.toggle(event)
  }
}

const handleLogout = () => {
  logout()
  showSuccess('Đã đăng xuất khỏi hệ thống thành công!')
  window.location.href = '/login'
}
</script>

<template>
  <Toolbar class="app-header-toolbar">
    <template #start>
      <div class="header-left">
        <Button
          icon="pi pi-bars"
          severity="secondary"
          text
          rounded
          style="color: #ffffff;"
          title="Thu gọn / Mở rộng Sidebar"
          @click="toggleSidebar"
        />
        <span class="breadcrumb-title">{{ pageTitle }}</span>
      </div>
    </template>

    <template #end>
      <div class="header-right flex items-center gap-3">
        <div class="relative">
          <Button icon="pi pi-bell" severity="secondary" text rounded style="color: #ffffff;" aria-label="Notifications" />
          <Badge severity="danger" class="absolute -top-1 -right-1 p-overlay-badge" />
        </div>

        <!-- User Profile Avatar Pill with Popover Dropdown Dialog -->
        <div
          class="flex items-center gap-2.5 pl-3 pr-2 py-1 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 cursor-pointer transition select-none"
          title="Nhấp để xem thông tin và đăng xuất"
          @click="toggleUserMenu"
        >
          <Avatar
            v-if="currentUser.avatarUrl"
            :image="currentUser.avatarUrl"
            shape="circle"
            style="width: 32px; height: 32px;"
          />
          <Avatar
            v-else
            :label="(currentUser.name || 'A').charAt(0).toUpperCase()"
            shape="circle"
            style="background-color: #ffffff; color: #8d6749; font-weight: 800; width: 32px; height: 32px;"
          />
          <div class="hidden sm:flex flex-col text-left text-white leading-tight">
            <span class="text-xs font-bold truncate max-w-[120px]">{{ currentUser.name || 'User' }}</span>
            <span class="text-[10px] text-white/80 font-medium truncate">{{ displayRoleName }}</span>
          </div>
          <i class="pi pi-chevron-down text-xs text-white/80 ml-1"></i>
        </div>

        <!-- User Profile Popover Dialog -->
        <OverlayPanel ref="op" class="user-menu-popover shadow-2xl rounded-2xl border border-[#e9e0e0] p-0 overflow-hidden w-72">
          <div class="p-4 bg-[#fff8f7] border-b border-[#e9e0e0] flex items-center gap-3">
            <Avatar
              v-if="currentUser.avatarUrl"
              :image="currentUser.avatarUrl"
              shape="circle"
              size="large"
            />
            <Avatar
              v-else
              :label="(currentUser.name || 'A').charAt(0).toUpperCase()"
              shape="circle"
              size="large"
              style="background-color: #8d6749; color: #ffffff; font-weight: 800;"
            />
            <div class="flex flex-col min-w-0 text-left">
              <span class="text-sm font-bold text-[#1e1b1b] truncate">{{ currentUser.name || 'User' }}</span>
              <span class="text-xs text-[#72796c] truncate mb-1">{{ currentUser.email || 'user@skycoffee.vn' }}</span>
              <Tag :severity="displayRoleSeverity" class="text-[10px] px-2 py-0.5 w-max font-semibold">
                {{ displayRoleName }}
              </Tag>
            </div>
          </div>

          <div class="p-2 space-y-1">
            <div class="px-3 py-2 text-xs text-[#72796c] flex items-center justify-between">
              <span>Trạng thái tài khoản:</span>
              <span class="px-2 py-0.5 bg-[#e8f5e9] text-[#2e7d32] font-semibold text-[10px] rounded-full border border-[#c8e6c9]">
                Hoạt động
              </span>
            </div>

            <hr class="border-[#e9e0e0] my-1" />

            <button
              type="button"
              @click="handleLogout"
              class="w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6] transition flex items-center gap-2 cursor-pointer"
            >
              <i class="pi pi-sign-out text-sm"></i>
              <span>Đăng xuất khỏi hệ thống</span>
            </button>
          </div>
        </OverlayPanel>
      </div>
    </template>
  </Toolbar>
</template>

<style scoped lang="scss" src="./Header.scss"></style>
