import { computed, reactive, watch, onUnmounted } from 'vue';
import { onShow, onHide } from '@dcloudio/uni-app';
import store from '@/sheep/store';
import request from '@/sheep/request';
import { edu, listOf, unwrap } from './api';
import { family, loadStudents } from './state';
import { courseProgress, publishedFeedback, remainingScheduled, count } from './parent-space-data';

const get = (url, params) =>
  unwrap(request({ url, params, custom: { auth: true, showLoading: false, showError: false } }));
const resource = () => ({ data: null, loading: false, error: '' });

export function useParentSpace() {
  const user = store('user');
  const loggedIn = computed(() => user.isLogin);
  const state = reactive({
    family: resource(),
    learning: resource(),
    feedback: resource(),
    reports: resource(),
    notices: resource(),
    orders: resource(),
    profile: resource(),
  });
  let active = false,
    generation = 0;
  const identity = () => user.sessionVersion;
  function clear() {
    Object.values(state).forEach((part) => Object.assign(part, resource()));
  }
  async function refresh() {
    const run = ++generation,
      accountSession = identity();
    clear();
    if (!loggedIn.value || !active) return;
    const valid = () => active && run === generation && loggedIn.value && identity() === accountSession;
    function finish(part) {
      if (!active || run !== generation) return;
      part.loading = false;
      if (loggedIn.value && identity() !== accountSession) {
        part.data = null;
        part.error = '登录状态已更新，请重新加载';
      }
    }
    async function fetchPart(part, fetcher, childId) {
      part.loading = true;
      try {
        const data = await fetcher();
        if (valid() && (childId === undefined || String(childId) === String(family.currentId)))
          part.data = data;
      } catch (e) {
        if (valid()) part.error = e?.message || '暂时无法加载，请稍后重试';
      } finally {
        finish(part);
      }
    }
    // Independent account information must remain usable when learning data fails.
    const accountTasks = [
      fetchPart(state.notices, () => get('/edu/notification/unread-count')),
      fetchPart(state.orders, () =>
        get('/trade/order/page', { pageNo: 1, pageSize: 1, status: 0 }),
      ),
      fetchPart(state.profile, async () => {
        const data = await get('/member/user/get');
        if (valid() && data && typeof data === 'object')
          user.userInfo = { ...user.userInfo, ...data };
        return data;
      }),
    ];
    state.family.loading = true;
    try {
      await loadStudents();
      if (!valid()) return;
      state.family.data = [...family.students];
      state.family.loading = false;
      const studentId = family.currentId;
      if (studentId)
        await Promise.all([
          fetchPart(state.learning, () => edu.dashboard(studentId), studentId),
          fetchPart(
            state.feedback,
            async () => publishedFeedback(listOf(await edu.reviews(studentId))),
            studentId,
          ),
          fetchPart(state.reports, async () => listOf(await edu.reports(studentId)), studentId),
        ]);
    } catch (e) {
      if (valid()) state.family.error = e?.message || '孩子档案暂未加载';
    } finally {
      finish(state.family);
    }
    await Promise.all(accountTasks);
  }
  onShow(() => {
    active = true;
    refresh();
  });
  onHide(() => {
    active = false;
    generation++;
  });
  watch([loggedIn, () => user.sessionVersion], () => {
    generation++;
    clear();
    family.students = [];
    family.currentId = null;
    family.loaded = false;
    if (loggedIn.value && active) refresh();
  });
  onUnmounted(() => {
    active = false;
    generation++;
  });
  const courses = computed(() => courseProgress(state.learning.data));
  const upcomingCount = computed(() =>
    state.learning.data ? remainingScheduled(courses.value) : null,
  );
  const nextSession = computed(() => state.learning.data?.nextSession || null);
  const feedback = computed(() => state.feedback.data || []);
  const pending = computed(() => state.learning.data?.pendingAssignments || []);
  const unread = computed(() => count(state.notices.data));
  const unpaid = computed(() => count(state.orders.data?.total));
  return {
    user,
    loggedIn,
    state,
    refresh,
    courses,
    upcomingCount,
    nextSession,
    feedback,
    pending,
    unread,
    unpaid,
  };
}
