<script setup lang="ts">
import Button from 'primevue/button'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="not-found-page">
    <h1>404</h1>
    <h2>Không tìm thấy trang yêu cầu</h2>
    <p>Trang bạn truy cập không tồn tại hoặc đã được di chuyển.</p>
    <Button label="Về trang chủ" icon="pi pi-home" severity="primary" @click="router.push('/')" />
  </div>
</template>

<style scoped lang="scss" src="./NotFoundPage.scss"></style>
