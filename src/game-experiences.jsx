import React, { useEffect, useId, useRef, useState } from "react";
import "./game-experiences.css";

const initialMods = [
  { id: "auto-farm", name: "自动农场", description: "作物成熟时自动收获", enabled: true },
  { id: "double-jump", name: "双倍跳跃", description: "修改角色的跳跃参数", enabled: true },
  { id: "weather-control", name: "天气控制", description: "为世界定义晴雨规则", enabled: false },
];
const availableMods = [
  { id: "jetpack", name: "飞行背包", description: "定义飞行状态与能量消耗" },
  { id: "chain-logging", name: "连锁伐木", description: "识别相连木块与收集范围" },
  { id: "custom-crafting", name: "自定义合成", description: "为物品组合设置新的配方" },
];

function MinecraftExperience() {
  const [mods, setMods] = useState(initialMods);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState("");
  const libraryId = useId();
  const enabledMods = mods.filter((mod) => mod.enabled);

  function addMod(mod) {
    setMods((current) => current.some((item) => item.id === mod.id)
      ? current
      : [...current, { ...mod, enabled: true }]);
    setDownloadStatus("");
  }

  function downloadConfiguration() {
    const configuration = {
      schemaVersion: 1,
      project: "山谷工坊",
      purpose: "教学创作配置；不是可直接安装运行的 Minecraft 模组包。",
      enabledCount: enabledMods.length,
      mods: mods.map(({ id, name, description, enabled }) => ({ id, name, description, enabled })),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(configuration, null, 2)], { type: "application/json;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "valley-workshop-config.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloadStatus("已导出当前教学配置。");
  }

  return (
    <div className="game-experience">
      <div className="ex-minecraft ex-game-surface">
        <aside className="ex-mods" aria-label="模组配置工作台">
          <div className="ex-mod-brand">MOD STUDIO<span>创作工作台</span></div>
          <span className="ex-small">我的项目 / 山谷工坊</span>
          <h2>给世界，<br />加一点自己的规则。</h2>
          <div className="ex-mods-label">模组配置 <span aria-live="polite">{enabledMods.length} 已启用</span></div>
          <div className="ex-mod-list">
            {mods.map((mod, index) => (
              <label key={mod.id}>
                <span className="ex-mod-icon" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <span className="ex-mod-description"><b>{mod.name}</b><small>{mod.description}</small></span>
                <input
                  type="checkbox"
                  checked={mod.enabled}
                  aria-label={`启用${mod.name}`}
                  onChange={(event) => {
                    const enabled = event.target.checked;
                    setMods((current) => current.map((item) => item.id === mod.id ? { ...item, enabled } : item));
                    setDownloadStatus("");
                  }}
                />
              </label>
            ))}
          </div>
          <button type="button" className="ex-add-mod" aria-expanded={libraryOpen} aria-controls={libraryId} onClick={() => setLibraryOpen((open) => !open)}>
            {libraryOpen ? "− 收起模组库" : "＋ 添加模组"}
          </button>
          <div className="ex-mod-library" id={libraryId} hidden={!libraryOpen}>
            <p>选择一个创作方向</p>
            {availableMods.map((mod) => {
              const added = mods.some((item) => item.id === mod.id);
              return <button type="button" key={mod.id} disabled={added} onClick={() => addMod(mod)}>{mod.name}<span>{added ? "已添加" : "＋"}</span></button>;
            })}
          </div>
          <div className="ex-mod-code"><span>规则示例 / 事件与条件</span><code>when crop.isReady<br />&nbsp; → harvest()<br />&nbsp; → plantAgain()</code></div>
          <button type="button" className="ex-export-mods" onClick={downloadConfiguration}>导出教学配置 <span aria-hidden="true">↓</span></button>
          <p className="ex-download-status" role="status">{downloadStatus}</p>
        </aside>
        <div className="ex-world">
          <img src="/art/showcase/minecraft.webp" alt="有石桥、机械工坊与种植区的 Minecraft 风格方块世界" />
          <div className="ex-world-top"><span>山谷工坊</span><span>世界画面 · 概念预览</span></div>
          <div className="ex-world-bottom"><b>我的世界，由我定义。</b><div>{enabledMods.length ? enabledMods.map((mod) => <span key={mod.id}>{mod.name}</span>) : <span>尚未启用模组</span>}</div></div>
        </div>
      </div>
      <p className="ex-game-note">可搭配预设模组并导出教学配置；场景为概念美术，配置不是可直接运行的 Minecraft 模组包。</p>
    </div>
  );
}

const storyRoutes = {
  start: {
    chapter: "第一章 · 静止的星空",
    heading: "午夜的钟声，唤醒了谁？",
    copy: "天球仪停在了一个陌生的刻度。展柜里有一把铜钥匙，旁边的星图似乎留下了提示。",
    inventory: ["一封旧信"],
  },
  star: {
    chapter: "第二章 · 星图的秘密",
    heading: "被遗漏的星座，指向了钟楼。",
    copy: "你将旧信与星图叠在一起，找到了钟楼的标记。铜钥匙还在展柜旁，新的路线已经出现。",
    inventory: ["一封旧信", "钟楼星图"],
  },
  key: {
    chapter: "第二章 · 铜钥匙的去处",
    heading: "钥匙转动时，一段录音响起。",
    copy: "展柜的暗格里藏着馆长的留言：“答案就在星空中。”你记下留言，准备回到天球仪前。",
    inventory: ["一封旧信", "铜钥匙", "馆长留言"],
  },
};

function MuseumExperience() {
  const [route, setRoute] = useState("start");
  const [mapOpen, setMapOpen] = useState(false);
  const headingRef = useRef(null);
  const previousRoute = useRef(route);
  const mapId = useId();
  const current = storyRoutes[route];

  useEffect(() => {
    if (previousRoute.current !== route) {
      // A selected choice disappears; move focus to its newly rendered result.
      headingRef.current?.focus({ preventScroll: true });
      previousRoute.current = route;
    }
  }, [route]);

  function chooseRoute(nextRoute) {
    setRoute(nextRoute);
  }

  return (
    <div className="game-experience">
      <div className="ex-story ex-game-surface">
        <img src="/art/showcase/museum.webp" alt="月光下的自然史博物馆，中央机械天球仪与探索者" />
        <div className="ex-story-top"><span>MIDNIGHT MUSEUM</span><button type="button" aria-expanded={mapOpen} aria-controls={mapId} onClick={() => setMapOpen((open) => !open)}>{mapOpen ? "收起故事分支" : "查看故事分支 ↗"}</button></div>
        <div className="ex-story-map" id={mapId} hidden={!mapOpen} aria-label="故事路径">
          <span className={route === "start" ? "is-current" : "is-visited"} aria-current={route === "start" ? "step" : undefined}>01 · 博物馆来信</span>
          <i aria-hidden="true">→</i>
          <div className="ex-story-map-branches">
            <span className={route === "star" ? "is-current" : ""} aria-current={route === "star" ? "step" : undefined}>02 · 星图的秘密</span>
            <span className={route === "key" ? "is-current" : ""} aria-current={route === "key" ? "step" : undefined}>02 · 铜钥匙的去处</span>
          </div>
        </div>
        <div className="ex-story-dialog">
          <span className="ex-story-chapter">{current.chapter}</span>
          <h2 ref={headingRef} tabIndex={-1}>{current.heading}</h2>
          <p>{current.copy}</p>
          <div className="ex-story-choices" hidden={route !== "start"}>
            <button type="button" onClick={() => chooseRoute("star")}><span>01</span> 靠近星图，寻找线索 <b aria-hidden="true">→</b></button>
            <button type="button" onClick={() => chooseRoute("key")}><span>02</span> 拿起钥匙，查看展柜 <b aria-hidden="true">→</b></button>
          </div>
          {route !== "start" && <div className="ex-story-branch-end">这条分支的片段已读完。可以回到起点，探索另一个选择。</div>}
          <div className="ex-story-status"><span aria-live="polite">线索背包：{current.inventory.join(" · ")}</span><button type="button" onClick={() => chooseRoute("start")}>回到起点</button></div>
        </div>
      </div>
      <p className="ex-game-note">可在本地选择两条故事分支、收集线索并回看路径；当前开放故事片段。</p>
    </div>
  );
}

const towerUnits = {
  shooter: { name: "种子射手", label: "远程攻击 · 100", copy: "检测同一路线的目标，按固定间隔发射种子。", skill: "学习：条件判断 · 定时器 · 碰撞检测" },
  sun: { name: "阳光花", label: "资源生产 · 50", copy: "按照时间间隔生产阳光，为布置新角色积累资源。", skill: "学习：计时事件 · 变量 · 资源管理" },
  wall: { name: "木盾守卫", label: "拦截来敌 · 75", copy: "阻挡来敌前进；耐久度归零时移出当前格子。", skill: "学习：状态变化 · 边界条件 · 对象属性" },
};

function TowerExperience() {
  const [selectedUnit, setSelectedUnit] = useState("shooter");
  const current = towerUnits[selectedUnit];
  return (
    <div className="game-experience">
      <div className="ex-tower ex-game-surface">
        <img src="/art/showcase/tower.webp" alt="花园塔防关卡，五条草坪路线、植物防御与机械来敌" />
        <div className="ex-tower-hud"><strong>花园守卫战</strong><span>晴日花园 / 关卡 02</span><b>关卡设计预览</b></div>
        <div className="ex-tower-units" role="group" aria-label="选择角色规则">{Object.entries(towerUnits).map(([id, unit]) => <button type="button" key={id} aria-pressed={selectedUnit === id} onClick={() => setSelectedUnit(id)}><b>{unit.name}</b><span>{unit.label}</span></button>)}</div>
        <div className="ex-tower-rule" aria-live="polite"><span>角色规则</span><h2>{current.name}</h2><p>{current.copy}</p><small>{current.skill}</small></div>
      </div>
      <p className="ex-game-note">体验关卡美术与三种角色的规则切换；当前演示不包含完整战斗循环。</p>
    </div>
  );
}

export function GameExperience({ id }) {
  if (id === "minecraft") return <MinecraftExperience />;
  if (id === "museum") return <MuseumExperience />;
  if (id === "tower") return <TowerExperience />;
  return null;
}
