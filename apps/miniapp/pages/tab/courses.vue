<template>
  <view class="course-canvas">
    <EduHeader home cart /><view class="edu-page"
      ><CourseSchedule />
      <view class="catalog-heading"
        ><text class="eyebrow">EXPLORE COURSES / 已发布课程</text
        ><view class="title">继续探索，找到你的方向。</view
        ><view class="subtitle">按孩子的兴趣、基础与已开放班期选择课程。</view></view
      >
      <view class="course-types"
        ><button
          v-for="kind in kinds"
          :key="kind.value"
          class="type-choice"
          :class="{ selected: filters.kind === kind.value }"
          @tap="setKind(kind.value)"
          >{{ kind.value ? kind.label : '全部课程' }}</button
        ></view
      >
      <button class="link" @tap="openStudio('courses')">先了解基础、AI 与实战课程体系 ↗</button>
      <view class="search-row"
        ><input
          class="input"
          v-model="keyword"
          placeholder="搜索课程、项目或兴趣"
          confirm-type="search"
          @confirm="search"
        /><button class="btn secondary" @tap="search">搜索</button></view
      ><view class="row between filter-row"
        ><scroll-view scroll-x class="directions"
          ><view class="chips no-wrap"
            ><button
              v-for="item in directions"
              :key="item.value"
              class="chip"
              :class="{ active: filters.direction === item.value }"
              @tap="setDirection(item.value)"
              >{{ item.label }}</button
            ></view
          ></scroll-view
        ><button class="chip" @tap="openFilter"
          >筛选{{ filterCount ? ' · ' + filterCount : '' }}⌄</button
        ></view
      ><view class="row between muted results"
        ><text>{{ loading ? '正在查询课程…' : error ? '课程暂未加载' : total + ' 门课程' }}</text
        ><button class="link" @tap="go('campuses')">城市与校区 ↗</button></view
      ><view v-if="activeFilters.length" class="selected-filters"
        ><button
          v-for="item in activeFilters"
          :key="item.key"
          class="selected-filter"
          :aria-label="'移除' + item.label"
          @tap="removeFilter(item.key)"
          >{{ item.label }} <text>×</text></button
        ></view
      ><EduState
        :loading="loading"
        :error="error"
        :empty="!courses.length"
        title="还没有匹配的课程"
        :description="
          activeFilters.length
            ? '当前条件暂无匹配；可以只放宽一个条件，保留其他选择。'
            : '课程和班期确认后会在这里开放。也可以先了解一对一服务。'
        "
        @retry="refresh"
        ><view class="recovery-actions"
          ><button v-if="filters.campusId" class="btn secondary" @tap="removeFilter('campusId')"
            >不限校区，保留其他条件</button
          ><button
            v-if="filters.startFrom || filters.startTo"
            class="btn secondary"
            @tap="removeFilter('date')"
            >不限开课日期</button
          ><button v-if="activeFilters.length" class="btn quiet" @tap="reset">清除全部条件</button
          ><button v-else class="btn secondary" @tap="go('one-to-one')"
            >了解一对一高级课</button
          ></view
        ></EduState
      ><view class="course-grid" v-if="!loading && !error"
        ><CourseCard
          v-for="course in courses"
          :key="course.id"
          :course="course"
          :context="filters" /></view
      ><button v-if="courses.length < total && !loading" class="btn secondary" @tap="more"
        >查看更多课程</button
      ></view
    ><view v-if="showFilter" class="filter-mask" @tap="showFilter = false"
      ><view class="filter-sheet" @tap.stop
        ><view class="row between"
          ><text class="section-title">找到适合孩子的课程</text
          ><button class="link" @tap="showFilter = false">取消</button></view
        ><view class="field"
          ><text class="field-label">孩子年龄</text
          ><view class="chips"
            ><button
              v-for="age in ages"
              :key="age"
              class="chip"
              :class="{ active: draft.age === age }"
              @tap="draft.age = age"
              >{{ age || '不限' }}{{ age ? ' 岁' : '' }}</button
            ></view
          ></view
        ><view class="field"
          ><text class="field-label">课程类型</text
          ><view class="chips"
            ><button
              v-for="kind in kinds"
              :key="kind.value"
              class="chip"
              :class="{ active: draft.kind === kind.value }"
              @tap="draft.kind = kind.value"
              >{{ kind.label }}</button
            ></view
          ></view
        ><view class="field"
          ><text class="field-label">学习基础</text>
          <view class="chips"
            ><button
              v-for="level in levels"
              :key="level.value"
              class="chip"
              :class="{ active: draft.level === level.value }"
              @tap="draft.level = level.value"
              >{{ level.label }}</button
            ></view
          >
        </view>
        <view class="field">
          <text class="field-label">开课日期</text>
          <view class="row"
            ><picker
              mode="date"
              :value="draft.startFrom"
              @change="draft.startFrom = $event.detail.value"
              ><view class="input">{{ draft.startFrom || '开始日期' }}</view></picker
            ><text>至</text
            ><picker
              mode="date"
              :value="draft.startTo"
              @change="draft.startTo = $event.detail.value"
              ><view class="input">{{ draft.startTo || '结束日期' }}</view></picker
            ></view
          >
          <button
            v-if="draft.startFrom || draft.startTo"
            class="link"
            @tap="
              draft.startFrom = '';
              draft.startTo = '';
            "
            >清除日期</button
          >
        </view>
        <view class="field"
          ><text class="field-label">上课方式</text
          ><view class="chips"
            ><button
              v-for="item in modes"
              :key="item.value"
              class="chip"
              :class="{ active: draft.mode === item.value }"
              @tap="setDraftMode(item.value)"
              >{{ item.label }}</button
            ></view
          ></view
        ><view class="field"
          ><text class="field-label">校区</text
          ><picker
            :range="campusNames"
            :value="
              Math.max(0, campuses.findIndex((c) => String(c.id) === String(draft.campusId)) + 1)
            "
            @change="setDraftCampus(Number($event.detail.value))"
            ><view class="input"
              >{{
                campuses.find((c) => String(c.id) === String(draft.campusId))?.name || '不限校区'
              }}
              ⌄</view
            ></picker
          ></view
        ><view class="row filter-actions"
          ><button
            class="btn quiet"
            @tap="
              draft = {
                age: '',
                mode: '',
                campusId: '',
                level: '',
                kind: '',
                startFrom: '',
                startTo: '',
              }
            "
            >重置</button
          ><button class="btn" style="flex: 1" @tap="apply">查看课程</button></view
        ></view
      ></view
    >
  </view>
