<script setup lang="ts">
import ResourceBoard, { type Field } from '../components/ResourceBoard.vue'
defineOptions({ name: 'EduAssignment' })
const fields: Field[] = [
  { key: 'title', label: '创作任务名称', required: true, wide: true },
  { key: 'cohortId', label: '班级', kind: 'resource', resource: 'cohort', required: true },
  {
    key: 'sessionId',
    label: '关联课次',
    kind: 'resource',
    resource: 'session',
    required: true,
    filters: (form) => ({ cohortId: form.cohortId })
  },
  { key: 'dueTime', label: '提交截止时间', kind: 'datetime', required: true },
  { key: 'description', label: '任务说明与验收要求', kind: 'textarea', required: true, wide: true },
  { key: 'materials', label: '参考材料', kind: 'materials', wide: true }
]
</script>
<template>
  <ResourceBoard
    resource="assignment"
    title="留一点空间，让创作继续"
    description="布置清楚的创作目标与提交要求，在每个孩子自己的作品里看见学习。"
    :fields="fields"
    :defaults="{ status: 'PUBLISHED' }"
    :columns="[
      { key: 'title', label: '创作任务', width: 260 },
      { key: 'cohortName', label: '班级', width: 200 },
      { key: 'dueTime', label: '截止时间', kind: 'time', width: 180 },
      { key: 'status', label: '状态', kind: 'status' }
    ]"
    create-label="布置作业"
    ><template #header
      ><router-link to="/edu/submission" class="edu-action-link"
        >去批改作业 →</router-link
      ></template
    ></ResourceBoard
  >
</template>
