<script setup lang="ts">
import ResourceBoard, { type Field, type Action } from '../components/ResourceBoard.vue'
defineOptions({ name: 'EduGrowthReport' })
const fields: Field[] = [
  { key: 'title', label: '报告标题', required: true, wide: true },
  { key: 'studentId', label: '学员', kind: 'resource', resource: 'student', required: true },
  { key: 'cohortId', label: '关联班级', kind: 'resource', resource: 'cohort', required: true },
  { key: 'summary', label: '阶段学习回顾', kind: 'textarea', required: true, wide: true },
  { key: 'strengths', label: '具体进步与作品证据', kind: 'textarea', required: true, wide: true },
  { key: 'nextSteps', label: '下一阶段建议', kind: 'textarea', required: true, wide: true }
]
const actions: Action[] = [
  {
    key: 'publish',
    label: '发布给家长',
    show: (row) => row.status === 'DRAFT',
    confirm: '将这份成长报告发布给该学员的监护人？请先确认具体进步与下一步建议已填写完整。'
  }
]
</script>
<template>
  <ResourceBoard
    resource="growth-report"
    title="让成长被看见"
    description="用具体作品和学习行为记录变化。草稿对家长不可见，发布后进入学员成长档案。"
    :fields="fields"
    :actions="actions"
    :defaults="{ status: 'DRAFT' }"
    :columns="[
      { key: 'title', label: '报告', width: 260 },
      { key: 'studentName', label: '学员' },
      { key: 'cohortName', label: '班级', width: 220 },
      { key: 'status', label: '发布状态', kind: 'status' }
    ]"
    create-label="撰写成长报告"
  />
</template>