</template>
<script setup>
  import CourseSchedule from '@/components/edu/CourseSchedule.vue';
  import { openStudio } from '@/edu/studio';
  import { ref, reactive, computed, watch, onUnmounted } from 'vue';
  import { onLoad, onPageScroll, onShow } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import EduState from '@/components/edu/EduState.vue';
  import CourseCard from '@/components/edu/CourseCard.vue';
  import { edu, listOf } from '@/edu/api';
  import { useResource } from '@/edu/resource';
  import { go } from '@/edu/state';
  const saved = uni.getStorageSync('edu-course-filters') || {};
  const filters = reactive({
      direction: '',
      age: '',
      mode: '',
      campusId: '',
      keyword: '',
      level: '',
      kind: '',
      startFrom: '',
      startTo: '',
      ...saved,
      campusId: saved.mode === 'ONLINE' ? '' : saved.campusId || '',
    }),
    keyword = ref(filters.keyword),
    showFilter = ref(false),
    draft = ref({}),
    campuses = ref([]),
    pageNo = ref(1);
  let scrollTop = 0,
    returning = false;
  const directions = [
      { label: '全部', value: '' },
      { label: '游戏创作', value: 'GAME' },
      { label: '互动故事', value: 'STORY' },
      { label: '网站设计', value: 'WEB' },
      { label: '实用工具', value: 'TOOL' },
      { label: 'AI 应用', value: 'AI' },
      { label: '综合项目', value: 'PRODUCT' },
    ],
    kinds = [
      { label: '不限', value: '' },
      { label: '体验课', value: 'TRIAL' },
      { label: '正式班', value: 'REGULAR' },
    ],
    levels = [
      { label: '不限', value: '' },
      { label: '零基础', value: 'BEGINNER' },
      { label: '已有基础', value: 'INTERMEDIATE' },
      { label: '进阶创作', value: 'ADVANCED' },
    ],
    ages = ['', 8, 9, 10, 11, 12, 13, 14, 15, 16],
    modes = [
      { label: '不限', value: '' },
      { label: '线上小班', value: 'ONLINE' },
      { label: '线下校区', value: 'OFFLINE' },
    ];
  const { data, loading, error, refresh } = useResource(async () => {
    const previous = pageNo.value > 1 ? listOf(data.value) : [];
    const result = await edu.courses({ ...filters, pageNo: pageNo.value, pageSize: 20 });
    return { ...result, list: [...previous, ...listOf(result)] };
  });
  const courses = computed(() => listOf(data.value)),
    total = computed(() => data.value?.total || 0),
    filterCount = computed(
      () =>
        [
          filters.age,
          filters.mode,
          filters.campusId,
          filters.level,
          filters.kind,
          filters.startFrom || filters.startTo,
        ].filter(Boolean).length,
    ),
    campusNames = computed(() => [
      '不限校区',
      ...campuses.value.map((c) => c.city + ' · ' + c.name),
    ]);
  const activeFilters = computed(() => {
    const values = [];
    if (filters.keyword) values.push({ key: 'keyword', label: '搜索：' + filters.keyword });
    if (filters.direction)
      values.push({
        key: 'direction',
        label: directions.find((x) => x.value === filters.direction)?.label || '课程方向',
      });
    if (filters.kind)
      values.push({
        key: 'kind',
        label: kinds.find((x) => x.value === filters.kind)?.label || '课程类型',
      });
    if (filters.age) values.push({ key: 'age', label: filters.age + ' 岁' });
    if (filters.level)
      values.push({
        key: 'level',
        label: levels.find((x) => x.value === filters.level)?.label || '学习基础',
      });
    if (filters.mode)
      values.push({
        key: 'mode',
        label: modes.find((x) => x.value === filters.mode)?.label || '授课方式',
      });
    if (filters.campusId)
      values.push({
        key: 'campusId',
        label:
          campuses.value.find((x) => String(x.id) === String(filters.campusId))?.name || '所选校区',
      });
    if (filters.startFrom || filters.startTo)
      values.push({
        key: 'date',
        label: `${filters.startFrom || '不限开始'} 至 ${filters.startTo || '不限结束'}`,
      });
    return values;
  });
  function removeFilter(key) {
    if (key === 'date') {
      filters.startFrom = '';
      filters.startTo = '';
    } else filters[key] = '';
    if (key === 'keyword') keyword.value = '';
    save();
  }
  function setKind(kind) {
    filters.kind = kind;
    save();
  }
  function setDraftMode(mode) {
    draft.value.mode = mode;
    if (mode === 'ONLINE') draft.value.campusId = '';
  }
  function setDraftCampus(index) {
    draft.value.campusId = campuses.value[index - 1]?.id || '';
    if (draft.value.campusId) draft.value.mode = 'OFFLINE';
  }
  function save() {
    uni.setStorageSync('edu-course-filters', { ...filters });
    pageNo.value = 1;
    refresh();
  }
  function search() {
    filters.keyword = keyword.value.trim();
    save();
  }
  function setDirection(d) {
    filters.direction = d;
    save();
  }
  function openFilter() {
    draft.value = {
      age: filters.age,
      mode: filters.mode,
      campusId: filters.campusId,
      level: filters.level,
      kind: filters.kind,
      startFrom: filters.startFrom,
      startTo: filters.startTo,
    };
    showFilter.value = true;
    edu
      .campuses()
      .then((d) => (campuses.value = listOf(d)))
      .catch(() => {});
  }
  function apply() {
    if (
      draft.value.startFrom &&
      draft.value.startTo &&
      draft.value.startFrom > draft.value.startTo
    ) {
      uni.showToast({ title: '结束日期不能早于开始日期', icon: 'none' });
      return;
    }
    if (draft.value.mode === 'ONLINE') draft.value.campusId = '';
    Object.assign(filters, draft.value);
    showFilter.value = false;
    save();
  }
  function reset() {
    Object.assign(filters, {
      direction: '',
      age: '',
      mode: '',
      campusId: '',
      keyword: '',
      level: '',
      kind: '',
      startFrom: '',
      startTo: '',
    });
    keyword.value = '';
    save();
  }
  async function more() {
    if (loading.value) return;
    pageNo.value++;
    await refresh();
    if (error.value) pageNo.value--;
  }
  watch(showFilter, (v) =>
    v ? uni.hideTabBar({ fail: () => {} }) : uni.showTabBar({ fail: () => {} }),
  );
  onUnmounted(() => uni.showTabBar({ fail: () => {} }));
  onLoad(refresh);
  onPageScroll((e) => {
    scrollTop = e.scrollTop;
    returning = true;
  });
  onShow(() => {
    const next = uni.getStorageSync('edu-next-course-context');
    if (next && typeof next === 'object') {
      uni.removeStorageSync('edu-next-course-context');
      Object.assign(
        filters,
        {
          direction: '',
          age: '',
          mode: '',
          campusId: '',
          keyword: '',
          level: '',
          kind: '',
          startFrom: '',
          startTo: '',
        },
        next,
      );
      keyword.value = filters.keyword;
      if (filters.mode === 'ONLINE') filters.campusId = '';
      scrollTop = 0;
      returning = false;
      uni.pageScrollTo({ scrollTop: 0, duration: 0 });
      save();
      return;
    }
    if (returning) uni.pageScrollTo({ scrollTop, duration: 0 });
  });
