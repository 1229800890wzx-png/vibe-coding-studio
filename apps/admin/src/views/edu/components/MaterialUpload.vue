<script setup lang="ts">
import { ref } from 'vue'
import { eduApi, errorMessage } from '@/api/edu'
import PrivateAttachments from './PrivateAttachments.vue'

type Material = { fileId: number; name: string }
const props = defineProps<{ modelValue?: Material[]; cohortId?: number }>()
const emit = defineEmits<{ 'update:modelValue': [value: Material[]]; busy: [value: boolean] }>()
const input = ref<HTMLInputElement>(),
  uploading = ref(false),
  error = ref('')
async function upload(event: Event) {
  const element = event.target as HTMLInputElement
  const file = element.files?.[0]
  element.value = ''
  if (!file || !props.cohortId) return
  error.value = ''
  if (file.size > 30 * 1024 * 1024) {
    error.value = '单个教学材料不能超过 30MB。'
    return
  }
  const cohortId = props.cohortId
  uploading.value = true
  emit('busy', true)
  try {
    const material = await eduApi.uploadMaterial(cohortId, file)
    if (cohortId !== props.cohortId) {
      error.value = '班级已切换，请为当前班级重新添加材料。'
      return
    }
    emit('update:modelValue', [...(props.modelValue || []), material])
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    uploading.value = false
    emit('busy', false)
  }
}
</script>
<template>
  <div style="width: 100%">
    <input ref="input" type="file" hidden @change="upload" />
    <el-button
      :disabled="!cohortId || uploading || (modelValue?.length || 0) >= 10"
      :loading="uploading"
      @click="input?.click()"
      >上传教学材料</el-button
    >
    <p class="edu-inline-note">{{
      cohortId
        ? '每个文件最多 30MB；仅本班已获得学习权益的学员可下载。'
        : '先选择班级，再上传教学材料。'
    }}</p>
    <p v-if="error" role="alert" class="edu-inline-note" style="color: var(--el-color-danger)">{{
      error
    }}</p>
    <div
      v-for="material in modelValue || []"
      :key="material.fileId"
      style="display: flex; align-items: center; gap: 12px"
    >
      <PrivateAttachments :attachments="[material]" />
      <el-button
        link
        type="danger"
        :disabled="uploading"
        @click="
          emit(
            'update:modelValue',
            (modelValue || []).filter((item) => item.fileId !== material.fileId)
          )
        "
        >移除</el-button
      >
    </div>
  </div>
</template>
