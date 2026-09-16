<!-- 订单确认的优惠劵选择弹窗 -->
<template>
  <su-popup
    :show="show"
    type="bottom"
    round="24"
    @close="emits('close')"
    showClose
    backgroundColor="#F5F5F7"
  >
    <view class="model-box">
      <view class="title ss-m-t-16 ss-m-l-20 ss-flex">优惠券</view>
      <scroll-view
        class="model-content"
        scroll-y
        :scroll-with-animation="false"
        :enable-back-to-top="true"
      >
        <!--可使用的优惠券区域-->
        <button class="no-coupon" @tap="radioChange(undefined)">{{
          state.couponId ? '本次不使用优惠券' : '✓ 本次不使用优惠券'
        }}</button>
        <view v-if="!state.couponInfo.length" class="empty-note"
          >暂无优惠券。机构发放后可在这里选择。</view
        >
        <view class="subtitle ss-m-l-20">可使用优惠券</view>
        <view
          v-for="(item, index) in state.couponInfo.filter((coupon) => coupon.match)"
          :key="index"
        >
          <s-coupon-list :data="item" type="user" :disabled="false">
            <template #default>
              <label class="coupon-radio ss-flex ss-col-center" @tap="radioChange(item.id)">
                <radio
                  color="var(--ui-BG-Main)"
                  :checked="state.couponId === item.id"
                  @tap.stop="radioChange(item.id)"
                />
              </label>
            </template>
          </s-coupon-list>
        </view>
        <!--不可使用的优惠券区域-->
        <view class="subtitle ss-m-t-40 ss-m-l-20">不可使用优惠券</view>
        <view v-for="item in state.couponInfo.filter((coupon) => !coupon.match)" :key="item.id">
          <s-coupon-list :data="item" type="user" :disabled="true">
            <template v-slot:reason>
              <view class="ss-flex ss-m-t-24">
                <view class="reason-title"> 不可用原因：</view>
                <view class="reason-desc">{{ item.mismatchReason || '未达到使用门槛' }}</view>
              </view>
            </template>
          </s-coupon-list>
        </view>
      </scroll-view>
    </view>
    <view class="modal-footer ss-flex">
      <button class="confirm-btn ss-reset-button" @tap="onConfirm">确认</button>
    </view>
  </su-popup>
</template>
<script setup>
  import { computed, reactive, watch } from 'vue';

  const props = defineProps({
    modelValue: {
      // 优惠劵列表
      type: Array,
      default: () => [],
    },
    show: {
      type: Boolean,
      default: false,
    },
    selectedId: { type: Number, default: undefined },
  });

  const emits = defineEmits(['confirm', 'close']);

  const state = reactive({
    couponInfo: computed(() => props.modelValue), // 优惠劵列表
    couponId: undefined, // 选中的优惠劵编号
  });
  watch(
    () => props.show,
    (visible) => {
      if (visible) state.couponId = props.selectedId;
    },
  );

  // 选中优惠劵
  function radioChange(couponId) {
    if (state.couponId === couponId) {
      state.couponId = undefined;
    } else {
      state.couponId = couponId;
    }
  }

  // 确认优惠劵
  const onConfirm = () => {
    emits('confirm', state.couponId);
  };
</script>
<style lang="scss" scoped>
  :deep() {
    .uni-checkbox-input {
      background-color: var(--ui-BG-Main);
    }
  }

  .model-box {
    height: 60vh;
  }

  .title {
    font-size: 20px;
    height: 80rpx;
    font-weight: bold;
    color: #333333;
    padding-left: 16px;
  }

  .subtitle {
    font-size: 14px;
    font-weight: 500;
    color: #333333;
  }

  .model-content {
    height: 54vh;
  }

  .modal-footer {
    width: 100%;
    min-height: 72px;
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
    background: #fff;
  }

  .confirm-btn {
    width: 100%;
    min-height: 48px;
    background: linear-gradient(90deg, var(--ui-BG-Main), var(--ui-BG-Main-gradient));
    border-radius: 12px;
    color: #1d1d1f;
    font-size: 16px;
  }

  .reason-title {
    font-weight: 600;
    font-size: 14px;
    line-height: 1.5;
    color: #6e6e73;
  }

  .reason-desc {
    font-weight: 600;
    font-size: 14px;
    line-height: 1.5;
    color: #434343;
  }
  .no-coupon {
    margin: 12px 16px;
    min-height: 44px;
    border-radius: 12px;
    background: #fff3e8;
    color: #c94b00;
    font-size: 16px;
  }
  .empty-note {
    margin: 16px;
    color: #6e6e73;
    font-size: 14px;
  }
  .coupon-radio {
    min-width: 44px;
    min-height: 44px;
    justify-content: flex-end;
  }
</style>
