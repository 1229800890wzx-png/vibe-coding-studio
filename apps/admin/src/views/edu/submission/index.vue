<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { eduApi, errorMessage, formatTime, type EduRecord } from '@/api/edu'
import { useEduPage } from '../components/useEduPage'
import EduHeader from '../components/EduHeader.vue'
import EduStatus from '../components/EduStatus.vue'
import ResourceSelect from '../components/ResourceSelect.vue'
import PrivateAttachments from '../components/PrivateAttachments.vue'
defineOptions({ name: 'EduSubmission' })
const { query, rows, total, loading, error, load, search, reset } = useEduPage('submission', {
  cohortId: undefined
})
const visible = ref(false),
  saving = ref(false),
  reviewError = ref(''),
  selected = ref<EduRecord>(),
  savedSnapshot = ref(''),
  reviewRevision = ref(0),
  serverSavedAt = ref<number>(),
  serverReviewStatus = ref('')
const feedback = reactive({
  feedback: '',
  score: undefined as number | undefined,
  requireRevision: false
})
const dirty = computed(() => JSON.stringify(feedback) !== savedSnapshot.value)
const published = computed(() => serverReviewStatus.value === 'PUBLISHED')
async function openReview(row: EduRecord) {
  try {
    const submission = await eduApi.get('submission', row.id)
    selected.value = submission
    const review = submission.review
    Object.assign(feedback, {
      feedback: review?.feedback || '',
      score: review?.score ?? undefined,
      requireRevision: review?.requireRevision ?? false
    })
    reviewRevision.value = review?.revision ?? 0
    serverSavedAt.value = review?.updateTime || undefined
    serverReviewStatus.value = review?.status || ''
    savedSnapshot.value = JSON.stringify(feedback)
    reviewError.value = ''
    visible.value = true
  } catch (e) {
    error.value = errorMessage(e)
  }
}
async function closeReview(done?: () => void) {
  if (saving.value) return
  if (dirty.value) {
    try {
      await ElMessageBox.confirm('当前反馈尚未保存。关闭后将丢失本次修改。', '离开批改', {
        confirmButtonText: '放弃修改',
        cancelButtonText: '继续批改',
        type: 'warning'
      })
    } catch {
      return
    }
  }
  if (done) done()
  else visible.value = false
}
async function saveReview(status: 'DRAFT' | 'PUBLISHED') {
  if (!selected.value || saving.value || published.value) return
  if (status === 'PUBLISHED' && !feedback.feedback.trim()) {
    reviewError.value = '请写下具体反馈后再发布，让孩子知道做得好的地方和下一步方向。'
    return
  }
  saving.value = true
  reviewError.value = ''
  try {
    const submitted = { ...feedback }
    const saved = await eduApi.action('submission', 'review', {
      id: selected.value.id,
      ...submitted,
      status,
      revision: reviewRevision.value
    })
    if (!Number.isInteger(saved?.revision) || !saved?.updateTime)
      throw new Error('服务器未返回保存版本和时间，请重新打开作品核对。当前输入已保留。')
    reviewRevision.value = saved.revision
    serverSavedAt.value = saved.updateTime
    serverReviewStatus.value = saved.status
    selected.value.review = saved
    savedSnapshot.value = JSON.stringify(submitted)
    ElMessage.success(status === 'DRAFT' ? '批改草稿已保存，学员暂不可见' : '反馈已发布给学员')
    if (status === 'PUBLISHED') {
      visible.value = false
      await load()
    }
  } catch (e) {
    reviewError.value = errorMessage(e)
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <main class="edu-page"
    ><EduHeader
      title="认真看见每一次尝试"
      description="先看作品，再给反馈。肯定具体的进步，也给出孩子能够继续尝试的下一步。"
      eyebrow="作业批改 / FEEDBACK STUDIO"
      ><router-link to="/edu/assignment" class="edu-action-link"
        >管理创作任务 →</router-link
      ></EduHeader
    ><section class="edu-card"
      ><form class="edu-filters" @submit.prevent="search"
        ><el-input
          v-model="query.keyword"
          placeholder="搜索学员或作业名称"
          aria-label="搜索学员或作业"
          clearable
        /><div style="width: 230px"
          ><ResourceSelect
            v-model="query.cohortId"
            resource="cohort"
            placeholder="全部授课班级" /></div
        ><el-select v-model="query.status" clearable placeholder="全部提交状态"
          ><el-option label="待批改" value="SUBMITTED" /><el-option
            label="已批改"
            value="REVIEWED" /><el-option label="待修改" value="REVISION_REQUIRED" /></el-select
        ><el-button native-type="submit" type="primary">查询</el-button
        ><el-button @click="reset">重置</el-button></form
      ><el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        :closable="false"
        class="edu-error" /><el-table
        v-loading="loading"
        :data="rows"
        row-key="id"
        empty-text="当前没有待处理的作品提交"
        ><el-table-column label="创作任务" min-width="250"
          ><template #default="{ row }"
            ><div class="edu-cell-title">{{
              row.assignmentTitle || row.assignmentName || `任务 #${row.assignmentId}`
            }}</div
            ><div class="edu-cell-meta"
              >{{ row.cohortName }} · 作品版本 v{{ row.version }}</div
            ></template
          ></el-table-column
        ><el-table-column prop="studentName" label="学员" min-width="140" /><el-table-column
          label="提交时间"
          min-width="170"
          ><template #default="{ row }">{{
            formatTime(row.submittedAt)
          }}</template></el-table-column
        ><el-table-column label="状态" width="120"
          ><template #default="{ row }"
            ><EduStatus :value="row.status" /></template></el-table-column
        ><el-table-column label="操作" width="140"
          ><template #default="{ row }"
            ><el-button
              v-hasPermi="['edu:submission:review']"
              type="primary"
              link
              @click="openReview(row)"
              >{{ row.status === 'SUBMITTED' ? '开始批改' : '查看与反馈' }}</el-button
            ></template
          ></el-table-column
        ></el-table
      ><el-pagination
        v-model:current-page="query.pageNo"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @change="load"
    /></section>
    <el-drawer
      v-model="visible"
      :title="`${selected?.studentName || '学员'}的创作 · v${selected?.version || 1}`"
      size="min(1180px,98vw)"
      :before-close="closeReview"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      ><div class="edu-review-grid"
        ><section
          ><p class="edu-eyebrow">THE WORK / 本次提交</p
          ><h2 style="font-size: 22px; margin: 0 0 12px">{{
            selected?.assignmentTitle || selected?.assignmentName || '创作任务'
          }}</h2
          ><p class="edu-description" style="margin-bottom: 20px"
            >{{ formatTime(selected?.submittedAt) }} · {{ selected?.cohortName }}</p
          ><div class="edu-work-preview">{{
            selected?.content || '学员通过附件提交了作品，请打开下方附件查看。'
          }}</div
          ><PrivateAttachments :attachments="selected?.attachments" /></section
        ><section
          ><p class="edu-eyebrow">THE FEEDBACK / 让下一步更清楚</p
          ><el-alert
            v-if="reviewError"
            :title="reviewError"
            type="error"
            show-icon
            :closable="false"
            class="edu-error"
          /><el-form label-position="top" :disabled="saving || published"
            ><el-form-item label="给孩子的具体反馈（发布必填）"
              ><el-input
                v-model="feedback.feedback"
                type="textarea"
                :rows="13"
                maxlength="5000"
                show-word-limit
                placeholder="我注意到你……\n这部分做得很好，因为……\n接下来可以试着……" /></el-form-item
            ><el-form-item label="作品评分（可选，0–100）"
              ><el-input-number
                v-model="feedback.score"
                :min="0"
                :max="100"
                :precision="0" /></el-form-item
            ><el-form-item
              ><el-checkbox v-model="feedback.requireRevision"
                >邀请学员修改后再次提交</el-checkbox
              ></el-form-item
            ></el-form
          ><el-alert
            :title="
              published
                ? '该版本反馈已发布，可供学员与监护人查看。学员重新提交后，可批改新的作品版本。'
                : '保存草稿仅供教师继续编辑；发布反馈后，学员与监护人可以查看。'
            "
            type="info"
            :closable="false"
            show-icon
          /><p v-if="serverSavedAt" class="edu-inline-note"
            >{{ serverReviewStatus === 'DRAFT' ? '草稿' : '反馈' }}服务器保存时间：{{
              new Date(serverSavedAt).toLocaleString('zh-CN', { hour12: false })
            }}</p
          ><p class="edu-inline-note">{{
            dirty
              ? '有尚未保存的修改'
              : serverSavedAt
                ? '当前输入与服务器保存内容一致'
                : '尚未保存反馈草稿'
          }}</p></section
        ></div
      ><template #footer
        ><el-button @click="closeReview()">关闭</el-button
        ><el-button v-if="!published" :loading="saving" @click="saveReview('DRAFT')"
          >保存批改草稿</el-button
        ><el-button
          v-if="!published"
          type="primary"
          :loading="saving"
          @click="saveReview('PUBLISHED')"
          >发布反馈</el-button
        ></template
      ></el-drawer
    ></main
  >
</template>
