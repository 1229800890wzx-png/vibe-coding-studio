<template>
  <view class="parent-feedback parent-panel">
    <view class="parent-feedback-top"
      ><view class="parent-icon-tile"><ParentIcon name="feedback" /></view
      ><view
        ><view class="parent-card-title small-title">导师的课堂回信</view
        ><text class="parent-micro">{{
          item ? dateParts(item.publishedAt).date + ' · 已发布' : '陪伴，也在每一次反馈里'
        }}</text></view
      ><text class="parent-quote">“</text></view
    >
    <template v-if="item"
      ><view class="parent-feedback-content">{{ item.feedback }}</view
      ><view class="parent-micro">关于：{{ item.assignmentTitle || '本次创作' }}</view
      ><button class="parent-text-button" @tap="open">阅读完整反馈 <text>↗</text></button></template
    >
    <template v-else
      ><view class="parent-muted">{{
        error
          ? '这次未能读取老师反馈，其他学习信息仍可查看。'
          : '老师发布点评后，你可以在这里看到孩子做得好的地方，以及下一步的建议。'
      }}</view
      ><button class="parent-text-button" @tap="error ? $emit('retry') : open()"
        >{{ error ? '重新加载反馈' : '查看反馈记录' }} <text>↗</text></button
      ></template
    >
  </view>
</template>
<script setup>
  import ParentIcon from './ParentIcon.vue';
  import { dateParts } from '@/edu/parent-space-data';
  import { go } from '@/edu/state';
  const props = defineProps({ item: Object, studentId: Number, error: String });
  defineEmits(['retry']);
  function open() {
    go('learning-list', { type: 'reviews', studentId: props.studentId });
  }
</script>
