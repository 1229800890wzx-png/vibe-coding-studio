<template
  ><EduHeader :title="meta.title" child @change="changeChild" /><view class="edu-page"
    ><text class="eyebrow">{{ currentStudent?.name }} · LEARNING SPACE</text
    ><view class="title">{{ meta.title }}</view
    ><view class="subtitle">{{ meta.desc }}</view
    ><EduState
      :loading="loading"
      :error="error"
      :empty="!items.length"
      :title="meta.empty"
      description="老师发布后，会在这里显示。"
      @retry="refresh"
    /><view
      v-for="item in items"
      :key="type === 'materials' ? `${item.sessionId || ''}:${item.fileId}` : item.id"
      class="card stack"
      @tap="open(item)"
      ><view class="row between"
        ><view class="strong">{{
          item.title || item.courseName || item.name || item.assignmentTitle || label(item.type)
        }}</view
        ><text class="pill">{{ label(item.status) }}</text></view
      ><template v-if="type === 'calendar'"
        ><view class="muted">{{ dateText(item.startTime) }} – {{ dateText(item.endTime) }}</view
        ><view class="muted">{{ item.campusName || '电脑端在线课堂' }}</view
        ><text class="orange">查看上课信息 →</text></template
      ><template v-else-if="type === 'assignments'"
        ><view class="muted">{{ item.description }}</view
        ><view class="small muted">{{
          item.dueTime ? '截止 ' + dateText(item.dueTime) : '无截止时间'
        }}</view
        ><text class="orange">查看作业 →</text></template
      ><template v-else-if="type === 'materials'"
        ><view class="muted">{{ item.sessionTitle || item.description || item.fileName }}</view
        ><text class="orange">获取学习资料 ↗</text></template
      ><template v-else-if="type === 'reviews'"
        ><view class="muted feedback">{{ item.feedback || item.content }}</view
        ><view v-if="item.score != null" class="small muted">老师评分 {{ item.score }}</view
        ><text class="small muted">{{
          dateText(item.createdAt || item.createTime)
        }}</text></template
      ><template v-else-if="type === 'reports'"
        ><view class="muted">{{ item.summary }}</view
        ><text class="orange">打开成长报告 →</text></template
      ><template v-else
        ><view class="muted">{{ item.reason }}</view
        ><view class="muted">{{ item.decisionReason || item.reviewNote || item.reviewReason }}</view
        ><text class="small muted">{{ dateText(item.createTime) }}</text></template
      ></view
    ><view v-if="actionError" class="error">{{ actionError }}</view
    ><view v-if="report" class="card stack"
      ><view class="section-title">{{ report.title }}</view
      ><view class="report-body">{{ report.content || report.summary }}</view
      ><template v-if="report.strengths"
        ><view class="strong report-label">做得好的地方</view
        ><view class="report-body">{{ report.strengths }}</view></template
      ><template v-if="report.nextSteps || report.suggestions"
        ><view class="strong report-label">下一步尝试</view
        ><view class="report-body">{{ report.nextSteps || report.suggestions }}</view></template
      ><button class="btn quiet" @tap="report = null">收起报告</button></view
    ></view
  ></template
>
<script setup>
  defineOptions({ inheritAttrs: false });
  import { ref, computed } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import EduState from '@/components/edu/EduState.vue';
  import { edu, listOf } from '@/edu/api';
  import { openMaterial } from '@/edu/files';
  import { useResource } from '@/edu/resource';
  import { family, currentStudent, loadStudents, requireLogin, go, dateText } from '@/edu/state';
  const type = ref('calendar'),
    studentId = ref(0),
    report = ref(null),
    actionError = ref('');
  const metas = {
    calendar: {
      title: '课程日历',
      desc: '每一次创作，都有值得期待的下一次。',
      empty: '还没有课程安排',
    },
    assignments: { title: '我的作业', desc: '把过程留下，把想法说清楚。', empty: '暂时没有作业' },
    materials: { title: '学习资料', desc: '为下一次探索，准备好工具。', empty: '暂时没有学习资料' },
    reviews: {
      title: '老师反馈',
      desc: '看看已经做好的，和下一步能试试的。',
      empty: '老师的反馈还在路上',
    },
    reports: {
      title: '成长报告',
      desc: '用具体的作品和变化，记录成长。',
      empty: '暂时没有阶段报告',
    },
    requests: { title: '请假与调班', desc: '查看申请的处理进度。', empty: '还没有申请记录' },
  };
  const meta = computed(() => metas[type.value] || metas.calendar);
  const fetchers = {
    calendar: edu.sessions,
    assignments: edu.assignments,
    materials: edu.materials,
    reviews: edu.reviews,
    reports: edu.reports,
    requests: edu.requests,
  };
  const { data, loading, error, refresh } = useResource(async () => {
    await loadStudents();
    studentId.value = family.currentId;
    return studentId.value ? (fetchers[type.value] || edu.sessions)(studentId.value) : [];
  }, []);
  const items = computed(() => listOf(data.value));
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
        LEAVE: '请假申请',
        TRANSFER: '调班申请',
      }[s] ||
      s ||
      '可查看'
    );
  }
  function changeChild() {
    report.value = null;
    refresh();
  }
  async function open(item) {
    actionError.value = '';
    if (type.value === 'calendar') go('session', { id: item.id, studentId: studentId.value });
    else if (type.value === 'assignments')
      go('assignment', { id: item.id, studentId: studentId.value });
    else if (type.value === 'materials') {
      try {
        await openMaterial(item.fileId, studentId.value, item.name || item.fileName);
      } catch (e) {
        actionError.value = e.message;
      }
    } else if (type.value === 'reports') {
      try {
        report.value = await edu.report(item.id, studentId.value);
      } catch (e) {
        actionError.value = e.message;
      }
    }
  }
  onLoad((o) => {
    type.value = o.type || 'calendar';
    studentId.value = Number(o.studentId);
  });
  onShow(() => {
    if (requireLogin()) refresh();
  });
</script>
<style scoped>
  .feedback,
  .report-body {
    white-space: pre-line;
    line-height: 1.9;
  }
  .report-body {
    font-size: 16px;
  }
  .report-label {
    margin-top: 18px;
    margin-bottom: 6px;
  }
</style>
