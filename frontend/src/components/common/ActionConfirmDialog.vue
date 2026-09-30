<script setup lang="ts">
import Dialog from 'primevue/dialog'

withDefaults(
  defineProps<{
    visible: boolean
    header?: string
    message?: string
    confirmText?: string
    cancelText?: string
    danger?: boolean
  }>(),
  {
    header: 'Xác nhận',
    message: 'Bạn có chắc chắn muốn thực hiện hành động này?',
    confirmText: 'Đồng ý',
    cancelText: 'Hủy',
    danger: false,
  },
)

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'update:visible', value: boolean): void
}>()
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="header"
    modal
    :closable="false"
    class="w-[400px]"
  >
    <div class="flex flex-col gap-4 text-sm text-[#1e1b1b]">
      <p>{{ message }}</p>
    </div>
    <template #footer>
      <div class="mt-4 flex justify-end gap-3">
        <button
          @click="emit('cancel')"
          class="h-9 rounded-xl bg-[#F2ECE4] px-4 text-xs font-semibold text-[#42493d] transition hover:bg-[#E8DFD5]"
        >
          {{ cancelText }}
        </button>
        <button
          @click="emit('confirm')"
          :class="[
            'h-9 rounded-xl px-4 text-xs font-semibold text-white shadow-sm transition',
            danger
              ? 'bg-[#ba1a1a] hover:bg-[#93000a]'
              : 'bg-[#4CAF50] hover:bg-[#43A047]',
          ]"
        >
          {{ confirmText }}
        </button>
      </div>
    </template>
  </Dialog>
</template>
