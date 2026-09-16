import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';

export function useStudioShare(title, page, parameters = () => ({})) {
  const query = () =>
    Object.entries(parameters())
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  onShareAppMessage(() => ({
    title,
    path: `${page}${query() ? '?' + query() : ''}`,
    imageUrl: '/static/studio/minecraft.jpg',
  }));
  onShareTimeline(() => ({ title, query: query(), imageUrl: '/static/studio/minecraft.jpg' }));
}