</script>
<style scoped>
  .course-canvas {
    min-height: 100vh;
    background: #f8f6f1;
  }
  .catalog-heading {
    padding-top: 25px;
    border-top: 1px solid #dccfbf;
  }
  .course-types {
    display: flex;
    gap: 4px;
    padding: 4px;
    border-radius: 14px;
    background: #eeeae1;
    margin: 20px 0 14px;
  }
  .type-choice {
    flex: 1;
    min-height: 44px;
    background: transparent;
    padding: 12px 6px;
    border-radius: 11px;
    font-size: 15px;
    margin: 0;
    color: #6e6e73;
    transition: background 120ms ease, color 120ms ease;
  }
  .type-choice.selected {
    background: #fffdf7;
    color: #a55130;
    font-weight: 750;
    box-shadow: 0 2px 5px #00000008;
  }
  .type-choice::after {
    border: 0;
  }
  .selected-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 16px;
  }
  .selected-filter {
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    min-height: 44px;
    max-width: 100%;
    font-size: 14px;
    background: #fff3e8;
    color: #c94b00;
    border-radius: 10px;
    padding: 10px 12px;
    margin: 0;
    overflow-wrap: anywhere;
  }
  .selected-filter > text {
    font-size: 20px;
    flex: none;
  }
  .recovery-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 12px;
  }
  @media (prefers-reduced-motion: reduce) {
    .type-choice {
      transition: none;
    }
  }
  .search-row {
    display: flex;
    gap: 8px;
    margin: 24px 0 16px;
  }
  .search-row .input {
    flex: 1;
  }
  .search-row .btn {
    padding: 12px 16px;
  }
  .filter-row {
    gap: 8px;
  }
  .directions {
    flex: 1;
    min-width: 0;
  }
  .no-wrap {
    flex-wrap: nowrap;
  }
  .no-wrap .chip {
    flex: none;
  }
  .results {
    margin: 12px 0;
  }
  .filter-mask {
    position: fixed;
    inset: 0;
    background: #0007;
    display: flex;
    align-items: flex-end;
    z-index: 50;
  }
  .filter-sheet {
    background: #fff;
    border-radius: 24px 24px 0 0;
    padding: 24px 24px calc(24px + env(safe-area-inset-bottom));
    width: 100%;
    max-width: 880px;
    margin: 0 auto;
    max-height: 90vh;
    overflow: auto;
  }
  .filter-actions {
    position: sticky;
    bottom: -24px;
    margin: 0 -10px;
    padding: 14px 10px 22px;
    background: #fffcf5f7;
    border-top: 1px solid #ded2c1;
  }
</style>
