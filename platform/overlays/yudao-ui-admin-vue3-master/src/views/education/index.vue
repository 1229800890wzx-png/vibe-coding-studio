<template>
  <ContentWrap title="官网运营">
    <ElAlert title="课程发布后会展示在官网；咨询信息仅授权管理员可见。" type="info" :closable="false" class="mb-4" />
    <ElTabs v-model="tab">
      <ElTabPane label="课程管理" name="courses">
        <ElButton type="primary" @click="editCourse()">新增课程</ElButton>
        <ElButton @click="load">刷新</ElButton>
        <ElTable :data="courses" v-loading="loading" class="mt-4">
          <ElTableColumn prop="title" label="课程名称" />
          <ElTableColumn label="发布状态"><template #default="{row}">{{ row.published ? '已发布' : '草稿' }}</template></ElTableColumn>
          <ElTableColumn prop="sortOrder" label="排序" />
          <ElTableColumn label="操作"><template #default="{row}"><ElButton link type="primary" @click="editCourse(row)">编辑</ElButton></template></ElTableColumn>
        </ElTable>
      </ElTabPane>
      <ElTabPane label="咨询跟进" name="inquiries">
        <p>显示最近 500 条咨询，联系方式仅用于已同意的课程沟通。</p>
        <ElButton @click="load">刷新咨询</ElButton>
        <ElTable :data="inquiries" v-loading="loading" class="mt-4" empty-text="暂无咨询">
          <ElTableColumn prop="name" label="称呼" width="110" />
          <ElTableColumn prop="contact" label="联系方式" min-width="180" />
          <ElTableColumn prop="interest" label="意向" />
          <ElTableColumn label="状态"><template #default="{row}">{{ statuses[row.status] }}</template></ElTableColumn>
          <ElTableColumn label="操作"><template #default="{row}"><ElButton link type="primary" @click="follow(row)">查看与跟进</ElButton></template></ElTableColumn>
        </ElTable>
      </ElTabPane>
    </ElTabs>
  </ContentWrap>
  <ElDialog v-model="courseOpen" title="编辑课程" width="min(640px, 95vw)">
    <ElForm label-position="top">
      <ElFormItem label="标识（小写英文、数字或连字符；创建后不要修改）"><ElInput v-model="form.id" :disabled="existing" maxlength="40" /></ElFormItem>
      <ElFormItem label="课程名称"><ElInput v-model="form.title" maxlength="80" /></ElFormItem>
      <ElFormItem label="简介"><ElInput v-model="form.description" type="textarea" maxlength="600" show-word-limit /></ElFormItem>
      <ElFormItem label="内容大纲（每行一项）"><ElInput v-model="form.outline" type="textarea" :rows="5" maxlength="2000" /></ElFormItem>
      <ElFormItem label="阶段"><ElSelect v-model="form.stage"><ElOption :value="1" label="初次接触"/><ElOption :value="2" label="动手创作"/><ElOption :value="3" label="持续进阶"/></ElSelect></ElFormItem>
      <ElFormItem label="封面素材"><ElSelect v-model="form.image"><ElOption value="minecraft" label="创意世界"/><ElOption value="museum" label="互动故事"/><ElOption value="notes" label="学习工具"/></ElSelect></ElFormItem>
      <ElFormItem label="排序"><ElInputNumber v-model="form.sortOrder" :min="0" :max="999"/></ElFormItem>
      <ElFormItem label="发布到官网"><ElSwitch v-model="form.published" /></ElFormItem>
    </ElForm>
    <template #footer><ElButton @click="courseOpen=false">取消</ElButton><ElButton type="primary" :loading="saving" @click="saveCourse">保存课程</ElButton></template>
  </ElDialog>
  <ElDialog v-model="inquiryOpen" title="咨询详情与跟进" width="min(640px,95vw)">
    <p>称呼：{{ selected.name }} · {{ selected.contact }}</p><p>已有经验：{{ selected.experience }}</p><p>兴趣：{{ selected.interest }}</p><p>留言：{{ selected.message || '未填写' }}</p>
    <ElForm label-position="top"><ElFormItem label="跟进状态"><ElSelect v-model="selected.status"><ElOption v-for="(label,key) in statuses" :key="key" :label="label" :value="key"/></ElSelect></ElFormItem><ElFormItem label="内部备注"><ElInput v-model="selected.note" type="textarea" maxlength="2000" :rows="4" /></ElFormItem></ElForm>
    <template #footer><ElButton type="primary" :loading="saving" @click="saveFollow">保存跟进</ElButton></template>
  </ElDialog>
</template>
<script setup lang="ts">
import request from '@/config/axios'
import { ElMessage } from 'element-plus'
defineOptions({name:'EducationManage'})
const tab=ref('courses'), loading=ref(false), saving=ref(false), courseOpen=ref(false), inquiryOpen=ref(false), existing=ref(false)
const courses=ref<any[]>([]), inquiries=ref<any[]>([]), form=ref<any>({}), selected=ref<any>({})
const statuses={new:'待联系',contacted:'已联系',closed:'已结束'}
async function load(){loading.value=true;try{[courses.value,inquiries.value]=await Promise.all([request.get({url:'/education/courses'}),request.get({url:'/education/inquiries'})])}finally{loading.value=false}}
function editCourse(row?:any){existing.value=Boolean(row);form.value=row?{...row,published:Boolean(row.published)}:{id:'',title:'',description:'',outline:'',stage:1,image:'minecraft',sortOrder:0,published:false};courseOpen.value=true}
async function saveCourse(){if(!/^[a-z0-9-]{1,40}$/.test(form.value.id)||!form.value.title.trim()||!form.value.description.trim()){ElMessage.error('请填写有效标识、课程名称与简介');return} saving.value=true;try{await request.put({url:'/education/courses',data:form.value});courseOpen.value=false;ElMessage.success('课程已保存');await load()}finally{saving.value=false}}
function follow(row:any){selected.value={...row};inquiryOpen.value=true}
async function saveFollow(){saving.value=true;try{await request.put({url:'/education/inquiries/'+selected.value.id,data:{status:selected.value.status,note:selected.value.note||''}});inquiryOpen.value=false;ElMessage.success('跟进已保存');await load()}finally{saving.value=false}}
onMounted(load)
</script>
