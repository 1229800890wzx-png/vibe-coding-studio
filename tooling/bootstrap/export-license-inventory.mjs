/** Offline direct-dependency inventory. Copies existing notices; does not infer a legal license. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(root, 'infra/templates');
const relative = (file) => path.relative(root, file).split(path.sep).join('/');
const digest = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const safeName = (name) => name.replace(/[^a-zA-Z0-9._-]+/g, '_');
fs.mkdirSync(output, { recursive: true });

function notices(packageDir, key) {
  if (!fs.existsSync(packageDir)) return [];
  return fs.readdirSync(packageDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^(licen[sc]e|notice|copying|copyright)([._-].*)?$/i.test(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      const source = path.join(packageDir, entry.name);
      const content = fs.readFileSync(source);
      const destination = path.join(output, 'license-notices', safeName(key), entry.name);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, content);
      return {
        source: relative(source), retainedCopy: relative(destination), sha256: digest(content),
        copyrightLines: [...new Set(content.toString('utf8').split(/\r?\n/).filter((line) => /copyright|©/i.test(line)).map((line) => line.trim()))],
      };
    });
}

const upstream = [
  { app: 'apps/server', commit: '8e43004cf68a405cd3485f98f8a539b97ca6544a', provenance: 'apps/server/UPSTREAM.json' },
  { app: 'apps/admin', commit: 'aab14fb0e74720dd09e964ae066f8bbde9f9012e', provenance: 'apps/admin/UPSTREAM.md' },
  { app: 'apps/miniapp', commit: '3c4bf3864415054a88fe616a414e098972329412', provenance: 'apps/miniapp/UPSTREAM.md' },
].map((entry) => ({ ...entry, reportedLicense: 'MIT', notices: notices(path.join(root, entry.app), entry.app) }));

const npm = [];
for (const app of ['.', 'apps/admin', 'apps/miniapp']) {
  const dir = path.join(root, app);
  const manifest = readJson(path.join(dir, 'package.json'));
  for (const scope of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    for (const [name, declaredVersion] of Object.entries(manifest[scope] || {}).sort(([a], [b]) => a.localeCompare(b))) {
      const candidates = [path.join(dir, 'node_modules', name), path.join(root, 'node_modules', name)];
      const packageDir = candidates.find((candidate) => fs.existsSync(path.join(candidate, 'package.json')));
      const metadata = packageDir ? readJson(path.join(packageDir, 'package.json')) : null;
      const key = `${app === '.' ? 'showcase' : app.replace('apps/', '')}_${name}_${metadata?.version || 'uninstalled'}`;
      const retained = packageDir ? notices(packageDir, key) : [];
      npm.push({
        app, scope, name, declaredVersion, installedVersion: metadata?.version ?? null,
        reportedLicense: metadata?.license ?? metadata?.licenses ?? null,
        metadataSource: packageDir ? relative(path.join(packageDir, 'package.json')) : null,
        metadataSha256: packageDir ? digest(fs.readFileSync(path.join(packageDir, 'package.json'))) : null,
        notices: retained,
        status: !metadata ? 'PACKAGE_NOT_INSTALLED' : !metadata.license && !metadata.licenses ? 'LICENSE_METADATA_MISSING' : !retained.length ? 'NO_ROOT_NOTICE_FOUND' : 'RECORDED',
      });
    }
  }
}

// Minimal XML token traversal, restricted to direct project/dependencies (not commented profiles or dependencyManagement).
function pom(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const xml = raw.replace(/<!--[\s\S]*?-->/g, '');
  const stack = [], values = {}, dependencies = [];
  let dependency;
  for (const match of xml.matchAll(/<[^>]+>|[^<]+/g)) {
    const token = match[0];
    if (token.startsWith('<?') || token.startsWith('<!')) continue;
    if (token.startsWith('</')) {
      if (stack.join('/') === 'project/dependencies/dependency') { dependencies.push(dependency); dependency = undefined; }
      stack.pop();
    } else if (token.startsWith('<')) {
      const name = token.match(/^<([^\s/>]+)/)?.[1];
      if (!name || token.endsWith('/>')) continue;
      stack.push(name);
      if (stack.join('/') === 'project/dependencies/dependency') dependency = {};
    } else if (token.trim()) {
      const where = stack.join('/');
      if (/^project\/(groupId|artifactId|version)$/.test(where) || /^project\/parent\/(groupId|version)$/.test(where)) values[where] = token.trim();
      if (dependency && /^project\/dependencies\/dependency\/(groupId|artifactId|version|scope|optional|type)$/.test(where)) dependency[stack.at(-1)] = token.trim();
    }
  }
  return { source: relative(file), sha256: digest(raw), artifactId: values['project/artifactId'], groupId: values['project/groupId'] || values['project/parent/groupId'], declaredVersion: values['project/version'] || values['project/parent/version'], dependencies };
}
const allPoms = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && !['target', 'node_modules', '.git'].includes(entry.name)) walk(path.join(dir, entry.name));
    else if (entry.isFile() && entry.name === 'pom.xml') allPoms.push(pom(path.join(dir, entry.name)));
  }
}
walk(path.join(root, 'apps/server'));
const internal = new Map(allPoms.filter((p) => p.artifactId).map((p) => [p.artifactId, p]));
const queue = ['yudao-server'], visited = new Set(), maven = [];
while (queue.length) {
  const artifact = queue.shift();
  if (visited.has(artifact)) continue;
  visited.add(artifact);
  const module = internal.get(artifact);
  if (!module) continue;
  maven.push({ ...module, dependencies: module.dependencies.map((dependency) => {
    const projectSource = dependency.groupId === 'cn.iocoder.boot' ? internal.get(dependency.artifactId)?.source : undefined;
    if (projectSource) queue.push(dependency.artifactId);
    return { ...dependency, projectSource: projectSource || null, licenseStatus: projectSource ? 'SEE_RETAINED_SERVER_UPSTREAM_LICENSE' : 'EXTERNAL_LICENSE_NOT_RESOLVED', resolutionStatus: dependency.version && !dependency.version.includes('${') ? 'DECLARED_VERSION_ONLY' : 'PARENT_OR_BOM_RESOLUTION_REQUIRED' };
  }) });
}

const report = {
  schemaVersion: 1, generatedAt: new Date().toISOString(),
  scope: 'Retained upstream source licenses; installed direct npm dependencies including development tools; direct POM declarations reachable through project module dependencies from yudao-server. No network, install, transitive npm inventory, final-artifact filtering or Maven effective-POM resolution.',
  noticePolicy: 'Existing root LICENSE/NOTICE/COPYING/COPYRIGHT files copied byte-for-byte. Missing metadata is reported, never assigned MIT. Copyright lines are an index; full retained copies are authoritative.',
  upstream, npm, maven,
  summary: { upstreamProjects: upstream.length, npmDeclarations: npm.length, npmWithoutRootNotice: npm.filter((p) => !p.notices.length).length, npmMissingMetadata: npm.filter((p) => !p.reportedLicense).length, mavenModules: maven.length, mavenExternalDeclarations: maven.flatMap((p) => p.dependencies).filter((d) => !d.projectSource).length },
};
fs.writeFileSync(path.join(output, 'license-inventory.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.summary));
console.log('Wrote infra/templates/license-inventory.json and byte-identical license-notices. This is not a complete release SBOM.');
