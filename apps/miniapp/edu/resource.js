import { ref } from 'vue';
export function useResource(fetcher, initial = null) {
  const data = ref(initial),
    loading = ref(false),
    error = ref('');
  let serial = 0;
  async function refresh() {
    const id = ++serial;
    loading.value = true;
    error.value = '';
    try {
      const result = await fetcher();
      if (id === serial) data.value = result;
    } catch (e) {
      if (id === serial) error.value = e?.message || e?.msg || '暂时无法加载，请重试';
    } finally {
      if (id === serial) loading.value = false;
    }
  }
  return { data, loading, error, refresh };
}
