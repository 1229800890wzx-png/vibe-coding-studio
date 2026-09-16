const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const helpers = import(
  'data:text/javascript;base64,' +
    Buffer.from(
      fs.readFileSync(path.join(__dirname, '../edu/parent-space-data.js'), 'utf8'),
    ).toString('base64')
);

test('course counts come from this enrollment’s published schedule, never package size', async () => {
  const { courseProgress, remainingScheduled } = await helpers;
  const now = Date.parse('2026-09-16T12:00:00+08:00');
  const result = courseProgress(
    {
      enrollments: [
        { id: 1, currentCohortId: 8, courseName: 'A', status: 'ACTIVE' },
        { id: 2, currentCohortId: 9, courseName: 'B' },
      ],
      courses: [
        {
          id: 8,
          lessons: Array(12).fill({}),
          sessions: [
            { endTime: '2026-09-15 20:00:00', status: 'SCHEDULED' },
            { endTime: '2026-09-18 20:00:00', status: 'SCHEDULED' },
            { endTime: '2026-09-19 20:00:00', status: 'CANCELLED' },
            { endTime: '2026-09-19 20:00:00', status: 'DRAFT' },
            { endTime: null, status: 'SCHEDULED' },
          ],
        },
        { id: 9, sessions: [] },
      ],
    },
    now,
  );
  assert.equal(result[0].total, 3);
  assert.equal(result[0].ended, 1);
  assert.equal(result[0].upcoming, 1);
  assert.equal(result[0].undated, 1);
  assert.equal(result[0].percent, 33);
  assert.equal(result[1].total, 0);
  assert.equal(remainingScheduled(result), 1);
  assert.match(result[0].progressLabel, /课表已结束 1 \/ 已安排 3 节/);
});
test('a missing schedule stays unknown rather than becoming zero or twelve paid lessons', async () => {
  const { courseProgress, remainingScheduled } = await helpers;
  const [c] = courseProgress({
    enrollments: [{ id: 1, currentCohortId: 8 }],
    courses: [{ id: 9, sessions: [{ endTime: '2027-01-01' }] }],
  });
  assert.equal(c.total, null);
  assert.equal(c.percent, null);
  assert.equal(remainingScheduled([c]), null);
  assert.equal(remainingScheduled([]), 0);
});
test('only published teacher feedback appears, never student submission content or draft reviews', async () => {
  const { publishedFeedback } = await helpers;
  const rows = publishedFeedback([
    { id: 1, content: 'student content' },
    { id: 2, review: { status: 'DRAFT', feedback: 'unpublished' } },
    {
      id: 3,
      review: { status: 'PUBLISHED', feedback: 'first', publishedAt: '2026-09-12 12:00:00' },
    },
    {
      id: 4,
      review: { status: 'PUBLISHED', feedback: 'latest', publishedAt: '2026-09-15 12:00:00' },
    },
    { id: 5, review: { status: 'PUBLISHED', feedback: '  ' } },
  ]);
  assert.deepEqual(
    rows.map((r) => r.id),
    [4, 3],
  );
  assert.equal(rows[0].feedback, 'latest');
});
test('Beijing class time is stable across browser time zones and missing data stays unknown', async () => {
  const { dateParts, timestamp, count } = await helpers;
  assert.deepEqual(dateParts('2026-09-18T11:00:00Z'), dateParts('2026-09-18 19:00:00'));
  assert.equal(dateParts('2026-09-18 19:00:00').time, '19:00');
  assert.equal(dateParts('2026-09-18 19:00:00').week, '周五');
  assert.equal(timestamp('invalid'), null);
  assert.equal(dateParts(null).time, '时间待确认');
  assert.equal(count(null), null);
  assert.equal(count('0'), null);
  assert.equal(count(0), 0);
});
function deferredFamily() {
  let resolve;
  const user = { isLogin: true, sessionVersion: 1 },
    storage = { token: 'first' };
  const context = vm.createContext({
    computed: (fn) => ({
      get value() {
        return fn();
      },
    }),
    reactive: (x) => x,
    store: () => user,
    edu: { students: () => new Promise((r) => (resolve = r)) },
    listOf: (x) => x,
    currentContinuation: () => '',
    uni: {
      getStorageSync: (key) => storage[key],
      setStorageSync: (key, value) => (storage[key] = value),
    },
  });
  const source = fs
    .readFileSync(path.join(__dirname, '../edu/state.js'), 'utf8')
    .replace(/^import .*;\r?\n/gm, '')
    .replace(/export /g, '');
  vm.runInContext(source + '\nglobalThis.api={family,loadStudents};', context);
  return { user, storage, api: context.api, resolve: (data) => resolve(data) };
}
test('a children request arriving after logout cannot restore private child data', async () => {
  const c = deferredFamily();
  const request = c.api.loadStudents();
  c.user.isLogin = false;
  c.resolve([{ id: 77, name: 'old account child' }]);
  await request;
  assert.equal(c.api.family.students.length, 0);
  assert.equal(c.api.family.loaded, false);
});
test('a children request from another token cannot overwrite the current account', async () => {
  const c = deferredFamily();
  const request = c.api.loadStudents();
  c.storage.token = 'second';
  c.user.sessionVersion++;
  c.resolve([{ id: 77, name: 'old account child' }]);
  await request;
  assert.equal(c.api.family.students.length, 0);
});

test('a successful token refresh keeps the same account children request valid', async () => {
  const c = deferredFamily();
  const request = c.api.loadStudents();
  c.storage.token = 'renewed-token';
  c.resolve([{ id: 77, name: 'same account child' }]);
  await request;
  assert.equal(c.api.family.students.length, 1);
  assert.equal(c.api.family.currentId, 77);
});
