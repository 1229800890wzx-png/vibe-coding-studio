<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { eduApi, errorMessage, formatTime, type EduRecord } from '@/api/edu'
import EduHeader from '../components/EduHeader.vue'
import EduStatus from '../components/EduStatus.vue'
import ResourceSelect from '../components/ResourceSelect.vue'
import MaterialUpload from '../components/MaterialUpload.vue'
defineOptions({ name: 'EduSession' })
const route = useRoute()
const defaults = { cohortId: route.query.cohortId ? Number(route.query.cohortId) : undefined }
let previousQuery = {}
try {
  previousQuery = JSON.parse(sessionStorage.getItem('edu:filters:session') || '{}')
} catch {
  /* Ignore obsolete filter state. */
}
const query = reactive<Record<string, any>>({
  pageNo: 1,
  pageSize: 20,
  keyword: '',
  status: '',
  ...defaults,
  ...previousQuery
})
const rows = ref<EduRecord[]>([]),
  total = ref(0),
  loading = ref(false),
  error = ref('')
const viewMode = ref('table'),
  calendarDate = ref(new Date())
let loadSequence = 0
async function load() {
  const sequence = ++loadSequence
  loading.value = true
  error.value = ''
  const calendar = viewMode.value === 'calendar'
  const params = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== '' && value != null)
  )
  try {
    // Both views read the original session API into one set of rows. Calendar loads every matching page.
    const result = await eduApi.page('session', {
      ...params,
      ...(calendar ? { pageNo: 1, pageSize: 100 } : {})
    })
    const items = [...result.list]
    if (calendar) {
      for (let pageNo = 2; items.length < result.total; pageNo++) {
        if (sequence !== loadSequence) return
        const next = await eduApi.page('session', { ...params, pageNo, pageSize: 100 })
        if (!next.list.length) break
        items.push(...next.list)
      }
    }
    if (sequence === loadSequence) {
      rows.value = items
      total.value = result.total
    }
  } catch (e) {
    if (sequence === loadSequence) {
      error.value = errorMessage(e)
      rows.value = []
      total.value = 0
    }
  } finally {
    if (sequence === loadSequence) loading.value = false
  }
}
function search() {
  query.pageNo = 1
  void load()
}
function reset() {
  Object.assign(query, { pageNo: 1, pageSize: 20, keyword: '', status: '', ...defaults })
  void load()
}
function localDay(value: number | Date) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const sessionsByDay = computed(() => {
  const grouped: Record<string, EduRecord[]> = {}
  for (const row of rows.value) (grouped[localDay(row.startTime)] ||= []).push(row)
  Object.values(grouped).forEach((items) => items.sort((a, b) => a.startTime - b.startTime))
  return grouped
})
const monthSessionCount = computed(
  () =>
    rows.value.filter(
      (row) => localDay(row.startTime).slice(0, 7) === localDay(calendarDate.value).slice(0, 7)
    ).length
)
const clockTime = (value: number) =>
  new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
const sessionEndLabel = (row: EduRecord) =>
  localDay(row.startTime) === localDay(row.endTime) ? clockTime(row.endTime) : formatTime(row.endTime)
watch(query, () => sessionStorage.setItem('edu:filters:session', JSON.stringify(query)), {
  deep: true
})
watch(viewMode, () => {
  void load()
})
onMounted(load)
const visible = ref(false),
  saving = ref(false),
  uploading = ref(false),
  formError = ref(''),
  formRef = ref<FormInstance>()
const form = reactive<any>({}),
  lessons = ref<EduRecord[]>([])
const previewOpen = ref(false),
  previewLoading = ref(false),
  schedulePreview = ref<any>(),
  previewPayload = ref('')
const candidate = () =>
  JSON.stringify({ ...form, startTime: Number(form.startTime), endTime: Number(form.endTime) })
watch(
  form,
  () => {
    schedulePreview.value = undefined
    previewPayload.value = ''
    previewOpen.value = false
  },
  { deep: true }
)
const attendanceOpen = ref(false),
  attendanceLoading = ref(false),
  attendanceError = ref(''),
  attendanceSession = ref<EduRecord>(),
  roster = ref<any[]>([])
