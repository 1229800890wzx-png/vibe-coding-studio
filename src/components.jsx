import React, {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  BookOpen,
  Bot,
  Box,
  ChartNoAxesColumnIncreasing,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleCheck,
  CircleHelp,
  Clock3,
  Code2,
  Compass,
  Download,
  Ear,
  FileCode2,
  FileText,
  Flag,
  FlaskConical,
  Gamepad2,
  Heart,
  Image,
  ImageOff,
  Images,
  Info,
  Laptop,
  Lightbulb,
  LoaderCircle,
  LockKeyhole,
  Menu,
  MessageCircle,
  NotebookPen,
  Orbit,
  PanelsTopLeft,
  Pause,
  Play,
  Plus,
  Presentation,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sprout,
  Star,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { artSources, mentors, homeSteps } from "./content";

export function Icon({ name, size = 22, ...props }) {
  const Icons = {
    ArrowDown,
    ArrowRight,
    ArrowUpRight,
    AudioLines,
    BookOpen,
    Bot,
    Box,
    ChartNoAxesColumnIncreasing,
    Check,
    ChevronLeft,
    ChevronRight,
    Circle,
    CircleCheck,
    CircleHelp,
    Clock3,
    Code2,
    Compass,
    Download,
    Ear,
    FileCode2,
    FileText,
    Flag,
    FlaskConical,
    Gamepad2,
    Heart,
    Image,
    ImageOff,
    Images,
    Info,
    Laptop,
    Lightbulb,
    LoaderCircle,
    LockKeyhole,
    Menu,
    MessageCircle,
    NotebookPen,
    Orbit,
    PanelsTopLeft,
    Pause,
    Play,
    Plus,
    Presentation,
    RefreshCw,
    RotateCcw,
    Search,
    Send,
    Settings2,
    ShieldCheck,
    Sparkles,
    Sprout,
    Star,
    Users,
    Workflow,
    X,
  };
  const Component = Icons[name] || Icons.Circle;
  return (
    <Component size={size} strokeWidth={1.7} aria-hidden="true" {...props} />
  );
}

export function Art({
  source = "original",
  rect,
  alt = "",
  className = "",
  priority = false,
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const reload = (event) => {
      if (event.detail !== source) return;
      setFailed(false);
      setLoaded(false);
      setRetry((n) => n + 1);
    };
    window.addEventListener("vibe:retry-art", reload);
    return () => window.removeEventListener("vibe:retry-art", reload);
  }, [source]);
  const [sw, sh] = artSources[source];
  const [x, y, w, h] = rect;
  return (
    <div
      className={`art ${className} ${loaded ? "is-loaded" : ""} ${failed ? "has-error" : ""}`}
      style={{ aspectRatio: `${w} / ${h}` }}
    >
      {failed ? (
        <div className="art-error">
          <Icon name="ImageOff" />
          <span>图片暂时未加载</span>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              window.dispatchEvent(
                new CustomEvent("vibe:retry-art", { detail: source }),
              );
            }}
          >
            重新加载
          </button>
        </div>
      ) : (
        <svg
          className="art-window"
          viewBox={`${x} ${y} ${w} ${h}`}
          preserveAspectRatio="xMidYMid slice"
          role={alt ? "img" : undefined}
          aria-label={alt || undefined}
          aria-hidden={!alt || undefined}
          focusable="false"
        >
          <image
            key={retry}
            href={`/art/${source}.webp${retry ? `?retry=${retry}` : ""}`}
            width={sw}
            height={sh}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </svg>
      )}
    </div>
  );
}

export const ReservationContext = createContext(() => {});
export function ReserveButton({
  className = "",
  secondary = false,
  arrow = true,
  courseId,
  courseTitle,
}) {
  const open = useContext(ReservationContext);
  return (
    <button
      type="button"
      className={`button ${secondary ? "button-secondary" : "button-primary"} ${className}`}
      onClick={() => open({ courseId, courseTitle })}
    >
      咨询课程{arrow && <Icon name="ArrowRight" size={18} />}
    </button>
  );
}
export function TextLink({ to, children, className = "", ...props }) {
  return (
    <Link to={to} className={`text-link ${className}`} {...props}>
      {children}
      <Icon name="ArrowRight" size={18} />
    </Link>
  );
}

export function Logo() {
  return (
    <Link to="/" className="brand" aria-label="VIBE CODING 首页">
      <strong>VIBE CODING</strong>
      <span>少儿创造力实验室</span>
    </Link>
  );
}

