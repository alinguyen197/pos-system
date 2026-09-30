<script setup lang="ts">
import Dialog from 'primevue/dialog'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <Dialog
    :visible="visible"
    header="Cảnh báo chưa lưu"
    modal
    :closable="false"
    class="w-[400px]"
  >
    <div class="flex flex-col gap-4 text-[#1e1b1b] text-sm">
      <p>
        Bạn đang có thay đổi chưa lưu. Bạn có chắc chắn muốn rời khỏi trang này?
        Mọi thông tin đang nhập sẽ bị mất.
      </p>
    </div>
    <template #footer>
      <div class="flex justify-end gap-3 mt-4">
        <button
          @click="emit('cancel')"
          class="h-9 px-4 rounded-xl text-xs font-semibold bg-[#F2ECE4] text-[#42493d] hover:bg-[#E8DFD5] transition"
        >
          Ở lại
        </button>
        <button
          @click="emit('confirm')"
          class="h-9 px-4 rounded-xl text-xs font-semibold bg-[#ba1a1a] text-white hover:bg-[#93000a] transition shadow-sm"
        >
          Rời khỏi
        </button>
      </div>
    </template>
  </Dialog>
</template>
