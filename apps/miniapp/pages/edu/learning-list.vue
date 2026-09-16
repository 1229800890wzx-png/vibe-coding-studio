<template>
  <view class="parent-canvas">
    <EduHeader :title="meta.title" child @change="changeChild" />
    <view class="parent-page parent-record-page">
      <text class="parent-eyebrow">{{ currentStudent?.name || '孩子的' }} · LEARNING JOURNAL</text>
      <view class="parent-title">{{ meta.title }}</view>
      <view class="parent-muted">{{ meta.desc }}</view>
      <view class="record-toolbar"
        ><text class="parent-micro">{{
          loading ? '正在整理记录…' : error ? '记录暂未加载' : items.length + ' 条记录'
        }}</text
        ><button v-if="cohortId" class="parent-text-button" @tap="cohortId = 0"
          >查看全部班期 ↗</button
        ><button v-else class="parent-text-button" :disabled="loading" @tap="refresh"
          >刷新 ↻</button
        ></view
      >
      <view v-if="loading" class="parent-skeleton" aria-label="正在读取学习记录" />
      <view v-else-if="error" class="parent-error"
        ><view>暂时无法读取，请重试。</view
        ><button class="parent-text-button" @tap="refresh">重新加载</button></view
      >
      <template v-else>
        <view v-if="!items.length" class="parent-panel parent-empty"
          ><view class="parent-icon-tile"><ParentIcon :name="meta.icon" /></view
          ><view class="parent-card-title">{{
            currentStudent ? meta.empty : '先添加孩子档案。'
          }}</view
          ><view class="parent-muted">{{
            currentStudent ? meta.hint : '为每个孩子分别整理课表、作品与成长记录。'
          }}</view
          ><button v-if="!currentStudent" class="parent-primary" @tap="go('children')"
            >添加孩子 ＋</button
          ><button v-else-if="type === 'calendar'" class="parent-text-button" @tap="tab('courses')"
            >了解课程与班期 ↗</button
          ></view
        >
        <view v-for="item in items" :key="keyOf(item)" class="parent-panel record-card">
          <view class="record-heading">
            <view v-if="type === 'calendar'" class="parent-date"
              ><text>{{ dateParts(item.startTime).month }} 月</text
              ><text class="parent-date-day">{{ dateParts(item.startTime).day }}</text
              ><text>{{ dateParts(item.startTime).week }}</text></view
            >
            <view v-else class="parent-icon-tile"><ParentIcon :name="meta.icon" /></view>
            <view class="record-title"
              ><text class="parent-micro">{{ contextLabel(item) }}</text
              ><view class="parent-card-title">{{ titleOf(item) }}</view></view
            >
          </view>
          <template v-if="type === 'calendar'"
            ><view class="record-schedule"
              ><text
                >{{ dateParts(item.startTime).time
                }}<text v-if="item.endTime"> – {{ dateParts(item.endTime).time }}</text></text
              ><text class="parent-tag" :class="{ calm: past(item) }">{{
                past(item) ? '课次已结束' : label(item.status)
              }}</text></view
            ><view class="parent-muted">{{
              item.mode === 'OFFLINE'
                ? item.campusName || '地点待老师确认'
                : item.mode === 'ONLINE'
                ? '线上课堂 · 北京时间'
                : '上课方式请查看课次信息'
            }}</view
            ><button class="record-open parent-text-button" @tap="open(item)"
              >{{ past(item) ? '查看课次与学习资料' : '课前准备与上课信息' }} <text>↗</text></button
            ></template
          >
          <template v-else-if="type === 'assignments'"
            ><view class="parent-muted record-description">{{
              item.description || '查看老师的要求，把想法变成一次具体的尝试。'
            }}</view
            ><view class="parent-micro">{{
              item.dueTime
                ? '截止 ' + dateParts(item.dueTime).date + ' ' + dateParts(item.dueTime).time
                : '未设置截止时间'
            }}</view
            ><button class="record-open parent-text-button" @tap="open(item)"
              >查看要求与提交记录 <text>↗</text></button
            ></template
          >
          <template v-else-if="type === 'materials'"
            ><view class="parent-muted record-description">{{
              item.description || item.fileName || '课后复习，也为下一次探索做准备。'
            }}</view
            ><button
              class="record-open parent-text-button"
              :disabled="actionBusy === keyOf(item)"
              @tap="open(item)"
              >{{ actionBusy === keyOf(item) ? '正在获取…' : '打开学习资料' }}
              <text>↗</text></button
            ></template
          >
          <template v-else-if="type === 'reviews'"
            ><view class="record-feedback" :class="{ clamped: expanded !== item.id }">{{
              item.feedback
            }}</view
            ><text class="parent-micro">{{ dateParts(item.publishedAt).date }} · 导师已发布</text
            ><button
              class="record-open parent-text-button"
              :aria-expanded="expanded === item.id"
              @tap="expanded = expanded === item.id ? null : item.id"
              >{{ expanded === item.id ? '收起反馈' : '阅读完整反馈' }}
              <text>{{ expanded === item.id ? '−' : '＋' }}</text></button
            ></template
          >
          <template v-else-if="type === 'reports'"
            ><view class="parent-muted record-description">{{
              item.summary || '记录这一阶段的尝试、积累与下一步方向。'
            }}</view
            ><template v-if="report?.id === item.id"
              ><view class="record-report"
                ><view>{{ report.content || report.summary }}</view
                ><template v-if="report.strengths"
                  ><view class="record-subtitle">做得好的地方</view
                  ><view>{{ report.strengths }}</view></template
                ><template v-if="report.nextSteps || report.suggestions"
                  ><view class="record-subtitle">下一步尝试</view
                  ><view>{{ report.nextSteps || report.suggestions }}</view></template
                ></view
              ></template
            ><button
              class="record-open parent-text-button"
              :disabled="actionBusy === keyOf(item)"
              :aria-expanded="report?.id === item.id"
              @tap="open(item)"
              >{{
                actionBusy === keyOf(item)
                  ? '正在读取…'
                  : report?.id === item.id
                  ? '收起报告'
                  : '阅读完整报告'
              }}
              <text>{{ report?.id === item.id ? '−' : '＋' }}</text></button
            ></template
          >
          <template v-else
            ><view class="record-schedule"
              ><text class="parent-micro">{{ dateParts(item.createTime).date }}</text
              ><text class="parent-tag">{{ label(item.status) }}</text></view
            ><view class="parent-muted record-description">{{ item.reason }}</view
            ><view
              v-if="item.decisionReason || item.reviewNote || item.reviewReason"
              class="record-decision"
              >处理说明：{{ item.decisionReason || item.reviewNote || item.reviewReason }}</view
            ></template
          >
          <view v-if="actionError && errorKey === keyOf(item)" class="record-action-error">{{
            actionError
          }}</view>
        </view>
      </template>
      <view class="parent-brand-sign">EVERY SMALL STEP COUNTS.</view>
    </view>
  </view>
