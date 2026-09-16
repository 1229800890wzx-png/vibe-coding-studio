export let baseUrl=import.meta.env.VITE_API_BASE_URL||'';
// #ifdef MP-WEIXIN
baseUrl=import.meta.env.VITE_MP_API_BASE_URL||'http://127.0.0.1:48080';
// #endif
export const apiPath='/app-api';
export const staticUrl=import.meta.env.VITE_STATIC_URL||'';
export const tenantId=import.meta.env.SHOPRO_TENANT_ID||'1';
export const websocketPath='/infra/ws';
export const h5Url=import.meta.env.VITE_H5_URL||'';
export default {baseUrl,apiPath,staticUrl,tenantId,websocketPath,h5Url};
