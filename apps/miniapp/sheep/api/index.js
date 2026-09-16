// 目的：解决微信小程序的「代码质量」在「JS 文件」提示：主包内，不应该存在主包未使用的 JS 文件
const files = import.meta.glob('./*/*.js', { eager: true });
let api = {};
Object.keys(files).forEach((key) => {
  Object.defineProperty(api, key.replace(/(.*\/)*([^.]+).*/gi, '$2'), {
    configurable: true, enumerable: true, get: () => files[key].default,
  });
});

export default api;
