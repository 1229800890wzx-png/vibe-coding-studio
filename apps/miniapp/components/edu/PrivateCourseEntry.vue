<template>
  <button class="private-entry" @tap="go('one-to-one')">
    <view class="private-mark">1:1</view>
    <view class="private-copy"
      ><view class="private-title">一对一高级课</view
      ><view class="private-description">专属创作指导 · 自选老师 · 预约沟通</view></view
    >
    <text class="private-arrow">↗</text>
  </button>
</template>
<script setup>
  import { go } from '@/edu/state';
</script>
<style scoped>
  .private-entry {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    padding: 20px 16px;
    margin: 20px 0 24px;
    background: linear-gradient(135deg, #fffcf6, #f1e8da);
    color: #34382c;
    border: 1px solid #dbcbb7;
    box-shadow: inset 0 0 0 2px #fff9;
    border-radius: 16px;
    text-align: left;
    line-height: 1.5;
    transition: transform 0.12s, background 0.12s;
  }
  .private-entry:active {
    transform: scale(0.99);
    background: #ece0ce;
  }
  .private-entry::after {
    border: 0;
  }
  .private-mark {
    display: grid;
    place-items: center;
    flex: none;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: #eee0cc;
    color: #9c5833;
    font-size: 22px;
    font-weight: 750;
    letter-spacing: -1px;
  }
  .private-copy {
    flex: 1;
    min-width: 0;
  }
  .private-title {
    font-size: 18px;
    font-weight: 700;
  }
  .private-description {
    font-size: 14px;
    color: #757362;
    margin-top: 4px;
  }
  .private-arrow {
    font-size: 25px;
    color: #a45d35;
    flex: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .private-entry {
      transition: none;
    }
    .private-entry:active {
      transform: none;
    }
  }
</style>
