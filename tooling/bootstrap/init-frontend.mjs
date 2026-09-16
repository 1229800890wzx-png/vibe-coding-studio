/** Create ignored frontend settings from the delivered public templates. Never overwrite. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const files = [
  ['apps/admin/.env.example', 'apps/admin/.env.local'],
  ['apps/admin/config/production.env.example', 'apps/admin/.env.prod'],
  ['apps/miniapp/.env.example', 'apps/miniapp/.env.local']
];
for (const [source, target] of files) {
  const destination = path.join(root, target);
  if (fs.existsSync(destination)) { console.log(`Kept existing ${target}`); continue; }
  fs.copyFileSync(path.join(root, source), destination, fs.constants.COPYFILE_EXCL);
  console.log(`Created ${target} from ${source}`);
}
console.log('Review public URLs before production; these files contain no server credentials.');
