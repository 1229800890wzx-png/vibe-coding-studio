<template
  ><image
    class="parent-icon"
    :src="'/static/studio/parent/' + name + '.png'"
    mode="aspectFit"
    aria-hidden="true"
/></template>
<script setup>
  defineProps({ name: { type: String, default: 'book' } });
</script>
<style scoped>
  .parent-icon {
    width: 25px;
    height: 25px;
    flex: none;
    display: block;
  }
</style>
