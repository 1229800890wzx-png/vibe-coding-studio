<template>
  <EduHeader title="课程咨询" />
  <view class="edu-page">
    <view class="title">先聊聊孩子的想法。</view>
    <view class="subtitle">留下课程意向，招生老师会按你授权的联系方式跟进。</view>
    <EduState :loading="loading && !data" :error="error" @retry="refresh" />
    <template v-if="data && !error">
      <view v-if="!family.students.length" class="card stack"><view>先添加孩子，方便老师了解学习阶段。</view><button class="btn primary" @tap="go('children')">添加孩子</button></view>
      <view v-else-if="!data.options.enabled" class="card stack"><view class="strong">咨询受理暂未开通</view><view class="muted">请通过「我的」页已公布的服务电话联系。</view></view>
      <view v-else class="card stack">
        <view class="field-label">咨询的孩子</view>
        <picker :disabled="loading || busy" :range="family.students" range-key="name" :value="studentIndex" @change="changeStudent"><view class="field">{{ selectedStudent?.name || '选择孩子' }}<text>⌄</text></view></picker>
        <view class="field-label">意向课程</view>
        <picker :disabled="loading || busy" :range="courseOptions" range-key="name" :value="courseIndex" @change="changeCourse"><view class="field">{{ courseOptions[courseIndex]?.name || '暂未确定' }}<text>⌄</text></view></picker>
        <view class="field-label">关联已有试听（可选）</view>
        <picker :disabled="loading || busy" :range="trialOptions" range-key="label" :value="trialIndex" @change="changeTrial"><view class="field">{{ trialOptions[trialIndex]?.label || '不关联' }}<text>⌄</text></view></picker>
        <view class="field-label">家长称呼</view><input v-model="form.contactName" class="field" maxlength="50" placeholder="老师如何称呼你" />
        <view class="field-label">联系手机</view><input v-model="form.mobile" class="field" type="number" maxlength="11" placeholder="用于本次课程咨询" />
        <view class="field-label">想了解什么</view><textarea v-model="form.message" class="field message" maxlength="1000" placeholder="例如课程难度、上课时间或试听安排" />
        <label class="consent row" @tap="form.contactConsent = !form.contactConsent"><view class="check" :class="{checked:form.contactConsent}">{{form.contactConsent?'✓':''}}</view><text>{{ data.options.consentText }}</text></label>
        <button class="btn primary" :disabled="loading || busy || !form.contactConsent" @tap="submit">{{busy?'正在提交…':loading?'正在更新…':'提交咨询'}}</button>
        <view v-if="actionError" class="error">{{actionError}}</view><view v-if="success" class="success">{{success}}</view>
      </view>
      <view class="section-title">我的咨询</view>
      <view v-if="!data.history.length" class="card muted">提交后，可以在这里查看受理与试听关联情况。</view>
      <view v-for="item in data.history" :key="item.id" class="card stack">
        <view class="row between history-heading"><text class="strong">{{item.name}}</text><text class="pill">{{item.followUpStatus?'已跟进':'待联系'}}</text></view>
        <view class="small muted">{{dateText(item.createTime)}}<text v-if="item.contactNextTime"> · 下次联系 {{dateText(item.contactNextTime)}}</text></view>
        <view v-for="trial in item.trials" :key="trial.id" class="muted">已关联：{{trial.cohortName}} · {{trialStatuses[trial.status]||trial.status}}</view>
      </view>
    </template>
  </view>
