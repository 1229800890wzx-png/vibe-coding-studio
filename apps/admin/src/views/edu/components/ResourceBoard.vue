<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import {
  eduApi,
  errorMessage,
  money,
  formatTime,
  statusLabels,
  type EduResource,
  type EduRecord
} from '@/api/edu'
import { useEduPage } from './useEduPage'
import EduHeader from './EduHeader.vue'
import EduStatus from './EduStatus.vue'
import ResourceSelect from './ResourceSelect.vue'
import MaterialUpload from './MaterialUpload.vue'
export interface Field {
  key: string
  label: string
  kind?:
    | 'text'
    | 'textarea'
    | 'number'
    | 'date'
    | 'datetime'
    | 'select'
    | 'resource'
    | 'money'
    | 'materials'
    | 'switch'
  required?: boolean
  options?: { label: string; value: string }[]
  resource?: EduResource | 'system-user' | 'system-dept'
  wide?: boolean
  hint?: string
  min?: number
  filters?: (form: Record<string, any>) => Record<string, any>
}
export interface Column {
  key: string
  label: string
  kind?: 'status' | 'money' | 'time' | 'boolean'
  width?: number
}
export interface Action {
  key: string
  label: string
  permission?: string
  show?: (row: EduRecord) => boolean
  payload?: (row: EduRecord) => Record<string, any>
  prompt?: string
  confirm?: string
  danger?: boolean
}
const props = withDefaults(
  defineProps<{
    resource: EduResource
    title: string
    description: string
    fields?: Field[]
    columns: Column[]
    defaults?: Record<string, any>
    actions?: Action[]
    readonly?: boolean
    createLabel?: string
    detailOnly?: boolean
    intro?: string
  }>(),
  { fields: () => [], defaults: () => ({}), actions: () => [], readonly: false }
)
const { query, rows, total, loading, error, load, search, reset } = useEduPage(props.resource)
const visible = ref(false),
  saving = ref(false),
  uploading = ref(false),
  formError = ref(''),
  formRef = ref<FormInstance>()
