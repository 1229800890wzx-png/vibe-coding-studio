<template>
  <div class="admission-page">
    <div class="heading"
      ><div
        ><h1>招生与一对一预约</h1
        ><p>查看学习目标、意向老师和期望时间，沿用原负责人权限跟进家长需求。</p></div
      ><el-button v-if="canConfigure" @click="openOwner">配置受理人</el-button></div
    >
    <ContentWrap>
      <el-form inline @submit.prevent="search">
        <el-form-item label="查找"
          ><el-input
            v-model="query.name"
            clearable
            placeholder="家长、孩子或线索名称"
            @keyup.enter="search"
        /></el-form-item>
        <el-form-item label="跟进"
          ><el-select v-model="query.followUpStatus" clearable style="width: 140px"
            ><el-option :value="false" label="待联系" /><el-option
              :value="true"
              label="已跟进" /></el-select
        ></el-form-item>
        <el-form-item label="服务"
          ><el-select
            v-model="query.educationServiceType"
            clearable
            placeholder="全部服务"
            style="width: 160px"
            ><el-option value="ONE_TO_ONE" label="一对一高级课" /><el-option
              value="COURSE"
              label="课程咨询" /></el-select
        ></el-form-item>
        <el-form-item label="来源"
          ><el-select
            v-model="query.educationOrigin"
            clearable
            placeholder="全部来源"
            style="width: 140px"
            ><el-option value="WEBSITE" label="官网咨询" /><el-option
              value="MINIAPP"
              label="小程序" /></el-select
        ></el-form-item>
        <el-button type="primary" @click="search">查询</el-button
        ><el-button @click="router.push('/edu/admission-clues')">原 CRM 线索</el-button>
      </el-form>
      <el-alert v-if="error" :title="error" type="error" show-icon :closable="false"
        ><el-button link @click="load">重试</el-button></el-alert
      >
      <el-table
        v-loading="loading"
        :data="rows"
        empty-text="当前权限范围内暂无教育咨询"
        @row-dblclick="open"
      >
        <el-table-column label="咨询" prop="name" min-width="240"
          ><template #default="{ row }"
            ><el-button link type="primary" @click="open(row)">{{ row.name }}</el-button></template
          ></el-table-column
        >
        <el-table-column label="服务类型" width="135"
          ><template #default="{ row }"
            ><el-tag :type="row.educationServiceType === 'ONE_TO_ONE' ? 'warning' : 'info'">{{
              row.educationServiceType === 'ONE_TO_ONE' ? '一对一高级课' : '课程咨询'
            }}</el-tag></template
          ></el-table-column
        >
        <el-table-column label="来源" width="105"
          ><template #default="{ row }">{{ originLabel(row) }}</template></el-table-column
        >
        <el-table-column label="意向老师 / 期望时间" min-width="210"
          ><template #default="{ row }"
            ><template v-if="row.educationServiceType === 'ONE_TO_ONE'"
              ><div>{{ row.educationTeacherName || '—' }}</div
              ><div class="muted">{{
                row.educationPreferredStartTime
                  ? formatDate(row.educationPreferredStartTime)
                  : '未填写'
              }}</div></template
            ><span v-else>—</span></template
          ></el-table-column
        >
        <el-table-column label="联系手机" prop="mobile" width="145" />
        <el-table-column label="负责人" prop="ownerUserName" width="130" />
        <el-table-column label="状态" width="110"
          ><template #default="{ row }"
            ><el-tag
              :type="
                row.educationAppointmentStatus === 'CANCELLED'
                  ? 'info'
                  : row.followUpStatus
                    ? 'success'
                    : 'warning'
              "
              >{{
                row.educationAppointmentStatus === 'CANCELLED'
                  ? '预约已撤回'
                  : row.followUpStatus
                    ? '已跟进'
                    : '待联系'
              }}</el-tag
            ></template
          ></el-table-column
        >
        <el-table-column label="下次联系" width="180"
          ><template #default="{ row }">{{
            row.contactNextTime ? formatDate(row.contactNextTime) : '未安排'
          }}</template></el-table-column
        >
        <el-table-column
          label="最近跟进"
          prop="contactLastContent"
          min-width="200"
          show-overflow-tooltip
        />
      </el-table>
      <Pagination
        v-model:page="query.pageNo"
        v-model:limit="query.pageSize"
        :total="total"
        @pagination="load"
      />
    </ContentWrap>
    <el-drawer v-model="drawer" title="咨询与预约跟进" size="min(900px, 96vw)" @closed="load">
      <el-alert v-if="detailError" :title="detailError" type="error" :closable="false" />
      <div v-loading="detailLoading" v-if="selected">
        <h2>{{ selected.name }}</h2>
        <el-alert
          v-if="selected.educationServiceType === 'ONE_TO_ONE'"
          :title="
            selected.educationAppointmentStatus === 'CANCELLED'
              ? '家长已撤回此预约申请，请保留处理记录。'
              : '家长选择的老师和时间仅为预约意向，尚未锁定日程或完成报名。请沟通方案及报价后，在原班期与订单中办理。'
          "
          type="info"
          :closable="false"
          show-icon
          class="appointment-note"
        />
        <el-descriptions :column="2" border>
          <el-descriptions-item label="咨询来源">{{ originLabel(selected) }}</el-descriptions-item>
          <template v-if="selected.educationServiceType === 'ONE_TO_ONE'"
            ><el-descriptions-item label="意向老师">{{
              selected.educationTeacherName
            }}</el-descriptions-item
            ><el-descriptions-item label="预约状态">{{
              selected.educationAppointmentStatus === 'CANCELLED' ? '已撤回' : '待沟通确认'
            }}</el-descriptions-item
            ><el-descriptions-item label="期望时间（北京时间）" :span="2"
              >{{ formatDate(selected.educationPreferredStartTime) }} 至
              {{ formatDate(selected.educationPreferredEndTime) }}</el-descriptions-item
            ></template
          >
          <el-descriptions-item label="联系手机">{{
            selected.mobile || '未填写'
          }}</el-descriptions-item
          ><el-descriptions-item label="负责人">{{ selected.ownerUserName }}</el-descriptions-item>
          <el-descriptions-item label="联系授权">{{
            selected.educationConsentTime
              ? formatDate(selected.educationConsentTime)
              : '原 CRM 手工线索'
          }}</el-descriptions-item
          ><el-descriptions-item label="授权版本">{{
            selected.educationConsentVersion || '—'
          }}</el-descriptions-item>
          <el-descriptions-item label="咨询内容" :span="2">{{
            selected.remark || '未补充'
          }}</el-descriptions-item>
        </el-descriptions>
        <div class="actions"
          ><el-button v-hasPermi="['crm:clue:update']" @click="transferRef?.open(selected.id)"
            >转移负责人</el-button
          ><el-button @click="router.push({ name: 'CrmClueDetail', params: { id: selected.id } })"
            >完整 CRM 记录</el-button
          ></div
        >
        <template v-if="!isWebsiteGuest(selected)">
          <h3>关联试听</h3>
          <el-table :data="linkedTrials" empty-text="家长尚未关联试听预约">
            <el-table-column label="班期" prop="cohortName" />
            <el-table-column label="预约状态">
              <template #default="{ row }">{{ trialStatuses[row.status] || row.status }}</template>
            </el-table-column>
          </el-table>
        </template>
        <h3>跟进记录</h3
        ><FollowUpList :key="selected.id" :biz-id="selected.id" :biz-type="BizTypeEnum.CRM_CLUE" />
      </div>
    </el-drawer>
    <TransferForm ref="transferRef" :biz-type="BizTypeEnum.CRM_CLUE" @success="afterTransfer" />
    <Dialog v-model="ownerDialog" title="配置咨询受理人" width="480px">
      <p>新咨询将由此原系统账号负责，后续可按原 CRM 权限转移。</p>
      <el-select
        v-model="ownerUserId"
        filterable
        placeholder="选择已启用的原系统账号"
        style="width: 100%"
        ><el-option v-for="user in users" :key="user.id" :label="user.nickname" :value="user.id"
      /></el-select>
      <template #footer
        ><el-button @click="ownerDialog = false">取消</el-button
        ><el-button
          type="primary"
          :loading="ownerSaving"
          :disabled="!ownerUserId"
          @click="saveOwner"
          >保存受理人</el-button
        ></template
      >
    </Dialog>
  </div>
