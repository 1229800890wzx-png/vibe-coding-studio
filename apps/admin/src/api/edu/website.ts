import request from '@/config/axios'

export interface WebsiteOffering {
  id: number
  slug: string
  title: string
  description: string
  outline: string
  stage: 1 | 2 | 3
  image: 'minecraft' | 'museum' | 'notes'
  sortOrder: number
  published: boolean
  courseId?: number
  revision: number
}

export type WebsiteOfferingDraft = Omit<WebsiteOffering, 'id' | 'revision' | 'published'>

export interface WebsiteAdmission {
  id: number
  contactName: string
  contact?: string
  mobile?: string
  email?: string
  experience?: string
  interest?: string
  message?: string
  status: 'NEW' | 'CONTACTED' | 'CLOSED'
  note?: string
  courseId?: number
  createTime: string
}

export interface PageResult<T> {
  list: T[]
  total: number
}

export const getWebsiteOfferingList = () =>
  request.get<WebsiteOffering[]>({ url: '/edu/website-offering/list' })

export const createWebsiteOffering = (data: WebsiteOfferingDraft) =>
  request.post<WebsiteOffering>({ url: '/edu/website-offering/create', data })

export const updateWebsiteOffering = (
  data: WebsiteOfferingDraft & Pick<WebsiteOffering, 'id' | 'slug' | 'revision'>
) => request.put<WebsiteOffering>({ url: '/edu/website-offering/update', data })

export const publishWebsiteOffering = (
  data: Pick<WebsiteOffering, 'id' | 'revision' | 'published'>
) => request.post<WebsiteOffering>({ url: '/edu/website-offering/publish', data })

export const getWebsiteAdmissionPage = (params: { pageNo: number; pageSize: number }) =>
  request.get<PageResult<WebsiteAdmission>>({ url: '/edu/website-admission/page', params })

export const getWebsiteAdmission = (id: number) =>
  request.get<WebsiteAdmission>({ url: '/edu/website-admission/get', params: { id } })

export const updateWebsiteAdmission = (data: Pick<WebsiteAdmission, 'id' | 'status' | 'note'>) =>
  request.put<boolean>({ url: '/edu/website-admission/update', data })
