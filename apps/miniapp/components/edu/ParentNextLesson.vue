<template>
  <view class="parent-next parent-panel">
    <view class="parent-next-top"
      ><text class="parent-eyebrow">{{
        session ? 'UP NEXT / 下一次课' : 'YOUR NEXT STEP / 下一步'
      }}</text
      ><text class="parent-tag">{{
        session ? (session.mode === 'OFFLINE' ? '线下课堂' : '线上课堂') : '等待新安排'
      }}</text></view
    >
    <template v-if="session">
      <view class="parent-next-main"
        ><view class="parent-date"
          ><text>{{ date.month }} 月</text><text class="parent-date-day">{{ date.day }}</text
          ><text>{{ date.week }}</text></view
        ><view class="parent-next-copy"
          ><view class="parent-card-title">{{ session.title }}</view
          ><view class="parent-next-time"
            >{{ date.time }}<text v-if="session.endTime"> – {{ end.time }}</text
            ><text class="parent-timezone"> 北京时间</text></view
          ><view class="parent-muted">{{
            session.mode === 'OFFLINE'
              ? session.campusName || '地点待老师确认'
              : '准备电脑，查看课前说明'
          }}</view></view
        ></view
      >
      <view class="parent-action-row"
        ><button class="parent-primary" @tap="go('session', { id: session.id, studentId })"
          >课前准备与上课信息 <text>↗</text></button
        ><button class="parent-text-button" @tap="calendar">课表</button></view
      >
    </template>
    <template v-else
      ><view class="parent-card-title">下一次相遇，值得期待。</view
      ><view class="parent-muted">{{
        enrolled
          ? '老师发布新的课次后，时间与准备事项会显示在这里。'
          : '先了解课程，再为孩子找到适合的学习起点。'
      }}</view
      ><button class="parent-text-button" @tap="enrolled ? calendar() : tab('courses')"
        >{{ enrolled ? '查看已有课表' : '探索课程与班期' }} <text>↗</text></button
      ></template
    >
  </view>
</template>
<script setup>
  import { computed } from 'vue';
  import { dateParts } from '@/edu/parent-space-data';
  import { go, tab } from '@/edu/state';
  const props = defineProps({ session: Object, studentId: Number, enrolled: Boolean });
  const date = computed(() => dateParts(props.session?.startTime)),
    end = computed(() => dateParts(props.session?.endTime));
  function calendar() {
    go('learning-list', { type: 'calendar', studentId: props.studentId });
  }
</script>
