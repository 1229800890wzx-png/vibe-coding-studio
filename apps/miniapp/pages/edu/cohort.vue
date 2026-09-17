<template>
  <EduHeader title="班期与课表" child />
  <view class="edu-page with-dock cohort-page">
    <EduState :loading="loading && !cohort" :error="error" @retry="refresh" />
    <template v-if="cohort && !error">
      <view v-if="loading" class="notice" role="status"
        >正在核查最新费用、名额和报名规则，完成后可继续。</view
      >
      <view v-if="changeNotice" class="notice" role="status">{{ changeNotice }}</view>
      <text class="pill"
        >{{ cohort.kind === 'TRIAL' ? '体验课' : '正式课程' }} ·
        {{ cohort.mode === 'ONLINE' ? '线上' : '线下' }}</text
      >
      <view class="title">{{ cohort.name }}</view>
      <view class="current-child card">
        <view
          ><text class="small muted">这次为谁报名</text
          ><view class="strong child-name">{{ currentStudent?.name || '请先选择孩子' }}</view></view
        >
        <text class="small muted">在顶部切换孩子</text>
        <view class="small muted child-help">{{
          currentStudent
            ? '本班期将与这位孩子绑定，选课袋中的其他课程保持原归属。'
            : '可以先查看课表和规则，报名时登录并选择孩子。'
        }}</view>
      </view>
      <view class="card stack">
        <view class="detail-row"
          ><text class="muted">适合年龄</text
          ><text class="detail-value">{{
            cohort.ageMin != null && cohort.ageMax != null
              ? cohort.ageMin + '–' + cohort.ageMax + ' 岁'
              : '待公布'
          }}</text></view
        >
        <view class="detail-row"
          ><text class="muted">授课老师</text
          ><text class="strong detail-value">{{ cohort.teacherName || '待安排' }}</text></view
        >
        <view class="detail-row"
          ><text class="muted">上课地点</text
          ><text class="detail-value">{{
            cohort.mode === 'ONLINE' ? '电脑端在线课堂' : cohort.campusName || '校区待公布'
          }}</text></view
        >
        <view class="detail-row"
          ><text class="muted">班级名额</text
          ><text class="detail-value"
            >{{ Number.isFinite(cohort.capacity) ? cohort.capacity + ' 人班 · ' : ''
            }}{{
              Number.isFinite(cohort.stock)
                ? '余 ' + Math.max(0, cohort.stock) + ' 位'
                : '名额待核查'
            }}</text
          ></view
        >
        <view class="detail-row"
          ><text class="muted">班期总价</text
          ><view class="fee detail-value"
            ><text class="price">{{ priceText(cohort.price) }}</text
            ><text class="small muted"
              >每位孩子 · {{ sessions.length ? sessions.length + ' 次课' : '课表待公布' }}</text
            ></view
          ></view
        >
      </view>
      <view v-if="closedReason" class="notice">{{ closedReason }}</view>
      <view class="section-head"
        ><text class="section-title">完整课表</text
        ><text class="muted">{{ sessions.length }} 次课</text></view
      >
      <view class="small muted timezone-note">以下时间均为北京时间（UTC+8）</view>
      <view class="card">
        <view v-for="(s, i) in sessions" :key="s.id" class="list-line">
          <view class="session-heading"
            ><text class="lesson-no">{{ String(i + 1).padStart(2, '0') }}</text
            ><text class="strong">{{ s.title }}</text></view
          >
          <view class="session-time"
            >{{ beijingDateText(s.startTime, true) }}<text class="muted"> 至 </text
            >{{ beijingDateText(s.endTime, true) }}</view
          >
        </view>
        <view v-if="!sessions.length" class="muted">课表尚未公布，请等待课次时间确认。</view>
      </view>
      <view class="section-head"><text class="section-title">报名前确认</text></view>
      <view class="card stack">
        <view class="strong">课程说明</view
        ><view class="muted rule-text">{{ cohort.terms || '课程说明待公布，暂不能报名。' }}</view>
        <view class="strong">退款与调班</view
        ><view class="muted rule-text">{{
          cohort.refundPolicy || '退款与调班规则待公布，暂不能报名。'
        }}</view>
        <checkbox-group @change="setAgreement">
          <label class="checkrow"
            ><checkbox
              value="agree"
              :checked="agree"
              :disabled="loading || busy || !!closedReason"
              color="#C94B00"
            /><text
              >我已为{{
                currentStudent?.name || '本次报名的孩子'
              }}阅读并确认本班期课程说明、完整课表及退款规则。</text
            ></label
          >
        </checkbox-group>
        <view v-if="!agree" class="small muted"
          >请阅读并勾选后继续。更换孩子或规则更新后，需要重新确认。</view
        >
      </view>
      <view v-if="actionError" class="error" role="alert">{{ actionError }}</view>
      <view class="note"
        >{{
          cohort.mode === 'ONLINE'
            ? '上课需使用电脑与外部课堂工具。'
            : '请按所选校区和具体课次时间到课。'
        }}{{
          isFreeTrial
            ? '免费体验预约确认后，可在预约记录查看结果。'
            : '加入选课袋后，还需确认订单并完成付款；加入选课袋不会锁定名额。'
        }}</view
      >
      <button class="link refresh-link" :disabled="loading || busy" @tap="refresh">{{
        loading ? '正在核查…' : '重新核查班期信息'
      }}</button>
    </template>
  </view>
  <view v-if="cohort && !error" class="dock">
    <view class="dock-inner cohort-dock">
      <view class="dock-summary"
        ><text class="small muted">{{ currentStudent?.name || '尚未选择孩子' }}</text
        ><text class="price">{{ priceText(cohort.price) }}</text></view
      >
      <button
        class="btn"
        :disabled="busy || loading || !!closedReason || !familyReady"
        @tap="enroll"
        >{{ actionLabel }}</button
      >
    </view>
  </view>
