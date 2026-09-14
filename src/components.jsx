import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { getAdmissionOptions, submissionIdentity, submitAdmission } from './education-api';
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
}) {
  const open = useContext(ReservationContext);
  return (
    <button
      type="button"
      className={`button ${secondary ? "button-secondary" : "button-primary"} ${className}`}
      onClick={open}
    >
      预约体验{arrow && <Icon name="ArrowRight" size={18} />}
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
  const location = useLocation();
  useEffect(() => {
    setMenu(false);
  }, [location]);
  useEffect(() => {
    const close = (e) => {
      if (e.key === "Escape") setMenu(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);
  return (
    <header className="site-header">
      <div className="nav-inner">
        <Logo />
        <nav
          aria-label="主导航"
          className={menu ? "main-nav is-open" : "main-nav"}
          id="main-menu"
        >
          <NavLink to="/" end>
            首页
          </NavLink>
          <NavLink
            to="/courses"
            className={({ isActive }) =>
              isActive || location.pathname === "/method" ? "active" : ""
            }
          >
            课程服务
          </NavLink>
          <NavLink to="/mentors">导师团队</NavLink>
          <NavLink to="/projects">作品展示</NavLink>
          <Link className="mobile-method" to="/method">
            教学方法
          </Link>
        </nav>
        <div className="nav-actions">
          <ReserveButton arrow={false} />
          <button
            type="button"
            className="icon-button menu-button"
            aria-label={menu ? "关闭导航菜单" : "打开导航菜单"}
            aria-expanded={menu}
            aria-controls="main-menu"
            onClick={() => setMenu(!menu)}
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
          <article key={m.title} className="mentor-card">
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

export function Footer({ title = "从一个小小的想法开始。", course = false }) {
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
          <span>课程、人物与作品为设计示意</span>
        </p>
      </div>
    </footer>
  );
}

export function Modal({ title, onClose, children, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = oldOverflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
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
        <h2 id="dialog-title">{title}</h2>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="关闭弹窗"
        >
          <Icon name="X" />
        </button>
      </div>
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
  const [options, setOptions] = useState(null);
  const [receipt, setReceipt] = useState('');
  const pendingRequest = useRef(null);
  useEffect(() => {
    const abort = new AbortController();
    getAdmissionOptions({ signal: abort.signal }).then(setOptions).catch(error => {
      if (error.name !== 'AbortError') setError(error.message);
    });
    return () => abort.abort();
  }, []);
  const change = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    setError("");
  };
  async function submit(e) {
    e.preventDefault();
    if (state === 'saving') return;
    const contact = values.contact.trim();
    if (!/^(1[3-9]\d{9}|[^\s@]+@[^\s@]+\.[^\s@]+)$/.test(contact)) {
      setError("请填写有效的 11 位手机号或邮箱，方便我们回复。");
      contactRef.current.focus();
      return;
    }
    setState("saving");
    setError('');
    try {
      // A failed attempt retains its exact payload/version and retry token.
      const formFingerprint = JSON.stringify(values);
      if (!pendingRequest.current || pendingRequest.current.formFingerprint !== formFingerprint) {
        const current = await getAdmissionOptions();
        if (!current.enabled) throw new Error('预约受理暂未开放，请稍后再试。');
        if (options?.consentVersion !== current.consentVersion) {
          setOptions(current);
          throw new Error('联系授权说明已更新，请阅读后再次提交。');
        }
        const body = { contactName: values.name.trim() || '家长', contactType: contact.includes('@') ? 'EMAIL' : 'MOBILE', contact,
          experience: values.experience, interest: values.interest, message: '', contactConsent: true, consentVersion: current.consentVersion };
        const identity = await submissionIdentity(body);
        pendingRequest.current = { formFingerprint, key: identity.key, body: { ...body, requestId: identity.requestId } };
      }
      const accepted = await submitAdmission(pendingRequest.current.body);
      setReceipt(accepted.receipt);
      setState('saved');
    } catch (error) {
      if (error.code === 1090010001) {
        // The server explicitly rejected consent; no receipt was committed for this request.
        pendingRequest.current = null;
        setOptions(null);
        try { setOptions(await getAdmissionOptions()); } catch { /* next click reloads the notice before sending */ }
        setError('联系授权说明已更新，请阅读后再次提交。');
      } else {
        setError(error.name === 'TimeoutError' ? '等待回复超时，请重试；同一提交不会重复创建咨询。' : error.message);
      }
      setState('editing');
    }
  }
  function download() {
    const data = `VIBE CODING · 体验意向单\n\n家长称呼：${values.name || "未填写"}\n联系方式：${values.contact || "未填写"}\n已有经验：${values.experience}\n感兴趣方向：${values.interest}\n\n${receipt ? `已提交，回执：${receipt}` : '尚未确认提交成功。'}体验形式、年龄范围、费用和课程安排需正式沟通确认。`;
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
          <h3>体验意向已提交</h3>
          <p>
            我们已收到你的意向，将通过所留联系方式沟通具体安排。你可以下载意向单留存。
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
              onClick={() => {
                try { if (pendingRequest.current) sessionStorage.removeItem(pendingRequest.current.key); } catch {}
                pendingRequest.current = null;
                setReceipt('');
                setState('editing');
              }}
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
                if (pendingRequest.current) sessionStorage.removeItem(pendingRequest.current.key);
              } catch {}
              pendingRequest.current = null;
              setReceipt('');
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
              {options ? options.consentText : '正在获取预约联系说明…'}体验形式、费用与安排将在沟通后确认。
            </p>
          </div>
          <form onSubmit={submit} noValidate>
            <div className="form-grid">
              <label>
                家长称呼<span>选填</span>
                <input
                  name="name"
                  disabled={state === 'saving'}
                  value={values.name}
                  onChange={change}
                  autoComplete="name"
                  placeholder="怎么称呼你"
                  maxLength={40}
                />
              </label>
              <label>
                手机号或邮箱<span>必填</span>
                <input
                  ref={contactRef}
                  name="contact"
                  disabled={state === 'saving'}
                  value={values.contact}
                  onChange={change}
                  autoComplete="off"
                  placeholder="便于我们与你联系"
                  maxLength={120}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "form-error" : undefined}
                />
              </label>
              <label>
                孩子的已有经验
                <select
                  name="experience"
                  disabled={state === 'saving'}
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
                  disabled={state === 'saving'}
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
              disabled={state === "saving" || options?.enabled === false}
            >
              {state === "saving" ? "正在提交…" : options && !options.enabled ? '暂未开放预约' : "同意并提交体验意向"}
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
