// Import the approved website copy through the same management API as operators.
// Defaults to preview. Supply an existing staff token via environment, never CLI arguments.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const origin = new URL(process.env.VIBE_API_TARGET || 'http://127.0.0.1:48080');
assert(origin.protocol === 'https:' || (origin.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname)), 'Use HTTPS or a loopback API');
assert(!origin.username && !origin.password && origin.pathname === '/' && !origin.search, 'Supply an API origin without credentials or a path');
const tenant = process.env.VIBE_WEBSITE_TENANT_ID || '1';
assert(/^[1-9][0-9]*$/.test(tenant), 'Invalid tenant');
assert(process.env.VIBE_ADMIN_TOKEN, 'VIBE_ADMIN_TOKEN is required (query permission; apply also needs create/publish)');
async function api(route, body) {
  const response = await fetch(new URL('/admin-api/edu/website-offering/' + route, origin), {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', 'tenant-id': tenant, Authorization: 'Bearer ' + process.env.VIBE_ADMIN_TOKEN },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000),
  });
  const result = await response.json();
  if (!response.ok || result.code !== 0) throw new Error(`${route}: ${result.msg || response.status}`);
  return result.data;
}
const approved = JSON.parse(fs.readFileSync(path.join(root, 'infra/website-content.json'), 'utf8'));
const existing = await api('list');
for (const { published, ...body } of approved) {
  if (existing.some(row => row.slug === body.slug)) {
    console.log(`PRESERVED ${body.slug}: existing operator content and publication state unchanged`);
    continue;
  }
  if (!process.argv.includes('--apply')) { console.log(`PREVIEW ${body.slug}: create approved website copy${published ? ' and publish' : ''}`); continue; }
  const row = await api('create', body);
  if (published) await api('publish', { id: row.id, revision: row.revision, published: true });
  console.log(`CREATED ${body.slug}`);
}
