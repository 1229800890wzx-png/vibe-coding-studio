<template>
  <view class="parent-canvas">
    <EduHeader home title="家长中心" :child="loggedIn" @change="refresh" />
    <view class="parent-page">
      <view class="parent-greeting"
        ><view class="parent-account"
          ><image
            v-if="loggedIn && user.userInfo.avatar && !avatarFailed"
            class="parent-avatar"
            :src="user.userInfo.avatar"
            mode="aspectFill"
            @error="avatarFailed = true"
          /><view v-else class="parent-avatar">{{
            loggedIn ? (user.userInfo.nickname || '家长').slice(0, 1) : 'V'
          }}</view
          ><text>{{
            loggedIn ? user.userInfo.nickname || '家长，你好' : '你好，好奇心守护者'
          }}</text></view
        ><button class="parent-notice-button" aria-label="查看消息中心" @tap="open('messages')"
          ><ParentIcon name="bell" /><text v-if="unread !== null && unread > 0">{{
            unread > 99 ? '99+' : unread
          }}</text></button
        ></view
      >
      <text class="parent-eyebrow">FAMILY SPACE / 家长学习中心</text>
      <view class="parent-title">每一步成长，<br />都值得被看见。</view>
      <view class="parent-muted" style="margin-bottom: 23px"
        >孩子的课程、老师的反馈，以及下一次期待。</view
      >

      <view v-if="!loggedIn" class="parent-panel parent-guest"
        ><text class="parent-eyebrow">A LITTLE CLOSER, EVERY DAY.</text
        ><view class="parent-script">Growing, together.</view
        ><view class="parent-card-title">把陪伴，变成看得见的日常。</view
        ><view class="parent-muted" style="margin-top: 12px"
          >登录后，为每位孩子分别查看课表、作业与反馈。报名、预约和学习记录，都放在一起。</view
        ><button class="parent-primary" @tap="go('login')"
          >登录 / 注册家长账号 <text>↗</text></button
        ><button class="parent-text-button" @tap="tab('courses')">先看看课程与班期 →</button></view
      >
      <template v-else>
        <view
          v-if="state.family.loading && !state.family.data"
          class="parent-skeleton"
          aria-label="正在加载孩子档案"
        />
        <view v-else-if="state.family.error" class="parent-error"
          ><view>孩子档案暂未加载，请重试后查看学习信息。</view
          ><button class="parent-text-button" @tap="refresh">重试 ↻</button></view
        >
        <view v-else-if="!state.family.data?.length" class="parent-panel parent-empty"
          ><view class="parent-icon-tile"><ParentIcon name="child" /></view
          ><view class="parent-card-title">先认识这位小创作者。</view
          ><view class="parent-muted">添加孩子档案，让课程与成长记录有自己的归属。</view
          ><button class="parent-primary" @tap="go('children')"
            >添加第一位孩子 <text>＋</text></button
          ></view
        >
        <view v-else class="parent-panel parent-child-panel"
          ><view class="parent-child-heading"
            ><view
              ><text class="parent-eyebrow">{{ currentStudent?.grade || 'MY LITTLE CREATOR' }}</text
              ><view class="parent-child-name">{{ currentStudent?.name }}</view
              ><view class="parent-micro">专属学习档案 · 顶部可切换孩子</view></view
            ><view
              ><text class="parent-child-art">Grow.</text
              ><button
                class="parent-text-button subtle"
                style="display: block; text-align: right"
                @tap="go('children')"
                >管理档案 ↗</button
              ></view
            ></view
          ><view class="parent-metrics"
            ><view
              ><view class="parent-metric-number">{{ activeCount }}<text>门</text></view
              ><view class="parent-metric-label">正在学习</view></view
            ><view
              ><view class="parent-metric-number">{{ upcomingCount ?? '—' }}<text>节</text></view
              ><view class="parent-metric-label">课表待上</view></view
            ><view
              ><view class="parent-metric-number">{{ pendingCount }}<text>项</text></view
              ><view class="parent-metric-label">待完成作业</view></view
            ></view
          ></view
        >
        <view v-if="state.learning.error" class="parent-error"
          ><view>学习记录暂未加载，订单与咨询入口仍可使用。</view
          ><button class="parent-text-button" @tap="refresh">重新加载</button></view
        >
        <view v-if="state.learning.loading" class="parent-skeleton" aria-label="正在加载课程信息" />
      </template>

      <view class="parent-columns">
        <view>
          <ParentNextLesson
            v-if="loggedIn && state.learning.data"
            :session="nextSession"
            :student-id="family.currentId"
            :enrolled="courses.length > 0"
          />
          <view class="parent-shortcuts"
            ><button
              v-for="item in shortcuts"
              :key="item.name"
              class="parent-shortcut"
              @tap="open(item.page, item.params)"
              ><view class="parent-icon-tile"
                ><ParentIcon :name="item.icon" /><text v-if="item.count > 0" class="parent-badge">{{
                  item.count > 99 ? '99+' : item.count
                }}</text></view
              ><text>{{ item.name }}</text></button
            ></view
          >
          <template v-if="loggedIn && courses.length"
            ><view class="parent-section-head"
              ><text class="parent-section-title">正在积累的能力</text
              ><button class="parent-text-button" @tap="tab('learning')">学习空间 ↗</button></view
            ><ParentCourseCard :course="featuredCourse" :student-id="family.currentId" /><view
              class="parent-micro"
              style="margin: -5px 4px 20px"
              >进度按已发布课表计算；出勤与付费课时以实际记录为准。</view
            ></template
          >
          <ParentFeedback
            v-if="loggedIn && state.family.data?.length && !state.feedback.loading"
            :item="feedback[0]"
            :student-id="family.currentId"
            :error="state.feedback.error"
            @retry="refresh"
          />
          <view
            v-else-if="state.feedback.loading"
            class="parent-skeleton"
            aria-label="正在加载老师反馈"
          />
          <view class="parent-section-head"
            ><text class="parent-section-title">课程与订单</text
            ><text class="parent-micro">每一次选择，都有记录</text></view
          >
          <view class="parent-panel parent-menu"
            ><button
              v-for="item in orderServices"
              :key="item.page"
              class="parent-menu-row"
              @tap="open(item.page, item.params)"
              ><ParentIcon :name="item.icon" /><view class="parent-menu-copy"
                ><view>{{ item.title }}</view
                ><text>{{ item.desc }}</text></view
              ><text class="parent-menu-tail">{{ item.tail || '↗' }}</text></button
            ></view
          >
          <view class="parent-panel"
            ><button
              class="parent-credit-toggle"
              :aria-expanded="creditOpen"
              @tap="creditOpen = !creditOpen"
              ><view class="parent-credit-heading"
                ><ParentIcon name="wallet" /><view
                  >体验与续课规则<view class="parent-micro">先体验 4 节，喜欢再继续</view></view
                ></view
              ><text>{{ creditOpen ? '−' : '＋' }}</text></button
            ><view v-if="creditOpen" class="parent-credit-body"
              ><view class="parent-credit-math"
                ><view
                  ><text>¥{{ groupOffer.trialPrice }}</text
                  ><view>前 {{ groupOffer.trialLessons }} 节体验</view></view
                ><text>＋</text
                ><view
                  ><text>¥{{ upgradeBalance }}</text
                  ><view>继续剩余 {{ remainingLessons }} 节</view></view
                ><text>＝</text
                ><view
                  ><text>¥{{ groupOffer.activityPrice }}</text
                  ><view>合计 {{ groupOffer.lessons }} 节</view></view
                ></view
              ><view class="parent-muted"
                >体验费全额抵扣。续课前核验同一孩子的已支付体验订单；这里展示课程规则，具体抵扣状态由订单核验确认。</view
              ><button class="parent-text-button" @tap="open('orders')">查看我的订单 ↗</button
              ><button
                class="parent-text-button"
                @tap="open('consultation', { studentId: family.currentId, topic: 'trial-credit' })"
                >咨询抵扣与续课 ↗</button
              ></view
            ></view
          >
        </view>
        <view>
          <view class="parent-section-head"
            ><text class="parent-section-title">学习服务</text
            ><text class="parent-micro">给每一次探索，多一点支持</text></view
          >
          <view class="parent-panel parent-menu"
            ><button
              v-for="item in learningServices"
              :key="item.title"
              class="parent-menu-row"
              @tap="open(item.page, item.params)"
              ><ParentIcon :name="item.icon" /><view class="parent-menu-copy"
                ><view>{{ item.title }}</view
                ><text>{{ item.desc }}</text></view
              ><text class="parent-menu-tail">↗</text></button
            ></view
          >
          <view class="parent-panel parent-help"
            ><text class="parent-eyebrow">ALWAYS BY YOUR SIDE / 我们在这里</text
            ><view class="parent-script">A little guidance.</view
            ><view class="parent-card-title">有问题，可以慢慢聊。</view
            ><view class="parent-muted">{{
              config.supportHours || '课程选择、上课安排或学习建议，都可以告诉我们。'
            }}</view
            ><button
              class="parent-text-button"
              @tap="open('consultation', { studentId: family.currentId })"
              >联系课程顾问 ↗</button
            ><button
              v-if="config.supportPhone"
              class="parent-text-button"
              style="margin-left: 20px"
              @tap="support"
              >电话咨询 ↗</button
            ><view v-if="actionError" class="parent-micro">{{ actionError }}</view></view
          >
          <view class="parent-panel parent-menu"
            ><button class="parent-menu-row" @tap="openStudio('mentors')"
              ><ParentIcon name="mentor" /><view class="parent-menu-copy"
                ><view>认识我们的导师</view><text>了解导师背景与教学团队</text></view
              ><text class="parent-menu-tail">↗</text></button
            ><button class="parent-menu-row" @tap="openStudio('courses')"
              ><ParentIcon name="book" /><view class="parent-menu-copy"
                ><view>了解课程体系</view><text>基础认知 · 工具协作 · 项目实战</text></view
              ><text class="parent-menu-tail">↗</text></button
            ></view
          >
        </view>
      </view>
      <view class="parent-footer"
        ><button class="parent-text-button" @tap="policy('terms')">用户协议</button
        ><button class="parent-text-button" @tap="policy('privacy')">隐私政策</button
        ><button v-if="loggedIn" class="parent-text-button" :disabled="loggingOut" @tap="logout">{{
          loggingOut ? '正在退出…' : '退出登录'
        }}</button></view
      >
      <view class="parent-brand-sign">VIBE CODING · GROWING TOGETHER</view>
    </view>
  </view>
