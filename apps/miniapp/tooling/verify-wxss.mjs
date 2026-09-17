// Run after build:mp-weixin using the compiler bundled with WeChat DevTools.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const compiler = process.env.WCSC_PATH || process.argv[2];
if (!compiler || !fs.existsSync(compiler)) throw new Error('Set WCSC_PATH to the WeChat DevTools wcsc executable');
const root = path.resolve('dist/build/mp-weixin');
const files = [];
function visit(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (entry.name.endsWith('.wxss')) files.push(path.relative(root, file).split(path.sep).join('/'));
  }
}
visit(root);
if (!files.length) throw new Error('No WXSS files found; build the mini program first');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'vibe-wxss-'));
try {
  const result = spawnSync(compiler, [...files, '-o', path.join(temporary, 'compiled.js')],
    { cwd: root, encoding: 'utf8', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
console.log(`PASS: ${files.length} WXSS files compiled with the WeChat compiler`);
