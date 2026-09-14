<template
  ><EduHeader title="支付结果" /><view class="edu-page"
    ><EduState :loading="loading" :error="error" @retry="refresh" /><view
      v-if="order && !loading && !error"
      class="card stack"
      ><text class="eyebrow">PAYMENT STATUS</text
      ><view class="title">{{
        order.status === 20
          ? '已有退款记录。'
          : paid
          ? '付款已确认。'
          : order.status === 30
          ? '订单已关闭。'
          : '正在等待付款确认。'
      }}</view
      ><view class="price">¥{{ money(order.price) }}</view
      ><view class="muted">{{
        order.status === 20
          ? '这笔付款已有退款。具体退款金额和课程安排，请查看报名订单。'
          : paid
          ? '请在报名订单中核对孩子和课程，已报名课程也会出现在学习页面。'
          : '如果已经付款，请稍后刷新。付款确认后，这里会更新结果。'
      }}</view
      ><button class="btn" @tap="go('orders')">查看报名订单</button
      ><button class="btn secondary" @tap="refresh">刷新付款状态</button
      ><button class="link" @tap="tab('learning')">去学习页面 ↗</button></view
    ></view
  ></template
>
<script setup>
  defineOptions({ inheritAttrs: false });
  import { ref, computed } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import EduState from '@/components/edu/EduState.vue';
  import PayOrderApi from '@/sheep/api/pay/order';
  import { unwrap } from '@/edu/api';
  import { useResource } from '@/edu/resource';
  import { money, go, tab } from '@/edu/state';
  const id = ref(0);
  const {
    data: order,
    loading,
    error,
    refresh,
  } = useResource(() => unwrap(PayOrderApi.getOrder(id.value, true)));
  const paid = computed(() => [10, 20].includes(order.value?.status));
  onLoad((o) => {
    id.value = Number(o.id);
  });
  onShow(() => {
    if (id.value) refresh();
  });
</script>
