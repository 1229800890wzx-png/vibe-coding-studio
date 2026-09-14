<template>
  <EduHeader home cart /><view class="edu-page"
    ><view class="row between discovery-row"
      ><button class="link" @tap="go('campuses')"
        >⌖
        {{
          discovery.mode === 'ONLINE' ? '全国线上' : discovery.campusName || '选择城市与校区'
        }}</button
      ><button class="chip" @tap="showCourses({ mode: 'ONLINE', campusId: '' })"
        >全国线上 ↗</button
      ></view
    ><view class="hero"
      ><text class="eyebrow">给 8–16 岁的创造者</text
      ><view class="title brand-copy">{{ brand.heroTitle }}</view
      ><view class="subtitle brand-copy">{{ brand.heroDescription }}</view
      ><button class="btn hero-cta" @tap="showCourses({ ...discovery })"
        >{{ brand.heroAction }} <text>↗</text></button
      ><view class="hero-code"
        ><view class="code-top"><text class="dot" /><text class="small">my-first-idea</text></view
        ><view class="code-line"
          ><text class="code-muted">01</text><text>const idea = </text
          ><text class="code-orange">'让它发生'</text></view
        ><view class="code-line"
          ><text class="code-muted">02</text><text>imagine. build. improve.</text></view
        ><view class="code-bottom"
          ><text class="code-cursor" /><text class="small">下一行，由孩子来写。</text></view
        ></view
      ></view
    ><CourseServices /><view class="row philosophy"
      ><view><text class="strong">项目驱动</text><view class="small muted">作品验证学习</view></view
      ><view
        ><text class="strong">线上 / 线下</text><view class="small muted">找到合适节奏</view></view
      ><view
        ><text class="strong">家长可见</text><view class="small muted">每步都有反馈</view></view
      ></view
    ><view class="section-head"
      ><text class="section-title">{{
        discovery.mode === 'ONLINE'
          ? '全国线上课程'
          : discovery.campusId
            ? '所选校区课程'
            : '从兴趣开始'
      }}</text
      ><button class="link" @tap="showCourses({ ...discovery })">全部课程 ↗</button></view
    ><EduState
      :loading="loading"
      :error="error"
      :empty="!courses.length"
      title="新课程准备中"
      description="课程和班期完成审核后，会在这里开放报名。"
      @retry="refresh"
    /><view v-if="!loading && !error" class="course-grid"
      ><CourseCard
        v-for="course in courses.slice(0, 4)"
        :key="course.id"
        :course="course"
        :context="discovery" /></view
    ><view class="card intro"
      ><text class="eyebrow">先体验，再决定</text
      ><view class="section-title">给好奇心一次试课的机会。</view
      ><view class="muted">看老师如何引导，观察孩子如何思考，再选择适合的学习路径。</view
      ><button class="btn secondary" @tap="showCourses({ ...discovery, kind: 'TRIAL' })"
        >查看可体验的课程</button
      ></view
    ><view class="section-head"><text class="section-title">每一次创作，都有方法</text></view
    ><view class="card"
      ><view v-for="(step, i) in steps" :key="step[0]" class="method-line"
        ><text class="method-num">0{{ i + 1 }}</text
        ><view
          ><text class="strong">{{ step[0] }}</text
          ><view class="muted">{{ step[1] }}</view></view
        ></view
      ></view
    ><view class="section-head"><text class="section-title">一起把想法做出来的老师</text></view>
    <view v-if="teachers.length" class="course-grid"
      ><view v-for="teacher in teachers.slice(0, 4)" :key="teacher.id" class="card stack"
        ><image
          v-if="teacher.avatarUrl"
          :src="teacher.avatarUrl"
          mode="aspectFill"
          class="teacher-avatar"
        /><view class="strong">{{ teacher.name }}</view
        ><view class="muted">{{ teacher.bio }}</view></view
      ></view
    >
    <view v-else class="note">师资资料确认后，将在这里公开介绍。</view>
    <view class="section-head"
      ><text class="section-title">身边的创作空间</text
      ><button class="link" @tap="go('campuses')">所有校区 ↗</button></view
    >
    <view v-for="campus in campuses.slice(0, 2)" :key="campus.id" class="card stack"
      ><view class="strong">{{ campus.city }} · {{ campus.name }}</view
      ><view class="muted">{{ campus.address }}</view
      ><button
        class="btn secondary"
        @tap="showCourses({ mode: 'OFFLINE', campusId: campus.id, campusName: campus.name })"
        >查看本校区班期</button
      ></view
    >
    <view v-if="!campuses.length" class="note">线下校区准备中，可先查看全国线上班期。</view>
    <view v-if="discoveryError" class="error"
      >{{ discoveryError }}<button class="link" @tap="loadDiscovery">重试师资与校区</button></view
    >
    <button class="link" @tap="go('works', { public: 1 })">看看经授权的公开作品 ↗</button></view
  >
