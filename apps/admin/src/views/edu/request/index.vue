<script setup lang="ts">
import ResourceBoard, { type Action } from '../components/ResourceBoard.vue'
defineOptions({ name: 'EduRequest' })
const actions: Action[] = [
  {
    key: 'approve',
    label: '同意申请',
    show: (row) => row.status === 'PENDING',
    prompt: '填写处理说明。调班会重新检查课程、名额、时间与适用范围。'
  },
  {
    key: 'reject',
    label: '驳回',
    show: (row) => row.status === 'PENDING',
    prompt: '请填写给家长的驳回原因，帮助他们了解后续可选安排。',
    danger: true
  }
]
</script>
<template>
  <ResourceBoard
    resource="request"
    title="请假与调班申请"
    description="每一次调整都有清楚的原因与处理记录。审批时再次核验班级名额、范围和学习权益。"
    readonly
    :actions="actions"
    :columns="[
      { key: 'studentName', label: '学员' },
      { key: 'type', label: '类型' },
      { key: 'currentCohortName', label: '原班级', width: 190 },
      { key: 'targetCohortName', label: '目标班级', width: 190 },
      { key: 'reason', label: '申请原因', width: 250 },
      { key: 'status', label: '处理状态', kind: 'status' }
    ]"
  />
</template>
