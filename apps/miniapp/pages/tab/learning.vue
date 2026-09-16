<template>
  <view class="parent-canvas">
    <EduHeader home title="学习空间" :child="loggedIn" @change="refresh" />
    <view class="parent-page">
      <view class="parent-greeting"
        ><view
          ><text class="parent-eyebrow">A LITTLE PROGRESS, EVERY DAY.</text
          ><view class="parent-title">{{
            loggedIn && currentStudent
              ? currentStudent.name + '的学习日常。'
              : '让好奇心，慢慢长大。'
          }}</view
          ><view class="parent-muted">每一次尝试，都有新的收获。</view></view
        ><text class="parent-script learning-art">Keep<br />creating.</text></view
      >
      <view v-if="!loggedIn" class="parent-panel parent-guest"
        ><view class="parent-icon-tile"><ParentIcon name="book" /></view
        ><view class="parent-card-title" style="margin-top: 18px">为孩子留下一份成长记录。</view
        ><view class="parent-muted" style="margin-top: 12px"
          >课程日历、创作作业和导师反馈，在这里串成孩子自己的学习旅程。</view
        ><button class="parent-primary" @tap="go('login')">登录后查看学习空间 ↗</button
        ><button class="parent-text-button" @tap="tab('courses')">先了解课程 →</button></view
      >
      <template v-else>
        <view
          v-if="state.family.loading && !state.family.data"
          class="parent-skeleton"
          aria-label="正在读取孩子档案"
        />
        <view v-else-if="state.family.error" class="parent-error"
          ><view>孩子档案暂未加载，请重试。</view
          ><button class="parent-text-button" @tap="refresh">重试 ↻</button></view
        >
        <view v-else-if="!state.family.data?.length" class="parent-panel parent-empty"
          ><view class="parent-icon-tile"><ParentIcon name="child" /></view
          ><view class="parent-card-title">从一份孩子档案开始。</view
          ><view class="parent-muted">添加孩子后，已报名课程、作业与反馈会分别整理。</view
          ><button class="parent-primary" @tap="go('children')">添加孩子 ＋</button></view
        >
        <template v-else>
          <view class="parent-tabs" role="group" aria-label="学习内容切换"
            ><button
              v-for="item in tabs"
              :key="item.key"
              :class="{ active: activeTab === item.key }"
              :aria-pressed="activeTab === item.key"
              @tap="activeTab = item.key"
              >{{ item.label
              }}<text v-if="item.key === 'tasks' && pending.length">
                · {{ pending.length }}</text
              ></button
            ></view
          >
          <view
            v-if="state.learning.loading"
            class="parent-skeleton"
            aria-label="正在读取学习记录"
          />
          <view v-else-if="state.learning.error" class="parent-error"
            ><view>这次未能读取学习记录。</view
            ><button class="parent-text-button" @tap="refresh">重新加载</button></view
          >
          <template v-if="state.learning.data && !state.learning.loading">
            <template v-if="activeTab === 'overview'">
              <view class="parent-columns"
                ><view
                  ><ParentNextLesson
                    :session="nextSession"
                    :student-id="family.currentId"
                    :enrolled="courses.length > 0"
                  /><view class="learning-stat-strip"
                    ><view
                      ><text>{{ activeCourses }}</text
                      ><view>正在学习 / 门</view></view
                    ><view
                      ><text>{{ upcomingCount ?? '—' }}</text
                      ><view>课表待上 / 节</view></view
                    ><view
                      ><text>{{ workCount }}</text
                      ><view>创作作品 / 件</view></view
                    ></view
                  ><view class="parent-section-head"
                    ><text class="parent-section-title">我的学习旅程</text
                    ><button class="parent-text-button" @tap="activeTab = 'courses'"
                      >全部课程 ↗</button
                    ></view
                  ><ParentCourseCard
                    v-for="course in courses.slice(0, 2)"
                    :key="course.id"
                    :course="course"
                    :student-id="family.currentId"
                  /><view v-if="!courses.length" class="parent-panel parent-empty"
                    ><view class="parent-card-title">第一段旅程，从兴趣开始。</view
                    ><view class="parent-muted">报名生效后的课程会显示在这里。</view
                    ><button class="parent-text-button" @tap="tab('courses')"
                      >发现适合孩子的课程 ↗</button
                    ></view
                  ></view
                ><view
                  ><view class="parent-section-head"
                    ><text class="parent-section-title">下一件小事</text
                    ><button class="parent-text-button" @tap="activeTab = 'tasks'"
                      >待办清单 ↗</button
                    ></view
                  ><button
                    v-for="item in pending.slice(0, 2)"
                    :key="item.id"
                    class="parent-task parent-panel"
                    @tap="assignment(item)"
                    ><ParentIcon name="pen" /><view
                      ><view class="parent-card-title">{{ item.title }}</view
                      ><view class="parent-micro">{{
                        item.submission?.status === 'REVISION_REQUIRED'
                          ? '老师建议修改后再试一次'
                          : '记录想法，继续创作'
                      }}</view></view
                    ><text>↗</text></button
                  ><view v-if="!pending.length" class="parent-panel"
                    ><view class="parent-card-title small-title">这一刻，给好奇心留点时间。</view
                    ><view class="parent-muted" style="margin-top: 8px"
                      >当前没有待完成的作业。也可以回看自己的作品和老师的建议。</view
                    ><button
                      class="parent-text-button"
                      @tap="go('works', { studentId: family.currentId })"
                      >回看孩子的作品 ↗</button
                    ></view
                  ><view v-if="state.feedback.loading" class="parent-skeleton" /><ParentFeedback
                    v-else
                    :item="feedback[0]"
                    :student-id="family.currentId"
                    :error="state.feedback.error"
                    @retry="refresh" /></view
              ></view>
            </template>
            <template v-else-if="activeTab === 'courses'">
              <view class="parent-section-head"
                ><text class="parent-section-title">每门课，都有自己的进度。</text></view
              ><view class="parent-filter" role="group" aria-label="课程状态"
                ><button
                  v-for="item in filters"
                  :key="item.key"
                  :class="{ active: courseFilter === item.key }"
                  @tap="courseFilter = item.key"
                  >{{ item.label }}</button
                ></view
              ><ParentCourseCard
                v-for="course in filteredCourses"
                :key="course.id"
                :course="course"
                :student-id="family.currentId"
              /><view v-if="!filteredCourses.length" class="parent-panel parent-empty"
                ><view class="parent-card-title">{{
                  courses.length ? '这个分类里还没有课程' : '学习旅程，即将开始'
                }}</view
                ><view class="parent-muted">{{
                  courses.length
                    ? '切换分类，查看孩子的其他课程。'
                    : '已报名并生效的课程会在这里显示。'
                }}</view
                ><button
                  class="parent-text-button"
                  @tap="courses.length ? (courseFilter = '') : tab('courses')"
                  >{{ courses.length ? '查看全部课程' : '去看看课程' }} ↗</button
                ></view
              ><view class="parent-micro" style="margin: 10px 4px"
                >课表进度按已发布课次计算，不代表出勤或付费课时扣减。</view
              >
            </template>
            <template v-else-if="activeTab === 'tasks'">
              <view class="parent-section-head"
                ><text class="parent-section-title">把想法，再向前推进一点。</text></view
              ><button
                v-for="item in pending"
                :key="item.id"
                class="parent-task parent-panel"
                @tap="assignment(item)"
                ><ParentIcon name="pen" /><view
                  ><view class="parent-card-title">{{ item.title }}</view
                  ><view class="parent-micro"
                    >{{
                      item.submission?.status === 'REVISION_REQUIRED'
                        ? '待修改'
                        : item.submission?.status === 'DRAFT'
                        ? '草稿待完成'
                        : '待开始'
                    }}
                    ·
                    {{
                      item.dueTime ? '截止 ' + dateParts(item.dueTime).date : '按自己的节奏完成'
                    }}</view
                  ></view
                ><text>↗</text></button
              ><view v-if="!pending.length" class="parent-panel parent-empty"
                ><view class="parent-icon-tile"><ParentIcon name="spark" /></view
                ><view class="parent-card-title">当前没有待完成作业。</view
                ><view class="parent-muted">新的任务发布后会显示在这里。</view></view
              ><button class="parent-text-button" @tap="tool('assignments')"
                >查看全部作业与提交记录 ↗</button
              >
            </template>
          </template>
          <template v-if="activeTab === 'feedback'">
            <view class="parent-section-head"
              ><text class="parent-section-title">听见每一次进步。</text
              ><button class="parent-text-button" @tap="tool('reviews')">全部反馈 ↗</button></view
            ><view v-if="state.feedback.loading" class="parent-skeleton" /><ParentFeedback
              v-for="item in feedback.slice(0, 4)"
              :key="item.id"
              :item="item"
              :student-id="family.currentId"
            /><ParentFeedback
              v-if="!feedback.length && !state.feedback.loading"
              :student-id="family.currentId"
              :error="state.feedback.error"
              @retry="refresh"
            /><view class="parent-section-head"
              ><text class="parent-section-title">阶段成长报告</text></view
            ><view v-if="state.reports.loading" class="parent-skeleton" /><view
              v-else-if="state.reports.error"
              class="parent-error"
              ><view>成长报告暂未加载。</view
              ><button class="parent-text-button" @tap="refresh">重试</button></view
            ><view v-else-if="latestReport" class="parent-panel"
              ><text class="parent-eyebrow">LEARNING REFLECTION</text
              ><view class="parent-card-title" style="margin: 10px 0">{{ latestReport.title }}</view
              ><view class="parent-feedback-content">{{
                latestReport.summary || latestReport.content
              }}</view
              ><button class="parent-text-button" @tap="tool('reports')"
                >阅读完整报告 ↗</button
              ></view
            ><view v-else class="parent-panel"
              ><view class="parent-card-title small-title">把变化，慢慢记下来。</view
              ><view class="parent-muted" style="margin-top: 9px"
                >老师发布阶段报告后，会在这里记录孩子的积累与下一步方向。</view
              ></view
            >
          </template>
          <view class="parent-section-head"
            ><text class="parent-section-title">随手可用的学习工具</text></view
          ><view class="parent-resource-grid"
            ><button
              v-for="item in tools"
              :key="item.type"
              class="parent-resource parent-panel"
              @tap="tool(item.type)"
              ><ParentIcon :name="item.icon" /><view>{{ item.name }}</view
              ><text>{{ item.desc }}</text></button
            ></view
          >
        </template>
      </template>
      <view class="parent-brand-sign">SMALL STEPS. REAL UNDERSTANDING.</view>
    </view>
  </view>
