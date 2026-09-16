/** Read-only delivery audit. Only this script's ignored JSON report is written.
 * Candidates come exclusively from this worktree's Git index/unignored files.
 * Private credential values never enter logs, report fields or process arguments.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const reportPath = path.join(root, '.runtime/delivery-integrity-report.json');
const report = {
  startedAt: new Date().toISOString(),
  scope: 'Current worktree Git cached/unignored candidate files; no stage, commit, build, database changes or external directory traversal. Only this ignored report is written.',
  checks: [],
  limitations: [
    'Credential matching covers nonempty password/token/secret/key values in the named local foundation.env, including common encodings; it is not a general-purpose secret discovery scanner.',
    'Frontend freshness compares local input/output modification times conservatively, not a content-addressed rebuild. Browser/API reports retain their own verification scope.',
    'License fingerprints cover the three fixed imported project notices, not a replacement for the third-party dependency license inventory.'
  ]
};
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const relative = filename => path.relative(root, filename).replaceAll('\\', '/');
const read = filename => fs.readFileSync(path.join(root, filename));
const json = filename => JSON.parse(read(filename).toString('utf8'));
const record = (name, ok, details = {}) => report.checks.push({ name, status: ok ? 'PASSED' : 'FAILED', ...details });
const safeRun = (executable, args, options = {}) => spawnSync(executable, args, {
  cwd: root, encoding: 'utf8', windowsHide: true, timeout: 120000,
  maxBuffer: 64 * 1024 * 1024, ...options
});
let candidates = [], candidateSet = new Set(), readable = [];
try {
  const listing = safeRun('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z']);
  if (listing.status !== 0) throw new Error('Candidate enumeration failed');
  candidates = [...new Set(listing.stdout.split('\0').filter(Boolean))].sort();
  candidateSet = new Set(candidates);
  report.candidateCount = candidates.length;
  report.candidatePathListSha256 = hash(candidates.join('\0'));
  record('Git delivery candidates enumerated without staging', candidates.length > 0);

  const forbidden = candidates.filter(filename => filename.split('/').some(segment =>
    /^(?:\.runtime|\.tools|node_modules|target|dist(?:-.*)?|unpackage|\.git)$/.test(segment)) ||
    /(?:^|\/)foundation\.env$/.test(filename));
  record('No local runtimes, dependencies, build outputs or foundation.env in candidates', forbidden.length === 0, { files: forbidden });

  const invalid = [], missing = [];
  const rootReal = fs.realpathSync(root);
  for (const filename of candidates) {
    const absolute = path.resolve(root, filename);
    const rel = path.relative(root, absolute);
    if (path.isAbsolute(rel) || rel === '..' || rel.startsWith('..' + path.sep)) { invalid.push(filename); continue; }
    if (!fs.existsSync(absolute)) { missing.push(filename); continue; }
    const stat = fs.lstatSync(absolute);
    if (!stat.isFile() || stat.isSymbolicLink()) { invalid.push(filename); continue; }
    const actualRel = path.relative(rootReal, fs.realpathSync(absolute));
    if (path.isAbsolute(actualRel) || actualRel === '..' || actualRel.startsWith('..' + path.sep)) { invalid.push(filename); continue; }
    readable.push(filename);
  }
  record('Candidate reads stay inside regular worktree files', invalid.length === 0 && missing.length === 0, { invalidFiles: invalid, missingFiles: missing });

  // Only values stay in memory. Never emit the env text, matching bytes, key names,
  // excerpts, exceptions containing child output, or a fingerprint of a secret.
  const privateFile = path.join(root, '.runtime/foundation.env');
  const values = [];
  if (fs.existsSync(privateFile)) {
    for (const line of fs.readFileSync(privateFile, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match || !/(?:PASSWORD|TOKEN|SECRET|PRIVATE_KEY|API_KEY|CREDENTIAL)/i.test(match[1])) continue;
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (value) values.push(value);
    }
  }
  const variants = [...new Set(values.flatMap(value => [value, encodeURIComponent(value), JSON.stringify(value).slice(1, -1), Buffer.from(value).toString('base64')]))].map(value => Buffer.from(value));
  const credentialFiles = [];
  let scannedBytes = 0;
  for (const filename of readable) {
    const bytes = read(filename); scannedBytes += bytes.length;
    if (variants.some(value => bytes.includes(value))) credentialFiles.push(filename);
  }
  record('Local foundation passwords/tokens absent from candidate bytes', values.length > 0 && credentialFiles.length === 0, {
    privateSourceAvailable: fs.existsSync(privateFile), comparedPrivateValueCount: new Set(values).size,
    scannedFiles: readable.length, scannedBytes, files: credentialFiles
  });
  values.fill(''); variants.forEach(bytes => bytes.fill(0));

  const expected = [
    { path: 'apps/server', url: 'https://github.com/YunaiV/ruoyi-vue-pro', ref: 'master-jdk17', commit: '8e43004cf68a405cd3485f98f8a539b97ca6544a', notice: '772daf1f82a50025a74e4066050490d875feba62a49cf0ecefa1b4cc824e9a07' },
    { path: 'apps/admin', url: 'https://github.com/yudaocode/yudao-ui-admin-vue3', ref: 'master', commit: 'aab14fb0e74720dd09e964ae066f8bbde9f9012e', notice: '3f101f5e0207524af727e58ca8abf241b754665ee1eb90b45388ff0263d3640d' },
    { path: 'apps/miniapp', url: 'https://github.com/yudaocode/yudao-mall-uniapp', ref: 'master', commit: '3c4bf3864415054a88fe616a414e098972329412', notice: '94ba843e4c0a72090f6dd0ca885c91dd777ae135003141c94f0145f644b79929' }
  ];
  const lock = json('upstream.lock.json');
  const locks = expected.map(entry => {
    const actual = lock.repositories.find(repo => repo.path === entry.path);
    const filename = entry.path + '/LICENSE';
    const notice = read(filename).toString('utf8').replaceAll('\r\n', '\n').trim() + '\n';
    return { path: entry.path, commit: entry.commit, lockMatches: actual?.url === entry.url && actual?.ref === entry.ref && actual?.commit === entry.commit && actual?.license === 'MIT',
      licenseFile: filename, licenseMatches: candidateSet.has(filename) && hash(notice) === entry.notice,
      noNestedGit: !fs.existsSync(path.join(root, entry.path, '.git')) };
  });
  record('Three fixed upstream locks and preserved MIT notices', lock.repositories.length === 3 && locks.every(entry => entry.lockMatches && entry.licenseMatches && entry.noNestedGit), { repositories: locks });

  const required = ['package.json', 'package-lock.json', 'apps/server/pom.xml', 'apps/server/yudao-server/pom.xml', 'apps/server/yudao-module-edu/pom.xml', 'apps/server/yudao-module-crm/pom.xml',
    'apps/admin/package.json', 'apps/admin/pnpm-lock.yaml', 'apps/admin/.env.example', 'apps/admin/config/production.env.example', 'apps/miniapp/.env.example', 'tooling/bootstrap/init-frontend.mjs', 'apps/miniapp/package.json', 'apps/miniapp/package-lock.json', 'apps/miniapp/pages.json', 'apps/miniapp/manifest.json',
    'infra/migration/pom.xml', 'infra/migration/db.changelog.xml', 'infra/migration/source-manifest.json'];
  const missingPackages = required.filter(filename => !candidateSet.has(filename) || !fs.existsSync(path.join(root, filename)) || !read(filename).length);
  for (const filename of required.filter(filename => /(?:package(?:-lock)?|manifest)\.json$/.test(filename) && !missingPackages.includes(filename))) json(filename);
  record('Key application and migration package manifests/locks are delivery candidates', missingPackages.length === 0, { checkedFiles: required.length, files: missingPackages });

  const manifest = json('apps/miniapp/manifest.json');
  const analytics = ['root', 'h5', 'mp-weixin'].map(platform => ({ platform, disabled: (platform === 'root' ? manifest : manifest[platform])?.uniStatistics?.enable === false }));
  record('Miniapp demo analytics explicitly disabled on all shipped platforms', analytics.every(item => item.disabled), { platforms: analytics });

  const migration = safeRun(process.execPath, ['tooling/bootstrap/generate-production-migrations.mjs', '--check']);
  record('Production migration assets match current fixed sources', migration.status === 0, { command: 'node tooling/bootstrap/generate-production-migrations.mjs --check', exitCode: migration.status });

  // Run the existing pure dictionary generator with its sole write replaced by
  // an equality assertion. No docs or model files are regenerated on disk.
  const generatorPath = 'scripts/generate-education-dictionary.mjs';
  const generator = read(generatorPath).toString('utf8');
  const writeStatement = "fs.writeFileSync(path.join(root,'docs/DATA_DICTIONARY.md'),out);";
  const writeCount = generator.split(writeStatement).length - 1;
  if (writeCount !== 1) record('Education dictionary exactly matches generator and authoritative model/DDL', false, { files: [generatorPath], reason: 'Expected pure generator write contract changed; inspect before executing' });
  else {
    const source = generator.replace(writeStatement, "assert.equal(fs.readFileSync(path.join(root,'docs/DATA_DICTIONARY.md'),'utf8').replaceAll('\\r\\n','\\n'),out.replaceAll('\\r\\n','\\n'),'Dictionary requires regeneration');")
      .replaceAll('import.meta.url', JSON.stringify(pathToFileURL(path.join(root, generatorPath)).href));
    const dictionary = safeRun(process.execPath, ['--input-type=module'], { input: source });
    record('Education dictionary exactly matches generator and authoritative model/DDL', dictionary.status === 0, { exitCode: dictionary.status, files: dictionary.status === 0 ? [] : ['docs/DATA_DICTIONARY.md', generatorPath, 'infra/sql/education.sql', 'scripts/generate-edu-models.mjs'] });
  }

  const freshness = [];
  const backendEvidence = json('.runtime/backend-build-report.json');
  const jarFile = 'apps/server/yudao-server/target/yudao-server.jar';
  const staleJava = [], excludedClasses = [];
  let checkedJavaSources = 0;
  for (const filename of readable.filter(filename => filename.startsWith('apps/server/') && filename.endsWith('.java') && !filename.endsWith('/package-info.java'))) {
    const marker = '/src/main/java/', index = filename.indexOf(marker);
    if (index < 0) continue;
    const module = filename.slice('apps/server/'.length, index);
    if (!backendEvidence.monitoredModules.includes(module)) continue;
    const compiled = filename.slice(0, index) + '/target/classes/' + filename.slice(index + marker.length).replace(/\.java$/, '.class');
    if (backendEvidence.excludedOptionalCrmBpmSources.includes(filename)) {
      if (fs.existsSync(path.join(root, compiled))) excludedClasses.push(compiled);
      continue;
    }
    checkedJavaSources++;
    if (!fs.existsSync(path.join(root, compiled)) || fs.statSync(path.join(root, filename)).mtimeMs > fs.statSync(path.join(root, compiled)).mtimeMs) staleJava.push(filename);
  }
  const resource = 'application-foundation.yaml';
  const backendFresh = backendEvidence.status === 'PASSED' && fs.existsSync(path.join(root, jarFile)) && hash(read(jarFile)) === backendEvidence.jarSha256 &&
    checkedJavaSources === backendEvidence.checkedJavaSources && !staleJava.length && !excludedClasses.length &&
    hash(read('apps/server/yudao-server/src/main/resources/' + resource)) === hash(read('apps/server/yudao-server/target/classes/' + resource));
  freshness.push({ application: 'backend', status: backendFresh ? 'CURRENT' : 'NEEDS_REFRESH', artifact: jarFile,
    checkedJavaSources, evidence: '.runtime/backend-build-report.json', evidenceTimestamp: backendEvidence.timestamp,
    staleSourceFiles: staleJava, unexpectedOptionalClasses: excludedClasses, packagedJarMatchesEvidence: fs.existsSync(path.join(root, jarFile)) && hash(read(jarFile)) === backendEvidence.jarSha256 });

  const frontend = [
    { application: 'admin production', prefix: 'apps/admin/', artifact: 'apps/admin/dist-prod/.vite/manifest.json', include: /^(?:src\/|public\/|build\/|vite\.config\.|tsconfig|uno\.config\.|package\.json$|pnpm-lock\.yaml$|index\.html$)/ },
    { application: 'miniapp H5', prefix: 'apps/miniapp/', artifact: 'apps/miniapp/dist/build/h5/index.html', include: /^(?:pages\/|edu\/|components\/|sheep\/|static\/|uni_modules\/|tooling\/uni\.mjs$|App\.vue$|main\.js$|uni\.scss$|vite\.config\.|pages\.json$|manifest\.json$|package(?:-lock)?\.json$)/ },
    { application: 'miniapp WeChat', prefix: 'apps/miniapp/', artifact: 'apps/miniapp/dist/build/mp-weixin/app.json', include: /^(?:pages\/|edu\/|components\/|sheep\/|static\/|uni_modules\/|tooling\/uni\.mjs$|App\.vue$|main\.js$|uni\.scss$|vite\.config\.|pages\.json$|manifest\.json$|package(?:-lock)?\.json$)/ }
  ];
  for (const app of frontend) {
    const inputs = readable.filter(filename => filename.startsWith(app.prefix) && app.include.test(filename.slice(app.prefix.length)) && !/(?:^|\/)(?:README|CHANGELOG|LICENSE)(?:\.|$)/i.test(filename));
    const exists = fs.existsSync(path.join(root, app.artifact));
    const modified = exists ? fs.statSync(path.join(root, app.artifact)).mtimeMs : 0;
    const newer = inputs.filter(filename => fs.statSync(path.join(root, filename)).mtimeMs > modified);
    freshness.push({ application: app.application, status: exists && !newer.length ? 'CURRENT' : 'NEEDS_REFRESH', artifact: app.artifact,
      artifactModified: exists ? new Date(modified).toISOString() : null, checkedInputFiles: inputs.length, newerInputFiles: newer });
  }
  report.buildFreshness = freshness;
  report.buildRefreshNeeded = freshness.some(entry => entry.status !== 'CURRENT');
} catch {
  // Deliberately omit exception messages/stacks: subprocess errors can contain
  // stdout or config bytes. Specific failed checks above retain safe file paths.
  record('Audit completed without an unclassified read/parse error', false, { reason: 'Read or parse failed; inspect named checks and workspace files without printing private values' });
}

report.completedAt = new Date().toISOString();
report.status = report.checks.some(check => check.status === 'FAILED') ? 'FAILED' : report.buildRefreshNeeded ? 'PASSED_WITH_BUILD_REFRESH_NEEDED' : 'PASSED';
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(`${report.status}: ${report.candidateCount ?? 0} Git candidates; ${report.checks.filter(check => check.status === 'PASSED').length}/${report.checks.length} integrity checks. Report: ${relative(reportPath)}`);
for (const check of report.checks.filter(check => check.status === 'FAILED')) console.log(`FAILED: ${check.name}${check.files?.length ? ' — ' + check.files.join(', ') : ''}`);
for (const build of report.buildFreshness ?? []) console.log(`${build.status}: ${build.application}${build.newerInputFiles?.length ? ' — ' + build.newerInputFiles.join(', ') : ''}`);
process.exitCode = report.status === 'FAILED' ? 1 : 0;
