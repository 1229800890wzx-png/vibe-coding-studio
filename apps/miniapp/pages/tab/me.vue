<template>
  <EduHeader home title="我的" /><view class="edu-page"
    ><view class="profile"
      ><image
        v-if="brand.logoUrl"
        :src="brand.logoUrl"
        mode="aspectFit"
        class="profile-icon"
      /><view v-else class="profile-icon">v.</view
      ><view
        ><view class="section-title">{{
          loggedIn ? user.userInfo.nickname || '家长，你好' : '你好，好奇心守护者。'
        }}</view
        ><view class="muted">陪孩子发现更多可能</view></view
      ></view
    ><button v-if="!loggedIn" class="btn" @tap="go('login')">登录 / 注册</button
    ><view v-else class="card children-summary" @tap="go('children')"
      ><view
        ><text class="strong">孩子档案</text
        ><view class="muted"
          >{{ family.students.length }} 位小创作者 ·
          {{ currentStudent?.name || '添加第一位孩子' }}</view
        ></view
      ><text class="orange">管理 ↗</text></view
    ><view class="section-head"><text class="section-title">我的服务</text></view
    ><view class="card menu"
      ><view v-for="m in menus" :key="m.page" class="menu-row" @tap="open(m)"
        ><view class="row"
          ><text class="menu-icon">{{ m.icon }}</text
          ><text class="strong">{{ m.name }}</text></view
        ><text class="muted">›</text></view
      ></view
    ><view class="card stack"
      ><view class="section-title">需要一点帮助？</view
      ><view class="muted">{{ config.supportHours || '查看客服服务时间与联系方式' }}</view
      ><button class="btn secondary" @tap="support">联系课程顾问</button></view
    ><view v-if="error" class="error">{{ error }}</view
    ><view class="row between"
      ><button class="link" @tap="policy('terms')">用户协议</button
      ><button class="link" @tap="policy('privacy')">隐私政策</button
      ><button v-if="loggedIn" class="link" @tap="logout">退出登录</button></view
    ><view class="foot">{{ brand.brandName }}<br />{{ brand.tagline }}</view></view
  >
</template>
<script setup>
  import { ref, computed } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import store from '@/sheep/store';
  import Auth from '@/sheep/api/member/auth';
  import { edu, unwrap } from '@/edu/api';
  import { brand, loadBrand } from '@/edu/brand';
  import {
    family,
    currentStudent,
    loadStudents,
    requireLogin,
    go,
    toast,
    confirm,
  } from '@/edu/state';
  const user = store('user'),
    loggedIn = computed(() => user.isLogin),
    config = ref({}),
    error = ref(''),
    menus = [
      { page: 'messages', name: '消息中心', icon: '◉' },
      { page: 'orders', name: '课程订单', icon: '▤' },
      { page: 'cart', name: '选课袋', icon: '＋' },
      { page: 'trials', name: '体验课预约', icon: '◷' },
      { page: 'one-to-one', name: '一对一高级课与预约', icon: '1:1', guest: true },
      { page: 'consultation', name: '课程咨询', icon: '◌' },
      { page: 'works', name: '孩子的作品集', icon: '✳' },
      { page: 'refunds', name: '退款与售后', icon: '↩' },
      { page: 'campuses', name: '城市与校区', icon: '⌖', guest: true },
    ];
  function open(m) {
    if (m.guest || requireLogin()) go(m.page);
  }
  async function support() {
    try {
      if (!config.value.supportPhone) config.value = await edu.config();
      if (config.value.supportPhone) uni.makePhoneCall({ phoneNumber: config.value.supportPhone });
      else toast('客服信息尚未发布，请稍后查看');
    } catch (e) {
      error.value = e.message;
    }
  }
  async function policy(type) {
    try {
      const c = await edu.config();
      const url = type === 'terms' ? c.termsUrl : c.privacyUrl;
      if (!url) {
        toast('协议尚未发布');
        return;
      }
      uni.navigateTo({ url: '/pages/public/webview?url=' + encodeURIComponent(url) });
    } catch (e) {
      error.value = e.message;
    }
  }
  async function logout() {
    if (!(await confirm('退出登录', '确认退出当前家长账号？'))) return;
    try {
      await unwrap(Auth.logout());
      await user.logout();
      family.students = [];
      family.currentId = null;
      uni.removeStorageSync('edu-current-student');
      uni.removeStorageSync('edu-checkout-items');
    } catch (e) {
      error.value = e.message;
    }
  }
  onShow(async () => {
    error.value = '';
    try {
      await loadStudents();
      config.value = await loadBrand(true);
    } catch (e) {
      error.value = e.message;
    }
  });
</script>
<style scoped>
  .profile {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 20px 0 28px;
  }
  .profile-icon {
    width: 64px;
    height: 64px;
    border-radius: 22px;
    background: #ff7a00;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 45px;
    font-weight: 800;
  }
  .children-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .menu {
    padding: 0 20px;
  }
  .menu-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 64px;
  }
  .menu-row + .menu-row {
    border-top: 1px solid #ececef;
  }
  .menu-icon {
    width: 26px;
    color: #c94b00;
    font-size: 22px;
  }
  .foot {
    text-align: center;
    font-size: 14px;
    color: #6e6e73;
    line-height: 2;
    margin-top: 28px;
  }
</style>
