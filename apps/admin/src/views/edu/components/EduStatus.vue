<script setup lang="ts">
import { computed } from 'vue'
import { statusLabels } from '@/api/edu'
const props = defineProps<{ value?: string }>()
const type = computed(() =>
  ['PUBLISHED', 'ACTIVE', 'REVIEWED', 'APPROVED', 'GRANTED', 'PRESENT', 'CONFIRMED'].includes(
    props.value || ''
  )
    ? 'success'
    : ['REJECTED', 'CANCELLED', 'ABSENT', 'REVOKED'].includes(props.value || '')
      ? 'danger'
      : ['SUBMITTED', 'PENDING', 'PENDING_PAYMENT', 'REVISION_REQUIRED', 'OPEN'].includes(
            props.value || ''
          )
        ? 'warning'
        : 'info'
)
</script>
<template>
  <el-tag :type="type" effect="light" size="small">{{
    statusLabels[value || ''] || value || '—'
  }}</el-tag>
</template>
