<template
  ><EduHeader title="选课袋" /><view class="edu-page with-dock"
    ><view class="title">为每一位孩子，<br />选好下一步。</view
    ><view class="subtitle">同一门课，为不同孩子分别报名。</view
    ><EduState
      :loading="loading"
      :error="error"
      :empty="!items.length"
      title="选课袋还是空的"
      description="选择课程与班期后，它们会出现在这里。"
      @retry="refresh"
      ><button class="btn secondary" @tap="tab('courses')">去选一门课</button></EduState
    ><view v-for="group in groups" :key="group.studentId" class="child-group"
      ><view class="section-head"
        ><text class="section-title">{{ studentName(group.studentId) }}</text
        ><text class="muted">{{ group.items.length }} 门课程</text></view
      ><view v-for="item in group.items" :key="item.id" class="card"
        ><view class="row"
          ><checkbox
            :checked="selected.includes(item.id)"
            color="#C94B00"
            :disabled="busy"
            @tap="toggle(item.id)"
          /><view style="flex: 1"
            ><view class="strong">{{ item.spu?.name || item.spuName || item.courseName }}</view
            ><view class="muted">{{
              item.sku?.properties?.map((p) => p.valueName).join(' / ') || item.cohortName
            }}</view
            ><view class="pill" style="margin-top: 10px"
              >报名孩子：{{ studentName(item.studentId) }}</view
            ></view
          ></view
        ><view class="row between" style="margin-top: 16px"
          ><text class="price">¥{{ money(item.sku?.price ?? item.price) }}</text
          ><button class="link" :disabled="busy" @tap="remove(item)">移除</button></view
        ></view
      ></view
    ><view v-if="invalid.length" class="card"
      ><view class="strong muted">以下课程暂不可报名</view
      ><view v-for="item in invalid" :key="item.id" class="row between list-line"
        ><view
          ><text class="strong">{{ item.spu?.name || item.spuName }}</text
          ><view class="muted"
            >{{ studentName(item.studentId) }} ·
            {{ item.invalidReason || '班期已不可售、名额不足或信息已变更，请重新选择班期。' }}</view
          ></view
        ><button class="link" @tap="remove(item)">移除</button></view
      ></view
    ><view v-if="actionError" class="error">{{ actionError }}</view
    ><view v-if="items.length" class="note"
      >孩子信息跟随每条课程保存。切换当前孩子不会改变选课袋中的报名人。</view
    ></view
  ><view v-if="items.length" class="dock"
    ><view class="dock-inner"
      ><view
        ><text class="strong">已选 {{ selected.length }} 项</text
        ><view class="small muted">最终金额在确认页计算</view></view
      ><button class="btn" :disabled="!selected.length || busy" @tap="checkout"
        >确认课程</button
      ></view
    ></view
  ></template
>
<script setup>
  defineOptions({ inheritAttrs: false });
  import { ref, computed } from 'vue';
  import { onShow } from '@dcloudio/uni-app';
  import EduHeader from '@/components/edu/EduHeader.vue';
  import EduState from '@/components/edu/EduState.vue';
  import Cart from '@/sheep/api/trade/cart';
  import { unwrap } from '@/edu/api';
  import { useResource } from '@/edu/resource';
  import { family, loadStudents, requireLogin, go, tab, money, confirm } from '@/edu/state';
  const selected = ref([]),
    busy = ref(false),
    actionError = ref('');
  const { data, loading, error, refresh } = useResource(async () => {
    await loadStudents();
    const result = await unwrap(Cart.getCartList());
    const all = Array.isArray(result) ? result : result.validList || [];
    selected.value = all.filter((x) => x.selected !== false).map((x) => x.id);
    return result;
  });
  const items = computed(() =>
      Array.isArray(data.value) ? data.value : data.value?.validList || [],
    ),
    invalid = computed(() => data.value?.invalidList || []),
    groups = computed(() => {
      const grouped = new Map();
      for (const item of items.value) {
        if (!grouped.has(item.studentId))
          grouped.set(item.studentId, { studentId: item.studentId, items: [] });
        grouped.get(item.studentId).items.push(item);
      }
      return [...grouped.values()];
    });
  function studentName(id) {
    return family.students.find((s) => s.id === id)?.name || '未指定孩子';
  }
  async function toggle(id) {
    if (busy.value) return;
    const previous = [...selected.value];
    const checked = !selected.value.includes(id);
    selected.value = !checked ? selected.value.filter((v) => v !== id) : [...selected.value, id];
    busy.value = true;
    actionError.value = '';
    try {
      await unwrap(Cart.updateCartSelected({ ids: [id], selected: checked }));
    } catch (e) {
      selected.value = previous;
      actionError.value = e.message;
    } finally {
      busy.value = false;
    }
  }
  async function remove(item) {
    if (!(await confirm('移除课程', '确认从选课袋移除这位孩子的课程？'))) return;
    busy.value = true;
    try {
      await unwrap(Cart.deleteCart([item.id]));
      await refresh();
    } catch (e) {
      actionError.value = e.message;
    } finally {
      busy.value = false;
    }
  }
  function checkout() {
    const lines = items.value
      .filter((i) => selected.value.includes(i.id))
      .map((i) => ({
        skuId: i.sku?.id || i.skuId,
        count: 1,
        cartId: i.id,
        studentId: i.studentId,
      }));
    if (lines.some((i) => !i.studentId)) {
      actionError.value = '存在未指定孩子的课程，请移除后重新选择班期和孩子。';
      return;
    }
    uni.setStorageSync('edu-checkout-items', lines);
    go('checkout');
  }
  onShow(() => {
    if (requireLogin()) refresh();
  });
</script>
