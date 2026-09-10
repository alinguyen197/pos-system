<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLayout } from '@/composables/useLayout'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const { isSidebarCollapsed } = useLayout()
const { isAllowedRoute } = useAuth()

const allMenuItems = [
  { path: '/', title: 'Dashboard', icon: 'pi pi-th-large', matchPrefix: false },
  { path: '/pos', title: 'Bán hàng (POS)', icon: 'pi pi-shopping-bag', matchPrefix: false },
  { path: '/products', title: 'Sản phẩm', icon: 'pi pi-box', matchPrefix: true },
  { path: '/ingredients', title: 'Kho nguyên liệu', icon: 'pi pi-database', matchPrefix: true },
  { path: '/stock-imports/create', title: 'Nhập kho', icon: 'pi pi-file-import', matchPrefix: true },
  { path: '/users', title: 'Người dùng', icon: 'pi pi-users', matchPrefix: true },
  { path: '/reports/sales', title: 'Báo cáo doanh số', icon: 'pi pi-chart-bar', matchPrefix: true },
]

const visibleMenuItems = computed(() => {
  return allMenuItems.filter((item) => isAllowedRoute(item.path))
})

const isActiveRoute = (item: { path: string; matchPrefix: boolean }) => {
  if (item.path === '/') return route.path === '/'
  if (item.matchPrefix) return route.path.startsWith(item.path)
  return route.path === item.path
}
</script>

<template>
  <aside class="app-sidebar" :class="{ collapsed: isSidebarCollapsed }">
    <!-- Brand Logo -->
    <div class="brand-box">
      <div class="brand-icon">
        <img src="/logo.png" alt="Mì Trộn Cô Xi Logo" class="brand-logo-img" />
      </div>
      <div class="brand-text">
        <span class="title">Mì Trộn Cô Xi</span>
        <span class="subtitle">XUXI Management</span>
      </div>
    </div>

    <!-- Dynamic Navigation List based on Role -->
    <div class="nav-group flex-1">
      <RouterLink
        v-for="item in visibleMenuItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: isActiveRoute(item) }"
        :title="item.title"
      >
        <i :class="item.icon"></i>
        <span>{{ item.title }}</span>
      </RouterLink>
    </div>
  </aside>
</template>

<style scoped lang="scss" src="./Navbar.scss"></style>
