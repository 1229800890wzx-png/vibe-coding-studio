<template>
  <EduHeader title="一对一高级课" />
  <view class="edu-page private-page">
    <view class="private-hero">
      <view class="hero-copy"
        ><text class="private-eyebrow">1:1 · PERSONAL STUDIO</text
        ><view class="private-title">一个孩子，<br />一个专属创作计划。</view
        ><view class="private-subtitle"
          >从孩子正在做的项目出发，与老师一起深入拆解、动手验证、打磨作品。</view
        ><view class="hero-tags"
          ><text>8–16 岁</text><text>个性化目标</text><text>老师自主选择</text></view
        ></view
      >
      <view class="hero-image"
        ><image src="/static/edu/courses/product.jpg" mode="aspectFill" /><text
          >课程创作示意</text
        ></view
      >
    </view>
    <view class="intro-grid">
      <view v-for="item in benefits" :key="item.title" class="intro-item"
        ><text class="intro-number">{{ item.number }}</text
        ><view class="strong">{{ item.title }}</view
        ><view class="small muted">{{ item.description }}</view></view
      >
    </view>
    <view class="section-head"><text class="section-title">怎样开始一对一</text></view>
    <view class="card process-card"
      ><view v-for="(step, i) in steps" :key="step.title" class="process-step"
        ><text class="step-number">{{ i + 1 }}</text
        ><view
          ><view class="strong">{{ step.title }}</view
          ><view class="small muted">{{ step.description }}</view></view
        ></view
      ></view
    >
    <view class="section-head"
      ><text class="section-title">选择指导老师</text
      ><text class="small muted">{{ teachers.length }} 位已开放</text></view
    >
    <EduState
      :loading="teacherLoading"
      :error="teacherError"
      :empty="!teachers.length"
      title="一对一师资准备中"
      description="老师开放服务后，可在这里查看介绍并提交预约申请。"
      @retry="refreshTeachers"
    />
    <view v-if="!teacherLoading && !teacherError" class="teacher-grid">
      <button
        v-for="teacher in teachers"
        :key="teacher.id"
        class="teacher-card"
        :class="{ selected: form.teacherId === teacher.id }"
        :disabled="busy"
        :aria-label="'选择' + teacher.name"
        @tap="chooseTeacher(teacher.id)"
      >
        <view class="teacher-top"
          ><image
            v-if="teacher.avatarUrl && !failedAvatars[teacher.id]"
            :src="teacher.avatarUrl"
            mode="aspectFill"
            class="teacher-avatar"
            @error="failedAvatars[teacher.id] = true"
          /><view v-else class="teacher-initial">{{ teacher.name?.slice(0, 1) }}</view
          ><view class="teacher-heading"
            ><view class="strong">{{ teacher.name }}</view
            ><view class="small muted">一对一创作指导</view></view
          ><text class="selection-mark">{{
            form.teacherId === teacher.id ? '✓' : '＋'
          }}</text></view
        >
        <view class="teacher-bio">{{ teacher.bio }}</view
        ><view class="teacher-action">{{
          form.teacherId === teacher.id ? '已选这位老师' : '选择这位老师'
        }}</view>
      </button>
    </view>
    <view id="appointment-form" class="section-head"
      ><text class="section-title">填写预约需求</text
      ><text class="small muted">约 1 分钟</text></view
    >
    <view v-if="!loggedIn" class="card stack"
      ><view class="strong">登录后，为孩子提交预约</view
      ><view class="muted">所选老师会保留，回来后继续填写。</view
      ><button class="btn" @tap="requireLogin">家长登录</button></view
    >
    <template v-else>
      <view v-if="success" class="success-panel"
        ><view class="strong">{{ success }}</view
        ><view>{{
          success.includes('撤回')
            ? '此申请已结束，可以按新的需求再次预约。'
            : '你可以在下方查看申请。具体授课时间与费用仍待沟通确认。'
        }}</view></view
      >
      <EduState
        :loading="accountLoading && !account"
        :error="accountError"
        @retry="refreshAccount"
      />
      <template v-if="account && !accountError">
        <view v-if="!students.length" class="card stack"
          ><view>先添加孩子，老师才能了解他的学习阶段。</view
          ><button class="btn secondary" @tap="go('children')">添加孩子档案</button></view
        >
        <view v-else-if="!account.options.enabled" class="card stack"
          ><view class="strong">预约受理暂未开放</view
          ><view class="muted">可以先了解老师，开放后再提交需求。</view></view
        >
        <view v-else class="card booking-form stack">
          <view class="selection-summary"
            ><text class="small muted">本次预约</text
            ><view class="strong"
              >{{ selectedStudent?.name || '选择孩子' }} ·
              {{ selectedTeacher?.name || '请先选择老师' }}</view
            ><view v-if="draftSavedAt" class="small muted"
              >草稿已保存在此设备 · {{ draftSavedAt }}</view
            ></view
          >
          <view class="field-label">孩子</view
          ><picker
            :disabled="busy"
            :range="students"
            range-key="name"
            :value="studentIndex"
            @change="changeStudent"
            ><view class="form-field"
              >{{ selectedStudent?.name || '选择孩子' }}<text>⌄</text></view
            ></picker
          >
          <view class="field-label">期望日期与开始时间 <text class="muted">· 北京时间</text></view>
          <view class="time-row"
            ><picker
              mode="date"
              :start="today"
              :value="form.date"
              :disabled="busy"
              @change="setField('date', $event.detail.value)"
              ><view class="form-field">{{ form.date || '选择日期' }}<text>⌄</text></view></picker
            ><picker
              mode="time"
              :value="form.time"
              :disabled="busy"
              @change="setField('time', $event.detail.value)"
              ><view class="form-field">{{ form.time || '开始时间' }}<text>⌄</text></view></picker
            ></view
          >
          <view class="field-label">期望时长</view
          ><view class="duration-row"
            ><button
              v-for="minutes in durations"
              :key="minutes"
              class="chip"
              :class="{ active: form.duration === minutes }"
              :disabled="busy"
              @tap="setField('duration', minutes)"
              >{{ minutes }} 分钟</button
            ></view
          >
          <view class="time-note"
            >这是你的期望时间，尚未锁定老师日程。受理后会与你确认具体安排与报价。</view
          >
          <view class="field-label">孩子想实现什么</view
          ><textarea
            v-model="form.message"
            :disabled="busy"
            class="form-field goal-input"
            maxlength="1000"
            placeholder="例如：已经做了一个小游戏，想让老师指导关卡设计和程序调试。也可以写下当前基础与想解决的问题。"
          />
          <view class="field-label">家长称呼</view
          ><input
            v-model="form.contactName"
            :disabled="busy"
            class="form-field"
            maxlength="50"
            placeholder="老师如何称呼你"
          />
          <view class="field-label">联系手机</view
          ><input
            v-model="form.mobile"
            :disabled="busy"
            class="form-field"
            type="number"
            maxlength="11"
            placeholder="仅用于本次预约沟通"
          />
          <view class="booking-review"
            ><view class="strong">提交前确认</view
            ><view>{{ selectedStudent?.name }} · {{ selectedTeacher?.name || '尚未选老师' }}</view
            ><view>{{ form.date || '尚未选日期' }} {{ form.time }} · {{ form.duration }} 分钟</view
            ><view class="small muted"
              >当前无需付款，教学方案和费用沟通确认后再决定报名。</view
            ></view
          >
          <label class="consent-row" @tap="!busy && (contactConsent = !contactConsent)"
            ><checkbox :checked="contactConsent" :disabled="busy" color="#C94B00" /><text>{{
              account.options.consentText
            }}</text></label
          >
          <view v-if="actionError" class="error" role="alert">{{ actionError }}</view>
          <button
            class="btn submit-appointment"
            :disabled="
              busy ||
              accountLoading ||
              teacherLoading ||
              !!teacherError ||
              !selectedTeacher ||
              !contactConsent
            "
            @tap="submit"
            >{{ busy ? '正在提交申请…' : '提交一对一预约申请' }}</button
          >
          <view v-if="!selectedTeacher" class="small muted">请在上方选择一位指导老师。</view>
        </view>
        <view class="section-head"
          ><text class="section-title">我的一对一预约</text
          ><button class="link" :disabled="accountLoading" @tap="refreshAccount">刷新</button></view
        >
        <view v-if="!history.length" class="card muted"
          >预约申请会保存在这里，可查看状态或撤回。</view
        >
        <view v-for="item in history" :key="item.id" class="card stack appointment-record">
          <view class="row between"
            ><text class="strong">{{ item.teacherName }} · 一对一</text
            ><text class="pill">{{ appointmentStatus(item) }}</text></view
          >
          <view>{{ item.name }}</view
          ><view class="muted"
            >期望：{{ dateText(item.preferredStartTime) }} –
            {{ dateText(item.preferredEndTime) }}</view
          ><view class="small muted"
            >申请时间：{{ dateText(item.createTime) }} · 时间待沟通确认</view
          >
          <button
            v-if="item.appointmentStatus !== 'CANCELLED'"
            class="link cancel-appointment"
            :disabled="!!cancelling"
            @tap="cancel(item)"
            >{{ cancelling === item.id ? '正在撤回…' : '撤回预约申请' }}</button
          >
        </view>
        <view v-if="cancelError" class="error" role="alert">{{ cancelError }}</view>
      </template>
    </template>
  </view>
