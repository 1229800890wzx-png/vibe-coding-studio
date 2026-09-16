<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { eduApi, errorMessage, formatTime } from '@/api/edu'
import { useUserStore } from '@/store/modules/user'
import { hasPermission } from '@/directives/permission/hasPermi'
import EduHeader from '../edu/components/EduHeader.vue'
import EduStatus from '../edu/components/EduStatus.vue'
defineOptions({ name: 'Index' })
const user = useUserStore(),
  loading = ref(false),
  error = ref(''),
  data = ref<Record<string, any>>({})
const shortcuts = [
  {
    path: '/edu/submission',
    title: '批改作品',
    text: '给下一次尝试一点方向',
    permission: 'edu:submission:query'
  },
  {
    path: '/edu/session',
    title: '查看教学日程',
    text: '每节课都有准备',
    permission: 'edu:session:query'
  },
  {
    path: '/edu/course',
    title: '准备下一门好课',
    text: '把创作拆解成可实践的课时',
    permission: 'edu:course:query'
  },
  {
    path: '/edu/request',
    title: '处理请假与调班',
    text: '让安排及时回应变化',
    permission: 'edu:request:query'
  }
]
async function load() {
  loading.value = true
  error.value = ''
  try {
    data.value = await eduApi.dashboard()
  } catch (e) {
    error.value = errorMessage(e)
    data.value = {}
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
<template>
  <main class="edu-page" v-loading="loading"
    ><EduHeader
      :title="`${user.user.nickname || '老师'}，今天也一起创造。`"
      description="从一节准备充分的课，到一句具体的反馈，让孩子的好奇心有地方继续生长。"
      eyebrow="VIBE CODING / TEACHING WORKBENCH"
      ><el-button @click="load">刷新工作台</el-button></EduHeader
    ><el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
      class="edu-error"
    /><div class="edu-stat-grid"
      ><article
        v-for="stat in [
          { key: 'todaySessions', label: '今日课次', unit: '次相遇' },
          { key: 'pendingReviews', label: '待批改作品', unit: '份新尝试' },
          { key: 'activeStudents', label: '在学学员', unit: '位创造者' },
          { key: 'openCohorts', label: '开放报名班级', unit: '个学习小组' }
        ]"
        :key="stat.key"
        class="edu-stat"
        ><span>{{ stat.label }}</span
        ><strong>{{ data[stat.key] ?? '—' }}</strong
        ><span>{{ stat.unit }}</span></article
      ></div
    ><div class="edu-review-grid"
      ><section class="edu-card"
        ><div class="edu-lesson-heading"
          ><h2 style="margin: 0">接下来，课堂见</h2
          ><router-link to="/edu/session" class="edu-action-link">完整日程 →</router-link></div
        ><el-table :data="data.upcomingSessions || []" empty-text="暂无近期课次"
          ><el-table-column label="课次" min-width="180"
            ><template #default="{ row }"
              ><div class="edu-cell-title">{{ row.title }}</div
              ><div class="edu-cell-meta">{{ row.cohortName }}</div></template
            ></el-table-column
          ><el-table-column label="时间" min-width="145"
            ><template #default="{ row }">{{
              formatTime(row.startTime)
            }}</template></el-table-column
          ><el-table-column label="状态" width="100"
            ><template #default="{ row }"
              ><EduStatus :value="row.status" /></template></el-table-column></el-table></section
      ><section class="edu-card"
        ><h2>开始一件重要的小事</h2
        ><template v-for="(item, index) in shortcuts" :key="item.path"
          ><router-link
            v-if="hasPermission([item.permission])"
            :to="item.path"
            class="edu-workbench-shortcut"
            ><span class="edu-shortcut-number">0{{ index + 1 }}</span
            ><span
              ><strong>{{ item.title }}</strong
              ><small>{{ item.text }}</small></span
            ><span aria-hidden="true">↗</span></router-link
          ></template
        ><p class="edu-inline-note" style="margin-top: 20px"
          >工作台数据按当前账号的授课班级与校区范围展示。</p
        ></section
      ></div
    ></main
  >
</template>
<style scoped>
.edu-workbench-shortcut {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 17px 0;
  text-decoration: none;
  color: #1d1d1f;
  border-bottom: 1px solid #ededf0;
}
.edu-shortcut-number {
  font-size: 12px;
  color: #a94d00;
  font-weight: 700;
}
.edu-workbench-shortcut strong {
  font-size: 14px;
  display: block;
}
.edu-workbench-shortcut small {
  display: block;
  margin-top: 5px;
  color: #77777d;
}
.edu-workbench-shortcut > span:last-child {
  margin-left: auto;
  color: #a94d00;
}
.edu-workbench-shortcut:hover strong {
  color: #a94d00;
}
</style>
