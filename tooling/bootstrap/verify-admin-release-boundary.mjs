/** Read-only original menu API versus actual production output. Build guard checks module graph too. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.runtime/foundation.env'), 'utf8').split(/\r?\n/).filter(x => x && !x.startsWith('#')).map(x => { const i = x.indexOf('='); return [x.slice(0, i), x.slice(i + 1)]; }));
async function api(url, options = {}) {
  const response = await fetch('http://127.0.0.1:48080/admin-api' + url, { headers: { 'Content-Type': 'application/json', 'tenant-id': '1', ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) }, method: options.body ? 'POST' : 'GET', ...(options.body ? { body: JSON.stringify(options.body) } : {}) });
  const result = await response.json(); assert.equal(result.code, 0, `${url}: ${result.msg}`); return result.data;
}
const token = (await api('/system/auth/login', { body: { username: 'admin', password: env.VIBE_ADMIN_PASSWORD } })).accessToken;
const permission = await api('/system/auth/get-permission-info', { token });
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'apps/admin/dist-prod/.vite/manifest.json'), 'utf8'));
const viewKeys = Object.keys(manifest).filter(key => key.startsWith('src/views/'));
const checked = [];
function checkMenus(menus) { for (const menu of menus || []) { if (menu.component && !menu.component.startsWith('http')) { const component = menu.component.replace(/^\//, '').replace(/\.(vue|tsx)$/, ''); assert(viewKeys.some(key => key === `src/views/${component}.vue` || key === `src/views/${component}.tsx`), `Missing active menu component ${component}`); checked.push({ path: menu.path, component }); } checkMenus(menu.children); } }
// Mirror the deployment's root-menu selection in src/store/modules/permission.ts.
const inactiveRoot = /^\/?(ai|bpm|cms|crm|erp|fms|hrm|im|iot|mes|mp|oa|pms|report|wms)(\/|$)/;
checkMenus(permission.menus.filter(menu => !inactiveRoot.test(menu.path)));
assert(checked.some(menu => menu.component === 'edu/admission/index'));
assert(checked.some(menu => menu.component === 'crm/clue/index'));
assert(!fs.existsSync(path.join(root, 'apps/admin/node_modules/dhtmlx-gantt')));
assert(!fs.readFileSync(path.join(root, 'apps/admin/pnpm-lock.yaml'), 'utf8').includes('dhtmlx-gantt'));
const inactive = /^src\/views\/(ai|bpm|erp|fms|hrm|im|iot|mes|mp|oa|pms|report|wms)\//;
assert(viewKeys.every(key => !inactive.test(key)));
const assets = fs.readdirSync(path.join(root, 'apps/admin/dist-prod/assets')).filter(name => /\.(js|css)$/.test(name));
for (const name of assets) assert(!/dhtmlx-gantt|dhtmlxGantt|gantt\.config\.|gantt_task_line/.test(fs.readFileSync(path.join(root, 'apps/admin/dist-prod/assets', name), 'utf8')), `Gantt distribution marker in ${name}`);
const report = { timestamp: new Date().toISOString(), status: 'PASSED', productionManifestViews: viewKeys.length, checkedBackendMenuComponents: checked.length, checked, noInstalledDhtmlx: true, noDhtmlxLockEntry: true, noInactiveManifestViews: true, scannedJsCssAssets: assets.length, noDhtmlxDistributionMarkers: true, scope: 'Actual original admin login/menu API plus production manifest and asset scan. Selective original CRM clue/followup/team views enabled. Does not replace every-page browser interaction.' };
fs.writeFileSync(path.join(root, '.runtime/admin-release-boundary-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`PASS: ${checked.length} actual menu components, ${viewKeys.length} manifest views, ${assets.length} JS/CSS assets; no excluded/Gantt distribution.`);
