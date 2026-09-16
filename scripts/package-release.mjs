import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { cp, mkdir, mkdtemp, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entries = [
  "dist",
  "src",
  "public",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "index.html",
  "README.md",
  "start-site.cmd",
  "scripts/serve.mjs",
  "scripts/website-proxy.mjs",
  "vite.config.js",
  "docs/UNIFIED_BACKEND.md",
  "scripts/start-site.mjs",
];

const startupGuide = `# VIBE CODING 网站启动说明

## 直接查看网站

1. 完整解压 ZIP，打开其中的 vibe-coding-site 文件夹。
2. 电脑需已安装 Node.js 22.12 或更高版本，并能在命令行运行 node。
3. Windows 双击 start-site.cmd。脚本会启动后台服务，再打开浏览器。
4. 默认地址为 http://127.0.0.1:4173/ 。关闭启动窗口不会停止网站；电脑重启后重新双击即可。

包内已经包含构建完成的 dist 文件夹，查看网站无需 npm install，也无需重新构建。请通过启动脚本访问，不要直接双击 dist/index.html。

如果电脑上已有旧版网站使用 4173 端口，启动脚本会复用该服务。想独立查看此版本，可在此文件夹打开 PowerShell：

\`\`\`powershell
$env:PORT = "4273"
.\\start-site.cmd
\`\`\`

访问 http://127.0.0.1:4273/ 。若启动失败，查看 output/server/preview-error.log。

## 修改网站源码

仅开发时需要安装依赖，在当前文件夹运行：

\`\`\`powershell
npm ci
npm run dev
\`\`\`

修改后运行 npm run build，再启动网站即可查看新的构建版。源码位于 src，网站图片位于 public。此包未包含 node_modules、设计评审页或原始生成素材。

此包是网站前端，课程介绍和预约已经接入统一后端。启动前设置 VIBE_API_TARGET 为真实后端地址（默认 http://127.0.0.1:48080）；后端不可用时会明确提示失败。此包不包含数据库和后端服务。整套部署说明见 docs/UNIFIED_BACKEND.md。
`;

function powershellLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

async function compressDirectory(directory, destination) {
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "$ProgressPreference = 'SilentlyContinue'",
    `if (Test-Path -LiteralPath ${powershellLiteral(destination)}) { throw 'Archive already exists; refusing to overwrite.' }`,
    `Compress-Archive -LiteralPath ${powershellLiteral(directory)} -DestinationPath ${powershellLiteral(destination)} -CompressionLevel Optimal -ErrorAction Stop`,
  ].join("\n");

  await new Promise((resolve, reject) => {
    const child = spawn(
      "powershell.exe",
      [
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-EncodedCommand",
        Buffer.from(script, "utf16le").toString("base64"),
      ],
      { cwd: root, windowsHide: true, stdio: ["ignore", "ignore", "pipe"] },
    );
    let errorOutput = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      errorOutput = (errorOutput + chunk).slice(-8000);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ZIP compression failed (${code}). ${errorOutput.trim()}`));
    });
  });
}

let staging;
let archive;
let packageRoot;

try {
  if (process.platform !== "win32") {
    throw new Error("Packaging requires Windows PowerShell and Compress-Archive.");
  }
  const builtIndex = await stat(path.join(root, "dist/index.html")).catch(() => null);
  if (!builtIndex?.isFile()) {
    throw new Error("Built dist/index.html is missing. Run npm run build before packaging.");
  }
  for (const entry of entries) {
    const source = path.join(root, entry);
    const info = await stat(source).catch(() => null);
    const directory = ["dist", "src", "public"].includes(entry);
    if (!info || (directory ? !info.isDirectory() : !info.isFile())) {
      throw new Error(`Required release ${directory ? "directory" : "file"} is missing: ${entry}`);
    }
  }

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const releases = path.join(root, "output/releases");
  await mkdir(releases, { recursive: true });
  staging = await mkdtemp(path.join(releases, `vibe-coding-site-${date}-`));
  packageRoot = path.join(staging, "vibe-coding-site");
  archive = path.join(releases, `vibe-coding-site-${date}-${randomUUID()}.zip`);
  await mkdir(packageRoot);

  const reviewDirectory = path.join(root, "dist/design-review");
  for (const entry of entries) {
    const source = path.join(root, entry);
    const destination = path.join(packageRoot, entry);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination, {
      recursive: true,
      force: false,
      errorOnExist: true,
      filter: (candidate) => candidate !== reviewDirectory,
    });
  }
  await writeFile(path.join(packageRoot, "START-HERE.md"), startupGuide, {
    encoding: "utf8",
    flag: "wx",
  });
  await compressDirectory(packageRoot, archive);
  const archiveInfo = await stat(archive);
  if (!archiveInfo.isFile() || archiveInfo.size === 0) {
    throw new Error("ZIP archive was not created correctly; staging is retained for inspection.");
  }
  process.stdout.write(`${JSON.stringify({ staging, zip: archive, path: packageRoot, bytes: archiveInfo.size }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ error: error.message, staging, zip: archive, path: packageRoot }, null, 2)}\n`);
  process.exitCode = 1;
}
