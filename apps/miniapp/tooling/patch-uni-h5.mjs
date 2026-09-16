import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// Temporary fix for queued image callbacks after page disposal in this pinned
// uni-h5 release. Re-evaluate/remove when upgrading; never patch unknown versions.
const require = createRequire(import.meta.url);
const packagePath = require.resolve('@dcloudio/uni-h5/package.json');
const metadata = JSON.parse(readFileSync(packagePath, 'utf8'));
if (metadata.version !== '3.0.0-5020420260813003')
  throw new Error('Review the uni-h5 image lifecycle patch before upgrading');
const runtimePath = require.resolve('@dcloudio/uni-h5/dist/uni-h5.es.js');
let source = readFileSync(runtimePath, 'utf8');
const marker = '/* vibe: image disposal guards v1 */';
if (!source.includes(marker)) {
  const start = source.indexOf('function useImageState(');
  const end = source.indexOf('\n}', source.indexOf('function useImageSize(', start)) + 2;
  if (start < 0 || end < start) throw new Error('uni-h5 image functions not found');
  let block = source.slice(start, end);
  const replace = (from, to) => {
    if (block.split(from).length !== 2) throw new Error(`uni-h5 patch anchor changed: ${from}`);
    block = block.replace(from, to);
  };
  replace('    state2.origWidth = rootEl.clientWidth', '    if (!rootEl) return;\n    state2.origWidth = rootEl.clientWidth');
  replace('  const loadImage = (src) => {', '  const loadImage = (src) => {\n    if (!rootRef.value) return;');
  replace('    img.onload = (evt) => {', '    img.onload = (evt) => {\n      if (!rootRef.value || !img) { resetImage(); return; }');
  replace('    img.onerror = (evt) => {', '    img.onerror = (evt) => {\n      if (!rootRef.value) { resetImage(); return; }');
  replace('    const value = rootEl[names[0]];', '    if (!rootEl) return;\n    const value = rootEl[names[0]];');
  replace('  const resetSize = () => {', '  const resetSize = () => {\n    if (!rootRef.value) return;');
  source = source.slice(0, start) + marker + '\n' + block + source.slice(end);
  writeFileSync(runtimePath, source);
}