</template>
<script setup>
  import { computed, ref } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import EduState from '@/components/edu/EduState.vue';
  import CourseCard from '@/components/edu/CourseCard.vue';
  import CourseServices from '@/components/edu/CourseServices.vue';
  import { normalizeCohortContext } from '@/edu/cohort-context';
  import { edu, listOf } from '@/edu/api';
  import { useResource } from '@/edu/resource';
  import { tab, go } from '@/edu/state';
  import { brand, loadBrand } from '@/edu/brand';
  import { discovery, showCourses } from '@/edu/discovery';
  const teachers = ref([]),
    campuses = ref([]),
    discoveryError = ref('');
  async function loadDiscovery() {
    discoveryError.value = '';
    const results = await Promise.allSettled([loadBrand(true), edu.teachers(), edu.campuses()]);
    if (results[1].status === 'fulfilled') teachers.value = listOf(results[1].value);
    if (results[2].status === 'fulfilled') campuses.value = listOf(results[2].value);
    if (results.some((r) => r.status === 'rejected'))
      discoveryError.value = '部分介绍暂时无法加载，请稍后重试。';
  }
  const { data, loading, error, refresh } = useResource(() =>
    edu.courses({ pageSize: 4, ...normalizeCohortContext(discovery) }),
  );
  const courses = computed(() => listOf(data.value));
  const steps = [
    ['说清想法', '提出问题，把大想法拆成小步骤。'],
    ['动手验证', '与 AI 协作，运行、测试、发现问题。'],
    ['迭代分享', '解释自己的选择，让作品越来越好。'],
  ];
  onShow(() => {
    refresh();
    loadDiscovery();
  });
</script>
<style scoped>
  .discovery-row {
    margin-bottom: 16px;
  }
  .brand-copy {
    white-space: pre-line;
  }
  .teacher-avatar {
    width: 64px;
    height: 64px;
    border-radius: 16px;
  }
  .hero-cta {
    margin-top: 24px;
    justify-content: space-between;
  }
  .hero-code {
    border: 1px solid #ffffff26;
    background: #252528;
    border-radius: 14px;
    margin-top: 28px;
    padding: 18px;
    font-family: monospace;
  }
  .code-top {
    display: flex;
    align-items: center;
    border-bottom: 1px solid #ffffff17;
    padding-bottom: 12px;
    color: #b6b6be;
  }
  .code-line {
    display: flex;
    gap: 8px;
    font-size: 13px;
    line-height: 2.1;
    flex-wrap: wrap;
  }
  .code-muted {
    color: #65656b;
  }
  .code-orange {
    color: #ffa557;
  }
  .code-bottom {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    color: #a7a7ae;
  }
  .code-cursor {
    width: 6px;
    height: 12px;
    background: #ff7a00;
  }
  .philosophy {
    justify-content: space-between;
    margin: 24px 0;
    text-align: center;
  }
  .philosophy .strong {
    font-size: 14px;
  }
  .philosophy > view {
    flex: 1;
    min-width: 0;
  }
  .intro > * + * {
    margin-top: 14px;
  }
  .method-line {
    display: flex;
    gap: 16px;
    padding: 16px 0;
  }
  .method-num {
    flex: none;
    min-width: 28px;
    white-space: nowrap;
    font-size: 20px;
    font-weight: 700;
    color: #c94b00;
  }
  .method-line + .method-line {
    border-top: 1px solid #ececef;
  }
  @media (max-width: 350px) {
    .hero .title {
      font-size: 28px;
    }
    .hero {
      padding: 20px;
    }
  }
</style>
