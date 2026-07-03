/**
 * Post-build step for the published library.
 *
 * ng-packagr generates an `exports` map that only exposes `"."` and
 * `"./package.json"`. The library also ships raw CSS theme files as assets,
 * which consumers import by deep subpath (e.g.
 * `@import "ng2-multi-modal/styles/theme/default.css"`). Under strict Node
 * `exports` resolution those subpaths must be declared, or the import is blocked.
 *
 * This script:
 *   1. adds `./styles/*` to the published `exports` map, and
 *   2. concatenates a convenience bundle `styles/ng2-multi-modal.css`
 *      (structural + default light + default dark) exposed as `./styles.css`.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join('dist', 'ng2-multi-modal');
const pkgPath = join(DIST, 'package.json');

if (!existsSync(pkgPath)) {
  console.error(`[patch-dist-exports] ${pkgPath} not found — did the library build run?`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.exports = pkg.exports ?? {};

// Expose every shipped stylesheet by deep subpath.
pkg.exports['./styles/*'] = { default: './styles/*' };

// Build a single-file convenience bundle: structural + light + dark defaults.
const stylesDir = join(DIST, 'styles');
const parts = [
  join(stylesDir, 'style.css'),
  join(stylesDir, 'theme', 'default.css'),
  join(stylesDir, 'theme', 'default-dark.css'),
].filter(existsSync);

if (parts.length) {
  // Strip per-file `@charset` rules (sass emits one per file) so the concatenation
  // stays valid — `@charset` must be the very first rule, declared once.
  const body = parts
    .map((p) => readFileSync(p, 'utf8').replace(/@charset\s+["'][^"']*["'];\s*/gi, ''))
    .join('\n');
  const combined =
    '@charset "UTF-8";\n' +
    '/* ng2-multi-modal — combined stylesheet (structural + default light/dark) */\n' +
    body;
  writeFileSync(join(stylesDir, 'ng2-multi-modal.css'), combined);
  pkg.exports['./styles.css'] = { default: './styles/ng2-multi-modal.css' };
}

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log('[patch-dist-exports] exports:', Object.keys(pkg.exports).join(', '));
