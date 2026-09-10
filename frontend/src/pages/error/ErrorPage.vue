<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const errorMap: Record<string, { title: string; message: string; icon: string }> = {
  MSG_ERR_COM_00901: {
    title: 'Lỗi hệ thống',
    message: 'Đã xảy ra lỗi hệ thống. Vui lòng liên hệ quản trị viên.',
    icon: 'report_problem',
  },
  MSG_ERR_COM_00902: {
    title: 'Phiên đăng nhập hết hạn',
    message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    icon: 'lock_clock',
  },
  MSG_ERR_COM_00903: {
    title: 'Không có quyền truy cập',
    message: 'Bạn không có quyền thực hiện thao tác này.',
    icon: 'gpp_bad',
  },
  MSG_ERR_COM_00904: {
    title: 'Không tìm thấy tài nguyên',
    message: 'Tài nguyên yêu cầu không tồn tại hoặc đã bị xóa.',
    icon: 'find_in_page',
  },
  MSG_ERR_COM_00905: {
    title: 'Hết thời gian chờ',
    message: 'Yêu cầu đã hết thời gian chờ. Vui lòng thử lại.',
    icon: 'hourglass_disabled',
  },
  MSG_ERR_COM_00907: {
    title: 'Hệ thống bảo trì',
    message: 'Hệ thống đang bảo trì. Vui lòng quay lại sau.',
    icon: 'engineering',
  },
}

const errorInfo = computed(() => {
  const code = (route.query.code as string) || 'MSG_ERR_COM_00901'
  return errorMap[code] || errorMap['MSG_ERR_COM_00901']
})
</script>

<template>
  <div class="min-h-screen bg-[#fff8f7] flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl border border-[#e9e0e0] shadow-lg p-8 sm:p-12 max-w-md w-full text-center flex flex-col items-center gap-5">
      <div class="w-20 h-20 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shadow-inner">
        <span class="material-symbols-outlined text-4xl">{{ errorInfo.icon }}</span>
      </div>

      <div class="space-y-2">
        <h1 class="text-2xl font-bold font-display text-[#1e1b1b]">{{ errorInfo.title }}</h1>
        <p class="text-xs text-[#72796c] leading-relaxed">{{ errorInfo.message }}</p>
      </div>

      <div class="flex items-center gap-3 mt-4 w-full">
        <button
          @click="router.back()"
          class="flex-1 py-3 px-4 bg-[#f5eceb] hover:bg-[#efe6e6] text-[#42493d] text-xs font-bold rounded-xl border border-[#c1c9b9]/60 transition"
        >
          Quay lại
        </button>
        <router-link
          to="/"
          class="flex-1 py-3 px-4 bg-[#8d6749] hover:bg-[#6e4e34] text-white text-xs font-bold rounded-xl transition text-center shadow-sm"
        >
          Trang chủ
        </router-link>
      </div>
    </div>
  </div>
</template>
