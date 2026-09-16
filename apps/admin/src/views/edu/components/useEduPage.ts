import { reactive, ref, onMounted, watch } from 'vue'
import { eduApi, errorMessage, type EduResource, type EduRecord } from '@/api/edu'

export function useEduPage(resource: EduResource, defaults: Record<string, any> = {}) {
  const key = `edu:filters:${resource}`
  let saved = {}
  try {
    saved = JSON.parse(sessionStorage.getItem(key) || '{}')
  } catch {
    /* Ignore obsolete filter state. */
  }
  const query = reactive<Record<string, any>>({
    pageNo: 1,
    pageSize: 20,
    keyword: '',
    status: '',
    ...defaults,
    ...saved
  })
  const rows = ref<EduRecord[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref('')
  let sequence = 0
  async function load() {
    const current = ++sequence
    loading.value = true
    error.value = ''
    try {
      const result = await eduApi.page(
        resource,
        Object.fromEntries(
          Object.entries(query).filter(([, value]) => value !== '' && value != null)
        )
      )
      if (current === sequence) {
        rows.value = result.list
        total.value = result.total
      }
    } catch (e) {
      if (current === sequence) {
        error.value = errorMessage(e)
        rows.value = []
        total.value = 0
      }
    } finally {
      if (current === sequence) loading.value = false
    }
  }
  function search() {
    query.pageNo = 1
    load()
  }
  function reset() {
    Object.assign(query, { pageNo: 1, pageSize: 20, keyword: '', status: '', ...defaults })
    load()
  }
  watch(query, () => sessionStorage.setItem(key, JSON.stringify(query)), { deep: true })
  onMounted(load)
  return { query, rows, total, loading, error, load, search, reset }
}