async function cohortChanged(id?: number, hydrateDefaults = true) {
  if (!id) return
  try {
    const cohort = await eduApi.get('cohort', id)
    if (hydrateDefaults)
      Object.assign(form, { teacherId: cohort.teacherId, roomId: cohort.roomId, mode: cohort.mode })
    lessons.value = cohort.lessons || []
    if (!cohort.courseVersionId && !lessons.value.length) {
      const course = await eduApi.get('course', cohort.courseId)
      lessons.value = course.lessons || []
    }
  } catch (e) {
    formError.value = errorMessage(e)
  }
}
function selectCohort(id?: number) {
  form.materials = []
  form.lessonTemplateId = undefined
  lessons.value = []
  void cohortChanged(id)
}
async function edit(row?: EduRecord) {
  formError.value = ''
  Object.keys(form).forEach((key) => delete form[key])
  Object.assign(form, {
    title: '',
    cohortId: query.cohortId,
    mode: 'ONLINE',
    status: 'SCHEDULED',
    joinInfo: { url: '', code: '', instructions: '' }
  })
  if (row) {
    try {
      Object.assign(form, await eduApi.get('session', row.id))
    } catch (e) {
      error.value = errorMessage(e)
      return
    }
  }
  if (form.cohortId) await cohortChanged(form.cohortId, !row)
  if (typeof form.joinInfo === 'string') {
    try {
      form.joinInfo = JSON.parse(form.joinInfo)
    } catch {
      form.joinInfo = { url: '', code: '', instructions: form.joinInfo }
    }
  }
  form.joinInfo ||= { url: '', code: '', instructions: '' }
  visible.value = true
}
async function save() {
  if (saving.value || previewLoading.value || uploading.value) return
  if (!(await formRef.value?.validate().catch(() => false))) return
  if (Number(form.endTime) <= Number(form.startTime)) {
    formError.value = '结束时间必须晚于开始时间。'
    return
  }
  if (form.mode === 'OFFLINE' && !form.roomId) {
    formError.value = '线下课次需要选择教室。'
    return
  }
  if (form.joinInfo?.url && !/^https?:\/\//i.test(form.joinInfo.url)) {
    formError.value = '课堂链接应以 https:// 或 http:// 开头。'
    return
  }
  previewLoading.value = true
  formError.value = ''
  try {
    const payload = candidate()
    const result = await eduApi.action('session', 'preview', JSON.parse(payload))
    if (payload !== candidate()) {
      formError.value = '排课信息已改变，请重新检查冲突与影响。'
      return
    }
    schedulePreview.value = result
    previewPayload.value = payload
    previewOpen.value = true
  } catch (e) {
    formError.value = errorMessage(e)
  } finally {
    previewLoading.value = false
  }
}
async function confirmSchedule() {
  if (saving.value || !schedulePreview.value?.canSave) return
  if (previewPayload.value !== candidate()) {
    previewOpen.value = false
    formError.value = '排课信息已改变，请重新检查冲突与影响。'
    return
  }
  saving.value = true
  formError.value = ''
  try {
    const payload = JSON.parse(previewPayload.value)
    if (form.id) await eduApi.update('session', payload)
    else await eduApi.create('session', payload)
    ElMessage.success('排课已保存')
    previewOpen.value = false
    visible.value = false
    await load()
  } catch (e) {
    previewOpen.value = false
    schedulePreview.value = undefined
    previewPayload.value = ''
    formError.value = errorMessage(e)
  } finally {
    saving.value = false
  }
}
async function attendance(row: EduRecord) {
  attendanceSession.value = row
  attendanceError.value = ''
  attendanceLoading.value = true
  attendanceOpen.value = true
  try {
    const data = await eduApi.page('enrollment', {
      pageNo: 1,
      pageSize: 100,
      cohortId: row.cohortId,
      sessionId: row.id
    })
    roster.value = data.list
      .filter((item) => ['ACTIVE', 'COMPLETED'].includes(item.status || ''))
      .map((item) => ({
        ...item,
        attendanceStatus: item.attendanceStatus || '',
        note: item.attendanceNote || ''
      }))
  } catch (e) {
    attendanceError.value = errorMessage(e)
    roster.value = []
  } finally {
    attendanceLoading.value = false
  }
}
async function saveAttendance() {
  const marked = roster.value.filter((item) => item.attendanceStatus)
  if (!marked.length) {
    attendanceError.value = '请至少为一位学员选择出勤状态。'
    return
  }
  attendanceLoading.value = true
  attendanceError.value = ''
  let saved = 0
  try {
    for (const item of marked) {
      await eduApi.attendance({
        enrollmentId: item.id,
        sessionId: attendanceSession.value?.id,
        status: item.attendanceStatus,
        note: item.note
      })
      saved++
    }
    ElMessage.success(`已记录 ${saved} 位学员出勤`)
    attendanceOpen.value = false
  } catch (e) {
    attendanceError.value = `已保存 ${saved} 条，其余记录未完成。${errorMessage(e)}`
  } finally {
    attendanceLoading.value = false
  }
}
</script>
<template>
  <main class="edu-page"
    ><EduHeader
      title="每一次创造，都有安排"
      description="按班级查看课次，检查教师与教室的时间冲突。保存失败时保留当前输入，方便调整后重试。"
      eyebrow="教学日程 / CLASS SCHEDULE"
      ><el-button v-hasPermi="['edu:session:create']" type="primary" @click="edit()"
        >＋ 安排课次</el-button
      ></EduHeader
    ><section class="edu-card"
      ><form class="edu-filters" @submit.prevent="search"
        ><div style="width: 250px"
          ><ResourceSelect v-model="query.cohortId" resource="cohort" placeholder="选择班级" /></div
        ><el-input
          v-model="query.keyword"
          placeholder="搜索课次名称"
          clearable
          aria-label="课次关键词"
        /><el-button type="primary" native-type="submit">查询</el-button
        ><el-button @click="reset">重置</el-button
        ><el-radio-group v-model="viewMode" aria-label="课表视图">
          <el-radio-button value="table">列表</el-radio-button>
          <el-radio-button value="calendar">月历</el-radio-button>
        </el-radio-group></form
      ><el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        :closable="false"
        class="edu-error" />
      <div v-if="viewMode === 'calendar'" v-loading="loading" class="session-calendar">
        <div class="calendar-toolbar">
          <el-date-picker
            v-model="calendarDate"
            type="month"
            :clearable="false"
            aria-label="查看月份"
          />
          <span class="edu-inline-note"
            >本月 {{ monthSessionCount }} 节课 · 沿用当前班级与关键词筛选</span
          >
        </div>
        <el-calendar v-model="calendarDate">
          <template #date-cell="{ data }">
            <div class="calendar-day">{{ Number(data.day.slice(-2)) }}</div>
            <article
              v-for="session in sessionsByDay[data.day] || []"
              :key="session.id"
              class="calendar-session"
            >
              <div class="calendar-time"
                >{{ clockTime(session.startTime) }}–{{ sessionEndLabel(session) }}</div
              >
              <div class="calendar-title">{{ session.title }}</div>
              <div class="calendar-meta">{{ session.cohortName }}<template v-if="session.teacherName"> · {{ session.teacherName }}</template></div>
              <EduStatus :value="session.status" />
              <div class="calendar-actions">
                <el-button
                  v-hasPermi="['edu:session:update']"
                  type="primary"
                  link
                  @click.stop="edit(session)"
                  >调整</el-button
                >
                <el-button
                  v-hasPermi="['edu:attendance:save']"
                  type="primary"
                  link
                  @click.stop="attendance(session)"
                  >记出勤</el-button
                >
              </div>
            </article>
          </template>
        </el-calendar>
      </div>
      <el-table
        v-else
        v-loading="loading"
        :data="rows"
        row-key="id"
        empty-text="这个班级还没有课次，开始安排第一节课"
        ><el-table-column label="课次" min-width="220"
          ><template #default="{ row }"
            ><div class="edu-cell-title">{{ row.title }}</div
            ><div class="edu-cell-meta">{{
              row.cohortName || `班级 #${row.cohortId}`
            }}</div></template
          ></el-table-column
        ><el-table-column label="上课时间" min-width="230"
          ><template #default="{ row }"
            >{{ formatTime(row.startTime) }} — {{ formatTime(row.endTime) }}</template
          ></el-table-column
        ><el-table-column prop="teacherName" label="教师" min-width="120" /><el-table-column
          label="上课地点"
          min-width="150"
          ><template #default="{ row }">{{
            row.mode === 'ONLINE' ? '线上课堂' : `${row.campusName || ''} ${row.roomName || ''}`
          }}</template></el-table-column
        ><el-table-column label="状态" width="110"
          ><template #default="{ row }"
            ><EduStatus :value="row.status" /></template></el-table-column
        ><el-table-column label="操作" width="160" fixed="right"
          ><template #default="{ row }"
            ><el-button v-hasPermi="['edu:session:update']" type="primary" link @click="edit(row)"
              >调整</el-button
            ><el-button
              v-hasPermi="['edu:attendance:save']"
              type="primary"
              link
              @click="attendance(row)"
              >记出勤</el-button
            ></template
          ></el-table-column
        ></el-table
      ><el-pagination
        v-if="viewMode === 'table'"
        v-model:current-page="query.pageNo"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @change="load"
    /></section>
    <el-drawer
      v-model="visible"
      :title="form.id ? '调整课次' : '安排新课次'"
      size="min(720px,96vw)"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      ><el-alert
        v-if="formError"
        :title="formError"
        type="error"
        show-icon
        :closable="false"
        class="edu-error"
      /><el-form
        ref="formRef"
        :model="form"
        label-position="top"
        :rules="
          Object.fromEntries(
            ['title', 'cohortId', 'teacherId', 'startTime', 'endTime'].map((key) => [
              key,
              [{ required: true, message: '请填写此项', trigger: ['blur', 'change'] }]
            ])
          )
        "
        ><div class="edu-form-grid"
          ><el-form-item prop="cohortId" label="班级" class="is-wide"
            ><ResourceSelect
              v-model="form.cohortId"
              resource="cohort"
              @update:model-value="selectCohort" /></el-form-item
          ><el-form-item label="教学课时模板" class="is-wide"
            ><el-select v-model="form.lessonTemplateId" clearable placeholder="选择课时模板"
              ><el-option
                v-for="lesson in lessons"
                :key="lesson.id"
                :value="lesson.id"
                :label="lesson.title" /></el-select></el-form-item
          ><el-form-item prop="title" label="课次标题" class="is-wide"
            ><el-input v-model="form.title" /></el-form-item
          ><el-form-item label="授课教师" prop="teacherId"
            ><ResourceSelect v-model="form.teacherId" resource="teacher" /></el-form-item
          ><el-form-item label="教室（线下课）"
            ><ResourceSelect v-model="form.roomId" resource="room" /></el-form-item
          ><el-form-item label="开始时间" prop="startTime"
            ><el-date-picker
              v-model="form.startTime"
              type="datetime"
              value-format="x"
              placeholder="开始时间" /></el-form-item
          ><el-form-item label="结束时间" prop="endTime"
            ><el-date-picker
              v-model="form.endTime"
              type="datetime"
              value-format="x"
              placeholder="结束时间"
          /></el-form-item>
          <template v-if="form.mode === 'ONLINE'">
            <el-form-item label="私密课堂链接" class="is-wide"
              ><el-input v-model="form.joinInfo.url" placeholder="https://…" /><p
                class="edu-inline-note"
                >仅向已获得本课次学习权益的学员展示。</p
              ></el-form-item
            >
            <el-form-item label="入会码"><el-input v-model="form.joinInfo.code" /></el-form-item>
            <el-form-item label="入会说明"
              ><el-input v-model="form.joinInfo.instructions" type="textarea" :rows="2"
            /></el-form-item>
          </template>
          <el-form-item label="本课教学材料" class="is-wide"
            ><MaterialUpload
              v-model="form.materials"
              :cohort-id="form.cohortId"
              @busy="uploading = $event" /></el-form-item></div
        ><el-alert
          title="系统同时检查教师、教室和班级时段重叠，调整时间后可再次保存。"
          type="info"
          :closable="false"
          show-icon /></el-form
      ><template #footer
        ><el-button @click="visible = false">关闭</el-button
        ><el-button
          type="primary"
          :loading="previewLoading"
          :disabled="uploading || saving"
          @click="save"
          >检查冲突与影响</el-button
        ></template
      ></el-drawer
    >
    <el-dialog
      v-model="previewOpen"
      title="确认本次排课影响"
      width="min(760px,96vw)"
      :close-on-click-modal="false"
      :close-on-press-escape="!saving"
      :show-close="!saving"
    >
      <template v-if="schedulePreview">
        <el-alert
          :type="schedulePreview.canSave ? 'success' : 'error'"
          :title="
            schedulePreview.canSave
              ? '当前检查未发现冲突，可核对后保存。'
              : '发现排课冲突，请返回调整。'
          "
          :closable="false"
          show-icon
        />
        <el-descriptions :column="1" border class="schedule-impact">
          <el-descriptions-item label="原上课时间">{{
            schedulePreview.before
              ? `${formatTime(schedulePreview.before.startTime)} — ${formatTime(schedulePreview.before.endTime)}`
              : '新安排的课次'
          }}</el-descriptions-item>
          <el-descriptions-item label="拟调整时间"
            >{{ formatTime(schedulePreview.proposed.startTime) }} —
            {{ formatTime(schedulePreview.proposed.endTime) }}</el-descriptions-item
          >
          <el-descriptions-item label="受影响学员"
            >{{ schedulePreview.affectedCount }} 位</el-descriptions-item
          >
          <el-descriptions-item label="服务器检查时间">{{
            formatTime(schedulePreview.checkedAt)
          }}</el-descriptions-item>
        </el-descriptions>
        <el-alert
          v-for="(conflict, index) in schedulePreview.conflicts"
          :key="index"
          :title="conflict.message"
          type="error"
          :closable="false"
          show-icon
          class="edu-error"
        />
        <el-table
          v-if="schedulePreview.affectedStudents?.length"
          :data="schedulePreview.affectedStudents"
        >
          <el-table-column prop="name" label="学员" />
          <el-table-column label="报名状态"
            ><template #default="{ row }"><EduStatus :value="row.status" /></template
          ></el-table-column>
          <el-table-column label="保存后通知"
            ><template #default="{ row }">{{
              row.willNotify ? '通知监护人' : '无需通知'
            }}</template></el-table-column
          >
        </el-table>
        <p class="edu-inline-note">检查结果反映当前安排；保存时系统会再次核验冲突和版本。</p>
      </template>
      <template #footer>
        <el-button :disabled="saving" @click="previewOpen = false">返回调整</el-button>
        <el-button
          type="primary"
          :disabled="!schedulePreview?.canSave"
          :loading="saving"
          @click="confirmSchedule"
          >确认并保存</el-button
        >
      </template>
    </el-dialog>
    <el-drawer
      v-model="attendanceOpen"
      :title="`记录出勤 · ${attendanceSession?.title || ''}`"
      size="min(760px,96vw)"
      :close-on-click-modal="false"
      ><el-alert
        v-if="attendanceError"
        :title="attendanceError"
        type="error"
        :closable="false"
        show-icon
        class="edu-error"
      /><p class="edu-description" style="margin-bottom: 20px"
        >{{ formatTime(attendanceSession?.startTime) }} · 只保存已选择状态的学员</p
      ><el-table v-loading="attendanceLoading" :data="roster"
        ><el-table-column prop="studentName" label="学员" min-width="100" /><el-table-column
          label="出勤状态"
          min-width="170"
          ><template #default="{ row }"
            ><el-select v-model="row.attendanceStatus" placeholder="尚未记录"
              ><el-option label="出勤" value="PRESENT" /><el-option
                label="缺勤"
                value="ABSENT" /><el-option
                label="已请假"
                value="EXCUSED" /></el-select></template></el-table-column
        ><el-table-column label="备注" min-width="180"
          ><template #default="{ row }"
            ><el-input v-model="row.note" placeholder="可选备注" /><div
              v-if="row.attendanceUpdateTime"
              class="edu-cell-meta"
              >已保存 {{ formatTime(row.attendanceUpdateTime) }}</div
            ></template
          ></el-table-column
        ></el-table
      ><template #footer
        ><el-button @click="attendanceOpen = false">关闭</el-button
        ><el-button type="primary" :loading="attendanceLoading" @click="saveAttendance"
          >保存出勤</el-button
        ></template
      ></el-drawer
    ></main
  >
</template>
<style scoped>
.schedule-impact {
  margin: 20px 0;
}
.calendar-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.session-calendar :deep(.el-calendar) {
  --el-calendar-cell-width: auto;
}
.session-calendar :deep(.el-calendar-day) {
  height: auto;
  min-height: 116px;
  padding: 8px;
}
.calendar-day {
  margin-bottom: 6px;
  color: #6e6e73;
}
.calendar-session {
  padding: 9px;
  margin: 6px 0;
  border-left: 3px solid #ff7a00;
  background: #fff6ed;
  border-radius: 6px;
  overflow-wrap: anywhere;
}
.calendar-time {
  font-size: 12px;
  font-weight: 700;
  color: #9c4400;
}
.calendar-title {
  margin: 5px 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
}
.calendar-meta {
  margin-bottom: 6px;
  font-size: 12px;
  color: #6e6e73;
  line-height: 1.4;
}
.calendar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 5px;
}
.calendar-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>
