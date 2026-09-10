<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import Header from '@/components/layout/header/Header.vue'
import Navbar from '@/components/layout/navbar/Navbar.vue'
import Footer from '@/components/layout/footer/Footer.vue'
import CoffeeLoadingOverlay from '@/components/common/CoffeeLoadingOverlay.vue'
import { useGlobalLoading } from '@/composables/useGlobalLoading'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const toast = useToast()
const { isLoggedIn } = useAuth()
const { isGlobalLoading } = useGlobalLoading()

const handleAppToast = (e: any) => {
  if (e?.detail) {
    toast.add({
      severity: e.detail.severity || 'error',
      summary: e.detail.summary || 'Thông báo',
      detail: e.detail.detail || '',
      life: e.detail.life || 4500,
    })
  }
}

onMounted(() => {
  window.addEventListener('sky-app-toast', handleAppToast)
  ;(window as any).__toggleLoading = (show: boolean) => {
    if (show) {
      useGlobalLoading().startLoading()
    } else {
      useGlobalLoading().resetLoading()
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('sky-app-toast', handleAppToast)
})

const showLoadingOverlay = computed(() => {
  return isGlobalLoading.value || route.query.previewLoading === 'true'
})

const isLoginPage = computed(() => {
  return !isLoggedIn.value || route.name === 'Login' || route.path.startsWith('/login')
})
</script>

<template>
  <div v-if="isLoginPage" class="login-layout">
    <RouterView v-slot="{ Component, route }">
      <transition name="page-fade" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </RouterView>
  </div>

  <div v-else class="app-layout">
    <Header />
    <div class="app-body">
      <Navbar />
      <main class="app-main">
        <RouterView v-slot="{ Component, route }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </RouterView>
      </main>
    </div>
    <Footer />
  </div>

  <!-- Cute Noodle Plate Loading Overlay with Screen Interaction Lock -->
  <CoffeeLoadingOverlay v-if="showLoadingOverlay" />

  <!-- Global PrimeVue Toast - Positioned last so DOM order & z-index strictly float on top -->
  <Toast position="top-right" />
</template>

<style scoped lang="scss">
.login-layout {
  min-height: 100vh;
  background-color: var(--color-bg-canvas, #F9F6F0);
}

:deep(.p-toast),
:global(.p-toast) {
  z-index: 1000000 !important;
}

.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;

  .app-body {
    display: flex;
    flex: 1;
    overflow: hidden;

    .app-main {
      flex: 1;
      padding: 1.25rem;
      background-color: var(--color-bg-canvas, #f5f5dc);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
  }
}
</style>
