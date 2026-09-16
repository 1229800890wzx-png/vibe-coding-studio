<template
  ><view v-if="loading" aria-live="polite"><view class="skeleton" /><view class="skeleton" /></view
  ><view v-else-if="error" class="card state"
    ><view class="state-icon">!</view><view class="section-title">暂时没能加载</view
    ><view class="muted">{{ error }}</view
    ><button class="btn secondary" @tap="$emit('retry')">重新加载</button></view
  ><view v-else-if="empty" class="card state"
    ><view class="state-icon">○</view
    ><view class="section-title">{{ title || '这里还没有内容' }}</view
    ><view class="muted">{{ description || '有新内容时，会在这里显示。' }}</view
    ><slot /></view
></template>
<script setup>
  defineProps({
    loading: Boolean,
    error: String,
    empty: Boolean,
    title: String,
    description: String,
  });
  defineEmits(['retry']);
</script>
<style scoped>
  .state {
    text-align: center;
    padding: 36px 24px;
  }
  .state > * + * {
    margin-top: 14px;
  }
  .state-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: #fff3e8;
    border-radius: 16px;
    margin: 0 auto;
    color: #c94b00;
    font-size: 25px;
  }
  .state .btn {
    max-width: 260px;
    margin-left: auto;
    margin-right: auto;
  }
</style>
