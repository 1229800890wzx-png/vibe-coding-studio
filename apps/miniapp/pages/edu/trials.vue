<template
  ><EduHeader title="体验课预约" child @change="refresh" /><view class="edu-page parent-flow"
    ><view class="title">从一次体验开始。</view
    ><view class="subtitle">查看预约、课表与取消状态。</view
    ><EduState
      :loading="loading"
      :error="error"
      :empty="!items.length"
      title="还没有体验课预约"
      description="为孩子挑一门感兴趣的课程，先试着动手。"
      @retry="refresh"
      ><button class="btn secondary" @tap="tab('courses')">发现体验课程</button></EduState
    ><view v-for="item in items" :key="item.id" class="card stack"
      ><view class="row between"
        ><view class="section-title">{{ item.cohortName || item.courseName || '体验课' }}</view
        ><text class="pill">{{ statuses[item.status] || item.status }}</text></view
      ><view class="muted"
        >{{ item.studentName || currentStudent?.name }} ·
        {{ dateText(item.startTime || item.startDate) }}</view
      ><view class="muted">{{ item.campusName || '电脑端在线课堂' }}</view
      ><button
        class="btn quiet"
        @tap="
          go('consultation', {
            studentId: item.studentId,
            courseId: item.courseId,
            trialBookingId: item.id,
          })
        "
        >咨询这次试听</button
      ><view class="row"
        ><button class="btn secondary" @tap="go('cohort', { id: item.cohortId })">查看课表</button
        ><button
          v-if="!item.orderItemId && !['CANCELLED', 'COMPLETED'].includes(item.status)"
          class="btn quiet"
          :disabled="busy === item.id"
          @tap="cancel(item)"
          >取消预约</button
        ><button v-if="item.orderItemId" class="btn quiet" @tap="go('orders')"
          >订单与退款</button
        ></view
      ></view
    ><view v-if="actionError" class="error">{{ actionError }}</view></view
  ></template
>
<script setup>
  defineOptions({ inheritAttrs: false });
  import { ref, computed } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import EduState from '@/components/edu/EduState.vue';
  import { edu, listOf } from '@/edu/api';
  import { useResource } from '@/edu/resource';
  import {
    family,
    currentStudent,
    loadStudents,
    requireLogin,
    confirm,
    go,
    tab,
    dateText,
  } from '@/edu/state';
  const busy = ref(0),
    actionError = ref(''),
    statuses = { CONFIRMED: '已预约', BOOKED: '已预约', CANCELLED: '已取消', COMPLETED: '已完成' };
  const { data, loading, error, refresh } = useResource(async () => {
      await loadStudents();
      return family.currentId ? edu.trials(family.currentId) : [];
    }, []),
    items = computed(() => listOf(data.value));
  async function cancel(item) {
    if (!(await confirm('取消体验课预约', '取消后名额将释放，可以重新选择其他班期。'))) return;
    busy.value = item.id;
    try {
      await edu.cancelTrial(item.id);
      await refresh();
    } catch (e) {
      actionError.value = e.message;
    } finally {
      busy.value = 0;
    }
  }
  onShow(() => {
    if (requireLogin()) refresh();
  });
</script>
