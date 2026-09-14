<template>
  <ContentWrap title="官网管理">
    <el-alert
      title="课程发布后会展示在官网；咨询信息仅用于家长已同意的课程沟通。"
      type="info"
      :closable="false"
      class="mb-4"
    />
    <el-tabs v-model="tab">
      <el-tab-pane label="课程管理" name="courses">
        <el-button v-hasPermi="['edu:website:create']" type="primary" @click="editCourse()">
          新增课程
        </el-button>
        <el-button v-hasPermi="['edu:website:query']" @click="loadCourses">刷新</el-button>
        <el-table v-loading="courseLoading" :data="courses" class="mt-4" empty-text="暂无官网课程">
          <el-table-column prop="title" label="课程名称" min-width="200" />
          <el-table-column label="阶段" width="120">
            <template #default="{ row }">{{ stageLabels[row.stage] }}</template>
          </el-table-column>
          <el-table-column label="发布状态" width="110">
            <template #default="{ row }">
              <el-tag :type="row.published ? 'success' : 'info'">
                {{ row.published ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sortOrder" label="排序" width="90" />
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button
                v-hasPermi="['edu:website:update']"
                link
                type="primary"
                @click="editCourse(row)"
              >
                编辑
              </el-button>
              <el-button
                v-hasPermi="['edu:website:publish']"
                link
                :type="row.published ? 'warning' : 'success'"
                :loading="publishingId === row.id"
                @click="changePublication(row)"
              >
                {{ row.published ? '撤下' : '发布' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane v-if="canQueryInquiries" label="咨询跟进" name="inquiries">
        <p class="muted">联系方式仅用于家长已同意的课程沟通。</p>
        <el-button v-hasPermi="['crm:clue:query']" @click="loadInquiries">刷新咨询</el-button>
        <el-table v-loading="inquiryLoading" :data="inquiries" class="mt-4" empty-text="暂无咨询">
          <el-table-column prop="contactName" label="称呼" width="120" />
          <el-table-column label="联系方式" min-width="190">
            <template #default="{ row }">{{ contactText(row) }}</template>
          </el-table-column>
          <el-table-column
            prop="experience"
            label="已有经验"
            min-width="150"
            show-overflow-tooltip
          />
          <el-table-column prop="interest" label="兴趣" min-width="150" show-overflow-tooltip />
          <el-table-column label="提交时间" width="170">
            <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">{{ statusLabels[row.status] }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button v-hasPermi="['crm:clue:query']" link type="primary" @click="follow(row)">
                查看与跟进
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <Pagination
          v-model:page="inquiryQuery.pageNo"
          v-model:limit="inquiryQuery.pageSize"
          :total="inquiryTotal"
          @pagination="loadInquiries"
        />
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>

  <Dialog v-model="courseOpen" :title="existing ? '编辑课程' : '新增课程'" width="640px">
    <el-alert
      v-if="publishRetryAvailable"
      title="课程内容已保存，但发布状态更新失败。请重试发布或撤下；如需继续编辑，请取消后重新打开。"
      type="warning"
      :closable="false"
      class="mb-4"
    />
    <el-form
      ref="courseFormRef"
      :model="courseForm"
      :rules="courseRules"
      label-position="top"
      :disabled="publishRetryAvailable"
    >
      <el-form-item label="标识（小写英文、数字或连字符；创建后不可修改）" prop="slug">
        <el-input v-model="courseForm.slug" :disabled="existing" maxlength="40" show-word-limit />
      </el-form-item>
      <el-form-item label="课程名称" prop="title">
        <el-input v-model="courseForm.title" maxlength="80" show-word-limit />
      </el-form-item>
      <el-form-item label="简介" prop="description">
        <el-input
          v-model="courseForm.description"
          type="textarea"
          maxlength="600"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="内容大纲（每行一项）" prop="outline">
        <el-input
          v-model="courseForm.outline"
          type="textarea"
          :rows="5"
          maxlength="2000"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="阶段" prop="stage">
        <el-select v-model="courseForm.stage">
          <el-option :value="1" label="初次接触" />
          <el-option :value="2" label="动手创作" />
          <el-option :value="3" label="持续进阶" />
        </el-select>
      </el-form-item>
      <el-form-item label="封面素材" prop="image">
        <el-select v-model="courseForm.image">
          <el-option value="minecraft" label="创意世界" />
          <el-option value="museum" label="互动故事" />
          <el-option value="notes" label="学习工具" />
        </el-select>
      </el-form-item>
      <el-form-item label="排序" prop="sortOrder">
        <el-input-number v-model="courseForm.sortOrder" :min="0" :max="999" />
      </el-form-item>
      <el-form-item v-hasPermi="['edu:website:publish']" label="发布到官网">
        <el-switch v-model="courseForm.published" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="courseOpen = false">取消</el-button>
      <el-button
        v-if="publishRetryAvailable"
        v-hasPermi="['edu:website:publish']"
        type="success"
        :loading="courseSaving"
        @click="retryPublication"
      >
        {{ courseForm.published ? '重试发布' : '重试撤下' }}
      </el-button>
      <el-button
        v-hasPermi="[existing ? 'edu:website:update' : 'edu:website:create']"
        type="primary"
        :loading="courseSaving"
        :disabled="publishRetryAvailable"
        @click="saveCourse"
      >
        保存课程
      </el-button>
    </template>
  </Dialog>

  <Dialog v-model="inquiryOpen" title="咨询详情与跟进" width="640px">
    <div v-loading="inquiryDetailLoading">
      <el-descriptions v-if="selectedInquiry.id" :column="1" border>
        <el-descriptions-item label="称呼">{{ selectedInquiry.contactName }}</el-descriptions-item>
        <el-descriptions-item label="联系方式">{{
          contactText(selectedInquiry)
        }}</el-descriptions-item>
        <el-descriptions-item label="已有经验">{{
          selectedInquiry.experience || '未填写'
        }}</el-descriptions-item>
        <el-descriptions-item label="兴趣">{{
          selectedInquiry.interest || '未填写'
        }}</el-descriptions-item>
        <el-descriptions-item label="留言">{{
          selectedInquiry.message || '未填写'
        }}</el-descriptions-item>
      </el-descriptions>
      <el-form v-if="selectedInquiry.id" label-position="top" class="mt-4">
        <el-form-item label="跟进状态">
          <el-select v-model="selectedInquiry.status">
            <el-option
              v-for="(label, key) in statusLabels"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="内部备注">
          <el-input
            v-model="selectedInquiry.note"
            type="textarea"
            maxlength="2000"
            show-word-limit
            :rows="4"
          />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="inquiryOpen = false">取消</el-button>
      <el-button
        v-hasPermi="['crm:clue:update']"
        type="primary"
        :loading="inquirySaving"
        :disabled="!selectedInquiry.id"
        @click="saveFollow"
      >
        保存跟进
      </el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { formatDate } from '@/utils/formatTime'
import { checkPermi } from '@/utils/permission'
import {
  createWebsiteOffering,
  getWebsiteAdmission,
  getWebsiteAdmissionPage,
  getWebsiteOfferingList,
  publishWebsiteOffering,
  updateWebsiteAdmission,
  updateWebsiteOffering,
  type WebsiteAdmission,
  type WebsiteOffering
} from '@/api/edu/website'

defineOptions({ name: 'EduWebsite' })

type CourseForm = Partial<WebsiteOffering> & {
  slug: string
  title: string
  description: string
  outline: string
  stage: 1 | 2 | 3
  image: 'minecraft' | 'museum' | 'notes'
  sortOrder: number
  published: boolean
}

const message = useMessage()
const canQueryInquiries = checkPermi(['crm:clue:query'])
const tab = ref('courses')
const courses = ref<WebsiteOffering[]>([])
const inquiries = ref<WebsiteAdmission[]>([])
const courseLoading = ref(false)
const inquiryLoading = ref(false)
const courseSaving = ref(false)
const inquirySaving = ref(false)
const inquiryDetailLoading = ref(false)
const publishingId = ref<number>()
const courseOpen = ref(false)
const inquiryOpen = ref(false)
const existing = ref(false)
const persistedPublished = ref(false)
const publishRetryAvailable = ref(false)
const inquiryTotal = ref(0)
const inquiryQuery = reactive({ pageNo: 1, pageSize: 20 })
const courseFormRef = ref<FormInstance>()
const stageLabels: Record<number, string> = { 1: '初次接触', 2: '动手创作', 3: '持续进阶' }
const statusLabels: Record<WebsiteAdmission['status'], string> = {
  NEW: '待联系',
  CONTACTED: '已联系',
  CLOSED: '已结束'
}
const emptyCourse = (): CourseForm => ({
  slug: '',
  title: '',
  description: '',
  outline: '',
  stage: 1,
  image: 'minecraft',
  sortOrder: 0,
  published: false
})
const courseForm = ref<CourseForm>(emptyCourse())
const selectedInquiry = ref<Partial<WebsiteAdmission>>({})
const courseRules: FormRules<CourseForm> = {
  slug: [
    { required: true, message: '请填写课程标识', trigger: 'blur' },
    { pattern: /^[a-z0-9-]{1,40}$/, message: '标识只能包含小写英文、数字或连字符', trigger: 'blur' }
  ],
  title: [
    { required: true, whitespace: true, message: '请填写课程名称', trigger: 'blur' },
    { max: 80, message: '课程名称不能超过 80 字', trigger: 'blur' }
  ],
  description: [
    { required: true, whitespace: true, message: '请填写课程简介', trigger: 'blur' },
    { max: 600, message: '课程简介不能超过 600 字', trigger: 'blur' }
  ],
  outline: [{ max: 2000, message: '内容大纲不能超过 2000 字', trigger: 'blur' }],
  sortOrder: [{ required: true, message: '请填写排序', trigger: 'change' }]
}

function contactText(row: Partial<WebsiteAdmission>) {
  return [...new Set([row.contact, row.mobile, row.email].filter(Boolean))].join(' / ') || '未填写'
}

async function loadCourses() {
  courseLoading.value = true
  try {
    courses.value = await getWebsiteOfferingList()
  } catch {
    // The request layer has already shown the actionable error to the operator.
  } finally {
    courseLoading.value = false
  }
}

async function loadInquiries() {
  if (!canQueryInquiries) return
  inquiryLoading.value = true
  try {
    const data = await getWebsiteAdmissionPage(inquiryQuery)
    inquiries.value = data.list
    inquiryTotal.value = data.total
  } catch {
    // Avoid turning a handled authorization or network failure into an unhandled rejection.
  } finally {
    inquiryLoading.value = false
  }
}

function editCourse(row?: WebsiteOffering) {
  existing.value = Boolean(row)
  publishRetryAvailable.value = false
  courseForm.value = row ? { ...row, published: Boolean(row.published) } : emptyCourse()
  persistedPublished.value = Boolean(row?.published)
  courseOpen.value = true
  nextTick(() => courseFormRef.value?.clearValidate())
}

function draftPayload() {
  return {
    slug: courseForm.value.slug.trim(),
    title: courseForm.value.title.trim(),
    description: courseForm.value.description.trim(),
    outline: courseForm.value.outline,
    stage: courseForm.value.stage,
    image: courseForm.value.image,
    sortOrder: courseForm.value.sortOrder,
    ...(courseForm.value.courseId ? { courseId: courseForm.value.courseId } : {})
  }
}

async function saveCourse() {
  if (!(await courseFormRef.value?.validate())) return
  courseSaving.value = true
  const desiredPublished = courseForm.value.published
  try {
    let saved: WebsiteOffering
    if (existing.value && courseForm.value.id && courseForm.value.revision !== undefined) {
      saved = await updateWebsiteOffering({
        ...draftPayload(),
        id: courseForm.value.id,
        revision: courseForm.value.revision
      })
    } else {
      saved = await createWebsiteOffering(draftPayload())
      existing.value = true
    }

    courseForm.value = { ...saved, published: desiredPublished }
    persistedPublished.value = saved.published

    if (desiredPublished !== persistedPublished.value) {
      publishRetryAvailable.value = true
      saved = await publishWebsiteOffering({
        id: saved.id,
        revision: saved.revision,
        published: desiredPublished
      })
      courseForm.value = { ...saved }
      persistedPublished.value = saved.published
      publishRetryAvailable.value = false
    }

    courseOpen.value = false
    message.success('课程已保存')
    await loadCourses()
  } finally {
    courseSaving.value = false
  }
}

async function publishSavedCourse(targetPublished: boolean) {
  if (!courseForm.value.id || courseForm.value.revision === undefined) return
  const saved = await publishWebsiteOffering({
    id: courseForm.value.id,
    revision: courseForm.value.revision,
    published: targetPublished
  })
  courseForm.value = { ...saved }
  persistedPublished.value = saved.published
}

async function retryPublication() {
  if (!publishRetryAvailable.value) return
  courseSaving.value = true
  try {
    await publishSavedCourse(courseForm.value.published)
    publishRetryAvailable.value = false
    courseOpen.value = false
    message.success(courseForm.value.published ? '课程已发布' : '课程已撤下')
    await loadCourses()
  } finally {
    courseSaving.value = false
  }
}

async function changePublication(row: WebsiteOffering) {
  publishingId.value = row.id
  try {
    const saved = await publishWebsiteOffering({
      id: row.id,
      revision: row.revision,
      published: !row.published
    })
    const index = courses.value.findIndex((item) => item.id === saved.id)
    if (index >= 0) courses.value[index] = saved
    message.success(saved.published ? '课程已发布' : '课程已撤下')
  } finally {
    publishingId.value = undefined
  }
}

async function follow(row: WebsiteAdmission) {
  inquiryOpen.value = true
  inquiryDetailLoading.value = true
  selectedInquiry.value = {}
  try {
    selectedInquiry.value = await getWebsiteAdmission(row.id)
  } finally {
    inquiryDetailLoading.value = false
  }
}

async function saveFollow() {
  if (!selectedInquiry.value.id || !selectedInquiry.value.status) return
  inquirySaving.value = true
  try {
    await updateWebsiteAdmission({
      id: selectedInquiry.value.id,
      status: selectedInquiry.value.status,
      note: selectedInquiry.value.note || ''
    })
    inquiryOpen.value = false
    message.success('跟进已保存')
    await loadInquiries()
  } finally {
    inquirySaving.value = false
  }
}

onMounted(() => {
  void loadCourses()
  if (canQueryInquiries) void loadInquiries()
})
</script>

<style scoped>
.muted {
  color: var(--el-text-color-secondary);
}
</style>
