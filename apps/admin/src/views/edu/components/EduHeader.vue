<script setup lang="ts">
import { brand } from '@/api/edu/brand'
defineProps<{ title: string; description: string; eyebrow?: string }>()
</script>
<template>
  <header class="edu-page-header"
    ><div
      ><p class="edu-eyebrow">{{ eyebrow || brand.brandName + ' / 教学运营' }}</p
      ><h1>{{ title }}</h1
      ><p class="edu-description">{{ description }}</p></div
    ><div class="edu-header-actions"><slot /></div
  ></header>
</template>
