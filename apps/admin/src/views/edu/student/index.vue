<script setup lang="ts">
import ResourceBoard, { type Field } from '../components/ResourceBoard.vue'
defineOptions({ name: 'EduStudent' })
const fields: Field[] = [
  { key: 'name', label: '学员姓名' },
  { key: 'birthMonth', label: '出生年月' },
  { key: 'grade', label: '年级' },
  { key: 'experience', label: '已有创作经验', kind: 'textarea', wide: true }
]
</script>
<template>
  <ResourceBoard
    resource="student"
    title="每一位小小创造者"
    description="查看授权范围内的学员信息。资料由监护人维护，学习记录随报名关系归档。"
    :fields="fields"
    :columns="[
      { key: 'name', label: '学员', width: 200 },
      { key: 'birthMonth', label: '出生年月' },
      { key: 'grade', label: '年级' },
      { key: 'experience', label: '创作经验', width: 280 }
    ]"
    readonly
    detail-only
  />
</template>
