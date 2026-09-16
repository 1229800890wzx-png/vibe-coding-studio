import React, { useId, useState } from 'react';
import { Icon } from './components';
import './lesson-exercises.css';

function Exercise({ title, intro, reset, children, name }) {
  return <section className={`le-exercise le-exercise--${name}`} aria-label={title}>
    <div className="le-heading"><div><h4>{title}</h4><p>{intro}</p></div>
      {reset && <button type="button" className="le-reset" onClick={reset}><Icon name="RotateCcw" size={14} />重置</button>}
    </div>
    {children}
  </section>;
}

function Feedback({ children, positive = false }) {
  return <p className={`le-feedback${positive ? ' is-positive' : ''}`} role="status" aria-live="polite"><Icon name={positive ? 'CircleCheck' : 'Info'} size={16} /><span>{children}</span></p>;
}

function Choices({ label, choices, value, onChange }) {
  return <div className="le-choices" role="group" aria-label={label}>{choices.map(choice => {
    const item = typeof choice === 'string' ? { value: choice, label: choice } : choice;
    return <button type="button" key={item.value} aria-pressed={value === item.value} onClick={() => onChange(item.value)}>{item.label}</button>;
  })}</div>;
}

function LogicExercise() {
  const [stars, setStars] = useState(0);
  const open = stars >= 3;
  return <Exercise name="logic" title="给冒险世界设计一扇门" intro="规则：收集至少 3 颗星，大门才会打开。试着改变输入。" reset={() => setStars(0)}>
    <Choices label="选择星星数量" value={stars} onChange={setStars} choices={[0, 2, 3, 5].map(value => ({ value, label: `${value} 颗` }))} />
    <div className="le-flow">
      <div className="le-flow-node"><span className="le-caption">输入</span><Icon name="Star" /><strong>{stars} 颗星</strong></div>
      <Icon className="le-flow-arrow" name="ArrowRight" size={19} />
      <div className="le-flow-node"><span className="le-caption">判断</span><Icon name="Workflow" /><strong>星星数量 ≥ 3</strong></div>
      <Icon className="le-flow-arrow" name="ArrowRight" size={19} />
      <div className={`le-flow-node${open ? ' is-positive' : ''}`}><span className="le-caption">结果</span><Icon name={open ? 'CircleCheck' : 'LockKeyhole'} /><strong>{open ? '大门已打开' : '继续探索'}</strong></div>
    </div>
    <Feedback positive={open}>{open ? '条件成立，程序执行「打开大门」。' : `条件还未成立，再找到 ${3 - stars} 颗星就能开门。`}</Feedback>
    <p className="le-note">学到的概念：输入与输出 · 条件判断 · 验证规则</p>
  </Exercise>;
}

const vibeSteps = [
  ['拆解任务', '先让计分按钮正常工作，再添加胜利提示。每一步都能单独检查。'],
  ['小步修改', '只调整当前这一步。说明哪些内容需要修改，哪些功能要继续保留。'],
  ['运行检查', '亲自点一次、连续点三次，再重置。把实际结果与验收条件逐项比较。'],
  ['保存版本', '确认能运行后保存版本并写清改动；下一次出错时，可以比较并恢复。'],
];

function VibeExercise() {
  const [clear, setClear] = useState(true);
  const [step, setStep] = useState(0);
  return <Exercise name="vibe" title="把「帮我做个游戏」说清楚" intro="工具更容易执行具体任务。比较两种描述，再走一遍创作流程。" reset={() => { setClear(true); setStep(0); }}>
    <Choices label="比较任务描述" value={clear} onChange={setClear} choices={[{ value: false, label: '模糊描述' }, { value: true, label: '清晰任务' }]} />
    <div className="le-task-brief">
      {clear ? <dl><div><dt>目标</dt><dd>制作一个点击星星计分的小游戏。</dd></div><div><dt>范围</dt><dd>先做计分按钮与重置，暂不添加音效和关卡。</dd></div><div><dt>验收</dt><dd>每次点击加 1 分；点击三次为 3 分；重置后为 0 分。</dd></div></dl> : <><p className="le-quote">“帮我做一个好玩的游戏。”</p><p className="le-note">目标、范围和完成标准都不清楚，结果容易偏离想法。</p></>}
    </div>
    <div className="le-step-buttons" role="group" aria-label="高效创作的四个步骤">{vibeSteps.map(([label], index) => <button type="button" key={label} aria-pressed={step === index} onClick={() => setStep(index)}><span>0{index + 1}</span>{label}</button>)}</div>
    <Feedback>{vibeSteps[step][1]}</Feedback>
  </Exercise>;
}

