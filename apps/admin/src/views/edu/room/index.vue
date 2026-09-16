<script setup lang="ts">
import ResourceBoard, { type Field } from '../components/ResourceBoard.vue'
defineOptions({ name: 'EduRoom' })
const fields: Field[] = [
  { key: 'name', label: '教室名称', required: true },
  { key: 'campusId', label: '所属校区', kind: 'resource', resource: 'campus', required: true },
  { key: 'capacity', label: '可容纳人数', kind: 'number', required: true, min: 1 }
]
</script>
<template>
  <ResourceBoard
    resource="room"
    title="教室管理"
    description="让空间容量与班级规模相匹配。排课时系统会检查教室时段是否冲突。"
    :fields="fields"
    :defaults="{ capacity: 8 }"
    :columns="[
      { key: 'name', label: '教室', width: 240 },
      { key: 'campusName', label: '所属校区', width: 200 },
      { key: 'capacity', label: '容量（人）' }
    ]"
    create-label="新增教室"
  />
</template>
