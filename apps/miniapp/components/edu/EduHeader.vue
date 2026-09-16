<template
  ><view class="edu-header" :style="navigation.outer"
    ><view class="header-inner" :style="navigation.inner"
      ><view class="brand" @tap="home ? tab('home') : back()"
        ><text v-if="!home" class="back">‹</text
        ><image
          v-if="brand.logoUrl"
          class="brand-logo"
          :src="brand.logoUrl"
          mode="aspectFit"
        /><text v-else class="brand-mark">v.</text><text>{{ title || brand.brandName }}</text></view
      ><button v-if="child" class="child" @tap="switchOpen = true"
        ><text class="child-name">{{ currentStudent?.name || '选择孩子' }}</text
        ><text>⌄</text></button
      ><button v-else-if="cart" class="child" @tap="go('cart')"
        >选课袋 <text>＋</text></button
      ></view
    ></view
  ><view v-if="switchOpen" class="scrim" @tap="switchOpen = false"
    ><view class="sheet" @tap.stop
      ><view class="row between"
        ><text class="section-title">为哪位孩子查看？</text
        ><button class="link" @tap="switchOpen = false">关闭</button></view
      ><view class="muted">切换孩子后，学习内容随之切换。</view
      ><button v-for="s in family.students" :key="s.id" class="student-choice" @tap="pick(s.id)"
        ><text>{{ s.name }}</text
        ><text class="orange">{{ s.id === family.currentId ? '当前孩子' : '选择' }}</text></button
      ><button
        class="btn secondary"
        @tap="
          switchOpen = false;
          go('children');
        "
        >管理孩子档案</button
      ></view
    ></view
  ></template
>
<script setup>
  import { ref, watch, onUnmounted, onMounted } from 'vue';
  import { brand, loadBrand } from '@/edu/brand';
  import { family, currentStudent, selectStudent, go, tab } from '@/edu/state';
  defineProps({ title: String, child: Boolean, home: Boolean, cart: Boolean });
  const emit = defineEmits(['change']);
  const switchOpen = ref(false);
  const navigation = { outer: {}, inner: {} };
  // #ifdef MP-WEIXIN
  const system = uni.getSystemInfoSync();
  const capsule = uni.getMenuButtonBoundingClientRect();
  const statusBar = system.statusBarHeight || 20;
  navigation.outer = { paddingTop: statusBar + 'px' };
  if (capsule?.width && capsule?.top) {
    navigation.inner = {
      height: Math.max(44, capsule.height + (capsule.top - statusBar) * 2) + 'px',
      paddingRight: Math.max(16, system.windowWidth - capsule.left + 12) + 'px',
    };
  }
  // #endif
  onMounted(() => {
    loadBrand().catch(() => {});
  });
  watch(switchOpen, (v) =>
    v ? uni.hideTabBar({ fail: () => {} }) : uni.showTabBar({ fail: () => {} }),
  );
  onUnmounted(() => uni.showTabBar({ fail: () => {} }));
  function pick(id) {
    selectStudent(id);
    switchOpen.value = false;
    emit('change', id);
  }
  function back() {
    if (getCurrentPages().length > 1) uni.navigateBack();
    else tab('home');
  }
</script>
<style scoped>
  .edu-header {
    padding-top: env(safe-area-inset-top);
    background: rgba(248, 246, 241, 0.97);
    border-bottom: 1px solid #e2d9cc70;
    position: sticky;
    top: 0;
    z-index: 20;
  }
  .header-inner {
    height: 64px;
    padding: 0 16px;
    max-width: 880px;
    margin: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: 15px;
    letter-spacing: 0.2px;
    font-weight: 750;
    min-height: 44px;
    min-width: 0;
    flex: 1;
  }
  .brand > text:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .brand-mark {
    display: flex;
    justify-content: center;
    align-items: center;
    background: #ba4b27;
    color: #fffaf3;
    border-radius: 9px;
    width: 30px;
    height: 30px;
    font-size: 25px;
    font-weight: 900;
  }
  .brand-logo {
    width: 30px;
    height: 30px;
    flex: none;
  }
  .back {
    font-size: 30px;
    min-width: 16px;
  }
  .child {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    font-size: 14px;
    font-weight: 600;
    background: #fffcf6;
    border: 1px solid #e1d6c5;
    border-radius: 12px;
    padding: 10px 12px;
    margin: 0;
    max-width: 48%;
    min-width: 0;
  }
  .child-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .scrim {
    position: fixed;
    inset: 0;
    background: #0007;
    z-index: 60;
    display: flex;
    align-items: flex-end;
  }
  .sheet {
    background: white;
    width: 100%;
    max-width: 880px;
    margin: auto auto 0;
    border-radius: 24px 24px 0 0;
    padding: 24px 24px calc(24px + env(safe-area-inset-bottom));
    max-height: 80vh;
    overflow: auto;
  }
  .student-choice {
    display: flex;
    justify-content: space-between;
    background: #f5f5f7;
    min-height: 56px;
    margin: 12px 0;
    padding: 16px;
    border-radius: 12px;
  }
</style>