const skillCases = [
  { name: '星星计分器', findings: ['目标：点击星星计分。', '规则：预期每次 +1，实际每次 +2。', '边界：重置后分数为 0，符合预期。'], action: '下一步：修正加分规则，再重新验证。' },
  { name: '冒险开门游戏', findings: ['目标：收集至少 3 颗星后开门。', '规则：2 颗时未打开，符合预期。', '边界：恰好 3 颗时仍未打开，需要检查「>」与「≥」。'], action: '下一步：检查条件边界，再测试 2、3、5 颗星。' },
];

function SkillExercise() {
  const [game, setGame] = useState(0);
  const [checked, setChecked] = useState(false);
  return <Exercise name="skill" title="让一个检查方法，服务不同作品" intro="Skill 可以把说明、步骤与参考资料整理成可复用的技能包。下面用预设案例体验同一套方法。" reset={() => { setGame(0); setChecked(false); }}>
    <Choices label="选择待检查作品" value={game} onChange={value => { setGame(value); setChecked(false); }} choices={skillCases.map((item, value) => ({ value, label: item.name }))} />
    <div className="le-method-pack"><div><Icon name="NotebookPen" size={20} /><strong>小游戏检查 · 方法包</strong></div><ol><li>说清作品目标</li><li>对照规则检查</li><li>测试边界情况</li></ol></div>
    <button type="button" className="le-action" onClick={() => setChecked(true)}><Icon name="Check" size={17} />按方法检查</button>
    <div className="le-result" role="status" aria-live="polite">{checked ? <><ul>{skillCases[game].findings.map(item => <li key={item}>{item}</li>)}</ul><p>{skillCases[game].action}</p></> : <p>选择一个作品，看看相同方法会发现什么。</p>}</div>
    <p className="le-note">方法可以复用，结论仍要验证。Skill 不会保证作品一定正确。</p>
  </Exercise>;
}

const sampleWorks = [{ title: '星星计分器', stage: '正在调试' }, { title: '会分支的故事', stage: '完成初稿' }];

function McpExercise() {
  const permissionId = useId();
  const [allowed, setAllowed] = useState(true);
  const [connected, setConnected] = useState(false);
  const [read, setRead] = useState(false);
  const [message, setMessage] = useState('先连接，再尝试读取作品。');
  const reset = () => { setAllowed(true); setConnected(false); setRead(false); setMessage('先连接，再尝试读取作品。'); };
  return <Exercise name="mcp" title="AI 怎样使用外部工具与数据？" intro="MCP 是连接 AI 应用与外部工具、数据的协议。这里用本地样例模拟连接与权限。" reset={reset}>
    <div className="le-simulation"><span className="le-mini-badge">模拟连接</span><span>本地作品清单 · 不连接真实账户</span></div>
    <div className="le-connection-row"><label className="le-switch" htmlFor={permissionId}><input id={permissionId} type="checkbox" checked={allowed} onChange={event => { setAllowed(event.target.checked); setRead(false); setMessage(event.target.checked ? '已允许读取，修改权限仍未开放。' : '已撤销读取权限，作品列表已清空。'); }} /><span>允许读取作品（只读）</span></label>
      <button type="button" className="le-action" aria-pressed={connected} onClick={() => { setConnected(!connected); setRead(false); setMessage(connected ? '模拟连接已断开。' : '模拟连接已建立。现在可以请求读取。'); }}>{connected ? '断开模拟连接' : '连接模拟清单'}</button></div>
    <div className="le-choices le-request-actions"><button type="button" onClick={() => { if (!connected) { setMessage('读取未执行：请先建立模拟连接。'); return; } if (!allowed) { setMessage('读取被拒绝：尚未获得读取权限。'); return; } setRead(true); setMessage('读取完成，返回 2 个本地样例。'); }}>读取作品</button><button type="button" onClick={() => setMessage(connected ? '修改被拒绝：此连接只允许读取，没有修改权限。' : '修改未执行：请先建立模拟连接。')}>尝试修改</button></div>
    {read && <ul className="le-records" aria-label="本地样例作品">{sampleWorks.map(item => <li key={item.title}><Icon name="FileText" size={17} /><strong>{item.title}</strong><span>{item.stage}</span></li>)}</ul>}
    <Feedback>{message}</Feedback>
    <p className="le-note">这是权限原理演示，没有发起真实 MCP 请求，也不会修改作品。</p>
  </Exercise>;
}

