<script setup lang="ts">
import ResourceBoard, { type Field } from '../components/ResourceBoard.vue'
defineOptions({ name: 'EduTeacher' })
const fields: Field[] = [
  { key: 'name', label: '教师公开姓名', required: true },
  {
    key: 'userId',
    label: '关联现有后台账号',
    kind: 'resource',
    resource: 'system-user',
    required: true,
    hint: '先在原有用户管理中创建教师账号并分配角色。'
  },
  { key: 'bio', label: '教师介绍', kind: 'textarea', wide: true },
  { key: 'avatarUrl', label: '头像地址', wide: true },
  {
    key: 'oneToOneEnabled',
    label: '一对一高级课',
    kind: 'switch',
    wide: true,
    hint: '开启且档案已发布、关联员工已启用、介绍完整时，家长可以选择这位老师提交预约申请。期望时间需另行沟通确认。'
  },
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
    resource="teacher"
    title="陪孩子一起创造的人"
    description="公开教师介绍与教学账号关联。教师只能访问分配给自己的班级、作业和学员资料。"
    :fields="fields"
    :defaults="{ status: 'DRAFT', oneToOneEnabled: false }"
    :columns="[
      { key: 'name', label: '教师姓名', width: 180 },
      { key: 'oneToOneEnabled', label: '一对一服务', kind: 'boolean' },
      { key: 'userId', label: '关联账号编号' },
      { key: 'bio', label: '教师介绍', width: 360 },
      { key: 'status', label: '公开状态', kind: 'status' }
    ]"
    create-label="新增教师档案"
  />
</template>