</template>
<script setup lang="ts">
import * as ClueApi from '@/api/crm/clue'
import * as ConfigApi from '@/api/infra/config'
import * as UserApi from '@/api/system/user'
import request from '@/config/axios'
import FollowUpList from '@/views/crm/followup/index.vue'
import TransferForm from '@/views/crm/permission/components/TransferForm.vue'
import { BizTypeEnum } from '@/api/crm/permission'
import { formatDate } from '@/utils/formatTime'
import { checkPermi } from '@/utils/permission'
defineOptions({ name: 'EduAdmission' })
const router = useRouter(),
  message = useMessage()
const queryKey = 'edu-admission-filters'
const query = reactive({
  pageNo: 1,
  pageSize: 20,
  educationOnly: true,
  name: '',
  followUpStatus: undefined as boolean | undefined,
  educationServiceType: undefined as string | undefined,
  educationOrigin: undefined as string | undefined
})
try {
  const saved = JSON.parse(sessionStorage.getItem(queryKey) || '{}')
  for (const key of [
    'pageNo',
    'pageSize',
    'name',
    'followUpStatus',
    'educationServiceType',
    'educationOrigin'
  ])
    if (saved[key] !== undefined) query[key] = saved[key]
} catch {
  /* Use defaults when local preferences are unavailable. */
}
let loadSequence = 0,
  detailSequence = 0
