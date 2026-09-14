import { reactive } from 'vue';
import { edu } from './api';

export const brand = reactive({
  brandName: 'VIBE CODING',
  tagline: '少儿创造力实验室',
  logoUrl: '',
  heroTitle: '一个好奇心。\n一个自己的作品。',
  heroDescription: '和 AI 一起，把想法写成现实。\n从第一条规则，到能分享的完整项目。',
  heroAction: '找到孩子的第一门课',
});
let updated = 0,
  pending;
export function loadBrand(force = false) {
  if (pending) return pending;
  if (!force && Date.now() - updated < 30000) return Promise.resolve(brand);
  pending = edu
    .config()
    .then((values) => {
      Object.assign(brand, values);
      updated = Date.now();
      return brand;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}
