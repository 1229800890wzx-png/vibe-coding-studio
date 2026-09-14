<script setup lang="ts">
import { ref } from 'vue'
import { eduApi, errorMessage } from '@/api/edu'
defineProps<{ attachments?: { fileId: number; name?: string }[] }>()
const error = ref(''),
  busy = ref<number>()
async function openFile(fileId: number, name?: string) {
  error.value = ''
  busy.value = fileId
  const viewer = window.open('', '_blank')
  if (viewer) viewer.opener = null
  try {
    const result = await eduApi.fileUrl(fileId)
    const url = typeof result === 'string' ? result : result.url
    const backendBase = import.meta.env.VITE_BASE_URL || window.location.origin
    const parsed = new URL(url, backendBase)
    if (!['http:', 'https:'].includes(parsed.protocol))
      throw new Error('附件地址无效，请联系管理员。')
    const headers = typeof result === 'string' ? {} : result.headers || {}
    if (Object.keys(headers).length && parsed.origin !== new URL(backendBase).origin)
      throw new Error('附件认证地址与当前服务不一致，请联系管理员。')
    const response = await fetch(parsed.href, { headers, credentials: 'omit' })
    if (!response.ok) throw new Error(`附件获取失败（${response.status}），请刷新后重试。`)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    if (
      viewer &&
      ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'].includes(blob.type)
    ) {
      viewer.location.replace(objectUrl)
    } else {
      viewer?.close()
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = name || `附件-${fileId}`
      link.click()
    }
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
  } catch (e) {
    viewer?.close()
    error.value = errorMessage(e)
  } finally {
    busy.value = undefined
  }
}
</script>
<template>
  <div
    ><el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
      class="edu-error"
    /><div v-for="file in attachments || []" :key="file.fileId" style="margin-top: 10px"
      ><el-button :loading="busy === file.fileId" @click="openFile(file.fileId, file.name)"
        >↗ {{ file.name || `附件 #${file.fileId}` }}</el-button
      ></div
    ><p v-if="attachments?.length" class="edu-inline-note"
      >点击附件后核验访问权限，在新窗口打开。</p
    ></div
  >
</template>
