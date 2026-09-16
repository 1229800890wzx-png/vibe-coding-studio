<script setup lang="ts">
import ResourceBoard, { type Field } from '../components/ResourceBoard.vue'
defineOptions({ name: 'EduCampus' })
const fields: Field[] = [
  { key: 'name', label: '校区名称', required: true },
  {
    key: 'deptId',
    label: '关联组织部门',
    kind: 'resource',
    resource: 'system-dept',
    required: true,
    hint: '复用原有组织与校区管理员数据范围。'
  },
  { key: 'city', label: '城市', required: true },
  { key: 'address', label: '详细地址', required: true },
  { key: 'latitude', label: '纬度' },
  { key: 'longitude', label: '经度' },
  { key: 'description', label: '校区介绍', kind: 'textarea', wide: true },
  {
    key: 'status',
    label: '公开状态',
    kind: 'select',
    required: true,
    options: [
      { value: 'DRAFT', label: '草稿' },
      { value: 'PUBLISHED', label: '已发布' },
      { value: 'ARCHIVED', label: '已归档' }
    ]
  }
]
</script>
<template>
  <ResourceBoard
    resource="campus"
    title="校区与教学空间"
    description="每个线下相遇的地方，都有清楚的地址、空间与负责人。"
    :fields="fields"
    :defaults="{ status: 'DRAFT' }"
    :columns="[
      { key: 'name', label: '校区名称', width: 220 },
      { key: 'city', label: '城市' },
      { key: 'address', label: '地址', width: 280 },
      { key: 'status', label: '状态', kind: 'status' }
    ]"
    create-label="新增校区"
  />
</template>
