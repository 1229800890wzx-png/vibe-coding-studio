import { showcaseProjects } from './showcase-content';

export const artSources = {
  'photo-hero': [1536, 1024],
  original: [1024, 1536],
  home: [793, 1983],
  courses: [832, 1891],
  method: [889, 1769],
  mentors: [887, 1774],
  projects: [819, 1920],
  "story-hd": [1536, 1024],
  "space-hd": [1536, 1024],
  "plant-hd": [1254, 1254],
};

export const categories = [
  { id: "game", label: "游戏与模组", icon: "Gamepad2", action: "设计规则" },
  { id: "story", label: "互动故事", icon: "BookOpen", action: "编写剧情" },
  {
    id: "website",
    label: "品牌与网站",
    icon: "PanelsTopLeft",
    action: "表达自我",
  },
  { id: "tool", label: "实用工具", icon: "FileText", action: "解决问题" },
];

const earlierProjects = [
  {
    id: "island",
    category: "game",
    title: "小岛冒险",
    description: "设计一座小岛，为探索写下自己的规则。",
    tags: ["条件判断", "循环", "交互"],
    thought: "怎样让角色收集星星，并在到达终点时获得反馈？",
    rule: "点击星星 → 更新数量 → 检查是否全部收集。",
    check: "重复点击同一颗星星，数量应该保持不变。",
    reflection: "如果把目标从 3 颗改成 5 颗，哪些地方需要一起修改？",
  },
  {
    id: "fox",
    category: "story",
    title: "会分支的故事",
    description: "让读者做出选择，走向不同的故事结局。",
    tags: ["流程图", "条件判断", "叙事"],
    thought: "小狐狸到了岔路口，选择怎样改变接下来的故事？",
    rule: "保存当前选择，再显示相应场景和下一组选项。",
    check: "分别走过每条分支，确认都能到达结局或返回起点。",
    reflection: "如果两条路最后汇合，怎样避免重复写同一段故事？",
  },
  {
    id: "space",
    category: "website",
    title: "我的宇宙网站",
    description: "整理自己的热爱，搭建一个可以浏览的网站。",
    tags: ["网页结构", "样式", "布局"],
    thought: "怎样把关于宇宙的收藏，整理成别人也能读懂的网站？",
    rule: "用标题组织内容，用导航连接章节，让手机也能清楚阅读。",
    check: "检查导航目的地、图片说明和窄屏下的阅读顺序。",
    reflection: "同样的信息，换一种排版会让读者先看到什么？",
  },
  {
    id: "plant",
    category: "tool",
    title: "植物照护提醒助手",
    description: "设定检查时间，到点提醒自己观察植物。",
    tags: ["时间数据", "条件判断", "事件"],
    thought: "怎样记住检查植物的时间，而不是凭感觉每次都浇水？",
    rule: "当前时间达到提醒时间，并且还未完成检查时，显示提醒。",
    check: "分别试试时间未到、时间已到和已完成检查的情况。",
    reflection: "记录的是检查时间；是否浇水，还需要观察植物和土壤。",
  },
  {
    id: "classify",
    category: "ai",
    title: "看图分类实验",
    description: "从样本与标签出发，理解分类与验证。",
    tags: ["训练样本", "分类", "验证"],
    thought: "怎样让计算机学习区分叶片和花朵？",
    rule: "整理有标签的样本，用没有参与训练的新样本检查结果。",
    check: "模糊、遮挡或不同光线的图片，会不会改变判断？",
    reflection: "此处是规则演示，没有调用模型；真实模型需要独立测试数据。",
  },
  {
    id: "question",
    category: "ai",
    title: "学习问答伙伴",
    description: "练习提出问题，检查答案中的依据与不确定性。",
    tags: ["提问", "上下文", "核查"],
    thought: "得到一个流畅的回答以后，我们还需要做什么？",
    rule: "明确问题 → 阅读回答 → 找出可核查的事实 → 对照可靠资料。",
    check: "找不到依据时保留疑问，不把“说得肯定”当成“已经证实”。",
    reflection: "这是预设的核查练习，不是实时 AI 对话，也不代表答案已经核验。",
  },
];

