const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function harness() {
  const mergeContext = vm.createContext({ isUndefined: x => x === undefined, deepMerge: (a, b) => ({ ...a, ...b }) });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../node_modules/luch-request/src/lib/core/mergeConfig.js'), 'utf8')
    .replace(/^import .*\r?\n/gm, '').replace('export default ', 'globalThis.mergeConfig = '), mergeContext);
  const mergeConfig = config => mergeContext.mergeConfig({}, config);
  const storage = new Map();
  let user, requestInterceptor, responseInterceptor, refresh;
  const context = vm.createContext({
    clone: x => ({ ...x }), cloneDeep: structuredClone,
    defineStore: (_name, config) => {
      user = { ...config.state(), ...config.actions, loginAfter() {}, logout() { this.setToken(); } };
      return user;
    },
    uni: { getStorageSync: key => storage.get(key), setStorageSync: (key, value) => storage.set(key, value),
      removeStorageSync: key => storage.delete(key), hideLoading() {}, showLoading() {}, showToast() {} },
    Request: class {
      interceptors = { request: { use: fn => { requestInterceptor = fn; } }, response: { use: fn => { responseInterceptor = fn; } } };
      middleware(config) { return Promise.resolve(requestInterceptor(mergeConfig(config))); }
    },
    $store: () => user, $platform: {}, showAuthModal() {}, getTerminal() {},
    AuthUtil: { refreshToken: () => refresh() }, baseUrl: '', apiPath: '', tenantId: 1,
  });
  const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/^export default .*;\r?$/gm, '').replace(/export const /g, 'const ');
  vm.runInContext(read('../sheep/store/user.js'), context);
  vm.runInContext(read('../sheep/request/index.js'), context);
  return { user, storage, request: config => requestInterceptor(mergeConfig(config)), response: res => responseInterceptor(res),
    refresh: fn => { refresh = fn; } };
}
const config = () => ({ url: '/edu/student/list', header: {}, custom: { isToken: true } });

test('renewal preserves account generation; a stale renewal cannot revive logout or overwrite a new login', () => {
  const h = harness();
  h.user.setToken('old', 'refresh');
  const version = h.user.sessionVersion;
  assert.equal(h.user.setToken('renewed', 'refresh2', { refresh: true, sessionVersion: version }), true);
  assert.equal(h.user.sessionVersion, version);
  h.user.setToken();
  assert.equal(h.user.setToken('late', 'late', { refresh: true, sessionVersion: version }), false);
  assert.equal(h.storage.has('token'), false);
  h.user.setToken('new-account', 'new-refresh');
  assert.equal(h.user.setToken('late', 'late', { refresh: true, sessionVersion: version }), false);
  assert.equal(h.storage.get('token'), 'new-account');
});

test('a queued request cannot acquire another account token', async () => {
  const h = harness();
  h.user.setToken('old', 'refresh');
  const pending = h.request(config());
  h.user.setToken('new-account', 'new-refresh');
  await assert.rejects(h.request(pending), /登录状态已更新/);
  assert.equal(pending.header.Authorization, 'Bearer old');
});

test('a delayed refresh failure does not log out a newly signed-in account', async () => {
  const h = harness();
  h.user.setToken('old', 'refresh');
  let rejectRefresh;
  h.refresh(() => new Promise((_resolve, reject) => { rejectRefresh = reject; }));
  const result = h.response({ config: h.request(config()), data: { code: 401 } });
  h.user.setToken('new-account', 'new-refresh');
  rejectRefresh(new Error('old refresh expired'));
  await assert.rejects(result, /old refresh expired/);
  assert.equal(h.user.isLogin, true);
  assert.equal(h.storage.get('token'), 'new-account');
});

test('a successful refresh retries using renewed credentials without changing account generation', async () => {
  const h = harness();
  h.user.setToken('old', 'refresh');
  const version = h.user.sessionVersion;
  h.refresh(async () => {
    await h.response({ config: h.request({ ...config(), url: '/member/auth/refresh-token' }),
      data: { code: 0, data: { accessToken: 'renewed', refreshToken: 'refresh2' } } });
    return { code: 0 };
  });
  const result = await h.response({ config: h.request(config()), data: { code: 401 } });
  assert.equal(result.header.Authorization, 'Bearer renewed');
  assert.equal(h.user.sessionVersion, version);
});
