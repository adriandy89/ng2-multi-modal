# ng2-multi-modal — workspace

Monorepo for **[`ng2-multi-modal`](projects/ng2-multi-modal/README.md)**, a signals-based,
zoneless multi-window modal library for **Angular 20, 21 & 22**.

👉 **Library documentation & API:** [`projects/ng2-multi-modal/README.md`](projects/ng2-multi-modal/README.md)

## Structure

```
projects/
  ng2-multi-modal/   → the publishable library (built with Angular 20 = min supported major)
  demo/              → showcase app (all features, all themes) — `npm start`
examples/
  ng20/ ng21/ ng22/  → isolated apps that install the packed library and build,
                       proving forward-compatibility on each supported Angular major
scripts/
  patch-dist-exports.mjs → adds ./styles/* subpath exports + a combined stylesheet
.github/workflows/
  ci.yml             → build + test the library, then build a consumer on Angular 20/21/22
  release.yml        → npm publish (with provenance) on a v* tag
```

## Why the library is built with Angular 20

Angular's rule: *an app's Angular version must be ≥ the version a library was built with.*
Building the library in Angular's *partial* compilation format against the **lowest**
supported major (20) makes one published artifact link cleanly into apps on 20, 21 **and**
22. The CI matrix builds a real consumer on each major to guard the 3-version span.

## Development

```bash
npm install
npm run build:lib     # sass → css, ng-packagr build, patch dist exports
npm test              # library unit tests (headless Chrome)
npm start             # serve the demo (projects/demo)
npm run build:demo    # production build of the demo
npm run pack:lib      # build + npm pack the library tarball
```

### Verifying multi-version compatibility locally

Each example installs the library as a **packed tarball** (not a `file:` symlink) so it resolves
Angular from its own `node_modules` — exactly like a real consumer:

```bash
npm run pack:examples   # builds the lib, packs it, copies ng2-multi-modal.tgz into each example
cd examples/ng21 && npm install --legacy-peer-deps && npm run build
```

> Note: the Angular **22** CLI requires Node ≥ 24.15 (or 26) and TypeScript 6; use a matching
> Node to build `examples/ng22` locally. CI runs every example on Node 24.

## Publishing

Bump the version in [`projects/ng2-multi-modal/package.json`](projects/ng2-multi-modal/package.json),
push a `vX.Y.Z` tag, and the release workflow publishes to npm. Manual alternative:

```bash
npm run build:lib
cd dist/ng2-multi-modal && npm publish --access public
```

## License

MIT © Adrian Duardo