</template>
<script setup>
  import { ref, computed, onUnmounted } from 'vue';
  import { onLoad, onShow, onHide } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import ParentIcon from '@/components/edu/ParentIcon.vue';
  import { edu, listOf } from '@/edu/api';
  import { openMaterial } from '@/edu/files';
  import {
    family,
    currentStudent,
    loadStudents,
    selectStudent,
    requireLogin,
    go,
    tab,
  } from '@/edu/state';
  import { dateParts, timestamp, publishedFeedback } from '@/edu/parent-space-data';
  import store from '@/sheep/store';
  defineOptions({ inheritAttrs: false });
  const type = ref('calendar'),
    studentId = ref(0),
    cohortId = ref(0),
    data = ref([]),
    loading = ref(true),
    error = ref(''),
    expanded = ref(null),
    report = ref(null),
    actionError = ref(''),
    errorKey = ref(null),
    actionBusy = ref(null);
  let generation = 0,
    actionGeneration = 0,
    active = false,
    requestedStudent = 0;
  const metas = {
    calendar: {
      title: '课程日历',
      icon: 'calendar',
      desc: '提前准备，从容开启每一次课。',
      empty: '还没有课程安排。',
      hint: '老师发布课表后，时间和上课说明会显示在这里。',
    },
    assignments: {
      title: '创作与作业',
      icon: 'pen',
      desc: '把过程留下，把想法说清楚。',
      empty: '暂时没有作业。',
      hint: '新的创作任务发布后，会按课程整理在这里。',
    },
    materials: {
      title: '学习资料',
      icon: 'folder',
      desc: '课前准备，课后也能再看一次。',
      empty: '暂时没有学习资料。',
      hint: '课件、参考文件与练习资料会在老师发布后显示。',
    },
    reviews: {
      title: '老师反馈',
      icon: 'feedback',
      desc: '看看已经做好的，和下一步能试试的。',
      empty: '老师的回信还在路上。',
      hint: '已发布的点评会在这里记录孩子的亮点和具体建议。',
    },
    reports: {
      title: '成长报告',
      icon: 'report',
      desc: '用具体的作品和变化，记录成长。',
      empty: '暂时没有阶段报告。',
      hint: '老师发布后，可以在这里阅读完整的成长记录。',
    },
    requests: {
      title: '请假与调班',
      icon: 'switch',
      desc: '查看申请状态，安排接下来的学习。',
      empty: '还没有申请记录。',
      hint: '请假可在对应课次提交，调班可从已报名课程发起。',
    },
  };
  const meta = computed(() => metas[type.value]);
  const fetchers = {
    calendar: edu.sessions,
    assignments: edu.assignments,
    materials: edu.materials,
    reviews: edu.reviews,
    reports: edu.reports,
    requests: edu.requests,
  };
  const items = computed(() => {
    const rows = listOf(data.value);
    if (type.value === 'reviews') return publishedFeedback(rows);
    if (type.value === 'calendar')
      return rows
        .filter(
          (s) =>
            !['CANCELLED', 'DRAFT'].includes(s.status) &&
            (!cohortId.value || Number(s.cohortId) === cohortId.value),
        )
        .sort(
          (a, b) => (timestamp(a.startTime) ?? Infinity) - (timestamp(b.startTime) ?? Infinity),
        );
    return rows;
  });
  const keyOf = (item) =>
    type.value === 'materials' ? `${item.sessionId || ''}:${item.fileId}` : item.id;
  const titleOf = (item) =>
    item.title || item.courseName || item.name || item.assignmentTitle || label(item.type);
  const past = (item) => timestamp(item.endTime) !== null && timestamp(item.endTime) <= Date.now();
  const contextLabel = (item) =>
    type.value === 'calendar'
      ? item.cohortName || '课程安排'
      : type.value === 'materials'
      ? item.sessionTitle || '课程资料'
      : type.value === 'reviews'
      ? '导师点评 · 关于这次创作'
      : type.value === 'reports'
      ? '阶段记录 · GROWTH NOTES'
      : type.value === 'requests'
      ? '申请记录'
      : item.cohortName || '课堂创作';
  function label(s) {
    return (
      {
        SCHEDULED: '待上课',
        COMPLETED: '已完成',
        DRAFT: '草稿',
        SUBMITTED: '待点评',
        REVIEWED: '已点评',
        REVISION_REQUIRED: '待修改',
        PUBLISHED: '已发布',
        PENDING: '待处理',
        APPROVED: '已通过',
        REJECTED: '未通过',
        CANCELLED: '已取消',
        LEAVE: '请假申请',
        TRANSFER: '调班申请',
      }[s] || '可查看'
    );
  }
  function resetDetails() {
    actionGeneration++;
    report.value = null;
    expanded.value = null;
    actionError.value = '';
    errorKey.value = null;
    actionBusy.value = null;
  }
  async function refresh() {
    const run = ++generation,
      token = uni.getStorageSync('token');
    resetDetails();
    data.value = [];
    loading.value = true;
    error.value = '';
    const valid = () =>
      active &&
      run === generation &&
      store('user').isLogin &&
      token === uni.getStorageSync('token');
    try {
      await loadStudents();
      if (!valid()) return;
      if (requestedStudent) {
        if (family.students.some((s) => s.id === requestedStudent)) selectStudent(requestedStudent);
        requestedStudent = 0;
      }
      const child = family.currentId;
      studentId.value = child;
      const result = child ? await fetchers[type.value](child) : [];
      if (valid() && family.currentId === child) data.value = result;
    } catch (e) {
      if (valid()) error.value = e?.message || '暂时无法读取';
    } finally {
      if (active && run === generation) {
        loading.value = false;
        if (token !== uni.getStorageSync('token')) error.value = '登录状态已更新，请重新加载';
      }
    }
  }
  function changeChild() {
    cohortId.value = 0;
    refresh();
  }
  async function open(item) {
    if (loading.value || error.value || !studentId.value) return;
    if (type.value === 'calendar')
      return go('session', { id: item.id, studentId: studentId.value });
    if (type.value === 'assignments')
      return go('assignment', { id: item.id, studentId: studentId.value });
    if (type.value === 'reports' && report.value?.id === item.id) {
      report.value = null;
      return;
    }
    const run = ++actionGeneration,
      child = studentId.value,
      token = uni.getStorageSync('token');
    actionError.value = '';
    errorKey.value = null;
    actionBusy.value = keyOf(item);
    const valid = () =>
      active &&
      run === actionGeneration &&
      family.currentId === child &&
      token === uni.getStorageSync('token');
    try {
      if (type.value === 'materials')
        await openMaterial(item.fileId, child, item.name || item.fileName);
      else if (type.value === 'reports') {
        const result = await edu.report(item.id, child);
        if (valid()) report.value = { ...result, id: item.id };
      }
    } catch (e) {
      if (valid()) {
        actionError.value = e?.message || '暂时无法打开，请重试';
        errorKey.value = keyOf(item);
      }
    } finally {
      if (active && run === actionGeneration) {
        actionBusy.value = null;
        if (token !== uni.getStorageSync('token')) {
          actionError.value = '登录状态已更新，请重新打开';
          errorKey.value = keyOf(item);
        }
      }
    }
  }
  onLoad((o) => {
    type.value = Object.prototype.hasOwnProperty.call(metas, o.type) ? o.type : 'calendar';
    requestedStudent = Number(o.studentId) || 0;
    cohortId.value = Number(o.cohortId) || 0;
  });
  onShow(() => {
    active = true;
    if (requireLogin()) refresh();
  });
  function deactivate() {
    active = false;
    generation++;
    resetDetails();
    data.value = [];
  }
  onHide(deactivate);
  onUnmounted(deactivate);