</template>
<script setup>
  import { computed, reactive, ref, watch } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import EduState from '@/components/edu/EduState.vue';
  import { edu, listOf, unwrap } from '@/edu/api';
  import UserApi from '@/sheep/api/member/user';
  import { getAccessToken } from '@/sheep/request';
  import { useResource } from '@/edu/resource';
  import { family, requireLogin, go, dateText, confirm } from '@/edu/state';
  import store from '@/sheep/store';
  defineOptions({ inheritAttrs: false });
  const user = store('user'),
    loggedIn = computed(() => user.isLogin);
  const benefits = [
    { number: '01', title: '项目进阶', description: '带着正在做的作品，深入解决具体问题。' },
    { number: '02', title: '思路讲清', description: '理解实现过程，练习测试和解释自己的选择。' },
    { number: '03', title: '目标定制', description: '结合年龄与基础，沟通适合的创作计划。' },
  ];
  const steps = [
    { title: '看课程，选老师', description: '了解一对一的学习方式，选择合适的指导老师。' },
    { title: '说目标，约时间', description: '填写孩子的情况、创作目标和期望时段。' },
    { title: '确认方案，再报名', description: '沟通教学方案、上课安排和报价，确认后报名。' },
  ];
  const durations = [30, 60, 90, 120, 180];
  const defaults = () => ({
    studentId: 0,
    teacherId: 0,
    date: '',
    time: '',
    duration: 60,
    message: '',
    contactName: '',
    mobile: '',
  });
  const form = reactive(defaults()),
    contactConsent = ref(false),
    busy = ref(false),
    actionError = ref(''),
    success = ref(''),
    cancelling = ref(0),
    cancelError = ref(''),
    draftSavedAt = ref(''),
    failedAvatars = reactive({});
  let draftOwner = '',
    restoring = false;
  const beijingIso = (ms) => new Date(ms + 8 * 3600000).toISOString().slice(0, 19);
  const today = computed(() => beijingIso(Date.now()).slice(0, 10));
  const {
    data: teacherData,
    loading: teacherLoading,
    error: teacherError,
    refresh: refreshTeachers,
  } = useResource(() => edu.teachers({ oneToOne: true }));
  const teachers = computed(() => listOf(teacherData.value));
  const selectedTeacher = computed(() => teachers.value.find((t) => t.id === form.teacherId));
  const account = ref(null),
    accountLoading = ref(false),
    accountError = ref('');
  let accountSequence = 0;
  const students = computed(() => account.value?.students || []);
  const selectedStudent = computed(() => students.value.find((s) => s.id === form.studentId));
  const studentIndex = computed(() =>
    Math.max(
      0,
      students.value.findIndex((s) => s.id === form.studentId),
    ),
  );
  async function refreshAccount(attempt = 0) {
    if (!Number.isInteger(attempt)) attempt = 0;
    const sequence = ++accountSequence,
      token = getAccessToken();
    if (!loggedIn.value || !token) return clearAccount();
    accountLoading.value = true;
    accountError.value = '';
    try {
      // Fetch through the original member API. Do not bind a late child response to a new login.
      const [member, children, options, records] = await Promise.all([
        unwrap(UserApi.getUserInfo()),
        edu.students(),
        edu.admissionOptions(),
        edu.admissions(),
      ]);
      if (sequence !== accountSequence) return;
      if (!loggedIn.value) {
        clearAccount();
        return;
      }
      if (token !== getAccessToken()) {
        // A renewed token may still belong to the same original member.
        if (attempt < 1) return refreshAccount(attempt + 1);
        clearAccount();
        accountError.value = '登录状态已更新，请重试加载预约资料';
        return;
      }
      const owner = String(member.id || '');
      if (!owner) throw new Error('账号资料尚未加载，请重试');
      const owned = listOf(children),
        changed = owner !== draftOwner;
      const selected = changed && draftOwner ? 0 : form.teacherId;
      account.value = { options, history: listOf(records), students: owned };
      if (changed || !owned.some((s) => s.id === form.studentId)) {
        draftOwner = owner;
        const current = owned.find((s) => s.id === family.currentId)?.id || owned[0]?.id || 0;
        restoreDraft(current, selected);
      }
    } catch (e) {
      if (sequence === accountSequence)
        accountError.value = success.value
          ? '操作已完成，预约记录暂未刷新，请重试。'
          : e.message || '预约资料加载失败，请重试';
    } finally {
      if (sequence === accountSequence) accountLoading.value = false;
    }
  }
  function clearAccount() {
    accountSequence++;
    account.value = null;
    accountLoading.value = false;
    accountError.value = '';
    draftOwner = '';
    restoreDraft(0);
    contactConsent.value = false;
    success.value = '';
    cancelError.value = '';
  }
  const history = computed(() =>
    (account.value?.history || []).filter((item) => item.serviceType === 'ONE_TO_ONE'),
  );
  const draftKey = () =>
    draftOwner && form.studentId ? `edu-one-to-one-draft:${draftOwner}:${form.studentId}` : '';
  function restoreDraft(studentId, selected = 0) {
    restoring = true;
    Object.assign(form, defaults(), { studentId });
    const saved = draftKey() && uni.getStorageSync(draftKey());
    if (saved && typeof saved === 'object') {
      for (const key of Object.keys(defaults()))
        if (key !== 'studentId' && saved[key] !== undefined) form[key] = saved[key];
    }
    if (selected) form.teacherId = selected;
    contactConsent.value = false;
    draftSavedAt.value = '';
    actionError.value = '';
    restoring = false;
  }
  watch(
    form,
    () => {
      if (restoring || !loggedIn.value || !draftKey()) return;
      try {
        uni.setStorageSync(draftKey(), { ...form });
        draftSavedAt.value = beijingIso(Date.now()).slice(11, 16);
      } catch {
        draftSavedAt.value = '';
      }
    },
    { deep: true, flush: 'sync' },
  );
  function chooseTeacher(id) {
    form.teacherId = id;
    contactConsent.value = false;
    success.value = '';
  }
  function changeStudent(event) {
    restoreDraft(students.value[Number(event.detail.value)]?.id || 0);
    success.value = '';
  }
  function setField(key, value) {
    form[key] = value;
    contactConsent.value = false;
  }
  async function sameMember(owner, token) {
    if (!loggedIn.value || owner !== draftOwner) return false;
    if (token === getAccessToken()) return true;
    for (let attempt = 0; attempt < 2; attempt++) {
      const currentToken = getAccessToken();
      const member = await unwrap(UserApi.getUserInfo());
      if (!loggedIn.value || owner !== draftOwner) return false;
      if (currentToken === getAccessToken()) return String(member.id) === owner;
    }
    return false;
  }
  async function submit() {
    if (busy.value || accountLoading.value || !requireLogin()) return;
    actionError.value = '';
    success.value = '';
    if (!selectedStudent.value || !selectedTeacher.value)
      return (actionError.value = '请确认本次预约的孩子和指导老师');
    if (!form.message.trim()) return (actionError.value = '请写下孩子的学习目标，帮助老师准备');
    if (!form.contactName.trim() || !/^1[3-9]\d{9}$/.test(form.mobile))
      return (actionError.value = '请填写家长称呼和正确的手机号码');
    const start = Date.parse(`${form.date}T${form.time}:00+08:00`);
    if (!Number.isFinite(start) || start <= Date.now())
      return (actionError.value = '请选择未来的期望日期和时间');
    if (!durations.includes(form.duration)) return (actionError.value = '请选择期望时长');
    if (!contactConsent.value) return (actionError.value = '请确认本次预约联系授权');
    busy.value = true;
    const operationToken = getAccessToken(),
      operationOwner = draftOwner;
    try {
      await edu.createAdmission({
        serviceType: 'ONE_TO_ONE',
        studentId: form.studentId,
        teacherId: form.teacherId,
        preferredStartTime: beijingIso(start),
        preferredEndTime: beijingIso(start + form.duration * 60000),
        message: form.message.trim(),
        contactName: form.contactName.trim(),
        mobile: form.mobile,
        contactConsent: true,
        consentVersion: account.value.options.consentVersion,
      });
      if (!(await sameMember(operationOwner, operationToken))) return;
      contactConsent.value = false;
      success.value = '预约申请已提交，等待老师与你确认。';
      const key = draftKey();
      restoring = true;
      form.message = '';
      restoring = false;
      if (key) uni.removeStorageSync(key);
      draftSavedAt.value = '';
      await refreshAccount();
    } catch (e) {
      if (operationOwner === draftOwner && loggedIn.value)
        actionError.value = e.message || '提交结果暂未确认，请刷新预约记录；输入已保留';
    } finally {
      busy.value = false;
    }
  }
  function appointmentStatus(item) {
    return item.appointmentStatus === 'CANCELLED'
      ? '已撤回'
      : item.followUpStatus
        ? '已跟进 · 待确认'
        : '已提交 · 待联系';
  }
  async function cancel(item) {
    if (
      cancelling.value ||
      !(await confirm(
        '撤回预约申请',
        `确认撤回与${item.teacherName}的一对一预约申请？申请记录会保留。`,
      ))
    )
      return;
    cancelling.value = item.id;
    cancelError.value = '';
    const operationToken = getAccessToken(),
      operationOwner = draftOwner;
    try {
      await edu.cancelAdmission(item.id);
      if (!(await sameMember(operationOwner, operationToken))) return;
      success.value = '预约申请已撤回，记录已保留。';
      await refreshAccount();
    } catch (e) {
      if (operationOwner === draftOwner && loggedIn.value)
        cancelError.value = e.message || '撤回结果暂未确认，请刷新预约记录';
    } finally {
      cancelling.value = 0;
    }
  }
  onShow(() => {
    refreshTeachers();
    if (loggedIn.value) refreshAccount();
    else if (draftOwner || account.value) clearAccount();
  });
  watch(
    () => [user.isLogin, user.userInfo.id],
    ([isLogin, id]) => {
      if (!isLogin || (draftOwner && id && String(id) !== draftOwner)) clearAccount();
    },
    { flush: 'sync' },
  );
