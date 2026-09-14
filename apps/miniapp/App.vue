<script setup>
  import { onLaunch } from '@dcloudio/uni-app';
  import store from '@/sheep/store';
  onLaunch(() => {
    const app = store('app');
    app.info.name = 'VIBE CODING';
    app.info.logo = '/static/edu/notes.webp';
    store('sys').setTheme();
  });
</script>
<style lang="scss">
  @import '@/sheep/scss/index.scss';
  @import '@/edu/theme.scss';
</style>
