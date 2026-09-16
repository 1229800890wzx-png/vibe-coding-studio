<template
  ><EduHeader title="城市与校区" /><view class="edu-page"
    ><text class="eyebrow">MEET IN REAL LIFE</text><view class="title">找到身边的创作空间。</view
    ><view class="subtitle">查看校区位置，再选择适合的线下班期。</view
    ><button
      class="btn secondary"
      style="margin-top: 16px"
      @tap="showCourses({ mode: 'ONLINE', campusId: '' })"
      >全国线上 · 查看在线班期</button
    ><view class="field"
      ><picker :range="cities" @change="city = cities[Number($event.detail.value)]"
        ><view class="input">{{ city }} ⌄</view></picker
      ></view
    ><EduState
      :loading="loading"
      :error="error"
      :empty="!filtered.length"
      title="该城市暂无开放校区"
      description="你也可以选择电脑端在线小班。"
      @retry="refresh"
    /><view v-for="c in filtered" :key="c.id" class="card stack"
      ><text class="pill">{{ c.city }}</text
      ><view class="section-title">{{ c.name }}</view
      ><view class="muted">{{ c.address }}</view
      ><view class="muted">{{ c.description }}</view
      ><button
        class="btn"
        @tap="showCourses({ mode: 'OFFLINE', campusId: c.id, campusName: c.name })"
        >查看这个校区的班期</button
      ><button class="btn secondary" @tap="location(c)">查看位置 / 复制地址 ↗</button></view
    ></view
  ></template
>
<script setup>
  defineOptions({ inheritAttrs: false });
  import { ref, computed } from 'vue';
  import { onLoad } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import EduState from '@/components/edu/EduState.vue';
  import { edu, listOf } from '@/edu/api';
  import { useResource } from '@/edu/resource';
  import { showCourses } from '@/edu/discovery';
  const { data, loading, error, refresh } = useResource(() => edu.campuses(), []);
  const city = ref('全部城市'),
    cities = computed(() => ['全部城市', ...new Set(listOf(data.value).map((c) => c.city))]),
    filtered = computed(() =>
      listOf(data.value).filter((c) => city.value === '全部城市' || c.city === city.value),
    );
  function location(c) {
    if (c.latitude && c.longitude)
      uni.openLocation({
        latitude: Number(c.latitude),
        longitude: Number(c.longitude),
        name: c.name,
        address: c.address,
        fail: () => uni.setClipboardData({ data: c.address }),
      });
    else uni.setClipboardData({ data: c.address });
  }
  onLoad(refresh);
</script>
