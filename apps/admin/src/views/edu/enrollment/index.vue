<script setup lang="ts">
import ResourceBoard from '../components/ResourceBoard.vue'
defineOptions({ name: 'EduEnrollment' })
</script>
<template>
  <ResourceBoard
    resource="enrollment"
    title="报名与学习权益"
    description="报名记录连接学员、班级和原始订单，支付与退款进度可在交易中心追踪。"
    readonly
    :columns="[
      { key: 'studentName', label: '学员' },
      { key: 'courseName', label: '课程', width: 230 },
      { key: 'cohortName', label: '当前班级', width: 210 },
      { key: 'orderItemId', label: '订单项编号' },
      { key: 'status', label: '学习状态', kind: 'status' }
    ]"
    intro="付费报名在原有订单支付成功后自动生成，退款后按订单状态回收权益。教务后台不手动授予付费课程。"
    ><template #header
      ><router-link to="/mall/trade/order" class="edu-action-link"
        >打开订单管理 ↗</router-link
      ></template
    ></ResourceBoard
  >
</template>
