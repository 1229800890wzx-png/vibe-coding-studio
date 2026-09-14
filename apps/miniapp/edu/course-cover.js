// Presentation assets for missing/old demo covers. Published course and order snapshots stay intact.
const covers = {
  STORY: '/static/edu/courses/story.jpg',
  GAME: '/static/edu/courses/game.jpg',
  WEB: '/static/edu/courses/web.jpg',
  WEBSITE: '/static/edu/courses/web.jpg',
  TOOL: '/static/edu/courses/tools.jpg',
  AI: '/static/edu/courses/ai.jpg',
  AI_CREATION: '/static/edu/courses/ai.jpg',
  PRODUCT: '/static/edu/courses/product.jpg',
  PROJECT: '/static/edu/courses/product.jpg',
};
const legacyPaths = new Set([
  '/static/edu/mono.webp',
  '/static/edu/notes.webp',
  '/assets/course-placeholder.svg',
  '/static/edu/course-story.svg',
]);

function localAssetPath(value) {
  const url = String(value || '').trim().split(/[?#]/)[0];
  return url.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?=\/)/i, '');
}

export function isLegacyCourseCover(value) {
  const path = localAssetPath(value);
  return !path || legacyPaths.has(path);
}

export function courseCover(course, useFallback = false) {
  const supplied = String(course?.coverUrl || '').trim();
  if (!useFallback && !isLegacyCourseCover(supplied)) return supplied;
  return covers[String(course?.direction || '').toUpperCase()] || covers.PRODUCT;
}

export function isCourseIllustration(source) {
  return Object.values(covers).includes(localAssetPath(source));
}
