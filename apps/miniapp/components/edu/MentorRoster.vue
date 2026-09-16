<template>
  <view class="mentor-roster" :class="{ compact }">
    <view v-for="profile in profiles" :key="profile.key" class="roster-card">
      <view class="roster-photo">
        <image
          v-if="profile.avatarUrl && !failedPhotos[profile.key]"
          :src="profile.avatarUrl"
          :alt="profile.name + '老师的照片'"
          mode="aspectFill"
          @error="failedPhotos[profile.key] = true"
        />
        <view v-else class="portrait-pending"
          ><text class="portrait-initial">{{ profile.initial || profile.name?.slice(0, 1) }}</text
          ><text class="portrait-label">照片待补充</text></view
        >
      </view>
      <view class="roster-copy">
        <view class="roster-name"
          >{{ profile.name }}<text>{{ profile.placeholder ? '暂用代称' : '老师' }}</text></view
        >
        <view v-if="profile.placeholder" class="roster-background">姓名、照片与背景介绍待补充</view>
        <view v-if="profile.role" class="roster-role">{{ profile.role }}</view>
        <view v-if="profile.organization" class="roster-background">{{
          profile.organization
        }}</view>
        <view v-if="profile.education" class="roster-education">{{ profile.education }}</view>
        <view v-if="profile.bio" class="roster-background">{{ profile.bio }}</view>
      </view>
    </view>
  </view>
</template>
<script setup>
  import { computed, ref } from 'vue';
  import { mentorIntroductions } from '@/edu/mentor-profiles';
  const props = defineProps({ published: { type: Array, default: () => [] }, compact: Boolean });
  const failedPhotos = ref({});
  const profiles = computed(() => {
    const list = mentorIntroductions(props.published);
    return props.compact ? list.slice(0, 2) : list;
  });
</script>
<style scoped>
  .mentor-roster {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin: 18px 0;
  }
  .roster-card {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 21px 18px;
    background: linear-gradient(140deg, #fffefa, #f8f0e4);
    border: 1px solid #dcd0bf;
    border-radius: 19px;
    box-shadow: inset 0 0 0 2px #fff9, 0 8px 19px -17px #72513155;
  }
  .roster-photo {
    width: 80px;
    height: 104px;
    flex: none;
    border: 1px solid #dfd0bb;
    border-radius: 12px;
    overflow: hidden;
    background: #eee4d5;
  }
  .roster-photo image {
    width: 100%;
    height: 100%;
  }
  .portrait-pending {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .portrait-initial {
    color: #a38a68;
    font-size: 29px;
    font-weight: 400;
  }
  .portrait-label {
    font-size: 9px;
    color: #8c7d66;
    margin-top: 9px;
  }
  .roster-copy {
    flex: 1;
    min-width: 0;
  }
  .roster-name {
    color: #32372b;
    font-size: 21px;
    font-weight: 600;
    line-height: 1.5;
  }
  .roster-name > text {
    font-size: 11px;
    font-weight: 400;
    color: #7b7c6f;
    margin-left: 9px;
  }
  .roster-role {
    color: #a2522f;
    font-size: 13px;
    font-weight: 600;
    margin-top: 5px;
  }
  .roster-background {
    color: #686958;
    font-size: 12px;
    line-height: 1.8;
    margin-top: 5px;
  }
  .roster-education {
    color: #7f694c;
    font-size: 11px;
    line-height: 1.8;
    padding-top: 9px;
    margin-top: 9px;
    border-top: 1px solid #dfd2bf;
  }
  .compact .roster-card {
    padding: 16px 14px;
    gap: 14px;
  }
  .compact .roster-photo {
    width: 63px;
    height: 86px;
  }
  .compact .roster-name {
    font-size: 18px;
  }
  @media (min-width: 700px) {
    .mentor-roster {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
