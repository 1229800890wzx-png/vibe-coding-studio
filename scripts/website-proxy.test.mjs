import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { test } from 'node:test';
import { websiteApiProxy } from './website-proxy.mjs';

test('public gateway strips identity headers, restricts routes and bounds requests', async () => {
  let seen;
  const upstream = http.createServer((req, res) => {
    seen = req.headers;
    req.resume();
    req.on('end', () => res.end(JSON.stringify({ code: 0, data: { accepted: true } })));
  });
  const gateway = http.createServer((req, res) => websiteApiProxy(req, res, () => {
    res.writeHead(204); res.end();
  }));
  const oldTarget = process.env.VIBE_API_TARGET;
  const oldTenant = process.env.VIBE_WEBSITE_TENANT_ID;
  try {
    upstream.listen(0, '127.0.0.1'); await once(upstream, 'listening');
    gateway.listen(0, '127.0.0.1'); await once(gateway, 'listening');
    process.env.VIBE_API_TARGET = `http://127.0.0.1:${upstream.address().port}`;
    process.env.VIBE_WEBSITE_TENANT_ID = '1';
    const base = `http://127.0.0.1:${gateway.address().port}`;
    let response = await fetch(base + '/app-api/edu/website-admission/create', {
      method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json',
        Authorization: 'Bearer test', Cookie: 'admin=test', 'tenant-id': '2',
        Forwarded: 'for=192.0.2.1', 'X-Forwarded-For': '192.0.2.2', 'X-Vibe-Client-IP': '192.0.2.3' },
    });
    assert.equal(response.status, 200); await response.json();
    assert.equal(seen['tenant-id'], '1'); assert.equal(seen['x-vibe-client-ip'], '127.0.0.1');
    for (const name of ['authorization', 'cookie', 'forwarded', 'x-forwarded-for']) assert.equal(seen[name], undefined);
    for (const url of ['/admin-api/system/user/page', '/app-api/edu/student/list', '/app-api/member/user/get']) {
      response = await fetch(base + url); assert.equal(response.status, 404); await response.text();
    }
    response = await fetch(base + '/app-api/edu/website-offering/list', { method: 'POST' });
    assert.equal(response.status, 404); await response.text();
    response = await fetch(base + '/app-api/edu/website-admission/create', { method: 'POST', body: '{}' });
    assert.equal(response.status, 415); await response.text();
    response = await fetch(base + '/app-api/edu/website-admission/create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'x'.repeat(65537),
    });
    assert.equal(response.status, 413); await response.text();
    process.env.VIBE_API_TARGET = 'not a URL';
    response = await fetch(base + '/app-api/edu/website-offering/list');
    assert.equal(response.status, 503); await response.text();
    assert.equal((await fetch(base + '/courses')).status, 204);
    const malformed = await new Promise(resolve => {
      const req = http.request({ host: '127.0.0.1', port: gateway.address().port, path: 'http://[' }, res => {
        res.resume(); res.on('end', () => resolve(res.statusCode));
      });
      req.end();
    });
    assert.equal(malformed, 400);
  } finally {
    if (oldTarget === undefined) delete process.env.VIBE_API_TARGET; else process.env.VIBE_API_TARGET = oldTarget;
    if (oldTenant === undefined) delete process.env.VIBE_WEBSITE_TENANT_ID; else process.env.VIBE_WEBSITE_TENANT_ID = oldTenant;
    gateway.closeAllConnections(); upstream.closeAllConnections();
    await Promise.all([new Promise(resolve => gateway.close(resolve)), new Promise(resolve => upstream.close(resolve))]);
  }
});
