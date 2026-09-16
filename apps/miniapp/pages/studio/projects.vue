<template>
  <EduHeader title="创作展示" />
  <view class="studio-page">
    <view class="studio-intro"
      ><text class="studio-kicker">IDEAS IN ACTION / 创作方向</text
      ><view class="studio-h1">想做什么，<br />从这里开始。</view
      ><view class="studio-body"
        >小游戏、互动故事、原创网站与实用工具。<br />用一个具体的想法，打开编程与 AI 的世界。</view
      ><text class="studio-script">Made of possibilities.</text></view
    >
    <scroll-view scroll-x class="project-filters"
      ><view class="project-filter-row"
        ><button
          v-for="filter in filters"
          :key="filter.id"
          :class="{ selected: category === filter.id }"
          @tap="category = filter.id"
          >{{ filter.title }}</button
        ></view
      ></scroll-view
    >
    <view class="studio-micro project-note"
      >以下为官网课程方向示例，供了解创作内容与学习方法。</view
    >
    <view v-for="project in visibleProjects" :key="project.id" class="project-card studio-glass">
      <image :src="project.image" :alt="project.title" class="project-image" mode="aspectFill" />
      <view class="project-copy"
        ><text class="studio-kicker">{{ labels[project.category] }} / 创作示例</text
        ><view class="studio-h2">{{ project.title }}</view
        ><view class="studio-body">{{ project.description }}</view
        ><view class="studio-chips"
          ><text v-for="tag in project.tags" :key="tag">{{ tag }}</text></view
        ><button
          class="link studio-link-row"
          :aria-expanded="expanded === project.id"
          @tap="expanded = expanded === project.id ? '' : project.id"
          >{{ expanded === project.id ? '收起创作思路' : '展开创作思路' }}
          <text>{{ expanded === project.id ? '−' : '+' }}</text></button
        ><view v-if="expanded === project.id" class="project-detail"
          ><text class="studio-kicker">从一个问题开始</text
          ><view class="studio-h3">{{ project.thought }}</view
          ><text class="detail-label">怎样实现</text
          ><view class="studio-body">{{ project.rule }}</view
          ><text class="detail-label">怎样验证</text
          ><view class="studio-body">{{ project.check }}</view
          ><button class="link" @tap="openStudio('courses', { stage: 'create' })"
            >了解对应学习内容 ↗</button
          ></view
        ></view
      >
    </view>
    <view class="studio-section"
      ><text class="studio-kicker">YOUNG CREATORS / 学员作品</text
      ><view class="studio-h2">下一件作品，来自孩子。</view
      ><view class="studio-body">看看经过授权公开的真实学员作品。</view
      ><button class="link" @tap="go('works', { public: 1 })">进入学员作品集 ↗</button></view
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
  import { projects, openStudio } from '@/edu/studio';
  import { go } from '@/edu/state';
  const category = ref('all'),
    expanded = ref('');
  const filters = [
    { id: 'all', title: '全部' },
    { id: 'game', title: '小游戏' },
    { id: 'story', title: '互动故事' },
    { id: 'website', title: '原创网站' },
    { id: 'tool', title: '实用工具' },
  ];
  const labels = {
    game: 'GAME & MOD',
    story: 'INTERACTIVE STORY',
    website: 'WEB DESIGN',
    tool: 'USEFUL TOOLS',
  };
  const visibleProjects = computed(() =>
    projects.filter((project) => category.value === 'all' || project.category === category.value),
  );
  onLoad((options) => {
    const project = projects.find((item) => item.id === options.project);
    if (project) {
      category.value = project.category;
      expanded.value = project.id;
    }
  });
  useStudioShare('VIBE CODING · 创作展示', '/pages/studio/projects', () => ({
    project: expanded.value,
  }));
</script>
<style scoped>
  .project-filters {
    width: 100%;
  }
  .project-filter-row {
    display: flex;
    gap: 8px;
    white-space: nowrap;
    padding: 3px 0;
  }
  .project-filter-row button {
    flex: none;
    margin: 0;
    padding: 11px 14px;
    font-size: 12px;
    min-height: 44px;
    border-radius: 10px;
    border: 1px solid #dfd5c5;
    background: #f4f0e7;
    color: #696657;
  }
  .project-filter-row .selected {
    border-color: #b07b59;
    background: #fffaf2;
    color: #a24e2c;
    box-shadow: inset 0 0 0 2px #fff;
  }
  .project-note {
    margin: 13px 0 21px;
    font-size: 10px;
  }
  .project-card {
    padding: 7px;
    margin-bottom: 23px;
  }
  .project-image {
    width: 100%;
    height: 205px;
    border-radius: 16px;
    display: block;
  }
  .project-copy {
    padding: 19px 14px 0;
  }
  .project-copy .studio-h2 {
    font-size: 21px;
    margin: 7px 0 10px;
  }
  .project-copy .studio-body {
    font-size: 13px;
  }
  .project-copy > .link {
    margin-top: 16px;
    border-top: 1px solid #e2d8c9;
    padding-top: 12px;
    padding-bottom: 13px;
  }
  .project-detail {
    border-top: 1px dashed #dcccba;
    padding: 19px 0 8px;
  }
  .project-detail .studio-h3 {
    font-size: 16px;
    margin-top: 8px;
  }
  .detail-label {
    display: block;
    color: #8b674b;
    font-size: 12px;
    font-weight: 600;
    margin: 17px 0 6px;
  }
  @media (min-width: 720px) {
    .project-image {
      height: 380px;
    }
    .project-copy {
      padding: 25px;
    }
  }
</style>
