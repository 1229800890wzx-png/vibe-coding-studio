<template>
  <view class="service-paths">
    <button class="service-path" @tap="showCourses({ ...discovery, kind: 'TRIAL' })">
      <text class="path-index">01 · 先体验</text><text class="path-title">体验课</text>
      <text class="path-description">初次接触<br />了解兴趣与基础</text
      ><text class="path-action">找体验课 ↗</text>
    </button>
    <button class="service-path" @tap="showCourses({ ...discovery, kind: 'REGULAR' })">
      <text class="path-index">02 · 系统学</text><text class="path-title">系统班课</text>
      <text class="path-description">按期学习<br />逐步完成项目</text
      ><text class="path-action">选正式班 ↗</text>
    </button>
    <button class="service-path private-path" @tap="go('one-to-one')">
      <text class="path-index">03 · 再进阶</text><text class="path-title">一对一高级课</text>
      <text class="path-description">个性化目标<br />自主选择老师</text
      ><text class="path-action">了解与预约 ↗</text>
    </button>
  </view>
</template>
<script setup>
  import { discovery, showCourses } from '@/edu/discovery';
  import { go } from '@/edu/state';
</script>
<style scoped>
  .service-paths {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin: 20px 0;
  }
  .service-path {
    margin: 0;
    padding: 16px 12px;
    border-radius: 16px;
    background: #fff;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    transition:
      transform 100ms ease,
      background 120ms ease;
  }
  .service-path:active {
    transform: scale(0.98);
  }
  .service-path::after {
    border: 0;
  }
  .path-index {
    color: #c94b00;
    font-size: 14px;
    margin-bottom: 10px;
  }
  .path-title {
    font-size: 17px;
    font-weight: 750;
    line-height: 1.4;
    min-height: 48px;
  }
  .path-description {
    font-size: 14px;
    line-height: 1.6;
    color: #6e6e73;
    margin: 8px 0 18px;
  }
  .path-action {
    margin-top: auto;
    font-size: 14px;
    color: #c94b00;
    line-height: 1.5;
  }
  .private-path {
    background: #1d1d1f;
    color: #fff;
  }
  .private-path .path-index,
  .private-path .path-action {
    color: #ffb36b;
  }
  .private-path .path-description {
    color: #d2d2d7;
  }
  @media (min-width: 600px) {
    .service-path {
      padding: 22px;
    }
    .path-title {
      font-size: 20px;
      min-height: auto;
    }
  }
  @media (max-width: 360px) {
    .service-paths {
      gap: 8px;
    }
    .service-path {
      padding: 14px 9px;
    }
    .path-title {
      font-size: 16px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .service-path {
      transition: none;
    }
    .service-path:active {
      transform: none;
    }
  }
</style>
