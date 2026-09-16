<template>
  <EduHeader title="课程详情" cart />
  <view class="edu-page with-dock course-page">
    <EduState :loading="loading" :error="error" @retry="refresh" />
    <template v-if="course && !loading && !error">
      <view class="chips"
        ><text class="pill">{{ ageLabel }}</text
        ><text class="pill">{{ levelLabel(course.level) }}</text></view
      >
      <view class="title">{{ course.name }}</view>
      <view class="subtitle">{{ course.description }}</view>
      <view v-if="!coverFailed" class="course-cover-frame">
        <image
          :src="coverSource"
          mode="aspectFill"
          class="course-cover"
          @error="handleCoverError"
        />
        <text v-if="isCourseIllustration(coverSource)" class="cover-caption">课程创作示意</text>
      </view>
      <view class="quick-facts">
        <view
          ><text class="fact-value">{{ ageLabel }}</text
          ><text class="small muted">适合年龄</text></view
        >
        <view
          ><text class="fact-value">{{ lessons.length ? lessons.length + ' 次' : '待公布' }}</text
          ><text class="small muted">课程大纲</text></view
        >
        <view
          ><text class="fact-value">{{ cohortError ? '待核查' : cohorts.length + ' 个' }}</text
          ><text class="small muted">{{
            hasContext && !viewAll ? '符合条件班期' : '当前班期'
          }}</text></view
        >
      </view>
      <view class="section-nav">
        <button @tap="scrollToSection('course-content')">学习收获</button>
        <button @tap="scrollToSection('course-outline')">课程大纲</button>
        <button @tap="scrollToSection('course-cohorts')">班期与费用</button>
      </view>
      <view id="course-content" class="anchor-section">
        <view class="section-head"><text class="section-title">带走的不止一个作品</text></view>
        <view class="card">
          <view class="strong">孩子将学会</view
          ><view class="muted prose">{{
            course.objectives || '学习目标正在完善，请稍后查看。'
          }}</view>
          <view class="divider" /><view class="strong">最终创作</view
          ><view class="muted prose">{{
            course.outcomes || '课程成果正在完善，请稍后查看。'
          }}</view>
        </view>
      </view>
      <view id="course-outline" class="anchor-section">
        <view class="section-head"
          ><text class="section-title">{{
            lessons.length ? lessons.length + ' 次课，一步步完成' : '课程大纲'
          }}</text></view
        >
        <view v-if="lessons.length" class="card">
          <view v-for="(lesson, i) in lessons" :key="lesson.id || i" class="lesson">
            <button
              class="lesson-toggle"
              :aria-expanded="expanded === i"
              @tap="expanded = expanded === i ? -1 : i"
            >
              <text class="lesson-no">{{ String(i + 1).padStart(2, '0') }}</text>
              <view class="lesson-heading"
                ><view class="strong">{{ lesson.title }}</view
                ><view class="small muted">{{
                  lesson.durationMinutes ? lesson.durationMinutes + ' 分钟' : '时长待公布'
                }}</view></view
              >
              <text>{{ expanded === i ? '−' : '＋' }}</text>
            </button>
            <view v-if="expanded === i" class="muted prose"
              >{{ lesson.objectives
              }}<view v-if="lesson.assignment">课后练习：{{ lesson.assignment }}</view></view
            >
          </view>
        </view>
        <view v-else class="card muted">详细大纲准备中，实际课表以所选班期为准。</view>
      </view>
      <view id="course-cohorts" class="anchor-section">
        <view class="section-head"
          ><text class="section-title">选择上课班期</text
          ><button class="link" @tap="go('campuses')">查看校区</button></view
        >
        <view v-if="hasContext" class="context-panel">
          <view class="strong">{{ viewAll ? '正在查看本课程全部班期' : '沿用选课页的条件' }}</view>
          <view class="chips"
            ><text v-for="label in contextLabels" :key="label" class="pill">{{ label }}</text></view
          >
          <view v-if="viewAll" class="small muted">选课页的筛选保持不变。</view>
          <button class="link" @tap="viewAll = !viewAll">{{
            viewAll ? '恢复原条件' : '查看本课程全部班期'
          }}</button>
        </view>
        <EduState
          :error="cohortError"
          :empty="!cohorts.length && !cohortError"
          :title="hasContext && !viewAll ? '没有符合条件的班期' : '新班期准备中'"
          :description="
            hasContext && !viewAll
              ? '可以查看本课程全部班期，或返回选课页调整条件。'
              : '开班时间、名额和报名价格确认后，会在这里公布。'
          "
          @retry="refresh"
        />
        <view v-for="group in cohortGroups" :key="group.kind" class="cohort-group">
          <view class="group-heading"
            ><text class="strong">{{ group.title }}</text
            ><text class="small muted"
              >{{ group.rows.length }} 个班期 · 每位孩子的班期总价</text
            ></view
          >
          <button
            v-for="c in group.rows"
            :key="c.id"
            :data-cohort-id="c.id"
            class="card cohort-card"
            @tap="go('cohort', { id: c.id })"
          >
            <view class="cohort-card-top"
              ><text class="strong">{{ c.name }}</text
              ><text class="pill">{{ c.mode === 'ONLINE' ? '全国线上' : '线下校区' }}</text></view
            >
            <view class="cohort-detail"
              ><text class="muted">开课</text
              ><text>{{ beijingDateText(c.startDate, true) }}</text></view
            >
            <view class="cohort-detail"
              ><text class="muted">老师</text
              ><text
                >{{ c.teacherName || '待安排' }} ·
                {{ sessionCount(c) ? sessionCount(c) + ' 次课' : '课表待公布' }}</text
              ></view
            >
            <view class="cohort-detail"
              ><text class="muted">地点</text
              ><text>{{
                c.mode === 'ONLINE' ? '电脑端在线课堂' : c.campusName || '校区待公布'
              }}</text></view
            >
            <view class="cohort-detail"
              ><text class="muted">名额</text
              ><text
                >{{
                  Number.isFinite(c.stock)
                    ? c.stock > 0
                      ? '余 ' + c.stock + ' 位'
                      : '名额已满'
                    : '待核查'
                }}{{ Number.isFinite(c.capacity) ? ' / ' + c.capacity + ' 人班' : '' }}</text
              ></view
            >
            <view class="cohort-card-bottom"
              ><view
                ><text class="price">{{ priceText(c.price) }}</text
                ><text class="small muted price-unit"
                  >/ 人 · {{ group.kind === 'TRIAL' ? '体验班期' : '完整班期' }}</text
                ></view
              ><text class="orange">{{ available(c) ? '查看并报名 →' : '查看班期 →' }}</text></view
            >
            <view v-if="!available(c)" class="small muted closed-reason">{{
              unavailableReason(c)
            }}</view>
          </button>
        </view>
        <view class="note"
          >以上时间均为北京时间。线上课程在电脑端外部课堂进行，请准备可上网的电脑；手机用于查看课程、提交作业与接收反馈。</view
        >
      </view>
    </template>
  </view>
  <view v-if="course && !loading && !error" class="dock">
    <view class="dock-inner course-dock">
      <view class="dock-price"
        ><view class="price">{{
          cohortError
            ? '待核查'
            : startingPrice === null
            ? '待开班'
            : '¥' + money(startingPrice) + ' 起'
        }}</view
        ><text class="small muted">{{ priceScope }}</text></view
      >
      <button class="btn" :disabled="!!cohortError || !cohorts.length" @tap="chooseCohort">{{
        bookable.length === 1 ? '查看可报班期' : '选择上课班期'
      }}</button>
    </view>
  </view>
