import request from '@/config/axios'

export type EduResource =
  | 'course'
  | 'cohort'
  | 'session'
  | 'campus'
  | 'room'
  | 'teacher'
  | 'student'
  | 'enrollment'
  | 'trial'
  | 'assignment'
  | 'submission'
  | 'growth-report'
  | 'request'
  | 'work'
export interface EduRecord {
  id: number
  name?: string
  title?: string
  status?: string
  [key: string]: any
}
export interface Lesson {
  id?: number
  title: string
  sort: number
  durationMinutes: number
  objectives: string
  materials: string
  assignment: string
}
export interface Course extends EduRecord {
  name: string
  code: string
  description: string
  ageMin: number
  ageMax: number
  version: number
  lessons: Lesson[]
}
export interface PageResult<T = EduRecord> {
  list: T[]
  total: number
}
export const eduApi = {
  uploadMaterial: (cohortId: number, file: File) => {
    const data = new FormData()
    data.append('cohortId', String(cohortId))
    data.append('file', file)
    return request.post<{ fileId: number; name: string }>({
      url: '/edu/file/upload',
      data,
      headersType: 'multipart/form-data'
    })
  },
  page: <T = EduRecord>(resource: EduResource, params: Record<string, any>) =>
    request.get<PageResult<T>>({ url: `/edu/${resource}/page`, params }),
  get: <T = EduRecord>(resource: EduResource, id: number) =>
    request.get<T>({ url: `/edu/${resource}/get`, params: { id } }),
  create: (resource: EduResource, data: Record<string, any>) =>
    request.post({ url: `/edu/${resource}/create`, data }),
  update: (resource: EduResource, data: Record<string, any>) =>
    request.put({ url: `/edu/${resource}/update`, data }),
  action: (resource: EduResource, action: string, data: Record<string, any>) =>
    request.post({ url: `/edu/${resource}/${action}`, data }),
  dashboard: () => request.get<Record<string, any>>({ url: '/edu/dashboard/get' }),
  fileUrl: (fileId: number) =>
    request.get<string | { url: string; headers?: Record<string, string>; expiresIn?: number }>({
      url: '/edu/file/get-url',
      params: { fileId }
    }),
  attendance: (data: Record<string, any>) => request.post({ url: '/edu/attendance/save', data })
}

export const errorMessage = (error: any) =>
  error?.response?.data?.msg ||
  error?.msg ||
  error?.message ||
  (typeof error === 'string' ? error : '请求未完成，请检查连接后重试。已保留输入。')
export const statusLabels: Record<string, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  ARCHIVED: '已归档',
  OPEN: '报名中',
  CLOSED: '已截止',
  CANCELLED: '已取消',
  COMPLETED: '已结课',
  ACTIVE: '学习中',
  PENDING_PAYMENT: '待支付',
  EXPIRED: '已失效',
  SUBMITTED: '待批改',
  REVIEWED: '已批改',
  REVISION_REQUIRED: '待修改',
  PENDING: '待处理',
  PRIVATE: '私密',
  REJECTED: '未通过',
  APPROVED: '已通过',
  CONFIRMED: '已确认',
  SCHEDULED: '待上课',
  PRESENT: '出勤',
  ABSENT: '缺勤',
  EXCUSED: '请假',
  GRANTED: '已授权',
  REVOKED: '已撤回',
  REGULAR: '正式班',
  TRIAL: '体验班',
  ONLINE: '线上',
  OFFLINE: '线下'
}
export const formatTime = (value: any) =>
  value
    ? new Date(value).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    : '—'
export const money = (value: any) =>
  value === undefined || value === null ? '—' : `¥${(Number(value) / 100).toFixed(2)}`
