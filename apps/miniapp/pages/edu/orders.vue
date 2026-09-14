<template
  ><EduHeader :title="orderId ? '订单详情' : '课程订单'" /><view class="edu-page"
    ><view class="title">{{ orderId ? '每一次报名，都有记录。' : '我的课程订单' }}</view
    ><view v-if="!orderId" class="chips" style="margin: 20px 0"
      ><button
        v-for="t in tabs"
        :key="t.label"
        class="chip"
        :class="{ active: filter === t.value }"
        @tap="
          filter = t.value;
          refresh();
        "
        >{{ t.label }}</button
      ><button class="chip" @tap="go('refunds')">退款 / 售后</button></view
    ><EduState
      :loading="loading"
      :error="error"
      :empty="!orders.length"
      title="还没有课程订单"
      description="为孩子选择的每一段学习旅程，都会在这里记录。"
      @retry="refresh"
      ><button class="btn secondary" @tap="tab('courses')">探索课程</button></EduState
    ><view v-for="order in orders" :key="order.id" class="card"
      ><view class="row between"
        ><text class="small muted">订单 {{ order.no || order.id }}</text
        ><text class="pill">{{ status[order.status] || '处理中' }}</text></view
      ><view v-for="item in order.items" :key="item.id" class="list-line"
        ><view class="strong">{{ item.spuName }}</view
        ><view class="muted">{{ item.properties?.map((p) => p.valueName).join(' / ') }}</view
        ><view v-if="item.currentCohortName" class="small muted"
          >当前班期：{{ item.currentCohortName }}</view
        ><view class="row between" style="margin-top: 10px"
          ><text class="small muted"
            >报名孩子：{{ item.studentName || studentName(item.studentId) }}</text
          ><text class="strong">¥{{ money(item.payPrice) }}</text></view
        ><button
          v-if="
            orderId &&
            order.payStatus &&
            Number(item.refundableRemaining) > 0 &&
            !item.refundInFlight
          "
          class="link"
          @tap="openRefund(item)"
          >申请课程退款</button
        ><button v-if="item.afterSaleId" class="link" @tap="go('refunds')">查看退款进度</button
        ><view v-if="orderId && item.refundableRemaining != null" class="small muted"
          >剩余可申请退款 ¥{{ money(item.refundableRemaining)
          }}<text v-if="item.refundInFlight"> · 当前退款处理中</text></view
        ><view
          v-if="item.enrollmentStatus === 'ACTIVE' && item.entitlementAction === 'KEEP'"
          class="note"
          >本次退款保留学习资格，课程安排继续有效。</view
        ><view v-if="item.enrollmentStatus === 'CANCELLED'" class="note"
          >学习资格已取消。</view
        ></view
      ><view class="row between" style="margin: 16px 0"
        ><text class="muted">{{ dateText(order.createTime) }}</text
        ><text class="strong">实付 ¥{{ money(order.payPrice) }}</text></view
      ><view class="row" style="justify-content: flex-end"
        ><button v-if="!orderId" class="btn quiet" @tap="go('orders', { id: order.id })"
          >订单详情</button
        ><button v-if="order.status === 0" class="btn quiet" :disabled="busy" @tap="cancel(order)"
          >取消订单</button
        ><button v-if="order.status === 0 && order.payOrderId" class="btn" @tap="pay(order)"
          >继续支付</button
        ></view
      ><view v-if="orderId" class="note" style="margin-top: 16px"
        >如付款或退款仍在处理中，请稍后刷新。需要帮助时，请向客服提供订单号。</view
      ></view
    ><view v-if="actionError" class="error">{{ actionError }}</view
    ><view v-if="refundItem" class="card stack"
      ><view class="section-title">申请退款</view
      ><view class="muted"
        >{{ refundItem.spuName }} ·
        {{ refundItem.studentName || studentName(refundItem.studentId) }}</view
      ><view class="small muted"
        >{{ refundItem.currentCohortName }} · 剩余可退 ¥{{
          money(refundItem.refundableRemaining)
        }}</view
      ><view class="note">实际可退款范围以所选班期规则及机构审核为准。提交申请不会立即退款。</view
      ><view class="field"
        ><text class="field-label">申请金额（元）</text
        ><input
          class="input"
          type="digit"
          v-model="refundAmount"
          placeholder="请输入本次退款金额" /></view
      ><view class="field"
        ><text class="field-label">学习资格</text
        ><view class="chips"
          ><button
            class="chip"
            :class="{ active: refundAction === 'CANCEL' }"
            @tap="refundAction = 'CANCEL'"
            >取消学习资格</button
          ><button
            v-if="refundItem.enrollmentStatus !== 'CANCELLED'"
            class="chip"
            :class="{ active: refundAction === 'KEEP' }"
            @tap="refundAction = 'KEEP'"
            >保留学习资格</button
          ></view
        ></view
      ><view class="note">{{
        refundAction === 'KEEP'
          ? '即使全额退款，孩子仍保留本次学习资格。机构审核通过并退款后，课程安排继续有效。'
          : '退款成功后将取消本次学习资格，并释放当前班期名额；部分退款也会取消资格。'
      }}</view
      ><textarea
        class="input textarea"
        v-model="refundReason"
        maxlength="300"
        placeholder="请说明退款原因"
      /><view class="row"
        ><button class="btn quiet" @tap="refundItem = null">暂不申请</button
        ><button class="btn" :disabled="busy || !refundReason.trim()" @tap="refund"
          >提交退款申请</button
        ></view
      ></view
    ></view
  ></template
