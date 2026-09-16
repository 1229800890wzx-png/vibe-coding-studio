export const directionLabel = (value) =>
  ({
    STORY: '互动故事',
    GAME: '创意小游戏',
    WEBSITE: '个人网站',
    WEB: '个人网站',
    TOOL: '实用工具',
    AI: 'AI 应用',
    AI_CREATION: 'AI 应用创作',
    PRODUCT: '综合产品项目',
    PROJECT: '综合产品项目',
  })[value] || '项目创作';
export const levelLabel = (value) =>
  ({
    BEGINNER: '零基础可学',
    INTERMEDIATE: '已有基础',
    ADVANCED: '进阶创作',
  })[value] || '基础要求待公布';
