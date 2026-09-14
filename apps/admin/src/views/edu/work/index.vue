<script setup lang="ts">
import { ref } from 'vue'
import { eduApi, errorMessage, type EduRecord } from '@/api/edu'
import ResourceBoard, { type Action } from '../components/ResourceBoard.vue'
import PrivateAttachments from '../components/PrivateAttachments.vue'
import EduStatus from '../components/EduStatus.vue'
defineOptions({ name: 'EduWork' })
const visible = ref(false),
  selected = ref<EduRecord>(),
  error = ref(''),
  loading = ref(false)
async function viewWork(row: EduRecord) {
  visible.value = true
  loading.value = true
  error.value = ''
  selected.value = undefined
  try {
    selected.value = await eduApi.get('work', row.id)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
const actions: Action[] = [
  {
    key: 'moderate',
    label: '审核通过',
    show: (row) => row.status === 'PENDING',
    payload: () => ({ status: 'APPROVED' }),
    prompt: '填写审核说明，确认作品内容适合公开展示。'
  },
  {
    key: 'moderate',
    label: '退回修改',
    show: (row) => row.status === 'PENDING',
    payload: () => ({ status: 'REJECTED' }),
    prompt: '说明需要修改的内容。',
    danger: true
  },
  {
    key: 'publish',
    label: '发布作品',
    show: (row) =>
      row.status !== 'PUBLISHED' &&
      ['GRANTED', 'APPROVED', 'CONSENTED'].includes(row.consentStatus || ''),
    confirm: '公开发布此版本作品？系统将再次核验当前版本的监护人授权与审核结果。'
  }
]
</script>
<template>
  <ResourceBoard
    resource="work"
    title="作品，值得认真对待"
    description="孩子拥有作品的创作权，家长决定是否公开。每个版本都独立核验授权、审核与发布状态。"
    readonly
    :actions="actions"
    :columns="[
      { key: 'title', label: '作品', width: 240 },
      { key: 'studentName', label: '创作者' },
      { key: 'version', label: '版本' },
      { key: 'consentStatus', label: '监护人授权', kind: 'status' },
      { key: 'status', label: '展示状态', kind: 'status' },
      { key: 'moderationNote', label: '审核说明', width: 240 }
    ]"
    intro="未授权作品保持私密；授权撤回后应立即停止公开访问。预览和附件使用受保护的业务访问接口。"
    ><template #actions="{ row }"
      ><el-button link type="primary" @click="viewWork(row)">查看作品</el-button></template
    ><el-drawer v-model="visible" :title="selected?.title || '作品预览'" size="min(860px,96vw)"
      ><div v-loading="loading"
        ><el-alert v-if="error" :title="error" type="error" :closable="false" show-icon /><template
          v-if="selected"
          ><p class="edu-description">{{ selected.description }}</p
          ><div style="display: flex; gap: 12px; margin: 20px 0"
            ><EduStatus :value="selected.consentStatus" /><EduStatus
              :value="selected.moderationStatus"
            /><span>版本 v{{ selected.version }}</span></div
          ><div class="edu-work-preview">{{
            selected.content ||
            selected.submission?.content ||
            '本作品通过附件提交，请查看下方附件。'
          }}</div
          ><PrivateAttachments
            :attachments="
              selected.attachments || selected.submission?.attachments
            " /></template></div></el-drawer
  ></ResourceBoard>
</template>
