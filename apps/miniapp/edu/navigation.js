// Only local education pages can be a continuation target. No external URLs or auth loops.
export function safeContinuation(value) {
  if (typeof value !== 'string' || value.length > 1800 || /[\\\r\n#]/.test(value)) return '';
  const route = value.split('?')[0];
  if (!/^\/pages\/(edu\/[a-z][a-z-]*|tab\/(home|courses|learning|me))$/.test(route)) return '';
  if (route === '/pages/edu/login') return '';
  return value;
}

export function currentContinuation() {
  const pages = getCurrentPages(),
    page = pages[pages.length - 1];
  if (!page) return '';
  const full = page.$page?.fullPath;
  if (full && safeContinuation(full)) return full;
  const query = Object.entries(page.options || {})
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return safeContinuation('/' + page.route + (query ? '?' + query : ''));
}

export function continuationLabel(url) {
  const route = safeContinuation(url).split('?')[0];
  return (
    {
      '/pages/edu/one-to-one': '一对一预约',
      '/pages/edu/cohort': '确认班期与报名',
      '/pages/edu/cart': '选课袋',
      '/pages/edu/checkout': '确认订单',
      '/pages/edu/children': '孩子档案',
      '/pages/edu/consultation': '课程咨询',
      '/pages/tab/learning': '学习空间',
    }[route] || '刚才的页面'
  );
}

export function continueTo(url, fallback = '/pages/tab/me') {
  const target = safeContinuation(url) || fallback;
  const pages = getCurrentPages(),
    previous = pages[pages.length - 2];
  const previousPath = previous?.$page?.fullPath || (previous?.route ? '/' + previous.route : '');
  if (previous && previousPath === target) {
    uni.navigateBack({ fail: () => navigate(target) });
  } else navigate(target);
}

function navigate(target) {
  if (target.startsWith('/pages/tab/')) uni.switchTab({ url: target.split('?')[0] });
  else uni.redirectTo({ url: target, fail: () => uni.switchTab({ url: '/pages/tab/me' }) });
}
