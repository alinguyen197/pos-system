import { ref } from 'vue'

export interface ApiValidationError {
  field: string
  messageCode?: string
  message: string
}

export function useApiError() {
  const fieldErrors = ref<Record<string, string>>({})
  const generalError = ref<string>('')

  const clearErrors = () => {
    fieldErrors.value = {}
    generalError.value = ''
  }

  const setApiError = (error: any, fallbackMessage = 'Đã xảy ra lỗi.') => {
    clearErrors()

    if (!error) {
      generalError.value = fallbackMessage
      return
    }

    // 1. Nếu error có mảng errors chi tiết (Format chuẩn từ BE: { success: false, errors: [{ field, message }] })
    const errorsList: ApiValidationError[] =
      error?.errors || error?.response?.data?.errors || []

    if (Array.isArray(errorsList) && errorsList.length > 0) {
      errorsList.forEach((item) => {
        if (item.field) {
          fieldErrors.value[item.field] = item.message
        }
      })
      generalError.value =
        error?.message ||
        error?.response?.data?.message ||
        errorsList[0]?.message ||
        fallbackMessage
      return
    }

    // 2. Nếu chỉ có thông báo lỗi dạng string
    const msg =
      error?.message ||
      error?.response?.data?.message ||
      (typeof error === 'string' ? error : fallbackMessage)

    generalError.value = msg
  }

  const getFieldError = (field: string): string => {
    return fieldErrors.value[field] || ''
  }

  const hasFieldError = (field: string): boolean => {
    return !!fieldErrors.value[field]
  }

  return {
    fieldErrors,
    generalError,
    clearErrors,
    setApiError,
    getFieldError,
    hasFieldError,
  }
}
