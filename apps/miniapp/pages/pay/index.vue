<template
  ><EduHeader title="收银台" /><view class="edu-page"
    ><text class="eyebrow">SECURE CHECKOUT</text
    ><view class="title">给下一段成长，<br />一个开始。</view
    ><EduState :loading="loading" :error="error" @retry="refresh" /><template
      v-if="order && !loading && !error"
      ><view class="card stack"
        ><view class="muted">待支付金额</view><view class="price">¥{{ money(order.price) }}</view
        ><view class="muted">{{ statusText }}</view></view
      ><view v-if="order.status === 0" class="card"
        ><view class="section-title">选择付款方式</view
        ><radio-group @change="selected = $event.detail.value"
          ><label v-for="method in methods" :key="method.value" class="row between list-line"
            ><text>{{ method.title }}</text
            ><radio
              :value="method.value"
              :checked="selected === method.value"
              color="#C94B00" /></label></radio-group
        ><view v-if="!methods.length" class="note" style="margin-top: 16px"
          >暂时没有可用的支付渠道。订单已保存，可稍后在课程订单中继续支付。</view
        ></view
      ><button v-if="order.status === 0" class="btn" :disabled="!selected || paying" @tap="pay">{{
        paying ? '正在调起支付…' : '确认支付'
      }}</button
      ><button class="btn secondary" style="margin-top: 12px" @tap="go('orders')"
        >查看课程订单</button
      ><button class="link" @tap="refresh">已完成付款？刷新结果</button></template
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
  import PayChannelApi from '@/sheep/api/pay/channel';
  import { getPayMethods } from '@/sheep/platform/pay';
  import sheep from '@/sheep';
  import { unwrap } from '@/edu/api';
  import { useResource } from '@/edu/resource';
  import { money, go } from '@/edu/state';
  const id = ref(0),
    methods = ref([]),
    selected = ref(''),
    paying = ref(false);
  const {
    data: order,
    loading,
    error,
    refresh,
  } = useResource(async () => {
    const o = await unwrap(PayOrderApi.getOrder(id.value, true));
    if (!o) throw new Error('没有找到支付订单');
    if (o.status === 0) {
      const channels = await unwrap(PayChannelApi.getEnableChannelCodeList(o.appId));
      methods.value = getPayMethods(channels).filter((m) => !m.disabled);
      selected.value = methods.value[0]?.value || '';
    }
    return o;
  });
  const statusText = computed(
    () =>
      ({
        0: '订单已保存，请在有效期内付款',
        10: '支付已确认，报名资格正在同步',
        20: '这笔付款已有退款，请查看报名订单',
        30: '支付订单已关闭',
      }[order.value?.status] || '正在确认状态'),
  );
  function pay() {
    if (paying.value) return;
    paying.value = true;
    try {
      sheep.$platform.pay(selected.value, 'goods', id.value);
    } finally {
      setTimeout(() => (paying.value = false), 1500);
    }
  }
  onLoad((o) => {
    id.value = Number(o.id);
    refresh();
  });
  onShow(() => {
    paying.value = false;
    if (id.value) refresh();
  });
</script>