const rows = ref<ClueApi.ClueVO[]>([]),
  total = ref(0),
  loading = ref(false),
  error = ref('')
const drawer = ref(false),
  selected = ref<ClueApi.ClueVO | null>(null),
  detailLoading = ref(false),
  detailError = ref(''),
  linkedTrials = ref<any[]>([])
const transferRef = ref<InstanceType<typeof TransferForm>>()
const trialStatuses: Record<string, string> = {
  CONFIRMED: '已预约',
  CANCELLED: '已取消',
  COMPLETED: '已完成'
}
function isWebsiteGuest(row: any) {
  return row?.educationOrigin === 'WEBSITE' && !row?.educationMemberId && !row?.educationStudentId
}
function originLabel(row: any) {
  if (row?.educationOrigin === 'WEBSITE') return '官网咨询'
  if (row?.educationOrigin === 'MINIAPP') return '小程序'
  return '原 CRM'
}
async function load() {
  const sequence = ++loadSequence
  loading.value = true
  error.value = ''
  try {
    sessionStorage.setItem(queryKey, JSON.stringify(query))
  } catch {
    /* Loading does not depend on browser storage. */
  }
  try {
    const data = await ClueApi.getCluePage({ ...query })
    if (sequence === loadSequence) {
      rows.value = data.list
      total.value = data.total
    }
  } catch (e: any) {
    if (sequence === loadSequence) error.value = e?.message || '咨询列表加载失败'
  } finally {
    if (sequence === loadSequence) loading.value = false
  }
}
function search() {
  query.pageNo = 1
  load()
}
async function open(row: ClueApi.ClueVO) {
  const sequence = ++detailSequence
  drawer.value = true
  selected.value = row
  linkedTrials.value = []
  detailLoading.value = true
  detailError.value = ''
  try {
    const [detail, clue] = await Promise.all([
      request.get({ url: '/edu/admission/get', params: { id: row.id } }),
      ClueApi.getClue(row.id)
    ])
    if (sequence === detailSequence) {
      selected.value = clue
      linkedTrials.value = detail.trials
    }
  } catch (e: any) {
    if (sequence === detailSequence) {
      selected.value = null
      detailError.value = e?.message || '没有读取此咨询的权限'
    }
  } finally {
    if (sequence === detailSequence) detailLoading.value = false
  }
}
function afterTransfer() {
  drawer.value = false
  selected.value = null
  load()
}
const canConfigure = computed(
  () =>
    checkPermi(['infra:config:query']) &&
    checkPermi(['infra:config:update']) &&
    checkPermi(['infra:config:create'])
)
const ownerDialog = ref(false),
  ownerSaving = ref(false),
  ownerUserId = ref<number>(),
  users = ref<UserApi.UserVO[]>([]),
  ownerConfig = ref<ConfigApi.ConfigVO | null>(null)
const ownerKey = 'edu.admission.owner-user-id'
async function openOwner() {
  const [accounts, configs] = await Promise.all([
    UserApi.getSimpleUserList(),
    ConfigApi.getConfigPage({ pageNo: 1, pageSize: 100, key: ownerKey } as any)
  ])
  users.value = accounts.filter((user) => user.status === undefined || user.status === 0)
  ownerConfig.value = configs.list.find((config) => config.key === ownerKey) || null
  ownerUserId.value = Number(ownerConfig.value?.value) || undefined
  ownerDialog.value = true
}
async function saveOwner() {
  if (!ownerUserId.value) return
  ownerSaving.value = true
  try {
    const data = {
      ...(ownerConfig.value || {}),
      category: '教育招生',
      name: '课程咨询受理人',
      key: ownerKey,
      value: String(ownerUserId.value),
      visible: false,
      remark: '原系统员工ID；咨询创建原CRM线索及负责人权限'
    } as ConfigApi.ConfigVO
    if (data.id) await ConfigApi.updateConfig(data)
    else await ConfigApi.createConfig(data)
    ownerDialog.value = false
    message.success('咨询受理人已保存')
  } finally {
    ownerSaving.value = false
  }
}
onMounted(load)
</script>
<style scoped>
.heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}
.heading h1 {
  font-size: 24px;
  margin: 0 0 8px;
}
.heading p {
  color: #666;
  margin: 0;
}
.actions {
  display: flex;
  gap: 12px;
  margin: 20px 0;
}
h3 {
  margin: 24px 0 12px;
}
.appointment-note {
  margin-bottom: 18px;
}
.muted {
  color: #6e6e73;
  font-size: 13px;
}
</style>