</template>
<script setup>
import {ref,reactive,computed} from 'vue';
import {onLoad,onShow} from '@dcloudio/uni-app';
import EduHeader from '@/components/edu/EduHeader.vue';
import EduState from '@/components/edu/EduState.vue';
import request from '@/sheep/request';
import {edu,listOf,unwrap} from '@/edu/api';
import {useResource} from '@/edu/resource';
import {family,loadStudents,requireLogin,go,dateText} from '@/edu/state';
defineOptions({inheritAttrs:false});
const form=reactive({studentId:0,courseId:null,trialBookingId:null,contactName:'',mobile:'',message:'',contactConsent:false});
const busy=ref(false),actionError=ref(''),success=ref('');
const trialStatuses={CONFIRMED:'已预约',CANCELLED:'已取消',COMPLETED:'已完成'};
const call=(path,method='GET',body)=>unwrap(request({url:'/edu/admission'+path,method,...(method==='GET'?{params:body}:{data:body}),custom:{auth:true,showLoading:false,showError:false}}));
const {data,loading,error,refresh}=useResource(async()=>{
  await loadStudents();if(!form.studentId)form.studentId=family.currentId||family.students[0]?.id||0;
  const [options,history,courses,trials]=await Promise.all([call('/options'),call('/list'),edu.courses({pageSize:100}),form.studentId?edu.trials(form.studentId):[]]);
  const courseList=listOf(courses);if(form.courseId&&!courseList.some(c=>c.id===form.courseId))courseList.push(await edu.course(form.courseId));
  return {options,history:listOf(history).filter(item=>item.serviceType!=='ONE_TO_ONE'),courses:courseList,trials:listOf(trials)};
});
const studentIndex=computed(()=>Math.max(0,family.students.findIndex(s=>s.id===form.studentId)));
const selectedStudent=computed(()=>family.students.find(s=>s.id===form.studentId));
const courseOptions=computed(()=>[{id:null,name:'暂未确定，想先听听建议'},...(data.value?.courses||[])]);
const courseIndex=computed(()=>Math.max(0,courseOptions.value.findIndex(c=>c.id===form.courseId)));
const trialOptions=computed(()=>[{id:null,label:'不关联'},...(data.value?.trials||[]).filter(t=>!form.courseId||t.courseId===form.courseId).map(t=>({...t,label:t.cohortName+' · '+(trialStatuses[t.status]||t.status)}))]);
const trialIndex=computed(()=>Math.max(0,trialOptions.value.findIndex(t=>t.id===form.trialBookingId)));
function changeStudent(event){form.studentId=family.students[Number(event.detail.value)]?.id;form.trialBookingId=null;form.contactConsent=false;refresh();}
function changeCourse(event){form.courseId=courseOptions.value[Number(event.detail.value)]?.id;form.trialBookingId=null;form.contactConsent=false;}
function changeTrial(event){const trial=trialOptions.value[Number(event.detail.value)];form.trialBookingId=trial?.id;if(trial?.courseId)form.courseId=trial.courseId;form.contactConsent=false;}
async function submit(){
  if(busy.value || loading.value)return;
  actionError.value='';success.value='';
  if(!selectedStudent.value)return actionError.value='请选择本次咨询的孩子';
  if(!form.contactName.trim()||!/^1[3-9]\d{9}$/.test(form.mobile))return actionError.value='请填写家长称呼和正确的手机号码';
  if(!form.contactConsent)return actionError.value='请确认本次咨询联系授权';
  busy.value=true;
  try{await call('/create','POST',{...form,consentVersion:data.value.options.consentVersion});form.contactConsent=false;success.value='咨询已提交，受理老师会与你联系。';await refresh();}
  catch(e){actionError.value=e.message;}finally{busy.value=false;}
}
onLoad(params=>{form.studentId=Number(params.studentId)||0;form.courseId=Number(params.courseId)||null;form.trialBookingId=Number(params.trialBookingId)||null;});
onShow(()=>{if(requireLogin())refresh();});
</script>
<style scoped>
.field{display:flex;align-items:center;justify-content:space-between;background:#f5f5f7;border-radius:12px;min-height:48px;padding:0 12px;box-sizing:border-box;width:100%}.field-label{font-size:14px;font-weight:600}.message{min-height:120px;padding:12px}.consent{align-items:flex-start;gap:12px;min-height:44px;font-size:14px;line-height:1.7}.check{flex:none;width:22px;height:22px;border:1px solid #aaa;border-radius:6px;text-align:center}.checked{background:#ff7a00;border-color:#ff7a00}.success{color:#206c42;font-size:14px}.section-title{margin:24px 0 12px}
.history-heading{align-items:flex-start;gap:12px}.history-heading .strong{min-width:0;flex:1}.history-heading .pill{flex:none;white-space:nowrap}
</style>