</template>
<script setup>
  import { ref, computed } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import ParentIcon from '@/components/edu/ParentIcon.vue';
  import ParentNextLesson from '@/components/edu/ParentNextLesson.vue';
  import ParentCourseCard from '@/components/edu/ParentCourseCard.vue';
  import ParentFeedback from '@/components/edu/ParentFeedback.vue';
  import { useParentSpace } from '@/edu/parent-space';
  import { family, currentStudent, go, tab, confirm, toast } from '@/edu/state';
  import { loadBrand } from '@/edu/brand';
  import { openStudio } from '@/edu/studio';
  import { groupOffer, upgradeBalance, remainingLessons } from '@/edu/course-schedule';
  import { edu, unwrap } from '@/edu/api';
  import Auth from '@/sheep/api/member/auth';
  const {
    user,
    loggedIn,
    state,
    refresh,
    courses,
    upcomingCount,
    nextSession,
    feedback,
    pending,
    unread,
    unpaid,
  } = useParentSpace();
  const config = ref({}),
    actionError = ref(''),
    creditOpen = ref(false),
    avatarFailed = ref(false),
    loggingOut = ref(false);
  const activeCount = computed(() =>
    state.learning.data ? courses.value.filter((c) => c.status === 'ACTIVE').length : '—',
  );
  const pendingCount = computed(() => (state.learning.data ? pending.value.length : '—'));
  const featuredCourse = computed(
    () => courses.value.find((c) => c.status === 'ACTIVE') || courses.value[0],
  );
  const shortcuts = computed(() => [
    { name: '待支付', icon: 'wallet', page: 'orders', params: { status: 0 }, count: unpaid.value },
    {
      name: '课表',
      icon: 'calendar',
      page: 'learning-list',
      params: { type: 'calendar', studentId: family.currentId },
    },
    {
      name: '老师反馈',
      icon: 'feedback',
      page: 'learning-list',
      params: { type: 'reviews', studentId: family.currentId },
    },
    { name: '作品集', icon: 'spark', page: 'works', params: { studentId: family.currentId } },
  ]);
  const orderServices = computed(() => [
    { title: '全部课程订单', desc: '付款、报名与退款记录', page: 'orders', icon: 'order' },
    { title: '体验课预约', desc: '查看预约时间与体验安排', page: 'trials', icon: 'calendar' },
    { title: '选课袋', desc: '继续确认已选课程', page: 'cart', icon: 'bag' },
    { title: '退款与售后', desc: '申请与处理进度', page: 'refunds', icon: 'shield' },
  ]);
  const learningServices = computed(() => [
    { title: '孩子档案', desc: '分别管理每位孩子的信息', page: 'children', icon: 'child' },
    { title: '一对一指导', desc: '选择导师，沟通学习目标', page: 'one-to-one', icon: 'mentor' },
    {
      title: '成长报告',
      desc: '把阶段进步看得更清楚',
      page: 'learning-list',
      params: { type: 'reports', studentId: family.currentId },
      icon: 'report',
    },
    {
      title: '请假与调班',
      desc: '查看申请与处理结果',
      page: 'learning-list',
      params: { type: 'requests', studentId: family.currentId },
      icon: 'switch',
    },
    { title: '城市与校区', desc: '了解线下地点与到校信息', page: 'campuses', icon: 'location' },
  ]);
  function open(page, params = {}) {
    if (loggedIn.value || ['campuses', 'one-to-one'].includes(page)) return go(page, params);
    const query = Object.entries(params)
      .filter(([, v]) => v != null)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    go('login', { returnTo: `/pages/edu/${page}${query ? '?' + query : ''}` });
  }
  async function support() {
    try {
      if (!config.value.supportPhone) config.value = await edu.config();
      if (config.value.supportPhone) uni.makePhoneCall({ phoneNumber: config.value.supportPhone });
      else toast('联系方式尚未发布，可以先提交课程咨询');
    } catch (e) {
      actionError.value = e.message;
    }
  }
  async function policy(type) {
    try {
      const c = await edu.config();
      const url = type === 'terms' ? c.termsUrl : c.privacyUrl;
      if (!url) return toast('协议尚未发布');
      uni.navigateTo({ url: '/pages/public/webview?url=' + encodeURIComponent(url) });
    } catch (e) {
      actionError.value = e.message;
    }
  }
  async function logout() {
    if (loggingOut.value || !(await confirm('退出登录', '确认退出当前家长账号？'))) return;
    loggingOut.value = true;
    try {
      await unwrap(Auth.logout());
      await user.logout();
      family.students = [];
      family.currentId = null;
      family.loaded = false;
      uni.removeStorageSync('edu-current-student');
      uni.removeStorageSync('edu-checkout-items');
    } catch (e) {
      actionError.value = e.message;
    } finally {
      loggingOut.value = false;
    }
  }
  onShow(() => {
    actionError.value = '';
    loadBrand(true)
      .then((data) => (config.value = data))
      .catch(() => {});
  });
</script>
