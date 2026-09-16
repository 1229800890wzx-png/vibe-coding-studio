<template>
  <EduHeader home cart />
  <view class="studio-page home-page">
    <view class="home-hero">
      <view class="studio-kicker">VIBE CODING / 少儿编程与 AI 创作</view>
      <view class="home-title">每一个奇思妙想，<br /><text>都值得被创造。</text></view>
      <view class="studio-body"
        >从编程基础出发，与 AI 一起，<br />把好奇心变成自己的第一个作品。</view
      >
      <view class="hero-actions"
        ><button class="btn hero-cta" @tap="openStudio('courses')"
          >了解课程体系 <text>↗</text></button
        ><button class="link" @tap="showCourses({ ...discovery, kind: 'TRIAL' })"
          >找一门体验课 →</button
        ></view
      >
      <view class="hero-showcase studio-glass">
        <view class="art-top"
          ><text class="studio-script">A little wonder.</text
          ><text class="studio-micro">创作方向示例</text></view
        >
        <swiper
          class="hero-swiper"
          :autoplay="autoplay && visible"
          :interval="5500"
          :duration="650"
          circular
          @change="slide = $event.detail.current"
        >
          <swiper-item v-for="project in heroProjects" :key="project.id"
            ><image
              class="hero-image"
              :src="project.image"
              :alt="project.title"
              mode="aspectFill"
              @tap="openStudio('projects', { project: project.id })"
          /></swiper-item>
        </swiper>
        <view class="art-caption"
          ><view
            ><view class="art-title">{{ heroProjects[slide].title }}</view
            ><view class="studio-micro">{{ heroCaptions[slide] }}</view></view
          ><button
            class="art-open"
            aria-label="了解当前创作方向"
            @tap="openStudio('projects', { project: heroProjects[slide].id })"
            >↗</button
          ></view
        >
        <view class="art-controls"
          ><view class="slide-dots"
            ><view
              v-for="(project, index) in heroProjects"
              :key="project.id"
              class="slide-dot"
              :class="{ active: slide === index }" /></view
          ><button
            class="play-control"
            :aria-label="autoplay ? '暂停轮播' : '播放轮播'"
            @tap="autoplay = !autoplay"
            >{{ autoplay ? 'Ⅱ 暂停' : '▷ 播放' }}</button
          ></view
        >
      </view>
    </view>
    <StudioNav />
    <button class="schedule-home-entry studio-glass" @tap="tab('courses')"
      ><view
        ><text class="studio-kicker">精品小班 · 课程活动</text
        ><view class="studio-h3"
          >¥{{ groupOffer.trialPrice }} 体验前 {{ groupOffer.trialLessons }} 节，喜欢再继续。</view
        ><view class="studio-micro"
          >整期 {{ groupOffer.lessons }} 节 ¥{{ groupOffer.activityPrice.toLocaleString() }} ·
          体验费全额抵扣</view
        ></view
      ><text class="schedule-home-arrow">↗</text></button
    >
    <view class="studio-section">
      <text class="studio-kicker">FROM FOUNDATIONS TO CREATION / 课程体系</text>
      <view class="studio-section-head"
        ><view class="studio-h2">从好奇，到独立创造。</view
        ><button class="link" @tap="openStudio('courses')">看大纲 ↗</button></view
      >
      <button
        v-for="path in paths"
        :key="path.id"
        class="path-row studio-glass"
        @tap="openStudio('courses', { stage: path.id })"
        ><text class="path-no studio-script">{{ path.number }}</text
        ><view class="path-copy"
          ><view class="studio-h3">{{ path.title }}</view
          ><view class="studio-body">{{ path.description }}</view></view
        ><text class="path-arrow">↗</text></button
      >
    </view>
    <view class="studio-section">
      <view class="mentor-feature studio-glass">
        <text class="studio-kicker">MEET YOUR MENTORS / 导师团队</text>
        <view class="studio-h2">好老师，<br />让想象走得更远。</view>
        <text class="studio-script">A little guidance.</text>
        <MentorRoster compact />
        <view class="mentor-line"
          ><text class="mentor-bullet">01</text
          ><view
            ><view class="studio-h3">世界顶尖名校背景</view
            ><view class="studio-body">扎实的学术积累，打开更广的视野。</view></view
          ></view
        >
        <view class="mentor-line"
          ><text class="mentor-bullet">02</text
          ><view
            ><view class="studio-h3">一线 AI 科技大厂科研经验</view
            ><view class="studio-body">持续接触前沿技术，理解真实项目。</view></view
          ></view
        >
        <button class="link studio-link-row" @tap="openStudio('mentors')"
          >认识我们的导师团队 <text>↗</text></button
        >
      </view>
    </view>
    <view class="studio-section">
      <text class="studio-kicker">LEARN BY CREATING / 教学方法</text>
      <view class="studio-h2">不止做出来，<br />也知道为什么。</view>
      <view class="home-method"
        ><view v-for="(step, index) in methodSteps" :key="step.title"
          ><text class="method-circle">0{{ index + 1 }}</text
          ><text>{{ step.title }}</text></view
        ></view
      >
      <view class="studio-body"
        >从提出问题到测试改进，让孩子学会使用 AI，也学会独立思考和验证结果。</view
      >
      <button class="link" @tap="openStudio('method')">走进我们的课堂 ↗</button>
    </view>
    <view class="studio-section">
      <text class="studio-kicker">START YOUR JOURNEY / 开始学习</text>
      <view class="studio-h2">找到适合孩子的下一步。</view>
      <CourseServices />
      <view class="row between"
        ><button class="link" @tap="go('campuses')"
          >{{
            discovery.mode === 'ONLINE' ? '全国线上' : discovery.campusName || '选择城市与校区'
          }}
          ⌄</button
        ><button class="link" @tap="showCourses({ ...discovery })">课程与班期 ↗</button></view
      >
      <view v-if="loading" class="studio-micro">正在查询可报名课程…</view>
      <view v-else-if="error" class="catalog-notice"
        ><view class="studio-body">班期信息暂时未能加载，课程介绍仍可正常浏览。</view
        ><button class="link" @tap="refresh">重新加载班期 ↻</button></view
      >
      <view v-else-if="courses.length" class="course-grid"
        ><CourseCard
          v-for="course in courses.slice(0, 2)"
          :key="course.id"
          :course="course"
          :context="discovery"
      /></view>
      <view v-else class="studio-micro">新课程与班期发布后，可在这里查看和报名。</view>
    </view>
    <StudioFooter />
  </view>