</template>
<script setup>
  defineOptions({ inheritAttrs: false });
  import { ref, computed } from 'vue';
  import { onLoad, onUnload } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import EduState from '@/components/edu/EduState.vue';
  import { edu, listOf } from '@/edu/api';
  import { go, money } from '@/edu/state';
  import { levelLabel } from '@/edu/labels';
  import { courseCover, isCourseIllustration } from '@/edu/course-cover';
  import {
    normalizeCohortContext,
    filterCohorts,
    cohortContextLabels,
    beijingDateText,
  } from '@/edu/cohort-context';
  const id = ref(0),
    course = ref(null),
    allCohorts = ref([]),
    context = ref({}),
    viewAll = ref(false);
  const loading = ref(false),
    error = ref(''),
    cohortError = ref(''),
    expanded = ref(0);
  const coverFailed = ref(false),
    useFallback = ref(false),
    checkedAt = ref(Date.now());
  let requestSerial = 0;
  const lessons = computed(() =>
    Array.isArray(course.value?.lessons) ? course.value.lessons : [],
  );
  const ageLabel = computed(() =>
    course.value?.ageMin != null && course.value?.ageMax != null
      ? course.value.ageMin + '–' + course.value.ageMax + ' 岁'
      : '适龄待公布',
  );
  const hasContext = computed(() => Object.keys(context.value).length > 0);
  const cohorts = computed(() =>
    filterCohorts(allCohorts.value, viewAll.value ? {} : context.value),
  );
  const contextLabels = computed(() =>
    cohortContextLabels(
      context.value,
      allCohorts.value.map((c) => ({ id: c.campusId, name: c.campusName })),
    ),
  );
  const cohortGroups = computed(() =>
    [
      { kind: 'REGULAR', title: '正式班', rows: cohorts.value.filter((c) => c.kind !== 'TRIAL') },
      { kind: 'TRIAL', title: '体验课', rows: cohorts.value.filter((c) => c.kind === 'TRIAL') },
    ].filter((group) => group.rows.length),
  );
  const startingPrice = computed(() => {
    const prices = cohorts.value.map((c) => c.price).filter((p) => Number.isFinite(p) && p >= 0);
    return prices.length ? Math.min(...prices) : null;
  });
  const priceScope = computed(() => {
    if (cohortError.value) return '班期费用加载失败，请重试';
    if (!cohorts.value.length) return '暂无符合条件的班期';
    if (cohortGroups.value.length > 1) return '含体验课；正式班费用见班期';
    return (cohortGroups.value[0]?.title || '当前班期') + '总价 / 人';
  });
  const bookable = computed(() => cohorts.value.filter(available));
  const coverSource = computed(() => courseCover(course.value, useFallback.value));
  function sessionCount(c) {
    return (c.sessions || []).filter((s) => s.status !== 'CANCELLED').length;
  }
  function priceText(value) {
    return Number.isFinite(value) && value >= 0 ? '¥' + money(value) : '费用待公布';
  }
  function unavailableReason(c) {
    if (c.status !== 'OPEN') return '该班期尚未开放报名';
    if (!Number.isFinite(c.price) || c.price < 0) return '班期费用尚未公布';
    if (!Number.isFinite(c.stock)) return '名额暂时无法核查';
    if (c.stock <= 0) return '当前名额已满，可查看其他班期';
    if (!c.startDate || !Number.isFinite(new Date(c.startDate).getTime())) return '开课时间待公布';
    if (new Date(c.startDate).getTime() <= checkedAt.value) return '该班期已经开课，请查看其他班期';
    if (!sessionCount(c)) return '课表尚未公布';
    if (!String(c.terms || '').trim() || !String(c.refundPolicy || '').trim())
      return '报名规则待公布';
    return '';
  }
  function available(c) {
    return !unavailableReason(c);
  }
  async function refresh() {
    const serial = ++requestSerial;
    loading.value = true;
    error.value = '';
    cohortError.value = '';
    course.value = null;
    allCohorts.value = [];
    if (!Number.isSafeInteger(id.value) || id.value <= 0) {
      error.value = '课程地址无效，请返回选课页';
      loading.value = false;
      return;
    }
    const [courseResult, cohortResult] = await Promise.allSettled([
      edu.course(id.value),
      edu.cohorts(id.value),
    ]);
    if (serial !== requestSerial) return;
    checkedAt.value = Date.now();
    if (courseResult.status === 'fulfilled') course.value = courseResult.value;
    else error.value = courseResult.reason?.message || '课程暂时无法加载，请重试';
    if (cohortResult.status === 'fulfilled') allCohorts.value = listOf(cohortResult.value);
    else cohortError.value = cohortResult.reason?.message || '班期暂时无法加载，请重试';
    coverFailed.value = false;
    useFallback.value = false;
    loading.value = false;
  }
  function handleCoverError() {
    if (coverSource.value !== courseCover(course.value, true)) useFallback.value = true;
    else coverFailed.value = true;
  }
  function scrollToSection(section) {
    uni
      .createSelectorQuery()
      .select('#' + section)
      .boundingClientRect()
      .selectViewport()
      .scrollOffset()
      .exec((results) => {
        if (!results?.[0]) return;
        // Instant scrolling also respects reduced-motion preferences on native targets.
        uni.pageScrollTo({
          scrollTop: Math.max(0, results[0].top + (results[1]?.scrollTop || 0) - 100),
          duration: 0,
        });
      });
  }
  function chooseCohort() {
    if (loading.value || cohortError.value) return;
    if (bookable.value.length === 1) go('cohort', { id: bookable.value[0].id });
    else scrollToSection('course-cohorts');
  }
  onLoad((options) => {
    id.value = Number(options.id);
    context.value = normalizeCohortContext(options);
    refresh();
  });
  onUnload(() => {
    requestSerial++;
  });