export function Header() {
  const [menu, setMenu] = useState(false);
  const menuButton = useRef(null);
  const navigation = useRef(null);
  const location = useLocation();
  useEffect(() => {
    setMenu(false);
  }, [location]);
  useEffect(() => {
    const close = (e) => {
      if (e.key === "Escape" && menu) {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [menu]);
  return (
    <header className="site-header">
      <div className="nav-inner">
        <Logo />
        <nav
          ref={navigation}
          aria-label="主导航"
          className={menu ? "main-nav is-open" : "main-nav"}
          id="main-menu"
          onKeyDown={(event) => {
            if (menu && event.key === "Tab" && menuButton.current?.getClientRects().length) {
              const links = navigation.current?.querySelectorAll("a");
              if (event.shiftKey && event.target === links?.[0]) {
                event.preventDefault();
                setMenu(false);
                menuButton.current?.focus();
              } else if (!event.shiftKey && event.target === links?.[links.length - 1]) {
                setMenu(false);
              }
            }
          }}
        >
          <NavLink to="/" end>
            首页
          </NavLink>
          <NavLink to="/courses">
            课程服务
          </NavLink>
          <NavLink to="/mentors">导师团队</NavLink>
          <NavLink to="/projects">作品展示</NavLink>
          <NavLink className="education-method-link" to="/method">
            教学方法
          </NavLink>
        </nav>
        <div className="nav-actions">
          <ReserveButton arrow={false} />
          <button
            type="button"
            className="icon-button menu-button"
            ref={menuButton}
            aria-label={menu ? "关闭导航菜单" : "打开导航菜单"}
            aria-expanded={menu}
            aria-controls="main-menu"
            onClick={() => setMenu(!menu)}
            onKeyDown={(event) => {
              if (menu && event.key === "Tab" && !event.shiftKey) {
                event.preventDefault();
                navigation.current?.querySelector("a")?.focus();
              }
            }}
          >
            <Icon name={menu ? "X" : "Menu"} />
          </button>
        </div>
      </div>
    </header>
  );
}

export function HeroCopy({
  eyebrow,
  line1,
  line2,
  description,
  children,
  breadcrumb,
  className = "",
}) {
  const signature = {
    教学方法: "Think. Make. Understand.",
    导师团队: "Curiosity, guided.",
    作品展示: "Ideas made real.",
  }[breadcrumb];
  return (
    <div className={`hero-copy ${className}`}>
      {breadcrumb && (
        <nav className="breadcrumb" aria-label="面包屑">
          <Link to="/">首页</Link>
          <span>/</span>
          {breadcrumb === "教学方法" && (
            <>
              <Link to="/courses">课程服务</Link>
              <span>/</span>
            </>
          )}
          <span>{breadcrumb}</span>
        </nav>
      )}
      {signature && <p className="brand-script hero-signature" aria-hidden="true">{signature}</p>}
      <p className="eyebrow">{eyebrow}</p>
      <h1>
        {line1}
        <span>{line2}</span>
      </h1>
      {description && <p className="hero-description">{description}</p>}
      {children}
    </div>
  );
}

export function SectionHead({ title, description, to, link, children }) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {to && <TextLink to={to}>{link}</TextLink>}
      {children}
    </div>
  );
}

export function Steps({ items = homeSteps, compact = false }) {
  return (
    <ol className={`steps ${compact ? "steps-compact" : ""}`}>
      {items.map(([icon, title, desc], i) => (
        <li key={title}>
          <div className="step-icon">
            <Icon name={icon} size={30} />
          </div>
          <div>
            <span className="step-number">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3>{title}</h3>
            <p>{desc}</p>
          </div>
          {i < items.length - 1 && (
            <span className="step-connector" aria-hidden="true" />
          )}
        </li>
      ))}
    </ol>
  );
}

export function MentorCards({ detail = false }) {
  return (
    <>
      <div className="grid-three mentor-grid">
        {mentors.map((m) => (
          <article key={m.title} className="mentor-card glass-card" data-glass-card>
            <Art rect={m.rect} alt={`${m.title}的示意肖像`} />
            <div className="mentor-body">
              <h3>{m.title}</h3>
              <p>{detail ? m.detail : m.caption}</p>
              {detail && (
                <span className="soft-tag">
                  <Icon name={m.icon} size={20} />
                  {m.tag}
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
      <p className="figure-note">
        导师角色与人物图片为示意，真实团队资料待补充。
      </p>
    </>
  );
}

export function FAQ({ items, firstOpen = true, className = "" }) {
  return (
    <div className={`faq ${className}`}>
      {items.map(([q, a], i) => (
        <details key={q} open={(i === 0 && firstOpen) || undefined}>
          <summary>
            {q}
            <Icon name="Plus" size={20} />
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}

export function Footer({ title = "从一个小小的想法开始。", course = false, note = "课程、人物与作品为设计示意" }) {
  return (
    <footer role="contentinfo">
      <div className="footer-cta">
        <div className="footer-cloud cloud-one" />
        <div className="footer-cloud cloud-two" />
        <div className="footer-cta-content">
          <h2>{title}</h2>
          <div className="button-row">
            {course && (
              <Link className="button button-secondary" to="/courses">
                了解课程
                <Icon name="ArrowRight" size={18} />
              </Link>
            )}
            <ReserveButton />
          </div>
        </div>
        <p className="handwritten">
          创造
          <br />
          让更好的未来发生
        </p>
      </div>
      <div className="footer-bottom container">
        <Logo />
        <nav aria-label="页脚导航">
          <Link to="/courses">课程服务</Link>
          <Link to="/method">教学方法</Link>
          <Link to="/mentors">导师团队</Link>
          <Link to="/projects">作品展示</Link>
        </nav>
        <p>
          © {new Date().getFullYear()} VIBE CODING · 少儿创造力实验室
          <span>{note}</span>
        </p>
      </div>
    </footer>
  );
}

export function Modal({ title, onClose, children, className = "", closeDisabled = false, closeMessage = "正在提交，请等待结果后再关闭。" }) {
  const ref = useRef(null);
  const titleRef = useRef(null);
  const titleId = useId();
  const closeStatusId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    const oldRootOverflow = document.documentElement.style.overflow;
    const oldOverflow = document.body.style.overflow;
    const oldPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar > 0) {
      document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbar}px`;
    }
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    dialog.showModal();
    titleRef.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.documentElement.style.overflow = oldRootOverflow;
      document.body.style.overflow = oldOverflow;
      document.body.style.paddingRight = oldPadding;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby={titleId}
      aria-describedby={closeDisabled ? closeStatusId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (!closeDisabled) onClose();
      }}
      onClick={(e) => {
        if (!closeDisabled && e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-head">
        <h2 id={titleId} ref={titleRef} tabIndex={-1}>{title}</h2>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          disabled={closeDisabled}
          aria-describedby={closeDisabled ? closeStatusId : undefined}
          aria-label="关闭弹窗"
        >
          <Icon name="X" />
        </button>
      </div>
      {closeDisabled && <p className="modal-close-status" id={closeStatusId} role="status">{closeMessage}</p>}
      {children}
    </dialog>
  );
}

function readInterestDraft() {
  const draft = JSON.parse(localStorage.getItem("vibe-interest") || "null");
  const clean =
    draft && typeof draft === "object" && !Array.isArray(draft) ? draft : {};
  const experiences = [
    "刚刚开始",
    "尝试过图形化编程",
    "写过一些代码",
    "接触过 AI 创作",
  ];
  const interests = [
    "还在探索",
    "小游戏",
    "互动故事",
    "个人网站",
    "实用工具",
    "AI 基础与新知",
  ];
  return {
    name: typeof clean.name === "string" ? clean.name.slice(0, 40) : "",
    contact:
      typeof clean.contact === "string" ? clean.contact.slice(0, 120) : "",
    experience: experiences.includes(clean.experience)
      ? clean.experience
      : experiences[0],
    interest: interests.includes(clean.interest)
      ? clean.interest
      : interests[0],
  };
}

export function Reservation({ onClose }) {
  const [state, setState] = useState("editing");
  const [error, setError] = useState("");
  const [values, setValues] = useState(() => {
    try {
      return readInterestDraft();
    } catch {
      return {
        name: "",
        contact: "",
        experience: "刚刚开始",
        interest: "还在探索",
      };
    }
  });
  const contactRef = useRef(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const change = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    setError("");
  };
  function submit(e) {
    e.preventDefault();
    const contact = values.contact.trim();
    if (contact && !/^(1[3-9]\d{9}|[^\s@]+@[^\s@]+\.[^\s@]+)$/.test(contact)) {
      setError("请填写有效的 11 位手机号或邮箱，也可以先留空。");
      contactRef.current.focus();
      return;
    }
    setState("saving");
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(
          "vibe-interest",
          JSON.stringify({ ...values, name: values.name.trim(), contact }),
        );
        setState("saved");
      } catch {
        setError("浏览器无法保存。填写内容已保留，你可以下载意向单。");
        setState("editing");
      }
    }, 350);
  }
  function download() {
    const data = `VIBE CODING · 体验意向单\n\n家长称呼：${values.name || "未填写"}\n联系方式：${values.contact || "未填写"}\n已有经验：${values.experience}\n感兴趣方向：${values.interest}\n\n此文件由你自行保存，尚未发送给机构。体验形式、年龄范围、费用和课程安排需正式沟通确认。`;
    const url = URL.createObjectURL(
      new Blob([data], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "VIBE-CODING-体验意向单.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <Modal
      title="从孩子的兴趣开始。"
      onClose={onClose}
      className="reservation-modal"
    >
      {state === "saved" ? (
        <div className="reservation-success" role="status">
          <span className="success-icon">
            <Icon name="Check" size={30} />
          </span>
          <h3>意向已保存在此浏览器</h3>
          <p>
            尚未发送给机构。你可以下载意向单，待正式联系方式公布后用于沟通。
          </p>
          <div className="button-row">
            <button
              type="button"
              className="button button-primary"
              onClick={download}
            >
              <Icon name="Download" size={18} />
              下载意向单
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setState("editing")}
            >
              继续修改
            </button>
          </div>
          <button
            type="button"
            className="text-button delete-draft"
            onClick={() => {
              try {
                localStorage.removeItem("vibe-interest");
              } catch {}
              setValues({
                name: "",
                contact: "",
                experience: "刚刚开始",
                interest: "还在探索",
              });
              setState("editing");
            }}
          >
            删除此浏览器中的意向记录
          </button>
        </div>
      ) : (
        <>
          <p className="modal-intro">
            聊聊孩子想做什么，记录下一步想了解的事。
          </p>
          <div className="reservation-notice">
            <Icon name="Info" size={20} />
            <p>
              当前为体验预约的本地预览，尚未接入预约接收渠道。信息只保存在你的浏览器；体验形式、费用与安排待正式确认。
            </p>
          </div>
          <form onSubmit={submit} noValidate>
            <div className="form-grid">
              <label>
                家长称呼<span>选填</span>
                <input
                  name="name"
                  value={values.name}
                  onChange={change}
                  autoComplete="name"
                  placeholder="怎么称呼你"
                  maxLength={40}
                />
              </label>
              <label>
                手机号或邮箱<span>选填</span>
                <input
                  ref={contactRef}
                  name="contact"
                  value={values.contact}
                  onChange={change}
                  autoComplete="off"
                  placeholder="便于之后自行联系"
                  maxLength={120}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "form-error" : undefined}
                />
              </label>
              <label>
                孩子的已有经验
                <select
                  name="experience"
                  value={values.experience}
                  onChange={change}
                >
                  <option>刚刚开始</option>
                  <option>尝试过图形化编程</option>
                  <option>写过一些代码</option>
                  <option>接触过 AI 创作</option>
                </select>
              </label>
              <label>
                感兴趣的方向
                <select
                  name="interest"
                  value={values.interest}
                  onChange={change}
                >
                  {[
                    "还在探索",
                    "小游戏",
                    "互动故事",
                    "个人网站",
                    "实用工具",
                    "AI 基础与新知",
                  ].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </label>
            </div>
            {error && (
              <p role="alert" className="field-error" id="form-error">
                {error}
              </p>
            )}
            <p className="form-privacy">
              <Icon name="LockKeyhole" size={16} />
              无需填写孩子姓名或其他身份资料。
            </p>
            <button
              type="submit"
              className="button button-primary full-width"
              disabled={state === "saving"}
            >
              {state === "saving" ? "正在保存…" : "保存体验意向"}
              <Icon
                name={state === "saving" ? "LoaderCircle" : "ArrowRight"}
                size={18}
                className={state === "saving" ? "spin" : ""}
              />
            </button>
            {error && (
              <button type="button" className="text-button" onClick={download}>
                直接下载意向单
              </button>
            )}
          </form>
        </>
      )}
    </Modal>
  );
}
