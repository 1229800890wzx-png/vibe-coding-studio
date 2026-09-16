<template
  ><EduHeader title="退款与售后" /><view class="edu-page parent-flow"
    ><view class="title">查看处理进度。</view
    ><view class="subtitle">退款申请经审核后，按原支付渠道处理。</view
    ><EduState
      :loading="loading"
      :error="error"
      :empty="!items.length"
      title="暂无退款申请"
      description="需要退款时，可从课程订单详情发起申请。"
      @retry="refresh"
    /><view v-for="item in items" :key="item.id" class="card stack"
      ><view class="row between"
        ><text class="strong">{{ item.spuName || item.orderItem?.spuName || '课程退款' }}</text
        ><text class="pill">{{ statuses[item.status] || item.status }}</text></view
      ><view class="price">¥{{ money(item.refundPrice) }}</view
      ><view v-if="item.studentName" class="muted"
        >{{ item.studentName }} · {{ item.currentCohortName }}</view
      ><view v-if="item.entitlementAction" class="note">{{
        item.entitlementAction === 'KEEP'
          ? '保留学习资格：即使全额退款，课程安排继续有效。'
          : '取消学习资格：退款成功后释放当前班期名额。'
      }}</view
      ><view class="muted">{{ item.applyReason }}</view
      ><view v-if="item.auditReason" class="note">{{ item.auditReason }}</view
      ><view class="small muted">{{ dateText(item.createTime) }}</view
      ><button v-if="item.status === 10" class="btn quiet" @tap="cancel(item)"
        >撤销申请</button
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
  import AfterSale from '@/sheep/api/trade/aftersale';
  import { unwrap, listOf } from '@/edu/api';
  import { useResource } from '@/edu/resource';
  import { requireLogin, money, dateText, confirm } from '@/edu/state';
  const actionError = ref(''),
    statuses = {
      10: '等待审核',
      20: '审核通过',
      30: '等待退货',
      40: '等待退款',
      50: '退款成功',
      61: '已撤销',
      62: '审核未通过',
      63: '退货未通过',
    };
  const { data, loading, error, refresh } = useResource(
      () => unwrap(AfterSale.getAfterSalePage({ pageNo: 1, pageSize: 50 })),
      [],
    ),
    items = computed(() => listOf(data.value));
  async function cancel(item) {
    if (!(await confirm('撤销退款申请', '撤销后将停止本次退款处理。'))) return;
    try {
      await unwrap(AfterSale.cancelAfterSale(item.id));
      refresh();
    } catch (e) {
      actionError.value = e.message;
    }
  }
  onShow(() => {
    if (requireLogin()) refresh();
  });
</script>
