import { ref, computed } from 'vue'

const isSidebarCollapsed = ref(false)
const isMobileSidebarOpen = ref(false)
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)

const updateWidth = () => {
  if (typeof window !== 'undefined') {
    windowWidth.value = window.innerWidth
    // Auto collapse sidebar on tablet, close mobile drawer on desktop resize
    if (windowWidth.value >= 1024) {
      isMobileSidebarOpen.value = false
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('resize', updateWidth)
}

export function useLayout() {
  const isMobile = computed(() => windowWidth.value < 768)
  const isTablet = computed(() => windowWidth.value >= 768 && windowWidth.value < 1024)
  const isDesktop = computed(() => windowWidth.value >= 1024)

  const toggleSidebar = () => {
    if (isMobile.value) {
      isMobileSidebarOpen.value = !isMobileSidebarOpen.value
    } else {
      isSidebarCollapsed.value = !isSidebarCollapsed.value
    }
  }

  const openMobileSidebar = () => {
    isMobileSidebarOpen.value = true
  }

  const closeMobileSidebar = () => {
    isMobileSidebarOpen.value = false
  }

  return {
    isSidebarCollapsed,
    isMobileSidebarOpen,
    windowWidth,
    isMobile,
    isTablet,
    isDesktop,
    toggleSidebar,
    openMobileSidebar,
    closeMobileSidebar,
  }
}

