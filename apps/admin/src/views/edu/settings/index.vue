<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/config/axios'
import { errorMessage } from '@/api/edu'
import { brand } from '@/api/edu/brand'
import EduHeader from '../components/EduHeader.vue'

defineOptions({ name: 'EduSettings' })
const values = reactive<Record<string, string>>({})
const revision = ref(''),
  baseline = ref(''),
  loading = ref(false),
  saving = ref(false),
  error = ref('')
const dirty = computed(() => baseline.value !== '' && JSON.stringify(values) !== baseline.value)
const fields = [
  { key: 'brandName', label: '品牌名称', required: true, max: 60 },
  { key: 'tagline', label: '品牌说明', max: 100 },
  { key: 'logoUrl', label: '品牌标志地址', hint: '已发布图片的 HTTPS 地址。留空使用默认标志。' },
  { key: 'supportPhone', label: '联系电话', max: 30 },
  { key: 'supportHours', label: '服务时间', max: 100 },
  {
    key: 'privacyUrl',
    label: '隐私政策地址',
    hint: '机构确认后的 HTTPS 页面；微信使用前需配置业务域名。'
  },
  { key: 'termsUrl', label: '用户协议地址' },
  { key: 'heroTitle', label: '首页标题', required: true, multiline: true, max: 100 },
  { key: 'heroDescription', label: '首页介绍', multiline: true, max: 300 },
  { key: 'heroAction', label: '选课按钮文字', required: true, max: 40 }
]
function accept(data: { values: Record<string, string>; revision: string }) {
  Object.keys(values).forEach((key) => delete values[key])
  Object.assign(values, data.values)
  revision.value = data.revision
  baseline.value = JSON.stringify(values)
  Object.assign(brand, data.values)
}
async function load() {
  if (dirty.value && !(await discard())) return
  loading.value = true
  error.value = ''
  try {
    accept(await request.get({ url: '/edu/settings/get' }))
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
async function save() {
  error.value = ''
  if (fields.some((field) => field.required && !values[field.key]?.trim())) {
    error.value = '请填写品牌名称、首页标题和选课按钮文字。'
    return
  }
  saving.value = true
  try {
    accept(
      await request.post({
        url: '/edu/settings/save',
        data: { revision: revision.value, values: { ...values } }
      })
    )
    ElMessage.success('已保存。小程序下次打开首页时读取最新内容。')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    saving.value = false
  }
}
async function discard() {
  try {
    await ElMessageBox.confirm(
      '当前输入尚未保存。离开或重新读取会丢弃这些修改。',
      '保留当前修改？',
      { confirmButtonText: '丢弃修改并继续', cancelButtonText: '继续编辑', type: 'warning' }
    )
    return true
  } catch {
    return false
  }
}
onBeforeRouteLeave(async () => !dirty.value || (await discard()))
const beforeUnload = (event: BeforeUnloadEvent) => {
  if (dirty.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
onMounted(() => {
  window.addEventListener('beforeunload', beforeUnload)
  load()
})
onUnmounted(() => window.removeEventListener('beforeunload', beforeUnload))
</script>
<template>
  <main class="edu-page">
    <EduHeader
      title="让每一处展示，都属于你的品牌"
      description="维护家长看到的品牌、首页和联系方式。课程、师资与校区仍在对应页面审核发布。"
      eyebrow="品牌与首页 / BRAND STUDIO"
    />
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
      class="edu-error"
    />
    <div class="settings-grid" v-loading="loading">
      <section class="edu-card">
        <el-form label-position="top" @submit.prevent="save">
          <el-form-item
            v-for="field in fields"
            :key="field.key"
            :label="field.label"
            :required="field.required"
          >
            <el-input
              v-model="values[field.key]"
              :aria-label="field.label"
              :type="field.multiline ? 'textarea' : 'text'"
              :rows="3"
              :maxlength="field.max || 500"
              show-word-limit
            />
            <p v-if="field.hint" class="field-hint">{{ field.hint }}</p>
          </el-form-item>
          <div class="save-bar">
            <span role="status">{{
              dirty ? '有尚未保存的修改' : revision ? '与服务器保存内容一致' : '等待读取配置'
            }}</span>
            <el-button :disabled="saving" @click="load">重新读取</el-button>
            <el-button
              v-hasPermi="['edu:settings:update']"
              type="primary"
              native-type="submit"
              :loading="saving"
              :disabled="!dirty || !revision"
              >保存展示内容</el-button
            >
          </div>
        </el-form>
      </section>
      <aside class="edu-card preview" aria-label="品牌内容预览">
        <p class="edu-eyebrow">展示预览 · 尚未保存的修改也会显示</p>
        <div class="preview-brand"
          ><img v-if="values.logoUrl" :src="values.logoUrl" alt="品牌标志" /><span
            v-else
            class="logo"
            >v.</span
          ><strong>{{ values.brandName }}</strong></div
        >
        <p>{{ values.tagline }}</p>
        <h2>{{ values.heroTitle }}</h2>
        <p class="description">{{ values.heroDescription }}</p>
        <div class="preview-button">{{ values.heroAction }}</div>
        <p class="field-hint"
          >{{ values.supportHours }}<br />{{ values.supportPhone || '联系电话尚未配置' }}</p
        >
      </aside>
    </div>
  </main>
</template>
<style scoped>
.settings-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  gap: 24px;
  align-items: start;
}
.field-hint {
  color: #6e6e73;
  font-size: 14px;
  line-height: 1.6;
  margin: 8px 0 0;
}
.save-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.save-bar span {
  flex: 1;
  font-size: 14px;
  color: #6e6e73;
}
.preview {
  position: sticky;
  top: 90px;
}
.preview-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  overflow-wrap: anywhere;
}
.preview-brand img,
.logo {
  width: 44px;
  height: 44px;
  flex: none;
  object-fit: contain;
}
.logo {
  display: grid;
  place-items: center;
  font-size: 30px;
  background: #ff7a00;
  border-radius: 12px;
}
.preview h2 {
  font-size: 28px;
  line-height: 1.4;
  white-space: pre-line;
}
.description {
  color: #6e6e73;
  line-height: 1.8;
  white-space: pre-line;
}
.preview-button {
  background: #ff7a00;
  color: #1d1d1f;
  border-radius: 12px;
  padding: 16px;
  font-weight: 600;
  text-align: center;
}
@media (max-width: 1100px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
  .preview {
    position: static;
  }
}
</style>