</template>
<script setup>
  import { useStudioShare } from '@/edu/studio-share';
  import { computed, ref } from 'vue';
  import { onShow, onHide } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import CourseCard from '@/components/edu/CourseCard.vue';
  import CourseServices from '@/components/edu/CourseServices.vue';
  import StudioFooter from '@/components/edu/StudioFooter.vue';
  import StudioNav from '@/components/edu/StudioNav.vue';
  import MentorRoster from '@/components/edu/MentorRoster.vue';
  import { paths, projects, methodSteps, openStudio } from '@/edu/studio';
  import { discovery, showCourses } from '@/edu/discovery';
  import { normalizeCohortContext } from '@/edu/cohort-context';
  import { edu, listOf } from '@/edu/api';
  import { useResource } from '@/edu/resource';
  import { go, tab } from '@/edu/state';
  import { groupOffer } from '@/edu/course-schedule';
  const slide = ref(0),
    autoplay = ref(true),
    visible = ref(true);
  const heroProjects = projects.filter((project) =>
    ['minecraft', 'museum', 'mono'].includes(project.id),
  );
  const heroCaptions = [
    '给熟悉的世界，添加自己的规则。',
    '让每一个选择，走向不同的故事。',
    '从页面结构，到自己的品牌表达。',
  ];
  const { data, loading, error, refresh } = useResource(() =>
    edu.courses({ pageSize: 2, ...normalizeCohortContext(discovery) }),
  );
  const courses = computed(() => listOf(data.value));
  onShow(() => {
    visible.value = true;
    refresh();
  });
  onHide(() => {
    visible.value = false;
  });
  useStudioShare('VIBE CODING · 每一个奇思妙想，都值得被创造。', '/pages/tab/home');
