import request from '@/sheep/request';
import { getAccessToken, getTenantId } from '@/sheep/request';
import { baseUrl, apiPath } from '@/sheep/config';
export async function unwrap(promise) {
  const result = await promise;
  if (!result || result.code !== 0) throw new Error(result?.msg || '暂时无法连接服务，请稍后重试');
  return result.data;
}
const call = (url, params, method = 'GET') =>
  unwrap(
    request({
      url: '/edu' + url,
      method,
      ...(method === 'GET' || method === 'DELETE' ? { params } : { data: params }),
      custom: { showLoading: false, showError: false },
    }),
  );
export const listOf = (data) => (Array.isArray(data) ? data : data?.list || []);
export const edu = {
  config: () => call('/config/get'),
  courses: (params) => call('/course/page', { pageNo: 1, pageSize: 40, ...params }),
  course: (id) => call('/course/get', { id }),
  cohorts: (courseId) => call('/cohort/list', { courseId }),
  cohort: (id) => call('/cohort/get', { id }),
  campuses: (params) => call('/campus/list', params),
  teachers: (params) => call('/teacher/list', params),
  admissionOptions: () => call('/admission/options'),
  admissions: () => call('/admission/list'),
  createAdmission: (data) => call('/admission/create', data, 'POST'),
  cancelAdmission: (id) => call('/admission/cancel', { id }, 'POST'),
  students: () => call('/student/list'),
  saveStudent: (data) =>
    call('/student/' + (data.id ? 'update' : 'create'), data, data.id ? 'PUT' : 'POST'),
  deleteStudent: (id) => call('/student/delete', { id }, 'DELETE'),
  trial: (data) => call('/trial/create', data, 'POST'),
  trials: (studentId) => call('/trial/list', { studentId }),
  cancelTrial: (id) => call('/trial/cancel', { id }, 'POST'),
  dashboard: (studentId) => call('/learning/dashboard', { studentId }),
  sessions: (studentId) => call('/session/list', { studentId }),
  session: (id, studentId) => call('/session/get', { id, studentId }),
  assignments: (studentId) => call('/assignment/list', { studentId }),
  assignment: (id, studentId) => call('/assignment/get', { id, studentId }),
  saveSubmission: (data) => call('/submission/save', data, 'POST'),
  submit: (data) => call('/submission/submit', data, 'POST'),
  reviews: (studentId) => call('/review/list', { studentId }),
  materials: (studentId) => call('/material/list', { studentId }),
  reports: (studentId) => call('/report/list', { studentId }),
  report: (id, studentId) => call('/report/get', { id, studentId }),
  works: (studentId) => call('/work/list', { studentId }),
  workPreview: (id, version) => call('/work/preview', { id, version }),
  createWork: (data) => call('/work/create', data, 'POST'),
  consent: (data) => call('/work/consent', data, 'POST'),
  revoke: (data) => call('/work/revoke', data, 'POST'),
  publicWorks: () => call('/work/public-page'),
  publicWork: (id, version) => call('/work/public-get', { id, version }),
  workFile: (id, version, attachment, published) => {
    const token = getAccessToken();
    return {
      url: `${baseUrl}${apiPath}/edu/work/${
        published ? 'public' : 'preview'
      }-file?id=${encodeURIComponent(id)}&version=${encodeURIComponent(
        version,
      )}&attachment=${encodeURIComponent(attachment)}`,
      headers: {
        'tenant-id': getTenantId(),
        ...(!published && token
          ? { Authorization: token.startsWith('Bearer ') ? token : 'Bearer ' + token }
          : {}),
      },
    };
  },
  leave: (data) => call('/leave/create', data, 'POST'),
  transfer: (data) => call('/transfer/create', data, 'POST'),
  requests: (studentId) => call('/request/list', { studentId }),
  fileUrl: (fileId, studentId) => call('/file/get-url', { fileId, studentId }),
};
