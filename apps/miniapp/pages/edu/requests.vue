<template
  ><EduHeader title="申请调班" /><view class="edu-page parent-flow"
    ><view class="title">调整节奏，继续创作。</view
    ><view class="subtitle">选择同课程、同价的目标班期，老师审核通过后再调整上课安排。</view
    ><view v-if="source" class="note">当前班期：{{ source.name }}</view
    ><EduState
      :loading="loading"
      :error="error"
      :empty="!cohorts.length"
      title="暂时没有符合调班条件的班期"
      description="这里只显示同课程、同类型、同版本且价格一致的可选班期，也可以联系教务协助安排。"
      @retry="refresh"
    /><view v-for="c in cohorts" :key="c.id" class="card" @tap="target = c.id"
      ><view class="row between"
        ><text class="strong">{{ c.name }}</text
        ><radio :checked="target === c.id" color="#C94B00" /></view
      ><view class="muted"
        >{{ dateText(c.startDate) }} · {{ c.campusName || '线上课堂' }}</view
      ></view
    ><view class="field"
      ><text class="field-label">调班原因</text
      ><textarea
        class="input textarea"
        v-model="reason"
        maxlength="300"
        placeholder="请说明希望调整的原因"
      /></view
    ><view v-if="actionError" class="error">{{ actionError }}</view
    ><button
      class="btn"
      :disabled="!target || !reason.trim() || busy || loading || !!error"
      @tap="submit"
      >{{ busy ? '正在提交…' : '提交调班申请' }}</button
    ></view
  ></template
>
<script setup>
  defineOptions({ inheritAttrs: false });
  import { ref, computed } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import EduState from '@/components/edu/EduState.vue';
  import { edu, listOf } from '@/edu/api';
  import { useResource } from '@/edu/resource';
  import { requireLogin, dateText, go, toast } from '@/edu/state';
  const enrollmentId = ref(0),
    courseId = ref(0),
    studentId = ref(0),
    target = ref(0),
    reason = ref(''),
    source = ref(null),
    busy = ref(false),
    actionError = ref('');
  const { data, loading, error, refresh } = useResource(async () => {
    if (!enrollmentId.value || !studentId.value)
      throw new Error('请从孩子已报名的课程进入调班申请。');
    const dashboard = await edu.dashboard(studentId.value);
    const enrollment = listOf(dashboard.enrollments).find(
      (item) => Number(item.id) === enrollmentId.value && item.status === 'ACTIVE',
    );
    if (!enrollment) throw new Error('这条报名当前不能申请调班，请返回学习页查看最新状态。');
    source.value = listOf(dashboard.courses).find(
      (item) => Number(item.id) === Number(enrollment.currentCohortId || enrollment.cohortId),
    );
    if (!source.value) throw new Error('当前班期信息暂不可用，请返回学习页重试。');
    if (Number(source.value.startDate) <= Date.now())
      throw new Error('当前班期已经开课，请联系教务协助调整。');
    courseId.value = Number(enrollment.courseId || source.value.courseId);
    if (!courseId.value) throw new Error('课程信息暂不可用，请返回学习页重试。');
    return edu.cohorts(courseId.value);
  }, []);
  const cohorts = computed(() =>
    listOf(data.value).filter(
      (c) =>
        source.value &&
        c.stock > 0 &&
        Number(c.id) !== Number(source.value.id) &&
        c.kind === source.value.kind &&
        String(c.courseVersionId) === String(source.value.courseVersionId) &&
        c.price === source.value.price &&
        Number(c.startDate) > Date.now(),
    ),
  );
  async function submit() {
    if (busy.value || !reason.value.trim() || !cohorts.value.some((c) => c.id === target.value))
      return;
    busy.value = true;
    actionError.value = '';
    try {
      await edu.transfer({
        enrollmentId: enrollmentId.value,
        targetCohortId: target.value,
        reason: reason.value.trim(),
      });
      toast('调班申请已提交');
      go('learning-list', { type: 'requests', studentId: studentId.value });
    } catch (e) {
      actionError.value = e.message;
    } finally {
      busy.value = false;
    }
  }
  onLoad((o) => {
    enrollmentId.value = Number(o.enrollmentId);
    courseId.value = Number(o.courseId);
    studentId.value = Number(o.studentId);
    if (requireLogin()) refresh();
  });
</script>