</script>
<style scoped>
  .schedule-home-entry {
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: space-between;
    margin: 20px 0 0;
    padding: 18px;
    width: 100%;
    text-align: left;
    background: #faf5ed;
    line-height: 1.6;
  }
  .schedule-home-entry .studio-h3 {
    margin: 8px 0;
    font-size: 15px;
  }
  .schedule-home-arrow {
    flex: none;
    color: #a45b36;
    font-size: 24px;
  }
  .schedule-home-entry::after {
    border: 0;
  }
  .home-page {
    padding-top: 12px;
  }
  .home-hero {
    padding-top: 3px;
  }
  .home-title {
    font-size: 29px;
    font-weight: 650;
    letter-spacing: -0.8px;
    line-height: 1.46;
    margin: 12px 0 8px;
  }
  .home-title > text {
    color: #ae4a2a;
  }
  .hero-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 14px 0 16px;
  }
  .hero-actions .btn {
    font-size: 13px;
    padding: 10px 16px;
    min-height: 45px;
    gap: 16px;
  }
  .hero-actions .link {
    font-size: 12px;
    white-space: nowrap;
  }
  .hero-showcase {
    padding: 8px;
  }
  .art-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 9px 14px;
  }
  .art-top .studio-script {
    font-size: 23px;
  }
  .hero-swiper {
    height: 180px;
    border-radius: 15px;
    overflow: hidden;
  }
  .hero-image {
    width: 100%;
    height: 100%;
  }
  .art-caption {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 8px 0;
  }
  .art-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 3px;
  }
  .art-open {
    font-size: 21px;
    background: #f3ebde;
    color: #8d4b2e;
    width: 40px;
    height: 40px;
    flex: none;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    margin: 0;
    border: 1px solid #e6d9c8;
    border-radius: 50%;
  }
  .art-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 8px 0;
  }
  .slide-dots {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .slide-dot {
    height: 4px;
    width: 5px;
    border-radius: 3px;
    background: #dcd2c4;
    transition: width 0.4s ease;
  }
  .slide-dot.active {
    background: #ba4b27;
    width: 24px;
  }
  .play-control {
    font-size: 10px;
    color: #7d725f;
    min-height: 36px;
    padding: 5px;
    margin: 0;
    background: transparent;
    display: flex;
    align-items: center;
  }
  .path-row {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 14px;
    text-align: left;
    padding: 20px 16px;
    margin-bottom: 12px;
  }
  .path-no {
    font-size: 33px;
    min-width: 32px;
  }
  .path-copy {
    flex: 1;
  }
  .path-copy .studio-body {
    font-size: 12px;
    margin-top: 5px;
  }
  .path-arrow {
    color: #a15330;
    flex: none;
  }
  .path-row:active {
    background: #f2e9da;
  }
  .mentor-feature {
    padding: 26px 22px 12px;
    background: linear-gradient(145deg, #fffdfa, #f2ede2);
  }
  .mentor-feature .studio-h2 {
    font-size: 27px;
    margin-top: 12px;
  }
  .mentor-feature .studio-script {
    margin: 15px 0 25px;
  }
  .mentor-line {
    display: flex;
    gap: 13px;
    margin-bottom: 20px;
  }
  .mentor-line .studio-h3 {
    font-size: 15px;
  }
  .mentor-line .studio-body {
    font-size: 12px;
    margin-top: 4px;
  }
  .mentor-bullet {
    color: #987557;
    font-size: 12px;
    padding-top: 3px;
  }
  .mentor-feature .link {
    border-top: 1px solid #ded4c3;
    padding-top: 13px;
  }
  .home-method {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    margin: 24px 0 19px;
  }
  .home-method > view {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 10px;
    position: relative;
    font-size: 12px;
  }
  .home-method > view:not(:last-child)::after {
    position: absolute;
    top: 18px;
    left: 75%;
    width: 50%;
    height: 1px;
    background: #d9cbbb;
    content: '';
  }
  .method-circle {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 38px;
    width: 38px;
    border: 1px solid #d5c3af;
    background: #fdfaf4;
    border-radius: 50%;
    font-size: 12px;
    color: #a15e39;
  }
  .catalog-notice {
    border-top: 1px solid #dfd5c5;
    margin-top: 8px;
    padding-top: 13px;
  }
  .catalog-notice .studio-body {
    font-size: 12px;
  }
  @media (min-width: 720px) {
    .home-title {
      font-size: 44px;
    }
    .hero-swiper {
      height: 350px;
    }
    .hero-showcase {
      max-width: 680px;
      margin: auto;
    }
    .home-hero {
      text-align: center;
    }
    .hero-actions {
      justify-content: center;
    }
    .art-caption {
      text-align: left;
    }
  }
  @media (max-width: 360px) {
    .home-title {
      font-size: 28px;
    }
    .hero-actions {
      gap: 10px;
    }
    .hero-actions .btn {
      padding: 9px 13px;
      gap: 8px;
    }
    .hero-swiper {
      height: 180px;
    }
  }
</style>
