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
    grid-template-columns: 1fr;
    gap: 10px;
    margin: 20px 0;
  }
  .service-path {
    margin: 0;
    padding: 18px;
    border-radius: 16px;
    background: #fffcf7;
    border: 1px solid #dfd3c1;
    box-shadow: inset 0 0 0 2px #fff9;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: flex-start;
    text-align: left;
    transition: transform 100ms ease, background 120ms ease;
  }
  .service-path:active {
    transform: scale(0.98);
  }
  .service-path::after {
    border: 0;
  }
  .path-index {
    color: #a5643d;
    font-size: 11px;
    margin-bottom: 10px;
  }
  .path-title {
    font-size: 17px;
    font-weight: 750;
    line-height: 1.4;
    min-height: 0;
    grid-column: 1;
  }
  .path-description {
    font-size: 12px;
    line-height: 1.6;
    color: #797464;
    margin: 8px 0 0;
    grid-column: 1;
  }
  .path-action {
    margin-top: 0;
    grid-column: 2;
    grid-row: 2 / 4;
    align-self: center;
    font-size: 12px;
    color: #a55731;
    line-height: 1.5;
  }
  .private-path {
    background: #f3ecdf;
    color: #393b30;
  }
  .private-path .path-index,
  .private-path .path-action {
    color: #9b613d;
  }
  .private-path .path-description {
    color: #797262;
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
