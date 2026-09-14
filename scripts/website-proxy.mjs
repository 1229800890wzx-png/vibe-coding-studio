import http from 'node:http';
import https from 'node:https';

const readRoutes = new Set([
  '/app-api/edu/website-offering/list', '/app-api/edu/website-admission/options',
  '/app-api/edu/course/page', '/app-api/edu/course/get', '/app-api/edu/config/get',
  '/app-api/edu/teacher/list', '/app-api/edu/campus/list', '/app-api/edu/cohort/list',
  '/app-api/edu/cohort/get',
]);
const writeRoute = '/app-api/edu/website-admission/create';
function reject(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify({ code: status, msg: message, data: null }));
}

/** Public website gateway: do not forward user tokens, cookies or tenant/proxy headers. */
export function websiteApiProxy(req, res, next) {
  let requestUrl;
  try { requestUrl = new URL(req.url, 'http://website.local'); }
  catch { return reject(res, 400, '请求地址无效'); }
  if (!requestUrl.pathname.startsWith('/app-api/') && !requestUrl.pathname.startsWith('/admin-api/')) return next();
  const allowed = (readRoutes.has(requestUrl.pathname) && ['GET', 'HEAD'].includes(req.method)) ||
    (requestUrl.pathname === writeRoute && req.method === 'POST');
  if (!allowed) return reject(res, 404, '接口不存在');
  if (req.method === 'POST' && !/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return reject(res, 415, '请使用 JSON 提交');
  let target;
  try { target = new URL(process.env.VIBE_API_TARGET || 'http://127.0.0.1:48080'); }
  catch { return reject(res, 503, '服务配置不可用'); }
  if (!['http:', 'https:'].includes(target.protocol)) return reject(res, 503, '服务配置不可用');
  const tenant = process.env.VIBE_WEBSITE_TENANT_ID || '1';
  if (!/^\d+$/.test(tenant)) return reject(res, 503, '服务配置不可用');
  let bytes = 0;
  const chunks = [];
  req.on('data', chunk => {
    bytes += chunk.length;
    if (bytes <= 64 * 1024) chunks.push(chunk);
  });
  req.on('end', () => {
    if (bytes > 64 * 1024) return reject(res, 413, '提交内容过长');
    const body = Buffer.concat(chunks);
    const upstream = (target.protocol === 'https:' ? https : http).request(new URL(requestUrl.pathname + requestUrl.search, target), {
      method: req.method,
      headers: {
        accept: 'application/json', 'content-type': 'application/json',
        'content-length': body.length, 'tenant-id': tenant,
        'x-vibe-client-ip': req.socket.remoteAddress || 'unknown',
      },
      timeout: 15000,
    }, response => {
      res.writeHead(response.statusCode || 502, {
        'Content-Type': response.headers['content-type'] || 'application/json; charset=utf-8',
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
      });
      response.pipe(res);
      response.on('error', () => res.destroy());
    });
    upstream.on('timeout', () => upstream.destroy(new Error('upstream timeout')));
    upstream.on('error', () => { if (!res.headersSent) reject(res, 503, '服务暂时不可用，请稍后重试'); else res.destroy(); });
    req.on('aborted', () => upstream.destroy());
    upstream.end(body);
  });
}
