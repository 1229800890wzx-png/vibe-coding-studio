async (page) => {
  const checks = [];
  const errors = [];
  const check = (name, pass, detail = "") =>
    checks.push({ name, pass: Boolean(pass), ...(detail ? { detail } : {}) });
  const textOf = (selector) => page.locator(selector).textContent();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://127.0.0.1:4173/");
  await page.locator("body").ariaSnapshot();
  const frame = await page.locator(".desk-art").boundingBox();
  for (const [i, label] of [
    "小游戏",
    "互动故事",
    "个人网站",
    "实用工具",
  ].entries()) {
    await page
      .getByRole("group", { name: "选择作品类型" })
      .getByRole("button", { name: label })
      .click();
    check(
      `轮播：${label}`,
      (await page.locator(".slide").getAttribute("aria-label")).includes(
        `${i + 1} / 4`,
      ),
    );
    const after = await page.locator(".desk-art").boundingBox();
    check(
      `轮播外壳固定：${label}`,
      JSON.stringify(frame) === JSON.stringify(after),
    );
    await page
      .locator(".tablet-screen")
      .screenshot({ path: `output/playwright/carousel-${i + 1}.png` });
  }
  await page.keyboard.press("ArrowLeft");
  check(
    "方向键切换",
    (await page.locator(".slide").getAttribute("aria-label")).includes(
      "个人网站",
    ),
  );
  await page.getByRole("button", { name: "开始自动轮播", exact: true }).click();
  check(
    "自动轮播可以开启",
    await page.getByRole("button", { name: "暂停自动轮播" }).isVisible(),
  );
  await page.locator("h1").click();
  const beforeAuto = await page.locator(".slide").getAttribute("aria-label");
  await page.waitForTimeout(7300);
  check(
    "自动轮播实际推进",
    (await page.locator(".slide").getAttribute("aria-label")) !== beforeAuto,
  );
  await page
    .getByRole("group", { name: "选择作品类型" })
    .getByRole("button", { name: "小游戏" })
    .click();
  check(
    "手动选择停止自动轮播",
    await page
      .getByRole("button", { name: "开始自动轮播", exact: true })
      .isVisible(),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  check(
    "减少动态效果停用自动轮播",
    await page
      .getByRole("button", { name: "已按系统偏好停用自动轮播" })
      .isDisabled(),
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });

  await page.goto("http://127.0.0.1:4173/courses");
  await page.locator("body").ariaSnapshot();
  check(
    "FAQ 首项默认展开",
    (await page.locator(".faq details").first().getAttribute("open")) !== null,
  );
  await page.locator(".faq summary").nth(1).click();
  check(
    "FAQ 可以展开",
    (await page.locator(".faq details").nth(1).getAttribute("open")) !== null,
  );
  await page.locator(".faq summary").nth(1).click();
  check(
    "FAQ 可以收起",
    (await page.locator(".faq details").nth(1).getAttribute("open")) === null,
  );
  await page.locator(".ai-topic").first().click();
  check("AI 概念详情打开", await page.getByRole("dialog").isVisible());
  await page.locator("dialog[open]").waitFor(); await page.keyboard.press("Escape"); await page.locator("dialog[open]").waitFor({ state: "detached" });
  check(
    "概念详情关闭并恢复焦点",
    await page
      .locator(".ai-topic")
      .first()
      .evaluate((el) => el === document.activeElement),
  );

  await page.goto("http://127.0.0.1:4173/method#plant-lab");
  await page.locator("body").ariaSnapshot();
  check(
    "提醒：未到时间",
    (await textOf(".plant-status")).includes("还没到提醒时间"),
  );
  await page.getByRole("button", { name: "试试到点", exact: true }).click();
  check(
    "提醒：到达时间",
    (await textOf(".plant-status")).includes("该检查植物了"),
  );
  await page.getByRole("button", { name: "完成检查", exact: true }).click();
  check(
    "提醒：完成后停止",
    (await textOf(".plant-status")).includes("已完成检查"),
  );
  check(
    "提醒：完成按钮防重复",
    await page
      .getByRole("button", { name: "完成检查", exact: true })
      .isDisabled(),
  );
  await page.getByLabel("提醒时间", { exact: true }).fill("10:00");
  check(
    "修改规则后重新计算",
    (await textOf(".plant-status")).includes("还没到提醒时间"),
  );
  await page.getByLabel("提醒时间", { exact: true }).fill("");
  check(
    "空时间有明确反馈",
    (await textOf(".plant-status")).includes("请先设置完整时间"),
  );
  await page.getByRole("button", { name: "重置提醒示例" }).click();
  check(
    "日历星期与日期正确",
    await page.evaluate(
      () =>
        new Date(2026, 8, 10).getDay() === 4 &&
        document.querySelector(".calendar .selected").textContent === "10",
    ),
  );

  await page.goto("http://127.0.0.1:4173/projects?category=tool#gallery");
  await page.locator("body").ariaSnapshot();
  check(
    "从首页分类进入作品页",
    (await page.locator(".project-card").count()) === 1,
  );
  await page
    .getByRole("button", { name: "查看植物照护提醒助手的创作过程" })
    .click();
  await page.locator("dialog[open]").waitFor();
  check("案例详情打开", await page.getByRole("dialog").isVisible());
  await page.locator("dialog[open]").waitFor(); await page.keyboard.press("Escape"); await page.locator("dialog[open]").waitFor({ state: "detached" });
  check(
    "关闭详情保留分类",
    (await page
      .getByRole("button", { name: "实用工具", exact: true })
      .getAttribute("aria-pressed")) === "true" &&
      (await page.locator(".project-card").count()) === 1,
  );
  check(
    "打开关闭详情不跳回顶部",
    await page.evaluate(() => window.scrollY > 100),
  );
  await page.getByRole("button", { name: "AI 探索", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.project-card').length === 2);
  check("AI 分类筛选", (await page.locator(".project-card").count()) === 2);
  await page.getByRole("button", { name: "全部", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.project-card').length === 6);
  check(
    "全部分类包含六个示例",
    (await page.locator(".project-card").count()) === 6,
  );
  await page.getByRole("button", { name: "查看小岛冒险的创作过程" }).click();
  await page.locator(".collect-star").nth(0).click();
  await page.locator(".collect-star").nth(0).click();
  check(
    "小游戏重复收集不重复计数",
    (await textOf(".game-hud")).includes("1 / 3"),
  );
  await page.locator(".collect-star").nth(1).click();
  await page.locator(".collect-star").nth(2).click();
  check("小游戏完成反馈", (await textOf(".game-hud")).includes("全部找到啦"));
  await page.locator("dialog[open]").waitFor(); await page.keyboard.press("Escape"); await page.locator("dialog[open]").waitFor({ state: "detached" });
  await page
    .getByRole("button", { name: "查看会分支的故事的创作过程" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "走进森林", exact: true })
    .click();
  check("故事分支一", (await textOf(".detail-demo")).includes("发光的种子"));
  await page.getByRole("button", { name: /回到岔路口/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "沿河探索", exact: true })
    .click();
  check("故事分支二", (await textOf(".detail-demo")).includes("小水獭"));
  await page.locator("dialog[open]").waitFor(); await page.keyboard.press("Escape"); await page.locator("dialog[open]").waitFor({ state: "detached" });
  await page
    .getByRole("button", { name: "查看我的宇宙网站的创作过程" })
    .click();
  await page.getByRole("button", { name: "我的发现", exact: true }).click();
  check(
    "网站演示导航",
    (await textOf(".detail-space .space-copy")).includes("记录好奇"),
  );
  await page.locator("dialog[open]").waitFor(); await page.keyboard.press("Escape"); await page.locator("dialog[open]").waitFor({ state: "detached" });
  await page
    .getByRole("button", { name: "查看看图分类实验的创作过程" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "花朵", exact: true })
    .click();
  await page.getByRole("button", { name: /查看标签与验证问题/ }).click();
  check(
    "分类实验明确标注规则演示",
    (await textOf(".detail-classify")).includes("样本标签：花朵") &&
      (await textOf(".detail-classify")).includes("未调用 AI 模型"),
  );
  await page.locator("dialog[open]").waitFor(); await page.keyboard.press("Escape"); await page.locator("dialog[open]").waitFor({ state: "detached" });
  await page
    .getByRole("button", { name: "查看学习问答伙伴的创作过程" })
    .click();
  await page.getByRole("button", { name: "查看核查步骤", exact: true }).click();
  check(
    "问答示例展开核查步骤",
    (await page.locator(".verify-list li").count()) === 3,
  );
  await page.locator("dialog[open]").waitFor(); await page.keyboard.press("Escape"); await page.locator("dialog[open]").waitFor({ state: "detached" });

  await page.evaluate(() => localStorage.removeItem("vibe-interest"));
  await page
    .locator(".nav-actions")
    .getByRole("button", { name: "预约体验", exact: true })
    .click();
  await page.locator("body").ariaSnapshot();
  check(
    "预约说明真实状态",
    (await textOf(".reservation-notice")).includes("尚未接入预约接收渠道"),
  );
  await page.getByLabel("手机号或邮箱").fill("123");
  await page.getByRole("button", { name: "保存体验意向", exact: true }).click();
  check(
    "预约联系方式校验",
    (await page.getByRole("alert").textContent()).includes("有效的"),
  );
  check(
    "校验后聚焦错误字段",
    await page
      .getByLabel("手机号或邮箱")
      .evaluate((el) => el === document.activeElement),
  );
  await page.getByLabel("手机号或邮箱").fill("parent@example.com");
  await page.getByLabel("家长称呼").fill("体验家长");
  await page.evaluate(() => {
    window.__originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function () {
      throw new Error("Simulated storage unavailable");
    };
  });
  await page.getByRole("button", { name: "保存体验意向", exact: true }).click();
  await page.getByRole("alert").waitFor();
  check(
    "保存失败保留内容并可重试",
    (await page.getByRole("alert").textContent()).includes("无法保存") &&
      (await page.getByLabel("手机号或邮箱").inputValue()) ===
        "parent@example.com",
  );
  await page.evaluate(() => {
    Storage.prototype.setItem = window.__originalSetItem;
    delete window.__originalSetItem;
  });
  await page.getByRole("button", { name: "保存体验意向", exact: true }).click();
  await page.getByRole("button", { name: "下载意向单", exact: true }).waitFor();
  check(
    "预约本地保存成功",
    (await textOf(".reservation-success")).includes("尚未发送给机构"),
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载意向单", exact: true }).click();
  const download = await downloadPromise;
  await download.saveAs("output/playwright/reservation-sample.txt");
  check("意向单可下载", download.suggestedFilename().endsWith(".txt"));
  for (let i = 0; i < 7; i++) await page.keyboard.press("Tab");
  check(
    "弹窗键盘焦点受限于弹窗",
    await page
      .getByRole("dialog")
      .evaluate((el) => el.contains(document.activeElement)),
  );
  await page.locator("dialog[open]").waitFor(); await page.keyboard.press("Escape"); await page.locator("dialog[open]").waitFor({ state: "detached" });
  check(
    "关闭预约恢复原按钮焦点",
    await page
      .locator(".nav-actions .button")
      .evaluate((el) => el === document.activeElement),
  );
  await page.locator(".nav-actions .button").click();
  check(
    "重新打开恢复本地草稿",
    (await page.getByLabel("家长称呼").inputValue()) === "体验家长",
  );
  await page.getByRole("button", { name: "保存体验意向", exact: true }).click();
  await page
    .getByRole("button", { name: "删除此浏览器中的意向记录", exact: true })
    .click();
  check(
    "可以删除本地意向",
    await page.evaluate(() => localStorage.getItem("vibe-interest") === null),
  );
  await page.locator("dialog[open]").waitFor(); await page.keyboard.press("Escape"); await page.locator("dialog[open]").waitFor({ state: "detached" });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:4173/");
  await page.locator("body").ariaSnapshot();
  await page.getByRole("button", { name: "打开导航菜单" }).click();
  check(
    "手机菜单展开",
    await page.getByRole("navigation", { name: "主导航" }).isVisible(),
  );
  await page
    .getByRole("navigation", { name: "主导航" })
    .getByRole("link", { name: "教学方法", exact: true })
    .click();
  check("手机导航到教学方法", page.url().includes("/method"));
  check(
    "切换页面后收起手机菜单",
    (await page
      .getByRole("button", { name: "打开导航菜单" })
      .getAttribute("aria-expanded")) === "false",
  );
  await page.goto("http://127.0.0.1:4173/");
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "下一个作品", exact: true }).click();
    check(
      `手机轮播切换 ${i + 1}`,
      (await page.locator(".slide").getAttribute("aria-label")) !== null,
    );
  }
  return {
    checks,
    errors,
    passed: checks.filter((c) => c.pass).length,
    total: checks.length,
  };
}