</template>
<script setup>
  defineOptions({ inheritAttrs: false });
  import { ref, computed, watch } from 'vue';
  import { onLoad, onShow, onUnload } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import EduState from '@/components/edu/EduState.vue';
  import { edu, unwrap } from '@/edu/api';
  import {
    loadStudents,
    currentStudent,
    family,
    requireChild,
    go,
    money,
    toast,
  } from '@/edu/state';
  import { beijingDateText } from '@/edu/cohort-context';
  import CartApi from '@/sheep/api/trade/cart';
  const id = ref(0),
    cohort = ref(null),
    loading = ref(false),
    error = ref('');
  const agree = ref(false),
    busy = ref(false),
    actionError = ref(''),
    changeNotice = ref(''),
    familyReady = ref(false),
    checkedAt = ref(Date.now());
  let requestSerial = 0,
    lastSnapshot = null;
  const sessions = computed(() =>
    (cohort.value?.sessions || []).filter((s) => s.status !== 'CANCELLED'),
  );
  const isFreeTrial = computed(() => cohort.value?.kind === 'TRIAL' && cohort.value?.price === 0);
  const closedReason = computed(() => {
    const c = cohort.value;
    if (!c) return '班期信息尚未加载';
    if (c.status !== 'OPEN') return '该班期尚未开放报名，请选择其他班期。';
    if (!Number.isFinite(c.price) || c.price < 0) return '班期费用尚未公布，暂不能报名。';
    if (!Number.isFinite(c.stock)) return '名额暂时无法核查，请刷新后重试。';
    if (c.stock <= 0) return '当前名额已满，请返回课程详情查看其他班期。';
    if (!c.startDate || !Number.isFinite(new Date(c.startDate).getTime()))
      return '开课时间尚未确认，暂不能报名。';
    if (new Date(c.startDate).getTime() <= checkedAt.value)
      return '该班期已经开课，请查看其他班期。';
    if (!sessions.value.length) return '课表尚未公布，暂不能报名。';
    if (!String(c.terms || '').trim() || !String(c.refundPolicy || '').trim())
      return '课程说明或退款规则待公布，暂不能报名。';
    return '';
  });
  const actionLabel = computed(() =>
    busy.value
      ? '正在提交…'
      : loading.value
      ? '正在核查…'
      : closedReason.value
      ? '暂不能报名'
      : !familyReady.value
      ? '请重试信息核查'
      : isFreeTrial.value
      ? '预约免费体验课'
      : '加入选课袋',
  );
  function priceText(value) {
    return Number.isFinite(value) && value >= 0 ? '¥' + money(value) : '费用待公布';
  }
  function snapshot(c) {
    return {
      price: c.price,
      terms: c.terms,
      refundPolicy: c.refundPolicy,
      kind: c.kind,
      mode: c.mode,
      campusId: c.campusId,
      teacherId: c.teacherId,
      startDate: c.startDate,
      endDate: c.endDate,
      sessions: (c.sessions || []).map((s) => [s.id, s.title, s.startTime, s.endTime, s.status]),
    };
  }
  function setAgreement(event) {
    agree.value =
      !loading.value && !busy.value && !closedReason.value && event.detail.value.includes('agree');
  }
  async function refresh() {
    const serial = ++requestSerial;
    loading.value = true;
    error.value = '';
    familyReady.value = false;
    actionError.value = '';
    if (!Number.isSafeInteger(id.value) || id.value <= 0) {
      cohort.value = null;
      error.value = '班期地址无效，请返回课程详情';
      loading.value = false;
      return;
    }
    const [cohortResult, familyResult] = await Promise.allSettled([
      edu.cohort(id.value),
      loadStudents(),
    ]);
    if (serial !== requestSerial) return;
    familyReady.value = familyResult.status === 'fulfilled';
    if (familyResult.status === 'rejected')
      actionError.value = familyResult.reason?.message || '孩子信息加载失败，请重新核查';
    if (cohortResult.status === 'fulfilled') {
      const next = snapshot(cohortResult.value);
      if (lastSnapshot && JSON.stringify(lastSnapshot) !== JSON.stringify(next)) {
        const changed = [];
        if (lastSnapshot.price !== next.price)
          changed.push(
            '费用由 ' + priceText(lastSnapshot.price) + ' 更新为 ' + priceText(next.price),
          );
        if (lastSnapshot.terms !== next.terms || lastSnapshot.refundPolicy !== next.refundPolicy)
          changed.push('课程说明或退款规则已更新');
        if (!changed.length) changed.push('课表或授课安排已更新');
        changeNotice.value = changed.join('；') + '。请重新阅读并勾选确认。';
        agree.value = false;
      }
      lastSnapshot = next;
      cohort.value = cohortResult.value;
      checkedAt.value = Date.now();
    } else {
      cohort.value = null;
      agree.value = false;
      error.value = cohortResult.reason?.message || '班期暂时无法加载，请重试';
    }
    loading.value = false;
  }
  async function enroll() {
    if (busy.value || loading.value || !familyReady.value || closedReason.value) return;
    if (!requireChild()) return;
    if (!currentStudent.value) {
      actionError.value = '请选择当前账号下的孩子后再报名';
      return;
    }
    if (!agree.value) {
      actionError.value = '请先阅读并勾选本班期的课程说明、课表及退款规则';
      toast('请先阅读并确认课程说明');
      return;
    }
    busy.value = true;
    actionError.value = '';
    const studentId = family.currentId,
      selected = cohort.value;
    try {
      if (selected.kind === 'TRIAL' && selected.price === 0) {
        await edu.trial({ studentId, cohortId: id.value });
        toast('体验课预约成功');
        go('trials');
      } else {
        await unwrap(CartApi.addCart({ skuId: selected.skuId, studentId, count: 1 }));
        go('cart');
      }
    } catch (e) {
      actionError.value = e?.message || '暂时无法提交，请重试';
    } finally {
      busy.value = false;
    }
  }
  watch(
    () => family.currentId,
    (next, previous) => {
      agree.value = false;
      if (next !== previous && cohort.value)
        changeNotice.value =
          '报名孩子已切换为' +
          (currentStudent.value?.name || '待选择') +
          '，请为这位孩子重新确认课程说明、课表及退款规则。';
    },
    { flush: 'sync' },
  );
  onLoad((options) => {
    id.value = Number(options.id);
  });
  onShow(() => {
    refresh();
  });
  onUnload(() => {
    requestSerial++;
  });