export const projects = [...showcaseProjects, ...earlierProjects.filter(p => p.category === 'ai')];

export const services = [
  {
    id: "start",
    title: "创意启蒙",
    subtitle: "把好奇变成清晰的想法",
    points: ["表达与提问", "图像与故事", "第一次互动作品"],
    icons: ["MessageCircle", "BookOpen", "Sparkles"],
  },
  {
    id: "create",
    title: "AI 项目创作",
    subtitle: "把想法做成可以运行的作品",
    points: ["拆解创作目标", "编程与调试", "项目展示与讲述"],
    icons: ["Workflow", "Code2", "Presentation"],
  },
  {
    id: "grow",
    title: "作品成长计划",
    subtitle: "形成自己的创作方向",
    points: ["持续迭代作品", "整理个人作品集", "回顾与成长建议"],
    icons: ["RefreshCw", "PanelsTopLeft", "Compass"],
  },
];

export const mentors = [
  {
    title: "创意编程导师",
    rect: [56, 1142, 297, 184],
    caption: "引导表达 · 激发创意",
    detail: "先请孩子说出想法，再一起讲清创作中的概念。",
    tag: "表达与理解",
    icon: "Lightbulb",
  },
  {
    title: "AI 项目导师",
    rect: [367, 1142, 290, 184],
    caption: "项目拆解 · 编程实践",
    detail: "陪孩子拆解任务，通过实验检查程序与 AI 的结果。",
    tag: "实践与验证",
    icon: "Settings2",
  },
  {
    title: "学习成长导师",
    rect: [671, 1142, 297, 184],
    caption: "过程反馈 · 成长陪伴",
    detail: "整理过程中的反馈，帮助孩子回顾方法和下一步。",
    tag: "反馈与成长",
    icon: "ChartNoAxesColumnIncreasing",
  },
];

export const homeSteps = [
  ["Lightbulb", "表达想法", "把想法说清楚"],
  ["Workflow", "拆解问题", "把目标分成小步骤"],
  ["Code2", "创作调试", "尝试、观察、改进"],
  ["Send", "分享作品", "讲述自己的设计"],
];
export const methodSteps = [
  ["观察问题", "从生活中发现值得思考的问题"],
  ["理解概念", "找到相关知识，想一想可以怎么做"],
  ["编程实验", "把想法变成程序，动手试一试"],
  ["检查调试", "观察结果，发现并解决问题"],
  ["讲述发现", "分享自己的作品，说明思路与收获"],
];

export const faqItems = [
  [
    "没有基础，如何开始？",
    "先从孩子熟悉的生活问题开始，练习表达、观察和拆分步骤。理解输入、输出、条件与重复这些概念后，再通过小实验接触编程和 AI。具体起点会结合孩子的兴趣与已有经验讨论。",
  ],
  [
    "基础课程与 AI 学习怎样衔接？",
    "基础理论帮助孩子读懂规则和程序；编程实践让规则运行起来；AI 学习进一步认识模型、生成、提示词与局限。三者会在项目中结合，并始终保留解释、测试与核查。",
  ],
  [
    "三项服务与四条知识路径有什么关系？",
    "创意启蒙、AI 项目创作、作品成长计划是不同的服务方向；基础理论、现代编程、AI 基础与新知、综合项目是贯穿其中的知识路径。它们不是互相替代的课程版本。",
  ],
  [
    "如何了解适合孩子的学习路径？",
    "可以先记录孩子的兴趣、已有经验和想做的作品，再与导师讨论学习起点。招生年龄、课程安排、费用与体验形式尚待正式资料确认，页面不会用未经确认的数字代替实际沟通。",
  ],
];
