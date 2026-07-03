/**
 * Packs the built library into a tarball and copies it into every example app as
 * `ng2-multi-modal.tgz`. Installing a tarball (instead of a `file:` directory,
 * which npm symlinks) makes the example resolve the library's peer dependencies
 * from its OWN node_modules — i.e. the real, per-example Angular version. This is
 * exactly how a published package is consumed.
 *
 * Run `npm run build:lib` first (or use `npm run pack:examples`).
 */
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = join('dist', 'ng2-multi-modal');
if (!existsSync(join(dist, 'package.json'))) {
  console.error('[pack-to-examples] dist/ng2-multi-modal not found — run `npm run build:lib` first.');
  process.exit(1);
}

const out = execSync('npm pack --json', { cwd: dist, encoding: 'utf8' });
const filename = JSON.parse(out)[0].filename;
const tarball = join(dist, filename);

const examplesDir = 'examples';
let copied = 0;
for (const entry of readdirSync(examplesDir)) {
  const dir = join(examplesDir, entry);
  if (!existsSync(join(dir, 'package.json'))) continue;
  copyFileSync(tarball, join(dir, 'ng2-multi-modal.tgz'));
  console.log(`[pack-to-examples] → ${dir}/ng2-multi-modal.tgz`);
  copied++;
}
console.log(`[pack-to-examples] copied ${filename} into ${copied} example(s).`);