function DebugExercise() {
  const [score, setScore] = useState(0);
  const [increment, setIncrement] = useState(2);
  const [snapshot, setSnapshot] = useState(null);
  const [message, setMessage] = useState('目标是每次点击 +1 分。先运行一次，寻找实际结果与预期的差异。');
  const reset = () => { setScore(0); setIncrement(2); setSnapshot(null); setMessage('已重置练习。点击计分按钮，重新检查规则。'); };
  return <Exercise name="debug" title="找到问题，也能回到上一个版本" intro="预期每次点击加 1 分。运行、修复、保存，再试着恢复。" reset={reset}>
    <div className="le-counter"><div><span className="le-caption">当前分数</span><strong>{score}</strong></div><button type="button" className="le-action" disabled={score >= 999} onClick={() => { const next = Math.min(999, score + increment); setScore(next); setMessage(increment === 2 ? `实际增加 ${next - score} 分，和每次 +1 的目标不一致。` : `实际增加 ${next - score} 分，${next - score === 1 ? '符合每次 +1 的规则。' : '已到达 999 分上限。'}`); }}><Icon name="Star" size={19} />点击计分</button><span className="le-rule">当前规则：每次 +{increment}</span></div>
    <div className="le-choices le-request-actions"><button type="button" disabled={increment === 1} onClick={() => { setIncrement(1); setMessage('已将规则修复为每次 +1，已有分数保留。再点一次验证。'); }}>{increment === 1 ? '规则已修复' : '修复规则'}</button><button type="button" onClick={() => { setSnapshot({ score, increment }); setMessage(`已保存此刻版本：${score} 分，每次 +${increment}。仅在本次练习中保留。`); }}>保存当前版本</button><button type="button" disabled={!snapshot} onClick={() => { setScore(snapshot.score); setIncrement(snapshot.increment); setMessage(`已恢复保存时的规则与分数：${snapshot.score} 分，每次 +${snapshot.increment}。`); }}>恢复已保存版本</button></div>
    <Feedback positive={increment === 1}>{message}</Feedback>
    <p className="le-note">保存的是当时的状态，也可能包含错误。先验证，再保存可用版本。此处是版本概念练习，实际项目中使用版本管理工具。</p>
  </Exercise>;
}

const comparisonChecks = [
  { title: '检查一次点击', expected: '预期 1 分', results: [1, 1], target: 1 },
  { title: '检查连续三次', expected: '从 0 开始，预期 3 分', results: [3, 3], target: 3 },
  { title: '检查重新开始', expected: '从 3 分重开，预期 0 分', results: [3, 0], target: 0 },
];