</script>
<style scoped>
  .private-page {
    padding-bottom: 40px;
  }
  .private-hero {
    overflow: hidden;
    border-radius: 20px;
    background: #1d1d1f;
    color: #fff;
  }
  .hero-copy {
    padding: 28px 24px;
  }
  .private-eyebrow {
    font-size: 12px;
    letter-spacing: 2px;
    color: #ffab60;
    font-weight: 650;
  }
  .private-title {
    font-size: 32px;
    font-weight: 750;
    line-height: 1.25;
    margin: 18px 0;
    letter-spacing: -1px;
  }
  .private-subtitle {
    color: #d1d1d6;
    line-height: 1.8;
    font-size: 16px;
  }
  .hero-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 20px;
  }
  .hero-tags text {
    border: 1px solid #55555b;
    padding: 5px 9px;
    border-radius: 7px;
    font-size: 13px;
  }
  .hero-image {
    height: 0;
    padding-top: 56.25%;
    position: relative;
  }
  .hero-image image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .hero-image > text {
    position: absolute;
    bottom: 12px;
    right: 12px;
    padding: 3px 7px;
    background: #fffffff0;
    color: #515157;
    border-radius: 5px;
    font-size: 14px;
  }
  .intro-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin: 24px 0 30px;
  }
  .intro-item .strong {
    margin: 8px 0;
  }
  .intro-number {
    color: #c94b00;
    font-size: 13px;
  }
  .process-card {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .process-step {
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }
  .step-number {
    flex: none;
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    background: #fff3e8;
    color: #c94b00;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
  }
  .process-step .muted {
    margin-top: 4px;
    line-height: 1.7;
  }
  .teacher-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .teacher-card {
    width: 100%;
    padding: 18px;
    background: white;
    border: 2px solid #eaeaee;
    border-radius: 16px;
    text-align: left;
    line-height: 1.6;
    transition:
      border-color 0.12s,
      background 0.12s;
  }
  .teacher-card::after {
    border: 0;
  }
  .teacher-card.selected {
    border-color: #c94b00;
    background: #fffbf6;
  }
  .teacher-card:active {
    background: #fff3e8;
  }
  .teacher-top {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .teacher-avatar,
  .teacher-initial {
    width: 52px;
    height: 52px;
    flex: none;
    border-radius: 14px;
  }
  .teacher-initial {
    display: grid;
    place-items: center;
    background: #fff3e8;
    color: #a54300;
    font-size: 24px;
  }
  .teacher-heading {
    flex: 1;
    min-width: 0;
  }
  .selection-mark {
    color: #c94b00;
    font-weight: 700;
  }
  .teacher-bio {
    margin: 16px 0;
    color: #515157;
    font-size: 14px;
    white-space: pre-line;
    overflow-wrap: anywhere;
  }
  .teacher-action {
    font-size: 14px;
    color: #c94b00;
    font-weight: 650;
  }
  .booking-form {
    gap: 12px;
  }
  .selection-summary {
    padding-bottom: 16px;
    border-bottom: 1px solid #eaeaee;
  }
  .selection-summary .strong {
    margin: 6px 0;
  }
  .field-label {
    font-size: 14px;
    font-weight: 600;
  }
  .form-field {
    background: #f5f5f7;
    border-radius: 12px;
    min-height: 48px;
    padding: 0 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    font-size: 16px;
  }
  .time-row {
    display: grid;
    grid-template-columns: 1.15fr 1fr;
    gap: 10px;
  }
  .duration-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .duration-row .chip {
    margin: 0;
  }
  .time-note {
    font-size: 14px;
    line-height: 1.7;
    color: #6e6e73;
  }
  .goal-input {
    padding: 12px;
    min-height: 140px;
    line-height: 1.7;
  }
  .booking-review {
    background: #fff3e8;
    border-radius: 12px;
    padding: 16px;
    font-size: 14px;
    line-height: 1.9;
  }
  .booking-review .muted {
    margin-top: 8px;
  }
  .consent-row {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 14px;
    line-height: 1.7;
    padding: 8px 0;
    min-height: 44px;
  }
  .consent-row checkbox {
    flex: none;
    transform: scale(0.85);
    transform-origin: top left;
  }
  .success-panel {
    padding: 18px;
    border: 1px solid #c9e5d0;
    border-radius: 16px;
    background: #f0faf3;
    color: #206c42;
    line-height: 1.8;
  }
  .appointment-record .row {
    flex-wrap: wrap;
    gap: 10px;
  }
  .appointment-record .pill {
    white-space: nowrap;
  }
  .cancel-appointment {
    align-self: flex-start;
  }
  .submit-appointment {
    width: 100%;
  }
  @media (min-width: 700px) {
    .private-hero {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .hero-image {
      height: 100%;
      padding: 0;
      min-height: 330px;
    }
    .hero-image image {
      object-fit: cover;
    }
    .hero-copy {
      padding: 32px;
    }
    .process-card {
      flex-direction: row;
    }
    .process-step {
      flex: 1;
    }
    .teacher-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 540px) {
    .teacher-grid {
      grid-template-columns: 1fr;
    }
    .intro-grid {
      gap: 10px;
    }
    .intro-item .strong {
      font-size: 15px;
    }
    .intro-item .small {
      font-size: 14px;
      line-height: 1.7;
    }
    .private-title {
      font-size: 29px;
    }
  }
  @media (max-width: 360px) {
    .private-title {
      font-size: 26px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .teacher-card {
      transition: none;
    }
  }
</style>
