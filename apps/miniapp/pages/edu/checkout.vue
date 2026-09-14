<template
  ><EduHeader title="确认报名" /><view class="edu-page with-dock"
    ><view class="title">确认孩子与课程。</view
    ><EduState :loading="loading && !quote" :error="error" @retry="refresh" /><template
      v-if="quote && !error"
      ><view class="card"
        ><view v-for="(item, i) in quote.items" :key="item.skuId + '-' + i" class="list-line"
          ><view class="strong">{{ item.spuName || item.name }}</view
          ><view class="muted">{{ item.properties?.map((p) => p.valueName).join(' / ') }}</view
          ><view class="row between" style="margin-top: 12px"
            ><text class="pill">{{ studentName(item.studentId) }}</text
            ><text class="strong">¥{{ money(item.payPrice ?? item.price) }}</text></view
          ></view
        ></view
      ><view class="card stack"
        ><button class="link row between" :disabled="busy || loading" @tap="showCoupon = true"
          ><text>优惠券</text
          ><text
            >{{
              couponId
                ? '已选择 · 更换'
                : coupons.some((c) => c.match)
                ? '选择可用满减券'
                : '查看优惠券'
            }}
            ›</text
          ></button
        ><view v-if="priceNotice" class="note" aria-live="polite">{{ priceNotice }}</view
        ><view class="row between"
          ><text class="muted">课程合计</text
          ><text>¥{{ money(quote.price?.totalPrice) }}</text></view
        ><view class="row between"
          ><text class="muted">优惠金额</text
          ><text
            >− ¥{{
              money((quote.price?.discountPrice || 0) + (quote.price?.couponPrice || 0))
            }}</text
          ></view
        ><view class="divider" /><view class="row between"
          ><text class="strong">实付金额</text
          ><text class="price">¥{{ money(quote.price?.payPrice) }}</text></view
        ></view
      ><view class="card"
        ><view class="strong">课程服务</view
        ><view class="muted" style="margin-top: 8px"
          >完成付款后可查看报名结果。若付款仍在确认中，请到订单页刷新查看；已报名课程会出现在对应孩子的学习页面。</view
        ><view class="field"
          ><text class="field-label">给老师的备注（选填）</text
          ><textarea
            class="input textarea"
            v-model="remark"
            maxlength="200"
            placeholder="例如希望重点了解的学习习惯"
          /></view
        ><label class="checkrow" @tap="agree = !agree"
          ><checkbox :checked="agree" color="#C94B00" /><text
            >我已核对孩子、课程与班期，同意所选班期的课程说明和退款规则。</text
          ></label
        ></view
      ><view v-if="actionError" class="error"
        >{{ actionError
        }}<button class="link" :disabled="busy || loading" @tap="refresh"
          >更新费用与名额</button
        ></view
      ></template
    ></view
  ><s-coupon-select
    :model-value="coupons"
    :selected-id="couponId"
    :show="showCoupon"
    @confirm="selectCoupon"
    @close="showCoupon = false"
  />
  <view v-if="quote && !error" class="dock"
    ><view class="dock-inner"
      ><view class="price">¥{{ money(quote.price?.payPrice) }}</view
      ><button class="btn" :disabled="busy || loading || !agree" @tap="submit">{{
        loading ? '正在核算费用…' : busy ? '正在创建报名订单…' : '提交订单并付款'
      }}</button></view
    ></view
  ></template
>
<script setup>
  defineOptions({ inheritAttrs: false });
  import { ref, computed } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import EduState from '@/components/edu/EduState.vue';
  import Order from '@/sheep/api/trade/order';
  import { unwrap } from '@/edu/api';
  import { useResource } from '@/edu/resource';
  import { family, loadStudents, requireLogin, go, money } from '@/edu/state';
  const lines = ref(uni.getStorageSync('edu-checkout-items') || []),
    remark = ref(''),
    agree = ref(false),
    busy = ref(false),
    actionError = ref(''),
    createdOrder = ref(null),
    couponId = ref(null),
    showCoupon = ref(false),
    priceNotice = ref('');
  const {
    data: quote,
    loading,
    error,
    refresh,
  } = useResource(async () => {
    await loadStudents();
    if (!lines.value.length) throw new Error('请先从选课袋选择课程');
    const result = await unwrap(
      Order.settlementOrder({
        items: lines.value,
        deliveryType: 3,
        pointStatus: false,
        couponId: couponId.value,
      }),
    );
    if (!result?.items?.length || result.items.some((item) => !item.studentId))
      throw new Error('报价缺少孩子信息，请刷新后重试');
    if (quote.value && result.price.payPrice !== quote.value.price.payPrice)
      priceNotice.value = `费用已从 ¥${money(quote.value.price.payPrice)} 更新为 ¥${money(
        result.price.payPrice,
      )}，请核对后重新确认。`;
    agree.value = false;
    return result;
  });
  const coupons = computed(() =>
    (quote.value?.coupons || []).map((c) =>
      c.discountType === 1 ? c : { ...c, match: false, mismatchReason: '当前课程支持单张满减券' },
    ),
  );
  async function selectCoupon(id) {
    couponId.value = id || null;
    showCoupon.value = false;
    actionError.value = '';
    await refresh();
  }
  function studentName(id) {
    return family.students.find((s) => s.id === id)?.name || '孩子信息待确认';
  }
  async function submit() {
    if (busy.value || loading.value || !agree.value) return;
    busy.value = true;
    actionError.value = '';
    try {
      const order =
        createdOrder.value ||
        (await unwrap(
          Order.createOrder({
            items: lines.value,
            deliveryType: 3,
            pointStatus: false,
            expectedPayPrice: quote.value.price.payPrice,
            ...(couponId.value ? { couponId: couponId.value } : {}),
            remark: remark.value,
          }),
        ));
      createdOrder.value = order;
      uni.removeStorageSync('edu-checkout-items');
      if (order.payOrderId)
        uni.redirectTo({ url: '/pages/pay/index?id=' + order.payOrderId + '&orderType=goods' });
      else go('orders', { id: order.id });
    } catch (e) {
      actionError.value = e.message;
    } finally {
      busy.value = false;
    }
  }
  onLoad(() => {
    if (requireLogin()) refresh();
  });
</script>