>
<script setup>
  defineOptions({ inheritAttrs: false });
  import { ref, computed } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import EduState from '@/components/edu/EduState.vue';
  import Order from '@/sheep/api/trade/order';
  import AfterSale from '@/sheep/api/trade/aftersale';
  import { unwrap, listOf } from '@/edu/api';
  import { useResource } from '@/edu/resource';
  import {
    family,
    loadStudents,
    requireLogin,
    go,
    tab,
    money,
    dateText,
    confirm,
    toast,
  } from '@/edu/state';
  const orderId = ref(0),
    filter = ref(''),
    busy = ref(false),
    actionError = ref(''),
    refundItem = ref(null),
    refundReason = ref(''),
    refundAmount = ref(''),
    refundAction = ref('CANCEL'),
    status = { 0: '待支付', 10: '已付款', 20: '学习服务中', 30: '已完成', 40: '已关闭' },
    tabs = [
      { label: '全部', value: '' },
      { label: '待支付', value: 0 },
      { label: '已付款', value: 10 },
      { label: '已关闭', value: 40 },
    ];
  const { data, loading, error, refresh } = useResource(async () => {
    await loadStudents();
    return orderId.value
      ? [await unwrap(Order.getOrderDetail(orderId.value, true))]
      : unwrap(
          Order.getOrderPage({
            pageNo: 1,
            pageSize: 50,
            ...(filter.value !== '' ? { status: filter.value } : {}),
          }),
        );
  }, []);
  const orders = computed(() => listOf(data.value));
  function studentName(id) {
    return family.students.find((s) => s.id === id)?.name || '报名信息以订单为准';
  }
  function pay(order) {
    uni.navigateTo({ url: '/pages/pay/index?id=' + order.payOrderId + '&orderType=goods' });
  }
  async function cancel(order) {
    if (!(await confirm('取消未支付订单', '取消后将释放本订单预留的课程名额。'))) return;
    busy.value = true;
    try {
      await unwrap(Order.cancelOrder(order.id));
      await refresh();
    } catch (e) {
      actionError.value = e.message;
    } finally {
      busy.value = false;
    }
  }
  async function refund() {
    const cents = Math.round(Number(refundAmount.value) * 100);
    if (
      !/^\d+(\.\d{1,2})?$/.test(refundAmount.value) ||
      !Number.isSafeInteger(cents) ||
      cents <= 0 ||
      cents > refundItem.value.refundableRemaining
    ) {
      actionError.value = '请填写不超过剩余额度的有效退款金额，最多两位小数';
      return;
    }
    if (
      !(await confirm(
        '确认退款申请',
        `申请退款 ¥${money(cents)}，${
          refundAction.value === 'KEEP' ? '保留' : '取消'
        }孩子的学习资格。提交后需等待机构审核。`,
      ))
    )
      return;
    busy.value = true;
    try {
      await unwrap(
        AfterSale.createAfterSale({
          orderItemId: refundItem.value.id,
          way: 10,
          refundPrice: cents,
          entitlementAction: refundAction.value,
          applyReason: refundReason.value.trim(),
          applyDescription: refundReason.value.trim(),
          applyPicUrls: [],
        }),
      );
      refundItem.value = null;
      toast('退款申请已提交');
      go('refunds');
    } catch (e) {
      actionError.value = e.message;
    } finally {
      busy.value = false;
    }
  }
  function openRefund(item) {
    refundItem.value = item;
    refundReason.value = '';
    refundAmount.value = money(item.refundableRemaining);
    refundAction.value = item.enrollmentStatus === 'CANCELLED' ? 'CANCEL' : 'KEEP';
    actionError.value = '';
  }
  onLoad((o) => (orderId.value = Number(o.id) || 0));
  onShow(() => {
    if (requireLogin()) refresh();
  });
</script>