const form = reactive<Record<string, any>>({})
function resourceChanged(field: Field) {
  if (field.key === 'cohortId') {
    if (props.fields.some((item) => item.key === 'materials')) form.materials = []
    if (props.fields.some((item) => item.key === 'sessionId')) form.sessionId = undefined
  }
}
const rules = computed(() =>
  Object.fromEntries(
    props.fields
      .filter((field) => field.required)
      .map((field) => [
        field.key,
        [{ required: true, message: `请填写${field.label}`, trigger: ['change', 'blur'] }]
      ])
  )
)
async function edit(row?: EduRecord) {
  formError.value = ''
  Object.keys(form).forEach((key) => delete form[key])
  Object.assign(form, props.defaults)
  if (row) {
    try {
      Object.assign(form, await eduApi.get(props.resource, row.id))
    } catch (e) {
      error.value = errorMessage(e)
      return
    }
  }
  for (const field of props.fields) {
    if (field.kind === 'money' && form[field.key] != null) form[field.key] /= 100
  }
  visible.value = true
}
async function save() {
  if (!(await formRef.value?.validate().catch(() => false))) return
  saving.value = true
  formError.value = ''
  try {
    const payload = { ...form }
    for (const field of props.fields) {
      if (field.kind === 'money' && payload[field.key] != null)
        payload[field.key] = Math.round(payload[field.key] * 100)
      if (field.kind === 'datetime' && payload[field.key])
        payload[field.key] = Number(payload[field.key])
    }
    if (form.id) await eduApi.update(props.resource, payload)
    else await eduApi.create(props.resource, payload)
    ElMessage.success('已保存')
    visible.value = false
    await load()
  } catch (e) {
    formError.value = errorMessage(e)
  } finally {
    saving.value = false
  }
}
async function runAction(action: Action, row: EduRecord) {
  let reason: string | undefined
  try {
    if (action.prompt) {
      const result = await ElMessageBox.prompt(action.prompt, action.label, {
        inputType: 'textarea',
        inputValidator: (value) => !!value?.trim() || '请填写处理说明',
        confirmButtonText: action.label,
        cancelButtonText: '取消'
      })
      reason = result.value
    } else
      await ElMessageBox.confirm(
        action.confirm || `确认${action.label}「${row.name || row.title || `#${row.id}`}」？`,
        action.label,
        {
          confirmButtonText: action.label,
          cancelButtonText: '取消',
          type: action.danger ? 'warning' : 'info'
        }
      )
    await eduApi.action(props.resource, action.key, {
      id: row.id,
      type: row.type,
      reason,
      ...(action.payload?.(row) || {}),
      ...(action.key === 'moderate' && reason ? { note: reason } : {})
    })
    ElMessage.success('处理成功')
    await load()
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') error.value = errorMessage(e)
  }
}
defineExpose({ load, rows, query })
</script>
<template>
  <main class="edu-page"
    ><EduHeader :title="title" :description="description"
      ><slot name="header"></slot><el-button
        v-if="!readonly"
        v-hasPermi="[`edu:${resource}:create`]"
        type="primary"
        @click="edit()"
        >＋ {{ createLabel || '新增' }}</el-button
      ></EduHeader
    ><el-alert
      v-if="intro"
      :title="intro"
      type="info"
      :closable="false"
      show-icon
      class="edu-error"
    /><section class="edu-card"
      ><form class="edu-filters" @submit.prevent="search"
        ><el-input
          v-model="query.keyword"
          placeholder="输入名称或编号搜索"
          clearable
          aria-label="关键词" /><el-select
          v-model="query.status"
          placeholder="全部状态"
          clearable
          aria-label="状态筛选"
          ><el-option
            v-for="value in [
              'DRAFT',
              'PUBLISHED',
              'OPEN',
              'ACTIVE',
              'PENDING',
              'APPROVED',
              'REJECTED',
              'CANCELLED',
              'COMPLETED',
              'PRIVATE'
            ]"
            :key="value"
            :label="statusLabels[value]"
            :value="value" /></el-select
        ><el-button native-type="submit" type="primary">查询</el-button
        ><el-button @click="reset">重置</el-button
        ><slot name="filters" :query="query" :search="search"></slot></form
      ><el-alert
        v-if="error"
        :title="error"
        type="error"
        :closable="false"
        show-icon
        class="edu-error" /><el-table
        v-loading="loading"
        :data="rows"
        row-key="id"
        empty-text="暂无符合条件的记录"
        ><el-table-column
          v-for="column in columns"
          :key="column.key"
          :prop="column.key"
          :label="column.label"
          :min-width="column.width || 130"
          :align="column.kind === 'money' ? 'right' : 'left'"
          ><template #default="{ row }"
            ><EduStatus v-if="column.kind === 'status'" :value="row[column.key]" /><template
              v-else-if="column.kind === 'money'"
              >{{ money(row[column.key]) }}</template
            ><template v-else-if="column.kind === 'time'">{{
              formatTime(row[column.key])
            }}</template
            ><template v-else-if="column.kind === 'boolean'">{{
              row[column.key] ? '已开放' : '未开放'
            }}</template
            ><template v-else>{{
              statusLabels[row[column.key]] || row[column.key] || '—'
            }}</template></template
          ></el-table-column
        ><el-table-column
          v-if="!readonly || actions.length || detailOnly"
          label="操作"
          min-width="200"
          fixed="right"
          ><template #default="{ row }"
            ><el-button
              v-if="!readonly || detailOnly"
              v-hasPermi="[`edu:${resource}:${detailOnly ? 'query' : 'update'}`]"
              link
              type="primary"
              @click="edit(row)"
              >{{ detailOnly ? '查看档案' : '编辑' }}</el-button
            ><template v-for="action in actions" :key="action.label"
              ><el-button
                v-if="!action.show || action.show(row)"
                v-hasPermi="[action.permission || `edu:${resource}:${action.key}`]"
                link
                :type="action.danger ? 'danger' : 'primary'"
                @click="runAction(action, row)"
                >{{ action.label }}</el-button
              ></template
            ><slot
              name="actions"
              :row="row"
              :reload="load"></slot></template></el-table-column></el-table
      ><el-pagination
        v-model:current-page="query.pageNo"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @change="load" /></section
    ><slot></slot>
    <el-drawer
      v-model="visible"
      :title="detailOnly ? '学员档案' : `${form.id ? '编辑' : '新增'}${title}`"
      size="min(700px, 96vw)"
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
        :rules="rules"
        label-position="top"
        :disabled="detailOnly"
        ><div class="edu-form-grid"
          ><el-form-item
            v-for="field in fields"
            :key="field.key"
            :label="field.label"
            :prop="field.key"
            :class="{ 'is-wide': field.wide }"
            ><ResourceSelect
              v-if="field.kind === 'resource' && field.resource"
              v-model="form[field.key]"
              :resource="field.resource"
              :filters="field.filters?.(form)"
              @update:model-value="resourceChanged(field)"
            /><MaterialUpload
              v-else-if="field.kind === 'materials'"
              v-model="form[field.key]"
              :cohort-id="form.cohortId"
              @busy="uploading = $event"
            /><el-switch
              v-else-if="field.kind === 'switch'"
              v-model="form[field.key]"
              active-text="已开放"
              inactive-text="未开放"
            />
            <el-input-number
              v-else-if="field.kind === 'number' || field.kind === 'money'"
              v-model="form[field.key]"
              :min="field.min ?? 0"
              :precision="field.kind === 'money' ? 2 : 0"
            /><el-select v-else-if="field.kind === 'select'" v-model="form[field.key]"
              ><el-option
                v-for="option in field.options"
                :key="option.value"
                :value="option.value"
                :label="option.label" /></el-select
            ><el-date-picker
              v-else-if="field.kind === 'datetime' || field.kind === 'date'"
              v-model="form[field.key]"
              :type="field.kind === 'date' ? 'date' : 'datetime'"
              :value-format="field.kind === 'date' ? 'YYYY-MM-DD' : 'x'"
            /><el-input
              v-else
              v-model="form[field.key]"
              :type="field.kind === 'textarea' ? 'textarea' : 'text'"
              :rows="4"
            /><p v-if="field.hint" class="edu-inline-note">{{ field.hint }}</p></el-form-item
          ></div
        ></el-form
      ><template #footer
        ><el-button @click="visible = false">关闭</el-button
        ><el-button
          v-if="!detailOnly"
          type="primary"
          :loading="saving"
          :disabled="uploading"
          @click="save"
          >保存</el-button
        ></template
      ></el-drawer
    ></main
  >
</template>
