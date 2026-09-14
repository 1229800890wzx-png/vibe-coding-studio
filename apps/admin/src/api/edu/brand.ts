import { reactive } from 'vue'
import request from '@/config/axios'

export const brand = reactive({
  brandName: 'VIBE CODING',
  tagline: '少儿创造力实验室',
  logoUrl: ''
})
let pending: Promise<any> | undefined
export function loadBrand() {
  if (!pending) {
    pending = request
      .get({
        url: import.meta.env.VITE_BASE_URL + '/app-api/edu/config/get',
        // Public member-side configuration must not receive an administrator token.
        headers: { isToken: false }
      })
      .then((values) => Object.assign(brand, values))
      .finally(() => {
        pending = undefined
      })
  }
  return pending
}
