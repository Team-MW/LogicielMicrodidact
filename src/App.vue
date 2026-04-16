<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'

const route = useRoute()
const layout = computed(() => route.meta.layout || 'admin')
</script>

<template>
  <template v-if="layout === 'admin'">
    <AppLayout />
  </template>
  <template v-else>
    <RouterView />
  </template>
</template>

<style>
/* Global styles if needed, but everything is in main.css and tailwind */
</style>
