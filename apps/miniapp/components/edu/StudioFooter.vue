<template>
  <view class="studio-footer">
    <text class="studio-script">A little wonder.</text>
    <view class="studio-h2">从一个小小的想法开始。</view>
    <view class="studio-body">先了解课程，再找到适合孩子的学习起点。</view>
    <button class="btn" @tap="showCourses({ ...discovery })">查看课程与班期 <text>↗</text></button>
    <button v-if="officialWebsiteUrl" class="link" @tap="openOfficialWebsite"
      >访问完整官网 ↗</button
    >
    <!-- #ifdef MP-WEIXIN -->
    <button class="link" open-type="share">分享给朋友 ↗</button>
    <!-- #endif -->
    <view class="studio-colophon">VIBE CODING · 少儿创造力实验室</view>
  </view>
</template>
<script setup>
  import { discovery, showCourses } from '@/edu/discovery';
  import { officialWebsiteUrl, openOfficialWebsite } from '@/edu/studio';
</script>
