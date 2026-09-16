<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { eduApi, errorMessage, type Course, type Lesson, type EduRecord } from '@/api/edu'
import { useEduPage } from '../components/useEduPage'
import EduHeader from '../components/EduHeader.vue'
import EduStatus from '../components/EduStatus.vue'
defineOptions({ name: 'EduCourse' })
const directions = [
  { value: 'GAME', label: '游戏与模组' },
  { value: 'STORY', label: '互动故事' },
  { value: 'WEB', label: '个人网站' },
  { value: 'TOOL', label: '实用工具' },
  { value: 'AI', label: '人工智能创作' },
  { value: 'PRODUCT', label: '综合产品项目' }
]
const directionLabel = (value?: string) =>
  directions.find((item) => item.value === value?.toUpperCase())?.label || value || '—'
const versionLabel = (version?: number) => (version ? `v${version}` : '未发布')
const { query, rows, total, loading, error, load, search, reset } = useEduPage('course')
const visible = ref(false),
  saving = ref(false),
  formError = ref(''),
  formRef = ref<FormInstance>()
const form = reactive<any>({})
const blankLesson = (sort: number): Lesson => ({
  title: '',
  sort,
  durationMinutes: 90,
  objectives: '',
  materials: '',
  assignment: ''
})
const validation = computed(() => {
  const issues: string[] = []
  if (!form.name?.trim()) issues.push('填写课程名称')
  if (!form.description?.trim()) issues.push('填写课程介绍')
  if (!form.lessons?.length) issues.push('至少添加一节课')
  if (form.ageMax < form.ageMin) issues.push('年龄上限不能小于下限')
  form.lessons?.forEach((lesson: Lesson, i: number) => {
    if (
      !lesson.title?.trim() ||
      !lesson.objectives?.trim() ||
      !lesson.materials?.trim() ||
      !lesson.assignment?.trim()
    )
      issues.push(`第 ${i + 1} 课需补齐标题、目标、材料和作业`)
  })
  return issues
})
async function edit(row?: EduRecord) {
  formError.value = ''
  let data: any = {
    name: '',
    code: '',
    description: '',
    ageMin: 8,
    ageMax: 14,
    direction: 'GAME',
    level: 'BEGINNER',
    objectives: '',
    outcomes: '',
    version: 0,
    status: 'DRAFT',
    lessons: [blankLesson(1)]
  }
  if (row) {
    try {
      data = await eduApi.get<Course>('course', row.id)
    } catch (e) {
      error.value = errorMessage(e)
      return
    }
  }
  Object.keys(form).forEach((key) => delete form[key])
  Object.assign(form, data, {
    direction: data.direction?.toUpperCase(),
    lessons: data.lessons || []
  })
  visible.value = true
}
function moveLesson(index: number, direction: number) {
  const other = index + direction
  if (other < 0 || other >= form.lessons.length) return
  ;[form.lessons[index], form.lessons[other]] = [form.lessons[other], form.lessons[index]]
  form.lessons.forEach((lesson: Lesson, i: number) => (lesson.sort = i + 1))
}
async function save() {
  if (!(await formRef.value?.validate().catch(() => false))) return
  if (form.ageMax < form.ageMin) {
    formError.value = '年龄上限不能小于年龄下限。'
    return
  }
  saving.value = true
  formError.value = ''
  try {
    const data = {
      ...form,
      lessons: form.lessons.map((lesson: Lesson, index: number) => ({ ...lesson, sort: index + 1 }))
    }
    if (form.id) await eduApi.update('course', data)
    else await eduApi.create('course', data)
    ElMessage.success('课程草稿已保存')
    visible.value = false
    await load()
  } catch (e) {
    formError.value = errorMessage(e)
  } finally {
    saving.value = false
  }
}
async function publish(row: EduRecord) {
  try {
    await ElMessageBox.confirm(
      `发布「${row.name}」？系统将检查课时内容与版本完整性，已报名班级保留所绑定版本。`,
      '发布课程',
      { confirmButtonText: '校验并发布', cancelButtonText: '继续编辑' }
    )
    await eduApi.action('course', 'publish', {
      id: row.id,
      version: row.version,
      revision: row.revision
    })
    ElMessage.success('课程已发布')
    await load()
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') error.value = errorMessage(e)
  }
}
</script>
<template>
  <main class="edu-page">
    <EduHeader
      title="把灵感变成一门好课"
      description="从课程版本到每节课的目标、材料与作业。发布前完成校验，班级始终绑定确定的教学版本。"
      eyebrow="课程中心 / COURSE STUDIO"
      ><el-button v-hasPermi="['edu:course:create']" type="primary" @click="edit()"
        >＋ 新建课程草稿</el-button
      ></EduHeader
    >
    <section class="edu-card">
      <form class="edu-filters" @submit.prevent="search"
        ><el-input
          v-model="query.keyword"
          placeholder="搜索课程名称或编号"
          aria-label="搜索课程"
          clearable
        /><el-select v-model="query.status" placeholder="全部状态" clearable aria-label="课程状态"
          ><el-option label="草稿" value="DRAFT" /><el-option
            label="已发布"
            value="PUBLISHED" /><el-option label="已归档" value="ARCHIVED" /></el-select
        ><el-button type="primary" native-type="submit">查询</el-button
        ><el-button @click="reset">重置</el-button></form
      >
      <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        :closable="false"
        class="edu-error"
      />
      <el-table
        v-loading="loading"
        :data="rows"
        row-key="id"
        empty-text="暂无课程，创建第一个草稿开始备课"
      >
        <el-table-column label="课程" min-width="260"
          ><template #default="{ row }"
            ><div class="edu-cell-title">{{ row.name }}</div
            ><div class="edu-cell-meta"
              >{{ row.code || '未设置编号' }} · {{ row.ageMin }}–{{ row.ageMax }} 岁</div
            ></template
          ></el-table-column
        >
        <el-table-column label="创作方向" min-width="120"
          ><template #default="{ row }">{{
            directionLabel(row.direction)
          }}</template></el-table-column
        ><el-table-column label="当前版本" width="110"
          ><template #default="{ row }">{{ versionLabel(row.version) }}</template></el-table-column
        ><el-table-column label="状态" width="110"
          ><template #default="{ row }"><EduStatus :value="row.status" /></template
        ></el-table-column>
        <el-table-column label="操作" width="190" fixed="right"
          ><template #default="{ row }"
            ><el-button v-hasPermi="['edu:course:update']" link type="primary" @click="edit(row)"
              >编辑课时</el-button
            ><el-button
              v-if="row.status === 'DRAFT'"
              v-hasPermi="['edu:course:publish']"
              link
              type="primary"
              @click="publish(row)"
              >校验发布</el-button
            ></template
          ></el-table-column
        > </el-table
      ><el-pagination
        v-model:current-page="query.pageNo"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @change="load"
      />
    </section>
    <el-drawer
      v-model="visible"
      :title="form.id ? `编辑课程 · ${versionLabel(form.version)}` : '新建课程草稿'"
      size="min(880px, 96vw)"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="edu-drawer-body"
        ><el-alert
          v-if="formError"
          :title="formError"
          type="error"
          :closable="false"
          show-icon
          class="edu-error"
        />
        <el-form
          ref="formRef"
          :model="form"
          label-position="top"
          :rules="{
            name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
            code: [{ required: true, message: '请输入唯一课程编号', trigger: 'blur' }]
          }"
        >
          <div class="edu-form-grid"
            ><el-form-item label="课程名称" prop="name"
              ><el-input v-model="form.name" maxlength="100" /></el-form-item
            ><el-form-item label="课程编号" prop="code"
              ><el-input
                v-model="form.code"
                maxlength="50"
                placeholder="例如 VC-GAME-01" /></el-form-item
            ><el-form-item label="适合年龄下限"
              ><el-input-number v-model="form.ageMin" :min="4" :max="18" /></el-form-item
            ><el-form-item label="适合年龄上限"
              ><el-input-number v-model="form.ageMax" :min="4" :max="18" /></el-form-item
            ><el-form-item label="创作方向"
              ><el-select v-model="form.direction"
                ><el-option
                  v-for="item in directions"
                  :key="item.value"
                  :value="item.value"
                  :label="item.label" /></el-select></el-form-item
            ><el-form-item label="学习级别"
              ><el-select v-model="form.level"
                ><el-option value="BEGINNER" label="零基础" /><el-option
                  value="INTERMEDIATE"
                  label="已有基础" /><el-option
                  value="ADVANCED"
                  label="进阶创作" /></el-select></el-form-item
            ><el-form-item label="课程介绍" class="is-wide"
              ><el-input
                v-model="form.description"
                type="textarea"
                :rows="3"
                maxlength="3000"
                show-word-limit /></el-form-item
            ><el-form-item label="学习目标"
              ><el-input v-model="form.objectives" type="textarea" :rows="3" /></el-form-item
            ><el-form-item label="可带走的作品与能力"
              ><el-input v-model="form.outcomes" type="textarea" :rows="3" /></el-form-item
          ></div>
          <div class="edu-lesson-heading"
            ><h2>课时与教学设计</h2
            ><el-button @click="form.lessons.push(blankLesson(form.lessons.length + 1))"
              >＋ 添加课时</el-button
            ></div
          >
          <section
            v-for="(lesson, index) in form.lessons"
            :key="lesson.id || index"
            class="edu-lesson"
            ><div class="edu-lesson-heading"
              ><strong>LESSON {{ String(Number(index) + 1).padStart(2, '0') }}</strong
              ><div
                ><el-button
                  text
                  :disabled="index === 0"
                  aria-label="课时上移"
                  @click="moveLesson(Number(index), -1)"
                  >↑</el-button
                ><el-button
                  text
                  :disabled="index === form.lessons.length - 1"
                  aria-label="课时下移"
                  @click="moveLesson(Number(index), 1)"
                  >↓</el-button
                ><el-button text type="danger" @click="form.lessons.splice(index, 1)"
                  >移除</el-button
                ></div
              ></div
            ><div class="edu-form-grid"
              ><el-form-item label="课时标题"><el-input v-model="lesson.title" /></el-form-item
              ><el-form-item label="时长（分钟）"
                ><el-input-number
                  v-model="lesson.durationMinutes"
                  :min="15"
                  :max="240"
                  :step="15" /></el-form-item
              ><el-form-item label="本课目标" class="is-wide"
                ><el-input v-model="lesson.objectives" type="textarea" :rows="2" /></el-form-item
              ><el-form-item label="教学材料"
                ><el-input
                  v-model="lesson.materials"
                  type="textarea"
                  :rows="3"
                  placeholder="材料说明或已登记的教学资源编号" /></el-form-item
              ><el-form-item label="课后创作任务"
                ><el-input
                  v-model="lesson.assignment"
                  type="textarea"
                  :rows="3"
                  placeholder="任务、验收方式与提交要求" /></el-form-item></div
          ></section>
          <el-alert
            :title="
              validation.length
                ? `发布前还需：${validation.join('；')}`
                : '内容完整。保存后可在课程列表发起发布校验。'
            "
            :type="validation.length ? 'warning' : 'success'"
            :closable="false"
            show-icon
          />
        </el-form> </div
      ><template #footer
        ><el-button @click="visible = false">关闭</el-button
        ><el-button type="primary" :loading="saving" @click="save">保存草稿</el-button></template
      >
    </el-drawer>
  </main>
</template>
