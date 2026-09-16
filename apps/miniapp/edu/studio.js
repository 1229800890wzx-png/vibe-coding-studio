import snapshot from './website-snapshot.json';

// Editorial content comes from the official website. These keys are NOT course IDs.
export const projects = snapshot.projects;
export const universities = snapshot.universities;
export const lessonCatalog = snapshot.lessons;
export const studioNav = [
  { id: 'courses', title: '课程体系', english: 'Courses', note: '从基础到创作', icon: 'courses' },
  { id: 'mentors', title: '导师团队', english: 'Mentors', note: '认识引路的人', icon: 'mentors' },
  { id: 'method', title: '教学方法', english: 'Method', note: '理解每一步', icon: 'method' },
  {
    id: 'projects',
    title: '创作展示',
    english: 'Projects',
    note: '看见更多可能',
    icon: 'projects',
  },
];
export const paths = [
  {
    id: 'start',
    number: '01',
    title: '创意启蒙',
    label: '从基础开始',
    description: '从表达想法，到理解程序的第一条规则。',
    result: '讲清一个想法，完成第一次交互练习。',
  },
  {
    id: 'create',
    number: '02',
    title: 'AI 项目创作',
    label: '与 AI 协作',
    description: '理解大模型，学会使用工具，把想法做成作品。',
    result: '拆解需求、编程调试，完成可体验的小项目。',
  },
  {
    id: 'grow',
    number: '03',
    title: '作品成长计划',
    label: '走向独立创造',
    description: '持续改进与验证，积累自己的作品与方法。',
    result: '完善作品集，讲清设计思路与验证过程。',
  },
];
export const methodSteps = [
  {
    title: '提出想法',
    text: '从生活和兴趣里，找到一个值得动手的问题。',
    question: '你想让这个作品做到什么？',
  },
  {
    title: '动手实现',
    text: '把大想法拆成小步骤，在编程与 AI 工具中实践。',
    question: '先实现哪一个最小的功能？',
  },
  {
    title: '测试改进',
    text: '对照预期检查结果，发现问题，再试一种办法。',
    question: '换一种输入，结果还正确吗？',
  },
  {
    title: '分享表达',
    text: '展示作品，也说清楚自己的设计和思考。',
    question: '你为什么做出这个选择？',
  },
];
export function openStudio(page, params = {}) {
  if (!studioNav.some((item) => item.id === page)) return;
  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  uni.navigateTo({ url: `/pages/studio/${page}${query ? '?' + query : ''}` });
}

// Set only to the deployed official HTTPS domain, registered as a WeChat business domain.
const configuredUrl = (import.meta.env.VITE_OFFICIAL_WEBSITE_URL || '').trim();
export const officialWebsiteUrl =
  /^https:\/\/[a-z0-9.-]+(?::\d+)?(?:\/[^\s]*)?$/i.test(configuredUrl) &&
  !/^https:\/\/(localhost|127\.|0\.|192\.168\.|10\.)/i.test(configuredUrl)
    ? configuredUrl
    : '';
export function openOfficialWebsite() {
  if (!officialWebsiteUrl) return;
  // #ifdef H5
  window.location.assign(officialWebsiteUrl);
  return;
  // #endif
  // #ifndef H5
  uni.navigateTo({ url: '/pages/public/webview?url=' + encodeURIComponent(officialWebsiteUrl) });
  // #endif
}
