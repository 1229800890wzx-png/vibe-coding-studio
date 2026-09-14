<template>
  <EduHeader title="孩子档案" /><view class="edu-page"
    ><text class="eyebrow">EACH CHILD, THEIR OWN JOURNEY</text
    ><view class="title">每个孩子，<br />都有自己的成长路径。</view
    ><view v-if="returnTo" class="card stack continuation-card"
      ><view class="strong">补充档案后，继续{{ continuationLabel(returnTo) }}</view
      ><view class="muted">选择或添加孩子后，回到刚才的课程继续操作。</view
      ><button
        v-if="family.currentId && family.students.some((s) => s.id === family.currentId)"
        class="btn secondary"
        @tap="continueTo(returnTo)"
        >使用当前孩子，继续</button
      ></view
    ><EduState
      :loading="loading"
      :error="error"
      :empty="!family.students.length"
      title="添加第一位小创作者"
      description="只需必要的学习信息，即可为孩子选择课程。"
      @retry="refresh"
    /><view v-for="s in family.students" :key="s.id" class="card"
      ><view class="row between"
        ><view class="row"
          ><view class="avatar">{{ s.name.slice(0, 1) }}</view
          ><view
            ><view class="section-title">{{ s.name }}</view
            ><view class="muted">{{ s.grade || '年级待完善' }} · {{ s.birthMonth }}</view></view
          ></view
        ><text v-if="s.id === family.currentId" class="pill">当前孩子</text></view
      ><view class="row" style="margin-top: 16px"
        ><button class="btn secondary" style="flex: 1" @tap="selectStudent(s.id)"
          >设为当前孩子</button
        ><button class="btn quiet" @tap="edit(s)">编辑</button></view
      ></view
    ><button class="btn" @tap="edit()">＋ 添加孩子</button
    ><view class="note" style="margin-top: 24px"
      >孩子的作业、课堂链接和成长记录仅对监护人及有权限的老师开放。作品展示需另行授权。</view
    ><view v-if="editing" class="editor-mask"
      ><scroll-view scroll-y class="editor"
        ><view class="row between"
          ><text class="section-title">{{ form.id ? '编辑孩子' : '添加孩子' }}</text
          ><button class="link" @tap="editing = false">取消</button></view
        ><view class="field"
          ><text class="field-label">孩子称呼 *</text
          ><input
            class="input"
            v-model="form.name"
            maxlength="20"
            placeholder="建议使用日常称呼或昵称" /></view
        ><view class="field"
          ><text class="field-label">出生年月 *</text
          ><picker
            mode="date"
            fields="month"
            :end="maxMonth"
            :value="form.birthMonth"
            @change="form.birthMonth = $event.detail.value"
            ><view class="input">{{ form.birthMonth || '请选择出生年月' }} ⌄</view></picker
          ></view
        ><view class="field"
          ><text class="field-label">年级</text
          ><picker :range="grades" @change="form.grade = grades[Number($event.detail.value)]"
            ><view class="input">{{ form.grade || '请选择年级' }} ⌄</view></picker
          ></view
        ><view class="field"
          ><text class="field-label">编程经历</text
          ><picker
            :range="experienceLabels"
            @change="form.experience = experiences[Number($event.detail.value)]"
            ><view class="input"
              >{{ experienceLabels[experiences.indexOf(form.experience)] || '请选择' }} ⌄</view
            ></picker
          ></view
        ><view v-if="saveError" class="error">{{ saveError }}</view
        ><button class="btn" :disabled="busy" @tap="save">{{
          busy ? '保存中…' : '保存档案'
        }}</button
        ><button v-if="form.id" class="link" @tap="remove">删除这份档案</button></scroll-view
      ></view
    ></view
  >
</template>
<script setup>
  defineOptions({ inheritAttrs: false });
  import { ref, reactive } from 'vue';
  import { onLoad, onShow } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import EduState from '@/components/edu/EduState.vue';
  import { edu } from '@/edu/api';
  import { useResource } from '@/edu/resource';
  import { family, loadStudents, selectStudent, requireLogin, confirm, toast } from '@/edu/state';
  import { safeContinuation, continuationLabel, continueTo } from '@/edu/navigation';
  const returnTo = ref('');
  onLoad((options) => {
    returnTo.value = safeContinuation(options.returnTo);
  });
  const { loading, error, refresh } = useResource(loadStudents);
  const editing = ref(false),
    busy = ref(false),
    saveError = ref(''),
    form = reactive({}),
    maxMonth = new Date().toISOString().slice(0, 7),
    grades = [
      '一年级',
      '二年级',
      '三年级',
      '四年级',
      '五年级',
      '六年级',
      '初一',
      '初二',
      '初三',
      '其他',
    ],
    experiences = ['NONE', 'BASIC', 'PROJECT'],
    experienceLabels = ['尚未接触', '学过一点', '做过完整项目'];
  function edit(s) {
    Object.keys(form).forEach((k) => delete form[k]);
    Object.assign(
      form,
      s
        ? {
            id: s.id,
            name: s.name,
            birthMonth: s.birthMonth,
            grade: s.grade,
            experience: s.experience,
          }
        : { name: '', birthMonth: '', grade: '', experience: 'NONE' },
    );
    saveError.value = '';
    editing.value = true;
  }
  async function save() {
    if (!form.name?.trim() || !/^\d{4}-\d{2}$/.test(form.birthMonth)) {
      saveError.value = '请填写孩子称呼和出生年月';
      return;
    }
    if (form.birthMonth > maxMonth) {
      saveError.value = '出生年月不能晚于当前月份';
      return;
    }
    busy.value = true;
    saveError.value = '';
    try {
      await edu.saveStudent({ ...form, name: form.name.trim() });
      await refresh();
      editing.value = false;
      toast('档案已保存');
    } catch (e) {
      saveError.value = e.message;
    } finally {
      busy.value = false;
    }
  }
  async function remove() {
    if (!(await confirm('删除孩子档案', '仅无报名和学习记录的档案可以删除。确认删除这份档案？')))
      return;
    try {
      await edu.deleteStudent(form.id);
      editing.value = false;
      await refresh();
    } catch (e) {
      saveError.value = e.message;
    }
  }
  onShow(() => {
    if (requireLogin()) refresh();
  });
</script>
<style scoped>
  .avatar {
    height: 48px;
    width: 48px;
    border-radius: 16px;
    background: #fff3e8;
    color: #c94b00;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 23px;
    font-weight: 700;
  }
  .editor-mask {
    position: fixed;
    inset: 0;
    background: #0006;
    z-index: 50;
    display: flex;
    align-items: flex-end;
  }
  .editor {
    max-height: 90vh;
    background: #fff;
    border-radius: 24px 24px 0 0;
    padding: 24px 24px calc(24px + env(safe-area-inset-bottom));
    max-width: 600px;
    margin: 0 auto;
  }
</style>
