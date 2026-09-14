import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Art,
  FAQ,
  Footer,
  HeroCopy,
  Icon,
  MentorCards,
  Modal,
  ReserveButton,
  SectionHead,
  Steps,
  TextLink,
} from "./components";
import {
  BrowserDots,
  EducationStage,
  FlowDiagram,
  PlantDemo,
  ProjectVisual,
  TabletStage,
} from "./demos";
import {
  categories,
  faqItems,
  homeSteps,
  methodSteps,
  projects,
  services,
} from "./content";
import { featuredProjects, legacyProjectIds, showcaseIds } from './showcase-content';
import { ShowcaseImage } from './showcase';

function HeroButtons({ to = "/courses", label = "了解课程" }) {
  return (
    <div className="button-row">
      <Link to={to} className="button button-primary">
        {label}
      </Link>
      <ReserveButton secondary />
    </div>
  );
}

function ServiceIllustration({ index }) {
  if (index === 0)
    return (
      <Art rect={[58, 824, 294, 206]} alt="画着树屋创意的手账与彩色铅笔" />
    );
  if (index === 1)
    return (
      <div className="service-device">
        <div className="mini-browser-bar">
          <BrowserDots />
        </div>
        <ProjectVisual id="minecraft" />
      </div>
    );
  return (
    <div className="portfolio-illustration">
      <strong>
        我的作品集
        <Icon name="ArrowUpRight" size={16} />
      </strong>
      <div>
        {["minecraft", "mono", "museum", "notes", "tower", "classify"].map(
          (id) => (
            <div key={id}>
              <ProjectVisual id={id} mini />
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export function Home() {
  return (
    <>
      <section className="home-hero">
        <HeroCopy
          eyebrow="面向孩子的编程与 AI 创作课程"
          line1="每一个奇思妙想，"
          line2="都值得被创造。"
          description="从编程基础出发，理解 AI，把自己的想法做成作品。"
        >
          <div className="button-row"><Link to="/courses" className="button button-primary">了解课程</Link><Link to="/projects#gallery" className="button button-secondary">体验作品<Icon name="ArrowRight" size={18}/></Link></div>
        </HeroCopy>
        <TabletStage />
      </section>
      <div className="container home-content">
        <section className="section directions-section">
          <SectionHead
            title="想做什么，从这里开始。"
            to="/projects"
            link="探索作品方向"
          />
          <div className="showcase-direction-grid">
            {featuredProjects.map(p=>{const c=categories.find(c=>c.id===p.category);return <article key={p.id} className="showcase-direction-card">
              <h3><Icon name={c.icon} size={19}/>{c.label}</h3>
              <Link to={`/projects?project=${p.id}#gallery`} aria-label={`体验${p.title}`}><ShowcaseImage id={p.id}/></Link>
              <h4>{p.title}</h4><p>{p.description}</p>
              <div className="tag-row">{p.tags.map(t=><span key={t}>{t}</span>)}</div>
              <div className="showcase-direction-links"><Link to={`/projects?project=${p.id}#gallery`}>探索作品<Icon name="ArrowUpRight" size={15}/></Link>{p.id==='minecraft'&&<Link to="/projects?project=tower#gallery">也可以做「花园守卫战」 →</Link>}</div>
            </article>})}
          </div>
        </section>
        <section className="section">
          <SectionHead
            title="从好奇，到独立创造。"
            description="看懂每一步学什么，找到适合孩子的起点"
          />
          <div className="grid-three service-grid">
            {services.map((s, i) => (
              <article key={s.id} className="service-card">
                <h3>{s.title}</h3>
                <p>{s.subtitle}</p>
                <div className="service-art">
                  <ServiceIllustration index={i} />
                </div>
                <ul>
                  {s.points.map((p, n) => (
                    <li key={p}>
                      <Icon name={s.icons[n]} size={20} />
                      {p}
                    </li>
                  ))}
                </ul>
                <TextLink to={`/courses#${s.id}`}>了解课程</TextLink>
              </article>
            ))}
          </div>
        </section>
        <section className="section learning-summary">
          <SectionHead
            title="不止做出来，也知道为什么。"
            to="/method"
            link="了解教学方法"
          />
          <Steps />
        </section>
        <section className="section home-mentors">
          <SectionHead
            title="好老师，让想象走得更远。"
            description="懂技术，也懂孩子的好奇心"
            to="/mentors"
            link="认识导师角色"
          />
          <MentorCards />
        </section>
      </div>
      <Footer />
    </>
  );
}

const knowledge = [
  {
    title: "计算机与编程基础",
    description: "认识计算机、数据与算法，理解程序怎样运行。",
    tags: "变量 · 条件 · 循环",
    target: "读懂简单条件与循环的执行顺序。",
    icon: "Workflow",
  },
  {
    title: "现代编程实践",
    description: "在编程环境中练习，学习代码的组织、交互与调试。",
    tags: "逻辑 · 事件 · 调试",
    target: "完成一个小功能，解释一次修改。",
    icon: "Code2",
  },
  {
    title: "AI 基础与前沿认知",
    description: "理解模型与生成，认识新技术的能力和边界。",
    tags: "模型 · 提示词 · AI 新知",
    target: "比较两段回答，指出需要核查的地方。",
    icon: "Sparkles",
  },
  {
    title: "编程与 AI 综合项目",
    description: "把所学用在项目中，验证结果，解释自己的设计。",
    tags: "应用 · 迭代 · 表达",
    target: "展示成果，也说明设计和测试过程。",
    icon: "PanelsTopLeft",
  },
];

const aiTopics = [
  [
    "FileText",
    "大模型与生成",
    "AI 怎样生成内容？",
    "模型从训练数据中学习规律，并基于输入生成内容。可以比较两次回答，观察哪些内容稳定、哪些内容仍需核查。",
  ],
  [
    "Images",
    "多模态与智能体",
    "AI 怎样处理信息与任务？",
    "多模态关注不同信息形式，例如文字与图片。智能体关注围绕目标执行步骤与使用工具。用“看懂图片”和“规划并执行任务”两个例子区分它们。",
  ],
  [
    "ShieldCheck",
    "能力与边界",
    "为什么还需要判断与验证？",
    "流畅的表达不等于可靠的事实。练习检查来源、识别不确定性，并思考哪些信息不适合交给工具。",
  ],
];

export function Courses() {
  const [topic, setTopic] = useState(null);
  return (
    <>
      <section className="courses-hero">
        <HeroCopy
          breadcrumb="课程服务"
          eyebrow="教育理念与课程"
          line1="先理解原理，"
          line2="再自由创造。"
          description="面向少儿的编程与 AI 教育"
        >
          <p className="hero-detail">
            从计算机与编程基础出发，理解 AI 的概念与原理，
            <br className="desktop-break" />
            认识不断发展的新技术，在实践中把知识变成创造。
          </p>
          <HeroButtons to="#learning-path" label="探索学习路径" />
        </HeroCopy>
        <EducationStage />
        <div className="mobile-lab-link container">
          <TextLink to="/method#plant-lab">打开植物提醒实验</TextLink>
        </div>
      </section>
      <div className="container">
        <section className="section" id="learning-path">
          <SectionHead title="从基础出发，一步步建立能力。" />
          <ol className="knowledge-path">
            {["基础理论", "现代编程", "AI 基础与新知", "综合项目"].map(
              (p, i) => (
                <li key={p}>
                  <span>{i + 1}</span>
                  {p}
                  {i < 3 && <Icon name="ArrowRight" />}
                </li>
              ),
            )}
          </ol>
          <div className="knowledge-grid">
            {knowledge.map((k, i) => (
              <article className="knowledge-card" key={k.title}>
                <div>
                  <h3>{k.title}</h3>
                  <p>{k.description}</p>
                  <span className="soft-tag">{k.tags}</span>
                </div>
                <div className={`knowledge-visual knowledge-visual-${i}`}>
                  {i === 0 ? (
                    <div className="input-output">
                      <Icon name="Laptop" size={62} />
                      <div>
                        <span>输入</span>
                        <Icon name="ArrowRight" size={16} />
                        <span>处理</span>
                        <Icon name="ArrowRight" size={16} />
                        <span>输出</span>
                      </div>
                    </div>
                  ) : i === 1 ? (
                    <div className="small-code">
                      <BrowserDots />
                      <code>
                        <span>让想法开始运行</span>
                        <b>if (ready) {"{"}</b>
                        <i> create();</i>
                        <b>{"}"}</b>
                      </code>
                    </div>
                  ) : i === 2 ? (
                    <div className="ai-concept">
                      <Icon name="Image" size={25} />
                      <Icon name="FileText" size={25} />
                      <strong>AI</strong>
                      <Icon name="MessageCircle" size={25} />
                      <Icon name="AudioLines" size={25} />
                    </div>
                  ) : (
                    <div className="project-check">
                      <Icon name="Sprout" size={62} />
                      <ul>
                        {["设计", "编写", "测试", "分享"].map((t) => (
                          <li key={t}>
                            <Icon name="Check" size={15} />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <p className="learning-target">
                  <Icon name="Flag" size={16} />
                  练习目标：{k.target}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section className="section service-mapping">
          <SectionHead
            title="选择创作起点，沿着知识路径成长。"
            description="三项服务是创作方向，四条路径是贯穿其中的知识。"
          />
          <div className="mapping-grid">
            {services.map((s, i) => (
              <article key={s.id} id={s.id}>
                <span>0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>
                  {
                    [
                      "从表达与基础概念出发，用小实验建立理解。",
                      "将编程实践与 AI 基础结合，完成可以验证的项目。",
                      "在综合项目中反复应用知识，回顾方法并持续改进。",
                    ][i]
                  }
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
      <section className="section blue-band container-wide">
        <div className="container">
          <SectionHead
            title="学懂基础，也看见技术的新变化。"
            description="从概念、生活例子、局限与验证四个角度认识 AI。"
          />
          <div className="grid-three ai-topic-grid">
            {aiTopics.map((t, i) => (
              <button
                type="button"
                className="ai-topic"
                key={t[1]}
                onClick={() => setTopic(i)}
              >
                <span className="circle-icon">
                  <Icon name={t[0]} size={30} />
                </span>
                <h3>{t[1]}</h3>
                <p>{t[2]}</p>
                <span className="text-link">
                  了解这个概念
                  <Icon name="ArrowRight" size={16} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
      <div className="container">
        <section className="section">
          <SectionHead
            title="讲清原理，再动手验证。"
            to="/method"
            link="了解教学方法"
          />
          <Steps
            items={[
              ["Lightbulb", "理解概念", "用简单清楚的方式，建立认识。"],
              ["Code2", "编程练习", "在实践中掌握方法，尝试解决问题。"],
              ["Box", "项目验证", "把想法做出来，检查并改进结果。"],
              ["FileText", "回顾表达", "分享与总结，让理解走得更远。"],
            ]}
          />
        </section>
        <section className="section">
          <SectionHead title="从哪里开始？" />
          <FAQ items={faqItems} />
        </section>
      </div>
      <Footer title="从孩子现在的起点开始。" />
      {topic !== null && (
        <Modal title={aiTopics[topic][1]} onClose={() => setTopic(null)}>
          <p className="concept-question">{aiTopics[topic][2]}</p>
          <p className="concept-body">{aiTopics[topic][3]}</p>
          <div className="concept-exercise">
            <Icon name="Lightbulb" />
            <div>
              <h3>试着想一想</h3>
              <p>
                {
                  [
                    "让 AI 给同一个故事写两个开头，哪些变化来自你的提示？哪些细节需要你自己决定？",
                    "描述一张植物图片，与规划一周的照护提醒，需要完成的任务有什么不同？",
                    "面对一个看起来很肯定的回答，你会先检查其中哪一个事实？",
                  ][topic]
                }
              </p>
            </div>
          </div>
          <TextLink to="/method" onClick={() => setTopic(null)}>
            看看怎样在实践中理解
          </TextLink>
        </Modal>
      )}
    </>
  );
}

export function Method() {
  return (
    <>
      <section className="method-hero">
        <HeroCopy
          eyebrow="教学方法"
          breadcrumb="教学方法"
          line1="让每次动手，"
          line2="都有理解发生。"
          description="从一个问题开始，经历尝试、验证与表达。"
        >
          <HeroButtons />
        </HeroCopy>
        <Art
          source="method"
          rect={[0, 276, 889, 291]}
          alt="教学场景示意：导师陪孩子用纸笔梳理想法"
          priority
          className="method-hero-photo"
        />
      </section>
      <div className="container">
        <section className="section method-process">
          <SectionHead
            title="先想清楚，再写出来。"
            description="从观察到表达，经历一个完整的创造过程。"
          />
          <ol className="number-steps five-steps">
            {methodSteps.map(([title, desc], i) => (
              <li key={title}>
                <span>{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="process-map">
            首页的「创作调试」，在这里展开为「编程实验」与「检查调试」。
          </p>
        </section>
        <section className="section" id="plant-lab">
          <SectionHead
            title="一个小实验，看见程序的逻辑。"
            description="教学示例 · 什么时候提醒我检查植物？"
          />
          <div className="grid-three lab-grid">
            <article className="lab-card">
              <div className="lab-card-head">
                <span>01</span>
                <div>
                  <h3>发现问题</h3>
                  <p>观察问题 · 理解概念</p>
                </div>
              </div>
              <div className="plant-notebook">
                <p className="notebook-title">小小植物观察记</p>
                <Art
                  source="method"
                  rect={[71, 957, 98, 152]}
                  alt="铅笔画下的盆栽观察草图"
                />
                <div className="notebook-caption">
                  怎样记住
                  <br />
                  检查的时间？
                </div>
              </div>
              <p>先说明要提醒什么、什么时候提醒，再整理需要记录的信息。</p>
            </article>
            <article className="lab-card">
              <div className="lab-card-head">
                <span>02</span>
                <div>
                  <h3>表达规则</h3>
                  <p>理解概念 · 编程实验</p>
                </div>
              </div>
              <div className="flow-surface">
                <FlowDiagram />
                <p>同一天内比较时间；完成检查后，不再重复提醒。</p>
              </div>
              <p>把「记得检查」变成清楚的条件，再把条件写进程序。</p>
            </article>
            <article className="lab-card">
              <div className="lab-card-head">
                <span>03</span>
                <div>
                  <h3>运行与修改</h3>
                  <p>检查调试 · 讲述发现</p>
                </div>
              </div>
              <PlantDemo interactive />
              <p>改一改时间，观察结果；完成检查后，再测试一次。</p>
            </article>
          </div>
          <div className="test-cases">
            <strong>
              <Icon name="FlaskConical" size={20} />
              三种情况，都试一试
            </strong>
            <span>
              <b>08:50</b> 时间未到 → 等待
            </span>
            <span>
              <b>09:00</b> 到达时间 → 提醒
            </span>
            <span>
              <Icon name="Check" size={17} /> 已完成检查 → 停止提醒
            </span>
          </div>
        </section>
        <section className="section blue-band ai-thinking">
          <SectionHead
            title="AI 可以协助，思考由孩子完成。"
            description="善用工具，更要学会思考。"
          />
          <div className="grid-three">
            {[
              ["CircleHelp", "问题说清楚了吗？", "我想解决的是什么？"],
              ["Settings2", "结果可靠吗？", "程序的输出符合预期吗？"],
              ["Lightbulb", "能说明修改理由吗？", "我为什么这样调整？"],
            ].map(([icon, title, desc]) => (
              <article className="thinking-item" key={title}>
                <span className="circle-icon">
                  <Icon name={icon} size={29} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="section">
          <SectionHead
            title="看见作品，也看见思考。"
            description="在交流与讨论中，让理解更深入。"
          />
          <div className="reflection-grid">
            <Art
              source="method"
              rect={[49, 1397, 429, 176]}
              alt="课堂交流示意：孩子向导师分享自己的想法"
            />
            <FAQ
              firstOpen={false}
              items={[
                [
                  "能解释自己的思路吗？",
                  "观察孩子能否先说清目标，再用自己的话解释为什么这样设计。",
                ],
                [
                  "能把任务分成小步骤吗？",
                  "观察孩子能否将一个大想法拆成可以逐个尝试的小任务。",
                ],
                [
                  "能发现并尝试修改错误吗？",
                  "观察孩子怎样复现问题、提出猜想，并比较修改前后的结果。",
                ],
                [
                  "能讲清设计中的选择吗？",
                  "观察孩子能否说明一个取舍，并提出下一次想改进的地方。",
                ],
              ]}
            />
          </div>
          <p className="figure-note">课堂摄影为教学场景示意。</p>
        </section>
      </div>
      <Footer title="把理解，变成下一次创造的起点。" course />
    </>
  );
}

export function Mentors() {
  return (
    <>
      <section className="mentors-hero">
        <HeroCopy
          eyebrow="导师团队"
          line1="好老师，"
          line2="让想象走得更远。"
          description="懂技术，也懂孩子的好奇心。"
        >
          <HeroButtons to="/method" label="了解教学方法" />
        </HeroCopy>
        <div className="container mentor-hero-wrap">
          <Art
            source="mentors"
            rect={[36, 298, 816, 313]}
            alt="导师角色场景示意：认真倾听孩子介绍树屋草图"
            priority
          />
        </div>
      </section>
      <div className="container">
        <section className="section">
          <SectionHead title="认识一路陪伴的导师。" />
          <MentorCards detail />
        </section>
        <section className="section mentor-guidance">
          <div>
            <SectionHead title="把知识讲明白，把思考留给孩子。" />
            <Steps
              compact
              items={[
                ["FileText", "理解问题", "一起梳理想法，看清问题本质"],
                ["CircleHelp", "提问引导", "启发思考方向，激发更多可能"],
                ["Code2", "动手验证", "尝试实现创意，在实践中学习"],
                ["RefreshCw", "回顾方法", "一起复盘过程，积累可迁移的方法"],
              ]}
            />
          </div>
          <div className="guidance-notebook">
            <Art rect={[59, 824, 294, 206]} alt="记录创意的树屋手账" />
            <div>
              <span>想一想</span>
              <Icon name="ArrowDown" size={18} />
              <span>试一试</span>
              <Icon name="ArrowDown" size={18} />
              <span>再改进</span>
            </div>
          </div>
        </section>
        <section className="section blue-band mentor-values">
          <h2>每一次探索，都有人同行。</h2>
          <div className="grid-three">
            {[
              [
                "Ear",
                "认真倾听",
                "先听孩子把思路说完，再一起寻找值得继续探索的问题。",
              ],
              [
                "Heart",
                "耐心引导",
                "先请孩子解释猜想，再一起定位错误、尝试修改。",
              ],
              [
                "Users",
                "鼓励表达",
                "邀请孩子分享过程中的选择，让每次尝试都有反馈。",
              ],
            ].map(([icon, title, desc]) => (
              <article key={title}>
                <Icon name={icon} size={32} />
                <div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="section conversation-section">
          <SectionHead title="先了解孩子，再讨论下一步。" />
          <ol className="number-steps">
            {[
              ["聊聊兴趣", "了解孩子的兴趣和想法"],
              ["了解经验", "聊聊已有的学习与创作经历"],
              ["沟通学习方向", "一起探讨更适合的下一步"],
            ].map(([title, desc], i) => (
              <li key={title}>
                <span>{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="button-row">
            <ReserveButton />
          </div>
        </section>
      </div>
      <Footer title="让好奇被听见，让探索有陪伴。" />
    </>
  );
}

export function ProjectDetail({ project, onClose }) {
  return (
    <Modal title={project.title} onClose={onClose} className="project-modal">
      <p className="modal-intro">创作示例 · {project.description}</p>
      <div className={`detail-demo detail-${project.id} ${showcaseIds.has(project.id)?'showcase-detail':''}`}>
        <ProjectVisual id={project.id} interactive />
      </div>
      <div className="project-detail-grid">
        <section>
          <span>01 / 从问题开始</span>
          <h3>我们想解决什么？</h3>
          <p>{project.thought}</p>
        </section>
        <section>
          <span>02 / 把思路写清楚</span>
          <h3>怎样让它运行？</h3>
          <p>{project.rule}</p>
        </section>
        <section>
          <span>03 / 检查与修改</span>
          <h3>怎样知道它可用？</h3>
          <p>{project.check}</p>
        </section>
        <section>
          <span>04 / 再多想一步</span>
          <h3>试着解释一次选择。</h3>
          <p>{project.reflection}</p>
        </section>
      </div>
      <TextLink to="/method" onClick={onClose}>
        了解教学方法
      </TextLink>
    </Modal>
  );
}

export function Projects() {
  const [search, setSearch] = useSearchParams();
  const available = ["all", ...categories.map((c) => c.id), "ai"];
  const category = available.includes(search.get("category"))
    ? search.get("category")
    : "all";
  const selectedId=legacyProjectIds[search.get('project')]||search.get('project');
  const selected = projects.find((p) => p.id === selectedId);
  const filtered = projects.filter(
    (p) => category === "all" || p.category === category,
  );
  const setCategory = (id) => {
    setSearch(
      (prev) => {
        const s = new URLSearchParams(prev);
        s.delete("project");
        if (id === "all") s.delete("category");
        else s.set("category", id);
        return s;
      },
      { preventScrollReset: true },
    );
  };
  const openProject = (id) =>
    setSearch(
      (prev) => {
        const s = new URLSearchParams(prev);
        s.set("project", id);
        return s;
      },
      { preventScrollReset: true },
    );
  const closeProject = () =>
    setSearch(
      (prev) => {
        const s = new URLSearchParams(prev);
        s.delete("project");
        return s;
      },
      { replace: true, preventScrollReset: true },
    );
  return (
    <>
      <section className="projects-hero">
        <HeroCopy
          eyebrow="作品展示"
          line1="让想法，"
          line2="成为看得见的作品。"
          description="探索不同的创作方向，看看知识怎样被应用。"
        >
          <p className="hero-note">本页均为创作示例</p>
        </HeroCopy>
        <TabletStage gallery />
      </section>
      <div className="container">
        <section className="section gallery-section" id="gallery">
          <SectionHead title="找到你的创作灵感。" />
          <div className="gallery-toolbar">
            <div
              className="filter-group"
              role="group"
              aria-label="筛选创作示例"
            >
              {[
                { id: "all", label: "全部" },
                ...categories,
                { id: "ai", label: "AI 探索" },
              ].map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={c.id === category ? "selected" : ""}
                  aria-pressed={c.id === category}
                  onClick={() => setCategory(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <p aria-live="polite">{filtered.length} 个创作示例</p>
          </div>
          <div className="grid-three project-grid">
            {filtered.map((p) => (
              <article className="project-card" key={p.id}>
                <div className="project-visual">
                  <ProjectVisual id={p.id} mini />
                </div>
                <div className="project-card-body">
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                  <div className="project-tags">
                    {p.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => openProject(p.id)}
                    aria-label={`查看${p.title}的创作过程`}
                  >
                    查看创作过程
                    <Icon name="ArrowRight" size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="section blue-band project-process">
          <SectionHead
            title="一个作品，是怎样做出来的？"
            description="从一个小问题出发，经历思考、实现与改进，让想法一步步变成作品。"
          />
          <ol className="number-steps five-steps">
            {[
              ["发现问题", "从生活中找到一个想解决的问题"],
              ["画出思路", "梳理想法，设计实现步骤"],
              ["动手实现", "用合适的工具，把思路落地"],
              ["测试修改", "试一试，发现问题，不断优化"],
              ["分享作品", "展示作品，也说明思路"],
            ].map(([title, desc], i) => (
              <li key={title}>
                <span>{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="process-examples">
            <div className="process-idea">
              <Icon name="NotebookPen" size={32} />
              <p>
                我想做一个
                <br />
                提醒自己检查
                <br />
                植物的小工具。
              </p>
              <span>发现问题</span>
            </div>
            <div>
              <FlowDiagram compact />
              <span>画出思路 · 动手实现</span>
            </div>
            <div>
              <PlantDemo mini />
              <span>测试修改 · 分享作品</span>
            </div>
          </div>
        </section>
        <section className="section">
          <SectionHead
            title="看懂一个功能，试着改变它。"
            description="在已有的作品基础上多想一步，你也能创造出不一样的可能。"
          />
          <div className="grid-three reflection-prompts">
            {[
              [
                "Settings2",
                "改一条规则",
                "试着调整一个条件，看看会发生什么变化。",
              ],
              [
                "Lightbulb",
                "换一种实现",
                "用不同的方法实现同一个功能，比较哪种更好。",
              ],
              [
                "ChartNoAxesColumnIncreasing",
                "讲一次改进",
                "为自己的作品提出一个小改进，并说明选择理由。",
              ],
            ].map(([icon, title, desc]) => (
              <article key={title}>
                <Icon name={icon} size={34} />
                <div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
      <Footer title="下一件作品，从一个想法开始。" course />
      {selected && <ProjectDetail project={selected} onClose={closeProject} />}
    </>
  );
}

export function NotFound() {
  return (
    <div className="not-found container">
      <span>404</span>
      <h1>这个页面还没被创造。</h1>
      <p>先回到首页，继续探索新的想法。</p>
      <Link to="/" className="button button-primary">
        回到首页
        <Icon name="ArrowRight" size={18} />
      </Link>
    </div>
  );
}
