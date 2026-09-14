<template
  ><EduHeader title="学习" home child @change="refresh" /><view class="edu-page"
    ><text class="eyebrow">KEEP CREATING</text
    ><view class="title">{{
      currentStudent ? currentStudent.name + '的创作日常。' : '成长，正在发生。'
    }}</view
    ><view class="subtitle">每一个小小的进步，都值得看见。</view
    ><view v-if="!loggedIn" class="card stack" style="margin-top: 24px"
      ><view class="section-title">登录后查看学习进度</view
      ><view class="muted">为每位孩子分别整理课程、作业与成长记录。</view
      ><button class="btn" @tap="go('login')">家长登录</button></view
    ><template v-else
      ><EduState
        :loading="loading"
        :error="error"
        :empty="!currentStudent"
        title="先添加一位小创作者"
        description="孩子档案建立后，就能在这里查看专属学习日程。"
        @retry="refresh"
        ><button class="btn secondary" @tap="go('children')">添加孩子</button></EduState
      ><template v-if="dashboard && currentStudent && !loading && !error"
        ><view class="stats"
          ><view
            ><view class="number">{{ dashboard.stats?.courses || 0 }}</view
            ><text class="small muted">学习中课程</text></view
          ><view
            ><view class="number">{{ dashboard.stats?.completedSessions || 0 }}</view
            ><text class="small muted">已完成课节</text></view
          ><view
            ><view class="number">{{ dashboard.stats?.works || 0 }}</view
            ><text class="small muted">创作作品</text></view
          ></view
        ><view v-if="dashboard.nextSession" class="next-card"
          ><text class="eyebrow">下一次一起创作</text
          ><view class="section-title" style="margin: 10px 0">{{
            dashboard.nextSession.title
          }}</view
          ><view class="muted"
            >{{ dateText(dashboard.nextSession.startTime) }} ·
            {{ dashboard.nextSession.campusName || '在线课堂' }}</view
          ><button
            class="btn"
            style="margin-top: 20px"
            @tap="go('session', { id: dashboard.nextSession.id, studentId: family.currentId })"
            >课前准备与上课信息 ↗</button
          ></view
        ><view class="section-head"><text class="section-title">学习工具箱</text></view
        ><view class="grid2"
          ><view
            v-for="tool in tools"
            :key="tool.type"
            class="card tool"
            @tap="go('learning-list', { type: tool.type, studentId: family.currentId })"
            ><text class="tool-icon">{{ tool.icon }}</text
            ><view class="strong">{{ tool.name }}</view
            ><text class="muted small">{{ tool.desc }}</text></view
          ></view
        ><view class="section-head"
          ><text class="section-title">继续创作</text
          ><text class="muted">{{ dashboard.stats?.pendingAssignments || 0 }} 项待完成</text></view
        ><view
          v-for="a in dashboard.pendingAssignments"
          :key="a.id"
          class="card"
          @tap="go('assignment', { id: a.id, studentId: family.currentId })"
          ><view class="row between"
            ><text class="strong">{{ a.title }}</text
            ><text class="orange">打开 →</text></view
          ><view class="muted">{{
            a.dueTime ? '截止 ' + dateText(a.dueTime) : '按自己的节奏完成'
          }}</view></view
        ><view v-if="!dashboard.pendingAssignments?.length" class="card muted"
          >当前没有待完成的作业，继续保持好奇。</view
        ><view class="section-head"><text class="section-title">我的课程</text></view
        ><view v-for="e in dashboard.enrollments" :key="e.id" class="card stack"
          ><view class="row between"
            ><text class="strong">{{ e.courseName }}</text
            ><text class="pill">{{ status[e.status] || e.status }}</text></view
          ><view class="muted">{{ e.cohortName }}</view
          ><view class="row"
            ><button class="link" @tap="go('cohort', { id: e.currentCohortId || e.cohortId })"
              >查看班期</button
            ><button
              v-if="e.status === 'ACTIVE'"
              class="link"
              @tap="
                go('requests', {
                  enrollmentId: e.id,
                  courseId: e.courseId,
                  studentId: family.currentId,
                })
              "
              >申请调班</button
            ></view
          ></view
        ><button class="btn secondary" @tap="go('works', { studentId: family.currentId })"
          >孩子的作品集 ↗</button
        ></template
      ></template
    ></view
  ></template
>
<script setup>
  import { computed } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import EduState from '@/components/edu/EduState.vue';
  import store from '@/sheep/store';
  import { edu } from '@/edu/api';
  import { useResource } from '@/edu/resource';
  import { currentStudent, family, loadStudents, go, dateText } from '@/edu/state';
  const loggedIn = computed(() => store('user').isLogin);
  const {
    data: dashboard,
    loading,
    error,
    refresh,
  } = useResource(async () => {
    await loadStudents();
    return family.currentId ? edu.dashboard(family.currentId) : null;
  });
  const tools = [
      { type: 'calendar', name: '课程日历', icon: '▦', desc: '上课时间与课前准备' },
      { type: 'assignments', name: '我的作业', icon: '↗', desc: '记录思考，提交作品' },
      { type: 'materials', name: '学习资料', icon: '▤', desc: '课件与参考文件' },
      { type: 'reviews', name: '老师反馈', icon: '✳', desc: '看见下一步怎么做' },
      { type: 'reports', name: '成长报告', icon: '◴', desc: '阶段能力与进步' },
      { type: 'requests', name: '请假与调班', icon: '⇄', desc: '查看申请进度' },
    ],
    status = {
      ACTIVE: '学习中',
      PENDING_PAYMENT: '待支付',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
      EXPIRED: '已结束',
    };
  onShow(() => {
    if (loggedIn.value) refresh();
  });
</script>
<style scoped>
  .stats {
    display: flex;
    justify-content: space-around;
    margin: 28px 0;
    text-align: center;
  }
  .next-card {
    padding: 24px;
    background: #fff3e8;
    border-radius: 16px;
  }
  .tool {
    margin: 0;
    padding: 18px;
    min-height: 142px;
  }
  .tool-icon {
    display: block;
    font-size: 26px;
    margin-bottom: 12px;
    color: #c94b00;
  }
  .tool .strong {
    margin-bottom: 4px;
  }
</style>
