<template>
  <EduHeader title="课程体系" />
  <view class="studio-page">
    <view class="studio-intro"
      ><text class="studio-kicker">COURSES / 找到学习起点</text
      ><view class="studio-h1">先理解原理，<br />再创造自己的可能。</view
      ><view class="studio-body"
        >从编程基础，到 AI 工具协作，再到完整项目。每一步动手，都能说清为什么。</view
      ><text class="studio-script">Small steps. Real understanding.</text></view
    >
    <view class="stage-tabs"
      ><button
        v-for="path in paths"
        :key="path.id"
        class="stage-tab"
        :class="{ selected: stage === path.id }"
        @tap="chooseStage(path.id)"
        ><text class="tab-no">{{ path.number }}</text
        ><text>{{ path.title }}</text></button
      ></view
    >
    <view class="path-detail studio-glass">
      <view class="row between"
        ><text class="studio-kicker">{{ currentPath.label }}</text
        ><text class="studio-script">{{ currentPath.number }}</text></view
      >
      <view class="studio-h2">{{ currentPath.title }}</view
      ><view class="studio-body">{{ catalog.summary }}</view>
      <view class="path-for">{{ catalog.prerequisite }}</view>
      <view class="syllabus-label">学习内容 <text>点开一节，看看学什么</text></view>
      <view v-for="(lesson, index) in catalog.lessons" :key="lesson.id" class="lesson-row">
        <button
          class="lesson-trigger"
          :aria-expanded="selectedLesson === lesson.id"
          @tap="selectedLesson = selectedLesson === lesson.id ? '' : lesson.id"
          ><text class="lesson-number">{{ String(index + 1).padStart(2, '0') }}</text
          ><view
            ><view class="lesson-title">{{ lesson.title }}</view
            ><view class="studio-micro">{{ lesson.subtitle }}</view></view
          ><text class="lesson-toggle">{{ selectedLesson === lesson.id ? '−' : '+' }}</text></button
        >
        <view v-if="selectedLesson === lesson.id" class="lesson-content"
          ><view class="studio-h3">{{ lesson.heading }}</view
          ><view class="studio-body">{{ lesson.intro }}</view
          ><view class="studio-chips"
            ><text v-for="concept in lesson.concepts" :key="concept">{{ concept }}</text></view
          ><view class="lesson-objectives"
            ><text class="studio-kicker">学完能做到</text
            ><view v-for="objective in lesson.objectives" :key="objective" class="studio-body"
              >· {{ objective }}</view
            ></view
          ></view
        >
      </view>
      <view class="learning-result"
        ><text class="studio-kicker">阶段目标</text
        ><view class="studio-body">{{ currentPath.result }}</view></view
      >
    </view>
    <view class="studio-micro curriculum-note"
      >以上为课程方向与内容介绍。具体课时、适龄范围及开班安排，请查看已发布的课程与班期。</view
    >
    <view class="studio-section"
      ><text class="studio-kicker">THE TOOLS, THE THINKING / 认识新技术</text
      ><view class="studio-h2">让新工具，成为新能力。</view
      ><view class="studio-body"
        >AI 与大模型、Vibe Coding、Skill、MCP，以及调试和版本管理，融入具体任务中学习。</view
      ><button class="link" @tap="showAI">展开 AI 项目创作大纲 ↑</button></view
    >
    <StudioFooter />
  </view>
</template>
<script setup>
  import { useStudioShare } from '@/edu/studio-share';
  import { computed, ref } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import StudioFooter from '@/components/edu/StudioFooter.vue';
  import { lessonCatalog, paths } from '@/edu/studio';
  const stage = ref('start'),
    selectedLesson = ref('express');
  const catalog = computed(() => lessonCatalog[stage.value]);
  const currentPath = computed(() => paths.find((path) => path.id === stage.value));
  function chooseStage(id) {
    if (!paths.some((path) => path.id === id)) return;
    stage.value = id;
    selectedLesson.value = lessonCatalog[id].lessons[0].id;
  }
  function showAI() {
    chooseStage('create');
    uni.pageScrollTo({ scrollTop: 230, duration: 300 });
  }
  onLoad((options) => {
    if (options.stage) chooseStage(options.stage);
  });
  useStudioShare('VIBE CODING · 课程体系', '/pages/studio/courses', () => ({ stage: stage.value }));
</script>
<style scoped>
  .stage-tabs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 8px 0 18px;
  }
  .stage-tab {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    background: #f1eee6;
    border: 1px solid #e4dccf;
    border-radius: 13px;
    padding: 13px 10px;
    font-size: 12px;
    text-align: left;
    width: 100%;
    margin: 0;
    color: #686a5e;
  }
  .stage-tab.selected {
    background: #fffaf3;
    color: #a24929;
    border-color: #b78363;
    box-shadow: inset 0 0 0 2px #fff;
  }
  .tab-no {
    font-family: 'Studio Art', Georgia, serif;
    font-style: italic;
    font-size: 22px;
  }
  .path-detail {
    padding: 22px 19px 20px;
  }
  .path-detail > .studio-h2 {
    margin: 7px 0 12px;
  }
  .path-for {
    font-size: 12px;
    line-height: 1.8;
    color: #7a654f;
    background: #f4eee3;
    border-left: 2px solid #b88964;
    padding: 12px;
    margin: 18px 0 25px;
  }
  .syllabus-label {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 9px;
  }
  .syllabus-label > text {
    font-weight: 400;
    font-size: 10px;
    color: #857c6e;
  }
  .lesson-row {
    border-bottom: 1px solid #e3dacd;
  }
  .lesson-trigger {
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    padding: 16px 0;
    background: transparent;
    margin: 0;
    width: 100%;
  }
  .lesson-number {
    font-size: 12px;
    color: #aa7049;
    min-width: 20px;
  }
  .lesson-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
    color: #393c32;
  }
  .lesson-trigger > view {
    flex: 1;
  }
  .lesson-toggle {
    color: #a86641;
    font-size: 21px;
  }
  .lesson-content {
    padding: 3px 0 18px 32px;
  }
  .lesson-content .studio-h3 {
    font-size: 16px;
    margin-bottom: 9px;
  }
  .lesson-content .studio-body {
    font-size: 13px;
  }
  .lesson-objectives {
    padding: 13px 0 0;
    margin-top: 14px;
    border-top: 1px dashed #dacdbb;
  }
  .lesson-objectives .studio-kicker {
    margin-bottom: 5px;
  }
  .learning-result {
    padding: 18px 0 0;
  }
  .learning-result .studio-body {
    margin-top: 5px;
  }
  .curriculum-note {
    padding: 14px 4px 28px;
  }
</style>
