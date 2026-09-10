import { ref, computed } from 'vue'

const activeRequestCount = ref(0)

export function useGlobalLoading() {
  const startLoading = () => {
    activeRequestCount.value++
  }

  const stopLoading = () => {
    if (activeRequestCount.value > 0) {
      activeRequestCount.value--
    }
  }

  const resetLoading = () => {
    activeRequestCount.value = 0
  }

  const isGlobalLoading = computed(() => activeRequestCount.value > 0)

  return {
    activeRequestCount,
    isGlobalLoading,
    startLoading,
    stopLoading,
    resetLoading,
  }
}
