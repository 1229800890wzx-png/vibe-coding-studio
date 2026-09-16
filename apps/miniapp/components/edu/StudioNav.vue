<template>
  <view class="studio-nav">
    <button
      v-for="item in studioNav"
      :key="item.id"
      class="studio-nav-item"
      @tap="openStudio(item.id)"
    >
      <image
        :src="'/static/studio/icons/' + item.icon + '.png'"
        class="studio-nav-icon"
        mode="aspectFit"
      />
      <text class="studio-nav-title">{{ item.title }}</text
      ><text class="studio-nav-note">{{ item.note }}</text>
    </button>
  </view>
</template>
<script setup>
  import { studioNav, openStudio } from '@/edu/studio';
</script>