function IterationExercise() {
  const [checked, setChecked] = useState([]);
  const [choice, setChoice] = useState('');
  const [message, setMessage] = useState('给两种方案相同任务，再用相同标准逐项检查。');
  const complete = checked.length === comparisonChecks.length;
  const check = index => {
    setChecked(current => current.includes(index) ? current : [...current, index]);
    setMessage(index === 2 ? '重新开始：方案 A 仍为 3 分，方案 B 回到 0 分。发现了需要修正的差异。' : `${comparisonChecks[index].title}：两种方案都符合这一项预期。继续检查其他情况。`);
  };
  const choose = value => {
    setChoice(value);
    setMessage(value === 'A' ? '选择方案 A 继续修改：计分符合要求，但重新开始没有清零。先修复重开规则，再复查全部三项。' : '选择方案 B 作为下一步基础：它通过了这三项检查。还需测试连续重开、更多点击等情况，才能进一步确认。');
  };
  return <Exercise name="iterate" title="用同一个任务，比较不同方案" intro="任务：点击计分，每次 +1，重新开始时归零。以下是两种匿名方案的预设测试样例，不代表真实工具评测。" reset={() => { setChecked([]); setChoice(''); setMessage('已重置比较。再次用相同标准逐项检查。'); }}>
    <table className="le-compare-table"><caption>同一套验收标准</caption><thead><tr><th scope="col">检查项目</th><th scope="col">方案 A</th><th scope="col">方案 B</th></tr></thead><tbody>{comparisonChecks.map((item, index) => <tr key={item.title}><th scope="row"><button type="button" onClick={() => check(index)}>{item.title}</button><span>{item.expected}</span></th>{item.results.map((result, plan) => <td key={plan}>{checked.includes(index) ? <><strong>{result} 分</strong><span className={result === item.target ? 'le-check-pass' : 'le-check-fail'}>{result === item.target ? '符合预期' : '需要修改'}</span></> : <span>等待检查</span>}</td>)}</tr>)}</tbody></table>
    <div className="le-choices" role="group" aria-label="根据检查结果选择下一步"><button type="button" disabled={!complete} aria-pressed={choice === 'A'} onClick={() => choose('A')}>修改方案 A</button><button type="button" disabled={!complete} aria-pressed={choice === 'B'} onClick={() => choose('B')}>以方案 B 继续</button></div>
    <Feedback>{message}</Feedback>
    <p className="le-note">{complete ? '不要只看生成效果。说清证据、说明选择原因，并保留测试通过的版本。' : '完成三项检查后，再根据结果选择修改或继续。每项检查都从表中规定的状态开始。'}</p>
  </Exercise>;
}

function AiExercise() {
  const [context, setContext] = useState(false);
  return <Exercise name="ai" title="同一个问题，给 AI 不同的上下文" intro="下面是预设回答对比，体验背景信息怎样影响回答。" reset={() => setContext(false)}>
    <Choices label="选择提问方式" value={context} onChange={setContext} choices={[{ value: false, label: '信息不足' }, { value: true, label: '补充上下文' }]} />
    <div className="le-comparison"><div><span className="le-caption">我的问题</span><p>{context ? '我的程序每次点星星加 2 分，代码是 score = score + 2。我希望每次只加 1，该检查哪里？' : '我的游戏有问题，帮我修好。'}</p></div><div><span className="le-caption">预设回答示例</span><p>{context ? '可以检查加分规则：把 +2 调整为 +1。修改后点击一次，再连续点击三次，验证结果。' : '还需要知道：发生了什么、你期待什么、相关代码是什么。'}</p></div></div>
    <Feedback>{context ? '上下文让建议更具体，但仍要亲自运行，确认一次 +1、三次 +3。' : '先补充现象、目标和必要代码；不需要提供姓名、密码等私人信息。'}</Feedback>
    <p className="le-note">大模型根据上下文生成回答，可能出错。参考建议后，还要查证与测试。</p>
  </Exercise>;
}

