import { useToast } from 'primevue/usetoast'

export interface ToastPayload {
  severity: 'success' | 'info' | 'warn' | 'error'
  summary: string
  detail: string
  life?: number
}

// Standalone global trigger (dùng được cả bên ngoài Vue setup context như Axios interceptor)
const recentToastMap = new Map<string, number>()
const DEDUPLICATION_INTERVAL_MS = 1500

export function dispatchAppToast(payload: ToastPayload) {
  const now = Date.now()
  const key = `${payload.severity}:${payload.summary}:${payload.detail}`
  const lastTime = recentToastMap.get(key)

  if (lastTime && now - lastTime < DEDUPLICATION_INTERVAL_MS) {
    // Bỏ qua toast trùng lặp trong khoảng 1.5s
    return
  }

  recentToastMap.set(key, now)

  // Dọn dẹp cache cũ sau 5s
  setTimeout(() => {
    recentToastMap.delete(key)
  }, 5000)

  window.dispatchEvent(
    new CustomEvent('sky-app-toast', {
      detail: payload,
    })
  )
}

export function showGlobalError(detail: string, summary: string = 'Thất bại') {
  dispatchAppToast({ severity: 'error', summary, detail, life: 5000 })
}

export function showGlobalSuccess(detail: string, summary: string = 'Thành công') {
  dispatchAppToast({ severity: 'success', summary, detail, life: 3500 })
}

export function showGlobalWarning(detail: string, summary: string = 'Cảnh báo') {
  dispatchAppToast({ severity: 'warn', summary, detail, life: 4000 })
}

export function useAppToast() {
  let toast: any = null
  try {
    toast = useToast()
  } catch (e) {
    // Không ở trong Vue setup context
  }

  const showSuccess = (detail: string, summary: string = 'Thành công') => {
    dispatchAppToast({ severity: 'success', summary, detail, life: 3500 })
  }

  const showError = (detail: string, summary: string = 'Thất bại') => {
    dispatchAppToast({ severity: 'error', summary, detail, life: 5000 })
  }

  const showWarning = (detail: string, summary: string = 'Cảnh báo') => {
    dispatchAppToast({ severity: 'warn', summary, detail, life: 4000 })
  }

  const showInfo = (detail: string, summary: string = 'Thông tin') => {
    dispatchAppToast({ severity: 'info', summary, detail, life: 3000 })
  }

  return {
    toast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}

