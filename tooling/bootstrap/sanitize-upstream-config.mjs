// Remove public upstream demo credentials from active server configuration, retaining comments/structure.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sensitive = /^(password|secret|api-key|app-id|appid|client-id|client-secret|key|customer|business-id|tencent-lbs-key|request-key|response-key|alipay-public-key)$/;
for (const name of ['application.yaml', 'application-local.yaml', 'application-dev.yaml']) {
  const file = path.join(root, 'apps/server/yudao-server/src/main/resources', name);
  let parents = [], changed = 0;
  const result = fs.readFileSync(file, 'utf8').split(/\r?\n/).flatMap(line => {
    if (/^---/.test(line)) parents = [];
    if (/^\s*#\s*(password|secret|app-id|appid|request-key|response-key):/.test(line)) { changed++; return []; }
    const m = line.match(/^(\s*)([\w-]+):(?:\s*(.*))?$/);
    if (!m) return [line];
    const depth = m[1].length, key = m[2], value = m[3] || '';
    parents = parents.filter(p => p.depth < depth);
    const segments = [...parents.map(p => p.key), key];
    parents.push({ depth, key });
    if (key === 'mock-enable') { changed++; return [`${m[1]}${key}: false # Authentication bypass is disabled.`]; }
    if (segments.join('.') === 'spring.profiles.active') { changed++; return [`${m[1]}${key}: \${SPRING_PROFILES_ACTIVE:foundation}`]; }
    if (/yudao\.ai\..*\.enable$/.test(segments.join('.'))) { changed++; return [`${m[1]}${key}: false`]; }
    if (['order-notify-url', 'refund-notify-url', 'transfer-notify-url'].includes(key)) {
      changed++; return [`${m[1]}${key}: http://127.0.0.1:48080/admin-api/pay/notify/${key.split('-')[0]}`];
    }
    if (!sensitive.test(key) || !value || value.startsWith('#') || value.startsWith('${')) return [line];
    const envName = `VIBE_${segments.join('_').replaceAll('-', '_').toUpperCase()}`;
    const fallback = /request-key|response-key/.test(key) ? '0123456789abcdef' : segments.join('.') === 'mybatis-plus.encryptor.password' ? 'local-only-key00' : 'local-unconfigured';
    changed++;
    return [`${m[1]}${key}: \${${envName}:${fallback}} # Configure your own value via environment.`];
  });
  fs.writeFileSync(file, result.join('\n'));
  console.log(`${name}: ${changed} demo/default settings sanitized.`);
}
