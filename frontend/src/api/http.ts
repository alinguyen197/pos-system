import axios, { AxiosError, AxiosInstance } from 'axios'
import { router } from '@/routers'
import { useGlobalLoading } from '@/composables/useGlobalLoading'
import { showGlobalError } from '@/composables/useAppToast'
import { useAuth } from '@/composables/useAuth'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30s timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

const { startLoading, stopLoading } = useGlobalLoading()

let globalAbortController = new AbortController()

export function abortPendingRequests(reason = 'Canceled due to API error') {
  globalAbortController.abort(reason)
  globalAbortController = new AbortController()
}

// Request interceptor: thêm token, signal & trigger global loading
http.interceptors.request.use(
  (config: any) => {
    // Đính kèm global AbortController signal nếu chưa có custom signal
    if (!config.signal) {
      config.signal = globalAbortController.signal
    }

    const isSilent = config.headers && (config.headers['x-silent-loading'] === 'true' || config.headers['x-silent-loading'] === true)
    if (!isSilent) {
      startLoading()
    }
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    stopLoading()
    return Promise.reject(error)
  },
)

// Response interceptor chuẩn hóa theo 01_API_Response_Standard.md & 02_API_Error_Handling.md
http.interceptors.response.use(
  (response) => {
    const isSilent = response.config.headers && (response.config.headers['x-silent-loading'] === 'true' || response.config.headers['x-silent-loading'] === true)
    if (!isSilent) {
      stopLoading()
    }
    return response
  },
  (error: AxiosError) => {
    // Bỏ qua im lặng đối với các request bị hủy (Canceled Request)
    if (axios.isCancel(error) || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      return Promise.reject(error)
    }

    const isSilent = error.config?.headers && (error.config.headers['x-silent-loading'] === 'true' || error.config.headers['x-silent-loading'] === true)
    const isSilentToast = error.config?.headers && (error.config.headers['x-silent-toast'] === 'true' || error.config.headers['x-silent-toast'] === true)
    if (!isSilent) {
      stopLoading()
    }

    // 1. Mất kết nối mạng (Network Error / No Response) -> Hủy tất cả các request song song khác
    if (!error.response) {
      abortPendingRequests('Network connection error')
      if (!isSilentToast) {
        showGlobalError('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet hoặc máy chủ.')
      }
      return Promise.reject(error)
    }

    const status = error.response.status
    const errorData: any = error.response.data

    // 2. Lỗi Validation 400 Bad Request -> Trả về data chứa errors để Component tự map hiển thị tại chỗ (inline)
    if (status === 400) {
      const msg = errorData?.message || 'Dữ liệu nhập vào không hợp lệ.'
      if (!isSilentToast) {
        showGlobalError(msg, 'Lỗi dữ liệu')
      }
      return Promise.reject(errorData || error)
    }

    // 3. Lỗi Conflict 409 -> Cảnh báo dữ liệu đã bị sửa
    if (status === 409) {
      if (!isSilentToast) {
        showGlobalError('Dữ liệu đã được cập nhật bởi người khác. Vui lòng tải lại trang.', 'Xung đột dữ liệu')
      }
      return Promise.reject(error)
    }

    // 4. Lỗi Rate Limit 429 -> Hiển thị Toast
    if (status === 429) {
      if (!isSilentToast) {
        showGlobalError(errorData?.message || 'Quá nhiều yêu cầu. Vui lòng thử lại sau.')
      }
      return Promise.reject(error)
    }

    // 5. Lỗi 500 Internal Server Error & Các lỗi hệ thống -> Hủy các request song song còn lại
    if (status >= 500) {
      abortPendingRequests('Internal server error (500)')
      const serverErrMsg = errorData?.message || 'Đã xảy ra lỗi máy chủ (HTTP 500). Vui lòng thử lại hoặc liên hệ quản trị viên.'
      if (!isSilentToast) {
        showGlobalError(serverErrMsg, 'Lỗi Server (500)')
      }
      if (router.currentRoute.value.name !== 'ErrorPage') {
        router.push({ name: 'ErrorPage', query: { code: 'MSG_ERR_COM_00901' } })
      }
      return Promise.reject(error)
    }

    // 6. Lỗi 401 Unauthorized -> Hủy các request song song khác, xóa session & đá về trang Đăng nhập
    if (status === 401) {
      abortPendingRequests('Unauthorized (401)')
      const { logout } = useAuth()
      logout()

      const authErrMsg = errorData?.message || 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
      if (!isSilentToast) {
        showGlobalError(authErrMsg, 'Phiên hết hạn')
      }

      if (router.currentRoute.value.name !== 'Login') {
        const currentPath = router.currentRoute.value.fullPath
        router.push({
          name: 'Login',
          query: currentPath && currentPath !== '/login' ? { redirect: currentPath } : undefined,
        })
      }
      return Promise.reject(error)
    }

    // 7. Lỗi 403, 404, 408 -> Hủy các request song song còn lại & chuyển hướng ErrorPage
    abortPendingRequests(`HTTP ${status} Error`)
    const errorMessages: Record<number, { code: string; message: string }> = {
      403: { code: 'MSG_ERR_COM_00903', message: 'Bạn không có quyền thực hiện thao tác này.' },
      404: { code: 'MSG_ERR_COM_00904', message: 'Không tìm thấy tài nguyên yêu cầu.' },
      408: { code: 'MSG_ERR_COM_00905', message: 'Yêu cầu đã hết thời gian chờ.' },
    }

    const errInfo = errorMessages[status] || { code: 'MSG_ERR_COM_00901', message: 'Đã xảy ra lỗi hệ thống.' }
    if (!isSilentToast) {
      showGlobalError(errInfo.message)
    }
    if (router.currentRoute.value.name !== 'ErrorPage') {
      router.push({ name: 'ErrorPage', query: { code: errInfo.code } })
    }

    return Promise.reject(error)
  },
)

export { http }
export default http
