<template>
  <EduHeader title="消息中心" />
  <view class="edu-page parent-flow">
    <view class="title">学习进展，及时知道。</view>
    <view class="subtitle">报名、课程调整与退款通知，都在这里。</view>
    <view class="row between message-toolbar">
      <view class="chips">
        <button class="chip" :class="{ active: !onlyUnread }" @tap="filter(false)">全部</button>
        <button class="chip" :class="{ active: onlyUnread }" @tap="filter(true)"
          >未读<text v-if="data"> {{ data.unread }}</text></button
        >
      </view>
      <button class="link" :disabled="busy || !data?.unread" @tap="readAll">全部已读</button>
    </view>
    <EduState
      :loading="loading"
      :error="error"
      :empty="!items.length"
      :title="onlyUnread ? '没有未读消息' : '暂时没有消息'"
      description="新的课程通知会显示在这里。"
      @retry="refresh"
    />
    <template v-if="!loading && !error">
      <view
        v-for="message in items"
        :key="message.id"
        class="card stack"
        :class="{ 'unread-card': !message.readStatus }"
      >
        <view class="row between"
          ><text class="strong">{{ message.title }}</text
          ><text class="pill" v-if="!message.readStatus">未读</text></view
        >
        <view class="message-content">{{ message.content }}</view>
        <view class="row between"
          ><text class="small muted">{{ dateText(message.createTime) }}</text
          ><button v-if="!message.readStatus" class="link" :disabled="busy" @tap="read(message)"
            >标记已读</button
          ><text v-else class="small muted">已读</text></view
        >
      </view>
      <view v-if="total > pageSize" class="row between pager"
        ><button class="btn quiet" :disabled="pageNo <= 1 || busy" @tap="turn(-1)">上一页</button
        ><text class="small muted">{{ pageNo }} / {{ Math.ceil(total / pageSize) }}</text
        ><button class="btn quiet" :disabled="pageNo * pageSize >= total || busy" @tap="turn(1)"
          >下一页</button
        ></view
      >
    </template>
    <view v-if="actionError" class="error">{{ actionError }}</view>
  </view>
</template>
<script setup>
  import { ref, computed } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import EduState from '@/components/edu/EduState.vue';
  import request from '@/sheep/request';
  import { unwrap } from '@/edu/api';
  import { useResource } from '@/edu/resource';
  import { requireLogin, dateText } from '@/edu/state';
  defineOptions({ inheritAttrs: false });
  const pageNo = ref(1),
    pageSize = 20,
    onlyUnread = ref(false),
    busy = ref(false),
    actionError = ref('');
  const call = (path, method = 'GET', input) =>
    unwrap(
      request({
        url: '/edu/notification' + path,
        method,
        ...(method === 'GET' ? { params: input } : { data: input }),
        custom: { showLoading: false, showError: false, auth: true },
      }),
    );
  const { data, loading, error, refresh } = useResource(async () => {
    const [page, unread] = await Promise.all([
      call('/page', 'GET', {
        pageNo: pageNo.value,
        pageSize,
        ...(onlyUnread.value ? { readStatus: false } : {}),
      }),
      call('/unread-count'),
    ]);
    return { ...page, unread };
  });
  const items = computed(() => data.value?.list || []),
    total = computed(() => data.value?.total || 0);
  function filter(value) {
    if (onlyUnread.value === value) return;
    onlyUnread.value = value;
    pageNo.value = 1;
    refresh();
  }
  function turn(delta) {
    pageNo.value += delta;
    refresh();
    uni.pageScrollTo({ scrollTop: 0, duration: 160 });
  }
  async function read(message) {
    busy.value = true;
    actionError.value = '';
    try {
      await call('/read', 'PUT', { ids: [message.id] });
      // Reading the final item on an unread page must keep a previous page reachable.
      if (
        onlyUnread.value &&
        pageNo.value > 1 &&
        (pageNo.value - 1) * pageSize >= total.value - 1
      ) {
        pageNo.value -= 1;
      }
      await refresh();
    } catch (e) {
      actionError.value = e.message;
    } finally {
      busy.value = false;
    }
  }
  async function readAll() {
    busy.value = true;
    actionError.value = '';
    try {
      await call('/read-all', 'PUT');
      pageNo.value = 1;
      await refresh();
    } catch (e) {
      actionError.value = e.message;
    } finally {
      busy.value = false;
    }
  }
  onShow(() => {
    if (requireLogin()) refresh();
  });
</script>
<style scoped>
  .message-toolbar {
    gap: 12px;
    margin: 24px 0 12px;
  }
  .message-content {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    line-height: 1.7;
  }
  .unread-card {
    border-left: 3px solid #ff7a00;
  }
  .pager {
    margin: 24px 0;
  }
</style>