</script>
<style scoped>
  .cohort-page.with-dock {
    padding-bottom: calc(150px + env(safe-area-inset-bottom));
  }
  .notice {
    padding: 14px 16px;
    border-radius: 12px;
    background: #fff3e8;
    color: #8b3900;
    line-height: 1.65;
    margin: 0 0 16px;
    overflow-wrap: anywhere;
  }
  .current-child {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    margin-top: 20px;
  }
  .child-name {
    margin-top: 4px;
    overflow-wrap: anywhere;
  }
  .child-help {
    flex-basis: 100%;
    line-height: 1.65;
  }
  .detail-row {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 12px;
    align-items: start;
  }
  .detail-value {
    text-align: right;
    overflow-wrap: anywhere;
  }
  .fee {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .timezone-note {
    margin: -4px 0 12px;
  }
  .session-heading {
    display: flex;
    gap: 12px;
    align-items: baseline;
  }
  .lesson-no {
    color: #c94b00;
    font-size: 18px;
    font-weight: 700;
  }
  .session-time {
    margin-top: 8px;
    line-height: 1.7;
    font-size: 14px;
  }
  .rule-text {
    white-space: pre-line;
    line-height: 1.8;
    overflow-wrap: anywhere;
  }
  .checkrow {
    line-height: 1.75;
    padding: 6px 0;
  }
  .checkrow checkbox {
    flex-shrink: 0;
  }
  .cohort-dock {
    align-items: center;
  }
  .dock-summary {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    gap: 4px;
    overflow-wrap: anywhere;
  }
  .dock-summary .price {
    font-size: 22px;
  }
  .cohort-dock > .btn {
    flex: 0 1 56%;
    min-height: 48px;
    padding: 14px 10px;
  }
  .refresh-link {
    margin: 12px 0 0;
    min-height: 44px;
    padding: 10px 0;
  }
  button:focus-visible {
    outline: 2px solid #c94b00;
    outline-offset: 3px;
  }
  @media (max-width: 340px) {
    .detail-row {
      grid-template-columns: 70px minmax(0, 1fr);
      gap: 8px;
    }
    .cohort-dock {
      gap: 8px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    button {
      transition: none;
      transform: none;
    }
  }
</style>