</template>
<script setup>
  import { ref, computed } from 'vue';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import ParentIcon from '@/components/edu/ParentIcon.vue';
  import ParentNextLesson from '@/components/edu/ParentNextLesson.vue';
  import ParentCourseCard from '@/components/edu/ParentCourseCard.vue';
  import ParentFeedback from '@/components/edu/ParentFeedback.vue';
  import { useParentSpace } from '@/edu/parent-space';
  import { family, currentStudent, go, tab } from '@/edu/state';
  import { dateParts, count } from '@/edu/parent-space-data';
  const { loggedIn, state, refresh, courses, upcomingCount, nextSession, feedback, pending } =
    useParentSpace();
  const activeTab = ref('overview'),
    courseFilter = ref('');
  const tabs = [
    { key: 'overview', label: '总览' },
    { key: 'courses', label: '课程' },
    { key: 'tasks', label: '待办' },
    { key: 'feedback', label: '反馈' },
  ];
  const filters = [
    { key: '', label: '全部课程' },
    { key: 'ACTIVE', label: '学习中' },
    { key: 'COMPLETED', label: '已结课' },
  ];
  const filteredCourses = computed(() =>
    courses.value.filter((c) => !courseFilter.value || c.status === courseFilter.value),
  );
  const activeCourses = computed(() => courses.value.filter((c) => c.status === 'ACTIVE').length);
  const workCount = computed(() => count(state.learning.data?.stats?.works) ?? '—');
  const latestReport = computed(() => state.reports.data?.[0] || null);
  const tools = [
    { type: 'calendar', name: '课程日历', icon: 'calendar', desc: '课次、时间与课前准备' },
    { type: 'assignments', name: '全部作业', icon: 'pen', desc: '想法、提交与修改记录' },
    { type: 'materials', name: '学习资料', icon: 'folder', desc: '课件与参考文件' },
    { type: 'reviews', name: '老师反馈', icon: 'feedback', desc: '已经做好的与下一步' },
    { type: 'reports', name: '成长报告', icon: 'report', desc: '记录阶段积累与变化' },
    { type: 'requests', name: '请假调班', icon: 'switch', desc: '查看申请处理进度' },
  ];
  function tool(type) {
    go('learning-list', { type, studentId: family.currentId });
  }
  function assignment(item) {
    go('assignment', { id: item.id, studentId: family.currentId });
  }
</script>
<style scoped>
  .learning-art {
    font-size: 27px;
    text-align: right;
    flex: none;
    line-height: 1.05;
    opacity: 0.8;
  }
  .parent-greeting > view {
    min-width: 0;
  }
  .learning-stat-strip {
    display: flex;
    justify-content: space-around;
    padding: 10px 0 20px;
    margin: 0 0 15px;
    border-bottom: 1px solid #ded2bd;
    text-align: center;
  }
  .learning-stat-strip > view > text {
    font-size: 29px;
    font-weight: 500;
    color: #727b59;
  }
  .learning-stat-strip > view > view {
    font-size: 10px;
    color: #8d806b;
    margin-top: 5px;
  }
</style>