function ExpressExercise() {
  const [role, setRole] = useState('小小探险家');
  const [goal, setGoal] = useState('收集星星');
  return <Exercise name="express" title="把脑海里的想法，说成清楚的任务" intro="选一个角色，再选一个目标，让别人知道你想做什么。" reset={() => { setRole('小小探险家'); setGoal('收集星星'); }}>
    <span className="le-caption">谁来使用？</span><Choices label="选择角色" choices={['小小探险家', '故事里的机器人']} value={role} onChange={setRole} />
    <span className="le-caption">要完成什么？</span><Choices label="选择目标" choices={['收集星星', '找到回家的路']} value={goal} onChange={setGoal} />
    <div className="le-result" role="status"><strong>我的第一份需求</strong><p>我想做一个互动故事，让{role}通过选择不同路线，{goal}。</p></div>
    <p className="le-note">下一步再说清楚：怎样操作？什么结果代表完成了？</p>
  </Exercise>;
}

function StoryExercise() {
  const [route, setRoute] = useState('');
  return <Exercise name="story" title="一个选择，让故事走向不同结局" intro="机器人来到岔路口。你会让它怎样寻找回家的路？" reset={() => setRoute('')}>
    <Choices label="选择故事分支" choices={['进入森林', '沿着河流']} value={route} onChange={setRoute} />
    <div className="le-story-result" role="status"><Icon name="Compass" size={25} /><div><strong>{route || '故事等待你的选择'}</strong><p>{route === '进入森林' ? '机器人发现旧路牌，读懂方向后找到了村庄。下一步可以设计「路牌是否清晰」的判断。' : route === '沿着河流' ? '机器人看见一座小桥，过桥后回到了家。下一步可以设计「桥是否能通过」的判断。' : '点击一个分支，观察同一个开头怎样产生不同的后续。'}</p></div></div>
    <p className="le-note">选择 → 条件 → 后续。把故事分支写清楚，就能开始设计交互逻辑。</p>
  </Exercise>;
}

function PortfolioExercise() {
  const id = useId();
  const [goal, setGoal] = useState('');
  const [method, setMethod] = useState('');
  const [preview, setPreview] = useState(null);
  return <Exercise name="portfolio" title="不只展示作品，也说清自己的思考" intro="写下目标与实现方法，生成一段自己的展示说明。内容只保留在当前练习中。" reset={() => { setGoal(''); setMethod(''); setPreview(null); }}>
    <div className="le-writing-grid"><label htmlFor={`${id}-goal`}>我想解决什么问题<input id={`${id}-goal`} value={goal} maxLength={80} placeholder="例如：让同学更容易记住课堂知识" onChange={event => { setGoal(event.target.value); setPreview(null); }} /><span>{goal.length}/80</span></label><label htmlFor={`${id}-method`}>我使用了什么方法<input id={`${id}-method`} value={method} maxLength={100} placeholder="例如：用条件判断制作互动问答" onChange={event => { setMethod(event.target.value); setPreview(null); }} /><span>{method.length}/100</span></label></div>
    <button type="button" className="le-action" disabled={!goal.trim() || !method.trim()} onClick={() => setPreview({ goal: goal.trim(), method: method.trim() })}>预览展示说明<Icon name="ArrowRight" size={17} /></button>
    <div className="le-result" role="status">{preview ? <><strong>我的作品说明</strong><p>我的目标是{preview.goal}。我通过{preview.method}来实现它。</p><p className="le-note">展示时再补充：哪里经过修改？你如何确认它能正常工作？</p></> : <p>填写两项内容后，预览自己的作品说明。</p>}</div>
  </Exercise>;
}

const exercises = { logic: LogicExercise, vibe: VibeExercise, skill: SkillExercise, mcp: McpExercise, debug: DebugExercise, iterate: IterationExercise, ai: AiExercise, express: ExpressExercise, story: StoryExercise, portfolio: PortfolioExercise, share: PortfolioExercise };

export default function LessonExercise({ type = 'logic' }) {
  const Component = exercises[type] || LogicExercise;
  return <Component key={type} />;
}