</script>
<style scoped>
  .parent-record-page {
    max-width: 720px;
  }
  .record-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 18px 0 12px;
    border-bottom: 1px solid #dfd1bc;
    padding-bottom: 7px;
  }
  .record-heading {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 18px;
  }
  .record-title {
    min-width: 0;
    flex: 1;
  }
  .record-title .parent-card-title {
    margin-top: 4px;
  }
  .record-schedule {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 14px 0 7px;
    font-size: 17px;
    color: #9a5a37;
    font-variant-numeric: tabular-nums;
  }
  .record-description {
    margin: 12px 0;
    white-space: pre-line;
  }
  .record-open {
    display: flex;
    justify-content: space-between;
    width: 100%;
    border-top: 1px solid #e4d8c6;
    margin-top: 16px;
    padding-top: 13px;
  }
  .record-feedback {
    font-size: 15px;
    line-height: 1.95;
    white-space: pre-line;
    color: #585f4c;
    padding: 2px 0 15px;
  }
  .record-feedback.clamped {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
    padding-bottom: 0;
    margin-bottom: 15px;
  }
  .record-report {
    border-top: 1px solid #e2d4bf;
    margin-top: 18px;
    padding-top: 20px;
    white-space: pre-line;
    font-size: 14px;
    line-height: 1.95;
    color: #545d46;
  }
  .record-subtitle {
    font-weight: 600;
    margin: 20px 0 8px;
    color: #98663e;
    font-size: 13px;
  }
  .record-decision {
    border-left: 2px solid #bd996d;
    padding: 8px 13px;
    margin-top: 15px;
    color: #73745f;
    font-size: 13px;
    line-height: 1.8;
    background: #f2ecde;
  }
  .record-action-error {
    font-size: 12px;
    line-height: 1.8;
    color: #a64829;
    padding: 10px 0;
  }
</style>
