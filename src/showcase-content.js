export const showcaseProjects = [
 {id:'minecraft',category:'game',title:'Minecraft 模组工坊',description:'自定义物品与规则，让熟悉的世界有自己的玩法。',tags:['事件与条件','变量与参数','模组设计'],thought:'怎样给熟悉的方块世界添加自己的玩法？',rule:'定义事件与触发条件，再把效果组织成可开关的模组配置。',check:'添加模组后检查启用数量，再关闭其中一个，确认配置同步变化。',reflection:'此处可编辑与导出教学配置；真正的 Minecraft 模组还需要对应版本的开发与测试。'},
 {id:'museum',category:'story',title:'午夜博物馆',description:'探索线索、选择分支，让每一次决定改变故事。',tags:['分支逻辑','状态管理','交互叙事'],thought:'同一个场景，选择怎样改变之后的线索和故事？',rule:'保存故事节点与线索，再显示相应的叙述和路线。',check:'分别探索星图与钥匙路线，返回起点后应清除已获得的线索。',reflection:'如果两个分支最终汇合，如何保留读者一路上的选择？'},
 {id:'mono',category:'website',title:'MONO · 原创产品官网',description:'从产品摄影到响应式布局，设计自己的品牌表达。',tags:['网页结构','响应式布局','组件交互'],thought:'怎样让读者先看见产品特点，再有条理地了解细节？',rule:'用层级组织页面，连接材质说明、配色概念与设计规格。',check:'在手机和桌面查看内容，检查按钮、焦点与折叠面板。',reflection:'MONO 为原创虚拟产品设计练习，配色概念与展示中的雾银图片分别标明。'},
 {id:'notes',category:'tool',title:'拾页 · 学习资料助手',description:'把资料整理成可追溯、可编辑、可导出的知识卡。',tags:['结构化数据','文件处理','AI 结果核验'],thought:'怎样把读过的资料变成自己的知识，还能找回原文依据？',rule:'把摘要与原文段落关联，编辑知识卡，再导出结构化笔记。',check:'定位来源、修改卡片并导出，检查文件是否包含最新内容与资料。',reflection:'当前使用固定示例资料，不调用 AI；接入模型后仍需要逐条核验出处。'},
 {id:'tower',category:'game',title:'花园守卫战',description:'设计不同角色、资源和关卡，探索塔防游戏怎样运转。',tags:['定时事件','碰撞检测','资源管理'],thought:'怎样让防御角色发现目标，并以不同规则回应？',rule:'根据角色类型设置攻击、生产资源或拦截的行为。',check:'切换三种角色，检查规则说明和所需能力是否一致。',reflection:'此处为关卡美术与规则演示；完整游戏还需实现战斗循环、胜负和难度平衡。'},
];
export const featuredProjects=showcaseProjects.slice(0,4);
export const showcaseSlides=[
 {id:'minecraft',label:'MOD 工坊',icon:'Box',eyebrow:'游戏与模组',title:'我的世界，添点新规则。',action:'体验模组配置'},
 {id:'tower',label:'花园塔防',icon:'Gamepad2',eyebrow:'小游戏创作',title:'从一条规则，设计整个关卡。',action:'探索角色规则'},
 {id:'museum',label:'互动故事',icon:'BookOpen',eyebrow:'互动故事',title:'午夜的钟声，唤醒了谁？',action:'走进故事'},
 {id:'mono',label:'品牌网站',icon:'PanelsTopLeft',eyebrow:'品牌与网站',title:'让声音，更靠近。',action:'探索产品网站'},
 {id:'notes',label:'实用工具',icon:'FileText',eyebrow:'实用工具',title:'读懂资料，记成自己的话。',action:'试试资料助手'},
];
export const showcaseIds=new Set(showcaseProjects.map(p=>p.id));
export const legacyProjectIds={island:'minecraft',fox:'museum',space:'mono',plant:'notes'};
