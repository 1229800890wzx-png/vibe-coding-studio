const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../node_modules/@dcloudio/uni-h5/dist/uni-h5.es.js'), 'utf8');
function harness() {
  const mounted = [], ticks = [], events = [];
  let image;
  const context = vm.createContext({
    reactive: x => x, computed: fn => ({ get value() { return fn(); } }),
    ref: value => ({ value }), getRealPath: x => x, IMAGE_MODES: {},
    FIX_MODES: { widthFix: ['clientWidth', 'height', x => x] },
    fixNumber: x => x, onMounted: fn => mounted.push(fn), onBeforeUnmount: () => {},
    nextTick: fn => ticks.push(fn), watch: () => {},
    Image: class { constructor() { image = this; this.width = 100; this.height = 100; } },
  });
  vm.runInContext(source.slice(source.indexOf('function useImageState('), source.indexOf('const isChrome =')), context);
  const sizeStart = source.indexOf('function useImageSize(');
  const sizeEnd = source.indexOf('\n}', sizeStart) + 2;
  vm.runInContext(source.slice(sizeStart, sizeEnd), context);
  return { context, mounted, ticks, events, image: () => image };
}
test('a queued image mount after its root disappears does not read clientWidth', () => {
  const h = harness();
  h.context.useImageState({ value: null }, { src: '' });
  assert.doesNotThrow(() => h.mounted.forEach(fn => fn()));
});
test('image load after navigation must not append to a destroyed root or emit load', () => {
  const h = harness(), root = { value: { appendChild() {} } };
  h.context.useImageLoader({ src: 'test.png' }, {}, root, () => {}, (...args) => h.events.push(args));
  h.mounted.forEach(fn => fn());
  root.value = null;
  assert.doesNotThrow(() => h.image().onload({}));
  assert.equal(h.events.length, 0);
});
test('an image size callback queued before navigation tolerates a removed root', () => {
  const h = harness();
  const result = h.context.useImageSize({ value: null }, { mode: 'widthFix' }, { origWidth: 100, origHeight: 100 });
  assert.doesNotThrow(() => result.fixSize());
});

test('a live image still attaches, emits dimensions and schedules sizing', () => {
  const h = harness(), attached = [], state = { src: 'test.png' };
  let resized = false;
  h.context.useImageLoader(state, {}, { value: { appendChild: image => attached.push(image) } },
    () => { resized = true; }, (...args) => h.events.push(args));
  h.mounted.forEach(fn => fn());
  h.image().onload({});
  h.ticks.forEach(fn => fn());
  assert.equal(attached.length, 1);
  assert.equal(h.events[0][0], 'load');
  assert.equal(h.events[0][2].width, 100);
  assert.equal(state.imgSrc, 'test.png');
  assert.equal(resized, true);
});
