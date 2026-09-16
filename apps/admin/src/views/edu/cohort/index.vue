<script setup lang="ts">
import ResourceBoard, { type Field, type Action } from '../components/ResourceBoard.vue'
defineOptions({ name: 'EduCohort' })
const fields: Field[] = [
  { key: 'name', label: '班级名称', required: true, wide: true },
  {
    key: 'courseId',
    label: '绑定课程',
    kind: 'resource',
    resource: 'course',
    required: true,
    hint: '发布班级时锁定课程版本。'
  },
  {
    key: 'kind',
    label: '班级类型',
    kind: 'select',
    options: [
      { value: 'REGULAR', label: '正式班' },
      { value: 'TRIAL', label: '体验班' }
    ],
    required: true
  },
  {
    key: 'mode',
    label: '上课方式',
    kind: 'select',
    options: [
      { value: 'ONLINE', label: '线上' },
      { value: 'OFFLINE', label: '线下' }
    ],
    required: true
  },
  { key: 'teacherId', label: '授课教师', kind: 'resource', resource: 'teacher', required: true },
  { key: 'campusId', label: '校区（线下必填）', kind: 'resource', resource: 'campus' },
  { key: 'roomId', label: '教室（线下必填）', kind: 'resource', resource: 'room' },
  { key: 'capacity', label: '班级容量', kind: 'number', required: true, min: 1 },
  {
    key: 'price',
    label: '学费（元）',
    kind: 'money',
    required: true,
    hint: '系统关联原有商品与订单；免费体验班设为 0。'
  },
  { key: 'startDate', label: '开课日期', kind: 'date', required: true },
  { key: 'endDate', label: '结课日期', kind: 'date', required: true },
  { key: 'terms', label: '报名与上课约定', kind: 'textarea', required: true, wide: true },
  { key: 'refundPolicy', label: '退费与改期规则', kind: 'textarea', required: true, wide: true }
]
const actions: Action[] = [
  {
    key: 'publish',
    label: '校验并开放报名',
    show: (row) => row.status === 'DRAFT',
    confirm: '开放班级报名？系统会检查课程版本、完整排课、师资、名额、价格与报名条款。'
  }
]
</script>
<template>
  <ResourceBoard
    resource="cohort"
    title="把一群好奇心，聚在一起"
    description="班级连接课程版本、教师与每一次上课安排。排课完整并通过校验后，才向家长开放报名。"
    :fields="fields"
    :actions="actions"
    :defaults="{ kind: 'REGULAR', mode: 'ONLINE', capacity: 8, price: 0, status: 'DRAFT' }"
    :columns="[
      { key: 'name', label: '班级', width: 240 },
      { key: 'teacherName', label: '教师' },
      { key: 'campusName', label: '校区' },
      { key: 'capacity', label: '容量' },
      { key: 'stock', label: '剩余名额' },
      { key: 'price', label: '学费', kind: 'money' },
      { key: 'status', label: '状态', kind: 'status' }
    ]"
    create-label="创建班级"
    ><template #header
      ><router-link to="/edu/session" class="edu-action-link">打开排课日历 →</router-link></template
    ><template #actions="{ row }"
      ><router-link
        :to="{ path: '/edu/session', query: { cohortId: row.id } }"
        class="edu-action-link"
        style="font-size: 12px; margin-left: 10px"
        >排课</router-link
      ></template
    ></ResourceBoard
  >
</template>
