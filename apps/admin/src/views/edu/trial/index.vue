<script setup lang="ts">
import ResourceBoard, { type Action } from '../components/ResourceBoard.vue'
defineOptions({ name: 'EduTrial' })
const actions: Action[] = [
  {
    key: 'update',
    label: '取消预约',
    permission: 'edu:trial:update',
    show: (row) => !['CANCELLED', 'COMPLETED'].includes(row.status || ''),
    payload: () => ({ status: 'CANCELLED' }),
    confirm: '取消这次体验预约并释放名额？',
    danger: true
  }
]
</script>
<template>
  <ResourceBoard
    resource="trial"
    title="从第一次体验开始"
    description="查看体验课预约，及时处理取消。体验班同样检查人数、时间和学习权益。"
    readonly
    :actions="actions"
    :columns="[
      { key: 'studentName', label: '学员' },
      { key: 'cohortName', label: '体验班', width: 260 },
      { key: 'startTime', label: '体验时间', kind: 'time', width: 180 },
      { key: 'status', label: '预约状态', kind: 'status' }
    ]"
  />
</template>
