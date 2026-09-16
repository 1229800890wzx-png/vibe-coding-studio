import { computed, reactive } from 'vue';
import store from '@/sheep/store';
import { edu, listOf } from './api';
import { currentContinuation } from './navigation';
export const family = reactive({
  students: [],
  currentId: Number(uni.getStorageSync('edu-current-student')) || null,
  loaded: false,
});
export const currentStudent = computed(() =>
  family.students.find((s) => s.id === family.currentId),
);
export function selectStudent(id) {
  family.currentId = Number(id);
  uni.setStorageSync('edu-current-student', family.currentId);
}
export async function loadStudents() {
  if (!store('user').isLogin) {
    family.students = [];
    family.loaded = false;
    return [];
  }
  const accountToken = uni.getStorageSync('token');
  const students = listOf(await edu.students());
  // A response from a previous account must not repopulate children after logout/login.
  if (!store('user').isLogin || uni.getStorageSync('token') !== accountToken) return [];
  family.students = students;
  family.loaded = true;
  if (!students.some((s) => s.id === family.currentId)) selectStudent(students[0]?.id || 0);
  return students;
}
export function go(page, params = {}) {
  if (page === 'login' && !params.returnTo) params = { ...params, returnTo: currentContinuation() };
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  uni.navigateTo({ url: `/pages/edu/${page}${query ? '?' + query : ''}` });
}
export function tab(name) {
  uni.switchTab({ url: `/pages/tab/${name}` });
}
export function requireLogin() {
  if (store('user').isLogin) return true;
  go('login');
  return false;
}
export function requireChild() {
  if (!requireLogin()) return false;
  if (family.currentId) return true;
  go('children', { returnTo: currentContinuation() });
  return false;
}
export function money(fen) {
  return typeof fen === 'number' ? (fen / 100).toFixed(fen % 100 ? 2 : 0) : '待发布';
}
export function dateText(value) {
  if (!value) return '待安排';
  const d = new Date(value);
  return Number.isNaN(+d)
    ? String(value)
    : `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(
        2,
        '0',
      )}:${String(d.getMinutes()).padStart(2, '0')}`;
}
export async function confirm(title, content) {
  return new Promise((resolve) =>
    uni.showModal({
      title,
      content,
      confirmColor: '#C94B00',
      success: (r) => resolve(r.confirm),
      fail: () => resolve(false),
    }),
  );
}
export function toast(title) {
  uni.showToast({ title, icon: 'none' });
}
export function safeExternal(url) {
  if (!/^https:\/\//i.test(url || '')) return toast('课堂链接尚未发布');
  uni.setClipboardData({ data: url });
}
