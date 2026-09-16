<script setup lang="ts">
import { ref, watch } from 'vue'
import { eduApi, errorMessage, type EduResource, type EduRecord } from '@/api/edu'
import { getSimpleUserList } from '@/api/system/user'
import { getSimpleDeptList } from '@/api/system/dept'
const props = defineProps<{
  modelValue?: number
  resource: EduResource | 'system-user' | 'system-dept'
  placeholder?: string
  filters?: Record<string, any>
}>()
const emit = defineEmits<{ 'update:modelValue': [value: number | undefined] }>()
const options = ref<EduRecord[]>([]),
  loading = ref(false),
  error = ref('')
let requestId = 0
async function search(keyword = '') {
  const current = ++requestId
  loading.value = true
  error.value = ''
  try {
    let data: any[]
    if (props.resource === 'system-user') data = await getSimpleUserList()
    else if (props.resource === 'system-dept') data = await getSimpleDeptList()
    else
      data = (
        await eduApi.page(props.resource, { pageNo: 1, pageSize: 100, keyword, ...props.filters })
      ).list
    if (current === requestId)
      options.value = data.map((item) => ({
        ...item,
        name: item.name || item.nickname || item.studentName || item.title || `编号 ${item.id}`
      }))
  } catch (e) {
    if (current === requestId) {
      options.value = []
      error.value = errorMessage(e)
    }
  } finally {
    if (current === requestId) loading.value = false
  }
}
watch(
  () => [props.resource, props.filters],
  () => search(),
  { immediate: true, deep: true }
)
</script>
<template>
  <div style="width: 100%"
    ><el-select
      :model-value="modelValue"
      filterable
      remote
      :remote-method="search"
      :loading="loading"
      :placeholder="placeholder || '输入名称搜索'"
      clearable
      style="width: 100%"
      @update:model-value="emit('update:modelValue', $event || undefined)"
      ><el-option
        v-if="modelValue && !options.some((item) => item.id === modelValue)"
        :value="modelValue"
        :label="`已选编号 ${modelValue}`" /><el-option
        v-for="item in options"
        :key="item.id"
        :value="item.id"
        :label="`${item.name} · #${item.id}`" /></el-select
    ><p v-if="error" role="alert" class="edu-inline-note" style="color: var(--el-color-danger)">{{
      error
    }}</p></div
  >
</template>
