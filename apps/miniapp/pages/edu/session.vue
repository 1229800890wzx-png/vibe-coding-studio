<template
  ><EduHeader title="上课与课前准备" /><view class="edu-page"
    ><EduState :loading="loading" :error="error" @retry="refresh" /><template
      v-if="session && !loading && !error"
      ><text class="pill">{{ session.mode === 'ONLINE' ? '电脑端在线课堂' : '线下课程' }}</text
      ><view class="title">{{ session.title }}</view
      ><view class="card stack"
        ><view class="row between"
          ><text class="muted">报名孩子</text><text class="strong">{{ studentName }}</text></view
        ><view class="row between"
          ><text class="muted">上课时间</text><text>{{ dateText(session.startTime) }}</text></view
        ><view class="row between"
          ><text class="muted">结束时间</text><text>{{ dateText(session.endTime) }}</text></view
        ><view class="muted">{{ session.campusName || '请使用电脑打开课堂链接' }}</view></view
      ><view class="card stack"
        ><view class="section-title">课前准备</view
        ><view class="muted">{{
          session.preparation || '准备电脑与稳定网络，提前检查麦克风，并留出专注的学习时间。'
        }}</view
        ><view v-if="session.joinInfo" class="note">{{
          session.joinInfo.instructions ||
          session.joinInfo.note ||
          '课堂信息仅供本次报名孩子使用，请勿公开分享。'
        }}</view
        ><button v-if="session.joinInfo?.url" class="btn" @tap="safeExternal(session.joinInfo.url)"
          >复制电脑端课堂链接 ↗</button
        ><view v-else-if="session.mode === 'ONLINE'" class="muted"
          >课堂链接将在老师发布后显示。</view
        ></view
      ><button class="btn secondary" @tap="go('learning-list', { type: 'materials', studentId })"
        >查看学习资料</button
      ><button class="link" @tap="leaveOpen = !leaveOpen">需要请假？</button
      ><view v-if="leaveOpen" class="card stack"
        ><view class="strong">请假说明</view
        ><textarea
          class="input textarea"
          v-model="reason"
          maxlength="300"
          placeholder="请填写请假原因，老师审核后会在申请记录中反馈。"
        /><view v-if="actionError" class="error">{{ actionError }}</view
        ><button class="btn" :disabled="busy || !reason.trim()" @tap="submitLeave">{{
          busy ? '正在提交…' : '提交请假申请'
        }}</button></view
      ></template
    ></view
  ></template
>
<script setup>
  defineOptions({ inheritAttrs: false });
  import { ref, computed } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import EduState from '@/components/edu/EduState.vue';
  import { edu } from '@/edu/api';
  import { useResource } from '@/edu/resource';
  import {
    family,
    loadStudents,
    requireLogin,
    go,
    dateText,
    safeExternal,
    toast,
  } from '@/edu/state';
  const id = ref(0),
    studentId = ref(0),
    leaveOpen = ref(false),
    reason = ref(''),
    busy = ref(false),
    actionError = ref('');
  const studentName = computed(
    () => family.students.find((s) => s.id === studentId.value)?.name || '当前报名孩子',
  );
  const {
    data: session,
    loading,
    error,
    refresh,
  } = useResource(async () => {
    await loadStudents();
    return edu.session(id.value, studentId.value);
  });
  async function submitLeave() {
    busy.value = true;
    try {
      await edu.leave({
        studentId: studentId.value,
        sessionId: id.value,
        reason: reason.value.trim(),
      });
      toast('请假申请已提交');
      leaveOpen.value = false;
      reason.value = '';
    } catch (e) {
      actionError.value = e.message;
    } finally {
      busy.value = false;
    }
  }
  onLoad((o) => {
    id.value = Number(o.id);
    studentId.value = Number(o.studentId);
    if (requireLogin()) refresh();
  });
</script>