</script>
<style scoped>
  .course-page.with-dock {
    padding-bottom: calc(146px + env(safe-area-inset-bottom));
  }
  .course-cover-frame {
    position: relative;
    height: 0;
    padding-top: 56.25%;
    border-radius: 16px;
    overflow: hidden;
    margin-top: 20px;
  }
  .course-cover {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .cover-caption {
    position: absolute;
    bottom: 12px;
    right: 12px;
    padding: 3px 8px;
    border-radius: 6px;
    background: #fffffff0;
    color: #515157;
    font-size: 14px;
  }
  .quick-facts {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 20px 0 16px;
    padding: 16px 8px;
    background: #fff;
    border-radius: 16px;
  }
  .quick-facts > view {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
    min-width: 0;
  }
  .fact-value {
    font-size: 17px;
    font-weight: 700;
  }
  .section-nav {
    display: flex;
    gap: 8px;
  }
  .section-nav button {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    border-radius: 12px;
    padding: 10px 4px;
    color: #c94b00;
    background: #fff3e8;
    font-size: 14px;
  }
  .anchor-section {
    scroll-margin-top: 100px;
  }
  .prose {
    white-space: pre-line;
    line-height: 1.8;
    margin-top: 12px;
    overflow-wrap: anywhere;
  }
  .lesson {
    padding: 12px 0;
  }
  .lesson + .lesson {
    border-top: 1px solid #ececef;
  }
  .lesson-toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 48px;
    padding: 0;
    margin: 0;
    background: transparent;
    text-align: left;
  }
  .lesson-heading {
    flex: 1;
    min-width: 0;
  }
  .lesson-no {
    font-size: 22px;
    font-weight: 700;
    color: #c94b00;
    min-width: 30px;
  }
  .context-panel {
    background: #fff3e8;
    padding: 16px;
    border-radius: 16px;
    margin-bottom: 16px;
  }
  .context-panel .chips {
    margin-top: 12px;
    flex-wrap: wrap;
  }
  .context-panel .link {
    padding: 10px 0;
    margin: 4px 0 0;
    text-align: left;
    min-height: 44px;
  }
  .group-heading {
    display: flex;
    gap: 6px;
    flex-direction: column;
    margin: 20px 0 12px;
  }
  .cohort-card {
    display: block;
    width: 100%;
    text-align: left;
    margin: 0 0 12px;
    line-height: 1.55;
  }
  .cohort-card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
  }
  .cohort-card-top > .strong {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .cohort-card-top .pill {
    flex-shrink: 0;
    font-size: 14px;
  }
  .cohort-detail {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr);
    gap: 10px;
    margin-top: 8px;
    font-size: 14px;
  }
  .cohort-detail > text:last-child {
    overflow-wrap: anywhere;
  }
  .cohort-card-bottom {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 10px;
    margin-top: 20px;
    flex-wrap: wrap;
  }
  .price-unit {
    display: block;
    margin-top: 4px;
  }
  .closed-reason {
    margin-top: 10px;
  }
  .course-dock {
    align-items: center;
  }
  .dock-price {
    flex: 1;
    min-width: 0;
  }
  .dock-price .price {
    font-size: 22px;
    overflow-wrap: anywhere;
  }
  .course-dock > .btn {
    flex: 0 1 52%;
    padding: 14px 12px;
    min-height: 48px;
  }
  .section-nav button:active,
  .cohort-card:active {
    background: #fff3e8;
  }
  button:focus-visible {
    outline: 2px solid #c94b00;
    outline-offset: 3px;
  }
  @media (max-width: 340px) {
    .cohort-card-top {
      flex-direction: column;
      gap: 8px;
    }
    .fact-value {
      font-size: 16px;
    }
    .course-dock {
      gap: 8px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    button {
      transition: none;
      transform: none;
    }
  }
</style>
