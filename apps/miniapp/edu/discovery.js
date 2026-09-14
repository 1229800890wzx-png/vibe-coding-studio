import { reactive } from 'vue';
import { tab } from './state';
export const discovery = reactive(
  uni.getStorageSync('edu-delivery-context') || { mode: '', campusId: '', campusName: '' },
);
export function showCourses(filters = {}) {
  if ('mode' in filters) {
    Object.assign(discovery, {
      mode: filters.mode,
      campusId: filters.campusId || '',
      campusName: filters.campusName || '',
    });
    uni.setStorageSync('edu-delivery-context', { ...discovery });
  }
  const next = { ...filters };
  delete next.campusName;
  uni.setStorageSync('edu-next-course-context', next);
  tab('courses');
}
