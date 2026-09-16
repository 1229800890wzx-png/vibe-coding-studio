<template>
  <EduHeader title="导师团队" />
  <view class="studio-page">
    <view class="studio-intro"
      ><text class="studio-kicker">OUR PEOPLE / 我们的核心优势</text
      ><view class="studio-h1">高水准导师，<br />陪伴每一次创造。</view
      ><view class="studio-body">世界顶尖名校的学术积累，<br />一线 AI 科技大厂的科研经验。</view
      ><text class="studio-script">Great minds. A shared curiosity.</text></view
    >
    <view id="mentor-team" class="studio-section">
      <text class="studio-kicker">MEET THE MENTORS / 认识导师</text>
      <view class="studio-h2">科研与研发一线，走进课堂。</view>
      <MentorRoster :published="teachers" />
      <button class="link" @tap="go('one-to-one')">了解一对一指导与预约 ↗</button>
    </view>
    <view class="background-panel studio-glass">
      <view class="background-heading"
        ><text class="studio-kicker">ACADEMIC BACKGROUNDS</text
        ><view class="studio-h2">来自世界顶尖名校</view
        ><view class="studio-body">让扎实的专业知识，成为孩子探索的底气。</view></view
      >
      <view class="university-window"
        ><view class="university-track" :class="{ paused: paused || !visible }"
          ><view v-for="copy in 2" :key="copy" class="university-group" :aria-hidden="copy === 2"
            ><view v-for="school in universities" :key="school.id" class="university-mark"
              ><image :src="school.logo" :alt="school.name" mode="aspectFit" /><text>{{
                school.name
              }}</text></view
            ></view
          ></view
        ></view
      >
      <view class="university-actions"
        ><button class="link" @tap="showAll = !showAll"
          >{{ showAll ? '收起院校' : '查看全部院校' }} {{ showAll ? '−' : '+' }}</button
        ><button class="link" @tap="paused = !paused">{{
          paused ? '▷ 继续滚动' : 'Ⅱ 暂停'
        }}</button></view
      >
      <view v-if="showAll" class="university-grid"
        ><view v-for="school in universities" :key="school.id"
          ><image :src="school.logo" :alt="school.name" mode="aspectFit" /><text>{{
            school.name
          }}</text></view
        ></view
      >
      <view class="research-background"
        ><text class="studio-kicker">AI RESEARCH EXPERIENCE</text
        ><view class="studio-h3">不止有优秀的学术背景。</view
        ><view class="studio-body"
          >导师团队同时拥有一线 AI
          科技大厂的科研岗位经验，持续接触新技术、理解行业的发展，把问题拆解与验证的方法带进课堂。</view
        ><view class="company-names"
          ><text>科大讯飞</text><text>滴滴</text><text>腾讯</text></view
        ></view
      >
      <view class="studio-micro background-note"
        >以上为团队成员的部分教育背景与行业经历，不代表院校或企业与本项目存在合作关系。</view
      >
    </view>
    <view v-if="error" class="studio-micro profile-intro"
      >更多导师资料暂时未能加载。<button class="link" @tap="loadTeachers">重新加载 ↻</button></view
    >
    <StudioFooter />
  </view>
</template>
<script setup>
  import { useStudioShare } from '@/edu/studio-share';
  import { ref } from 'vue';
  import { onShow, onHide } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import StudioFooter from '@/components/edu/StudioFooter.vue';
  import MentorRoster from '@/components/edu/MentorRoster.vue';
  import { universities } from '@/edu/studio';
  import { edu, listOf } from '@/edu/api';
  import { go } from '@/edu/state';
  const paused = ref(false),
    visible = ref(true),
    showAll = ref(false),
    loading = ref(true),
    error = ref(''),
    teachers = ref([]);
  async function loadTeachers() {
    loading.value = true;
    error.value = '';
    try {
      teachers.value = listOf(await edu.teachers());
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }
  onShow(() => {
    visible.value = true;
    loadTeachers();
  });
  onHide(() => {
    visible.value = false;
  });
  useStudioShare('VIBE CODING · 导师团队', '/pages/studio/mentors');
</script>
<style scoped>
  .background-panel {
    overflow: hidden;
  }
  .background-heading {
    padding: 25px 22px 20px;
  }
  .background-heading .studio-h2 {
    margin: 10px 0;
    font-size: 22px;
  }
  .university-window {
    overflow: hidden;
    padding: 18px 0;
    background: #fffdf8;
    border-top: 1px solid #e9e1d5;
    border-bottom: 1px solid #e9e1d5;
  }
  .university-track {
    display: flex;
    width: max-content;
    animation: school-flow 65s linear infinite;
  }
  .university-track.paused {
    animation-play-state: paused;
  }
  .university-group {
    display: flex;
    flex: none;
  }
  .university-mark {
    width: 146px;
    flex: none;
    padding: 0 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-right: 1px solid #ece6db;
  }
  .university-mark image {
    width: 112px;
    height: 63px;
    margin-bottom: 14px;
  }
  .university-mark text {
    font-size: 12px;
    color: #615f51;
    white-space: nowrap;
  }
  .university-actions {
    display: flex;
    justify-content: space-between;
    padding: 5px 22px;
  }
  .university-actions .link {
    font-size: 12px;
  }
  .university-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    padding: 12px 18px 20px;
  }
  .university-grid > view {
    display: flex;
    align-items: center;
    flex-direction: column;
    background: #fff;
    border: 1px solid #eae2d7;
    border-radius: 10px;
    padding: 12px 4px;
    gap: 8px;
  }
  .university-grid image {
    width: 110px;
    height: 50px;
  }
  .university-grid text {
    font-size: 11px;
  }
  .research-background {
    margin: 10px 22px 0;
    padding: 22px 0 17px;
    border-top: 1px solid #dfd4c3;
  }
  .research-background .studio-h3 {
    margin: 10px 0;
  }
  .research-background .studio-body {
    font-size: 13px;
  }
  .company-names {
    display: flex;
    justify-content: space-between;
    font-weight: 600;
    font-size: 17px;
    color: #686752;
    margin-top: 22px;
  }
  .background-note {
    padding: 15px 22px 21px;
    background: #f4eee3;
    font-size: 10px;
  }
  .profile-intro {
    margin: 10px 0 20px;
  }
  .profile-placeholder {
    text-align: center;
    padding: 28px 20px;
  }
  .profile-placeholder .studio-h3 {
    margin: 12px 0;
  }
  .profile-placeholder .studio-body {
    font-size: 13px;
  }
  .placeholder-icon {
    width: 38px;
    height: 38px;
  }
  .teacher-profile {
    overflow: hidden;
    margin: 16px 0;
  }
  .teacher-photo {
    width: 100%;
    height: 240px;
  }
  .teacher-copy {
    padding: 20px;
  }
  .teacher-copy .studio-body {
    margin-top: 10px;
  }
  .photo-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #eee9de;
  }
  .photo-empty image {
    width: 60px;
    height: 60px;
  }
  @keyframes school-flow {
    to {
      transform: translateX(-50%);
    }
  }
</style>
