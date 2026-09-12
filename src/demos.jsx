import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Art, Icon } from "./components";
import { categories, projects } from "./content";
import { ShowcaseTablet } from "./tablet-showcase";
import { ShowcaseImage, ShowcaseExperience } from "./showcase";
import { showcaseIds } from "./showcase-content";

export function BrowserDots() {
  return (
    <span className="browser-dots" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

export function Island({ interactive = false, compact = false }) {
  const [stars, setStars] = useState([]);
  return (
    <div className={`island-demo ${compact ? "compact" : ""}`}>
      <Art rect={[507, 361, 228, 230]} alt="蓝色海面上的树屋小岛" priority />
      {interactive && (
        <>
          <div className="game-hud">
            <Icon name="Heart" size={20} />
            <span aria-live="polite">
              {stars.length === 3 ? "全部找到啦！" : `星星 ${stars.length} / 3`}
            </span>
            <button
              type="button"
              onClick={() => setStars([])}
              aria-label="重新收集星星"
            >
              <Icon name="RotateCcw" size={18} />
            </button>
          </div>
          {[0, 1, 2].map((n) => (
            <button
              type="button"
              key={n}
              className={`collect-star star-${n} ${stars.includes(n) ? "collected" : ""}`}
              aria-label={`${stars.includes(n) ? "已收集" : "收集"}第 ${n + 1} 颗星星`}
              aria-pressed={stars.includes(n)}
              onClick={() => setStars((s) => (s.includes(n) ? s : [...s, n]))}
            >
              <Icon name={stars.includes(n) ? "Check" : "Star"} size={28} />
            </button>
          ))}
          <p className="game-caption">试着找到小岛上的三颗星星</p>
        </>
      )}
    </div>
  );
}

export function Story({ interactive = false }) {
  const [choice, setChoice] = useState("start");
  const texts = {
    start: "一条小路在你面前延伸，你想去哪里？",
    forest: "你在森林里找到了一颗会发光的种子。",
    river: "你在河边遇到了一只迷路的小水獭。",
  };
  return (
    <div className={`story-demo ${interactive ? "interactive" : ""}`}>
      <Art
        source="story-hd"
        rect={[0, 0, 1536, 1024]}
        alt="孩子与小狐狸在温暖的森林相遇"
        priority
      />
      <div className="story-choice">
        <p aria-live="polite">{texts[choice]}</p>
        {choice === "start" ? (
          <div className="story-buttons">
            {interactive ? (
              <>
                <button type="button" onClick={() => setChoice("forest")}>
                  走进森林
                </button>
                <button type="button" onClick={() => setChoice("river")}>
                  沿河探索
                </button>
              </>
            ) : (
              <>
                <span>走进森林</span>
                <span>沿河探索</span>
              </>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => setChoice("start")}>
            回到岔路口 <Icon name="RotateCcw" size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export function Space({ interactive = false }) {
  const [tab, setTab] = useState("星空探索");
  const panels = {
    星空探索: ["仰望星空", "发现更多可能"],
    我的发现: ["记录好奇", "收集每一次发现"],
    关于我: ["我的宇宙", "一个关于热爱的空间"],
  };
  return (
    <div className="space-demo">
      <Art
        source="space-hd"
        rect={[0, 0, 1536, 1024]}
        alt="深蓝太空中的环状行星"
        priority
      />
      <div className="space-top">
        <span>我的宇宙探索站</span>
        <Icon name="Orbit" size={20} />
      </div>
      <div className="space-copy" aria-live="polite">
        <strong>
          {panels[tab][0]}
          <br />
          {panels[tab][1]}
        </strong>
        <p>用好奇心，探索更大的世界</p>
      </div>
      {interactive && (
        <nav className="space-nav" aria-label="宇宙网站演示导航">
          {Object.keys(panels).map((t) => (
            <button
              type="button"
              key={t}
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

export function PlantPicture() {
  return (
    <Art
      source="plant-hd"
      rect={[240, 130, 775, 1020]}
      alt="陶土盆里生长的绿色植物"
      className="plant-picture"
    />
  );
}

export function Calendar({ day = 10 }) {
  // September 1, 2026 is Tuesday. A Monday-first calendar has one leading cell.
  return (
    <div className="calendar" aria-label={`2026 年 9 月，选中 9 月 ${day} 日`}>
      <strong>2026 年 9 月</strong>
      <div className="calendar-grid" aria-hidden="true">
        {["一", "二", "三", "四", "五", "六", "日"].map((d) => (
          <b key={d}>{d}</b>
        ))}
        <span />
        {Array.from({ length: 30 }, (_, i) => (
          <span key={i} className={i + 1 === day ? "selected" : ""}>
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

export function reminderState(now, due, checked) {
  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(now) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(due)
  )
    return "请先设置完整时间";
  return checked
    ? "已完成检查"
    : now >= due
      ? "该检查植物了"
      : "还没到提醒时间";
}

export function PlantDemo({ interactive = false, mini = false }) {
  const [time, setTime] = useState("08:50");
  const [due, setDue] = useState("09:00");
  const [checked, setChecked] = useState(false);
  const status = reminderState(time, due, checked);
  return (
    <div className={`plant-demo ${mini ? "plant-mini" : ""}`}>
      <div className="plant-title">
        <Icon name="Sprout" size={20} />
        <strong>植物照护提醒助手</strong>
      </div>
      <div className="plant-main">
        <PlantPicture />
        <div className="plant-detail">
          <span>下次检查</span>
          <strong>9 月 10 日 {due}</strong>
          <span
            className={`plant-status ${checked ? "done" : time >= due ? "due" : ""}`}
            aria-live="polite"
          >
            <Icon name={checked ? "CircleCheck" : "Clock3"} size={16} />
            {status}
          </span>
        </div>
      </div>
      {!mini && <Calendar />}
      {mini && (
        <div className="mini-week" aria-label="示例日期：9 月 10 日，星期四">
          {["一", "二", "三", "四", "五", "六", "日"].map((d, i) => (
            <span key={d} className={i === 3 ? "today" : ""}>
              <b>{d}</b>
              <i>{i + 7}</i>
            </span>
          ))}
        </div>
      )}
      {interactive && (
        <div className="plant-controls">
          <div className="time-controls">
            <label>
              模拟当前时间
              <input
                type="time"
                aria-label="模拟当前时间"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setChecked(false);
                }}
                required
              />
            </label>
            <label>
              提醒时间
              <input
                type="time"
                aria-label="提醒时间"
                value={due}
                onChange={(e) => {
                  setDue(e.target.value);
                  setChecked(false);
                }}
                required
              />
            </label>
          </div>
          <div className="plant-buttons">
            <button
              type="button"
              onClick={() => {
                setTime(due);
                setChecked(false);
              }}
            >
              试试到点
            </button>
            <button
              type="button"
              onClick={() => setChecked(true)}
              disabled={checked}
            >
              完成检查
            </button>
            <button
              type="button"
              aria-label="重置提醒示例"
              onClick={() => {
                setTime("08:50");
                setDue("09:00");
                setChecked(false);
              }}
            >
              <Icon name="RotateCcw" size={16} />
            </button>
          </div>
          <small>模拟日期为 2026 年 9 月 10 日，仅提醒检查，不控制浇水。</small>
        </div>
      )}
    </div>
  );
}

export function Classification({ interactive = false }) {
  const [sample, setSample] = useState("leaf");
  const [tested, setTested] = useState(false);
  return (
    <div className="classification-demo">
      <strong>这是什么植物？</strong>
      <div className="classification-pictures">
        <div className={sample === "leaf" ? "selected" : ""}>
          <Art source="projects" rect={[346, 987, 45, 51]} alt="绿色叶片样本" />
        </div>
        <div className={sample === "flower" ? "selected" : ""}>
          <Art source="projects" rect={[431, 982, 42, 55]} alt="粉色花朵样本" />
        </div>
      </div>
      {interactive ? (
        <>
          <div className="choice-row">
            <button
              type="button"
              aria-pressed={sample === "leaf"}
              onClick={() => {
                setSample("leaf");
                setTested(false);
              }}
            >
              叶片
            </button>
            <button
              type="button"
              aria-pressed={sample === "flower"}
              onClick={() => {
                setSample("flower");
                setTested(false);
              }}
            >
              花朵
            </button>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() => setTested(true)}
          >
            查看标签与验证问题 <Icon name="ArrowRight" size={16} />
          </button>
          {tested && (
            <p className="demo-feedback" role="status">
              样本标签：{sample === "leaf" ? "叶片" : "花朵"}
              。换一张有遮挡的图片，还能判断吗？
            </p>
          )}
          <small>标签演示 · 未调用 AI 模型</small>
        </>
      ) : (
        <div className="choice-row">
          <span>叶片</span>
          <span>花朵</span>
        </div>
      )}
    </div>
  );
}

export function QuestionDemo({ interactive = false }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="question-demo">
      <div className="chat-question">为什么天空是蓝色的？</div>
      <div className="chat-answer">
        <Icon name="Bot" size={22} />
        <p>
          这与光在大气中的散射有关。我们可以把这个说法拆开，找资料逐项核查。
        </p>
      </div>
      {interactive ? (
        <>
          <button
            type="button"
            className="text-button"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            <Icon name="Search" size={16} />
            {expanded ? "收起核查步骤" : "查看核查步骤"}
          </button>
          {expanded && (
            <ol className="verify-list">
              <li>找出可核查的关键词：光、大气、散射。</li>
              <li>查阅科学教材或可靠科普机构的解释。</li>
              <li>比较不同资料，记录仍不理解的部分。</li>
            </ol>
          )}
        </>
      ) : (
        <span className="verify-label">
          <Icon name="Search" size={14} />
          需要核查
        </span>
      )}
    </div>
  );
}

export function ProjectVisual({ id, interactive = false, mini = false }) {
  if (showcaseIds.has(id)) return interactive ? <ShowcaseExperience id={id} /> : <ShowcaseImage id={id} />;
  if (id === "island") return <Island interactive={interactive} />;
  if (id === "fox") return <Story interactive={interactive} />;
  if (id === "space") return <Space interactive={interactive} />;
  if (id === "plant")
    return <PlantDemo interactive={interactive} mini={mini} />;
  if (id === "classify") return <Classification interactive={interactive} />;
  if (id === "question") return <QuestionDemo interactive={interactive} />;
  return null;
}

export function TabletStage(props) {
  return <ShowcaseTablet {...props} />;
}

export function FlowDiagram({ compact = false }) {
  return (
    <div
      className={`flow-diagram ${compact ? "compact" : ""}`}
      aria-label="条件流程：到提醒时间了吗？是，显示提醒；否，继续等待。"
    >
      <div className="flow-node">到提醒时间了吗？</div>
      <div className="flow-branch" aria-hidden="true" />
      <div className="flow-paths">
        <div>
          <span>是</span>
          <i />
          <strong>显示提醒</strong>
        </div>
        <div>
          <span>否</span>
          <i />
          <strong>继续等待</strong>
        </div>
      </div>
    </div>
  );
}

export function EducationStage() {
  return (
    <div className="education-stage">
      <Art
        source="courses"
        rect={[0, 334, 832, 306]}
        alt="书桌上的笔记本与平板，展示从流程到程序的过程"
        priority
      />
      <div className="notebook-overlay">
        <p>记得检查我的植物</p>
        <FlowDiagram compact />
        <span>先想清规则，再让它运行。</span>
      </div>
      <div className="education-screen">
        <div className="code-pane">
          <span>
            <Icon name="FileCode2" size={16} />
            植物提醒 · 伪代码
          </span>
          <pre>
            <code>
              <b>如果</b> 当前时间 ≥ 提醒时间{`\n`} <b>并且</b> 还未完成检查：
              {`\n`} 显示 <em>“该检查植物了”</em>
              {`\n`}
              <b>否则</b>：{`\n`} 继续等待
            </code>
          </pre>
          <Link to="/method#plant-lab" className="button button-primary">
            运行这个例子
            <Icon name="ArrowRight" size={16} />
          </Link>
        </div>
        <PlantDemo mini />
      </div>
    </div>
  );
}
