<template>
  <view class="parent-course parent-panel">
    <view class="parent-course-heading"
      ><view
        ><text class="parent-eyebrow">{{
          course.mode === 'OFFLINE' ? 'IN PERSON' : 'LEARNING JOURNEY'
        }}</text
        ><view class="parent-card-title">{{ course.courseName }}</view></view
      ><text class="parent-tag" :class="{ calm: course.status === 'COMPLETED' }">{{
        status[course.status] || '查看记录'
      }}</text></view
    >
    <view class="parent-muted"
      >{{ course.cohortName
      }}<text v-if="course.teacherName && course.teacherName !== '待安排'">
        · {{ course.teacherName }}老师</text
      ></view
    >
    <view class="parent-progress-label"
      ><text>{{ course.progressLabel }}</text
      ><text v-if="course.upcoming !== null && course.total"
        >待上 {{ course.upcoming }} 节</text
      ></view
    >
    <view
      v-if="course.total"
      class="parent-progress"
      role="progressbar"
      :aria-valuenow="course.ended"
      :aria-valuemin="0"
      :aria-valuemax="course.total"
      aria-label="已发布课表进度"
      ><view :style="{ width: course.percent + '%' }"
    /></view>
    <view v-if="course.undated" class="parent-micro">另有 {{ course.undated }} 节时间待确认</view>
    <view class="parent-course-foot"
      ><button
        class="parent-text-button"
        @tap="go('learning-list', { type: 'calendar', studentId, cohortId: course.cohortId })"
        >查看课表 <text>↗</text></button
      ><button class="parent-text-button subtle" @tap="go('orders')">订单记录</button
      ><button
        v-if="course.status === 'ACTIVE'"
        class="parent-text-button subtle"
        @tap="go('requests', { enrollmentId: course.id, courseId: course.courseId, studentId })"
        >申请调班</button
      ></view
    >
  </view>
</template>
<script setup>
  import { go } from '@/edu/state';
  defineProps({ course: { type: Object, required: true }, studentId: Number });
  const status = {
    ACTIVE: '学习中',
    COMPLETED: '已结课',
    PENDING_PAYMENT: '待支付',
    CANCELLED: '已取消',
    EXPIRED: '已结束',
  };
</script>
