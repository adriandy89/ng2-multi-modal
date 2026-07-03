# Changelog

All notable changes to `ng2-multi-modal` are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## 2.0.0

### Breaking changes
- **Angular support is now 20, 21 and 22** (dropped 19). `peerDependencies` widened to
  `^20.0.0 || ^21.0.0 || ^22.0.0`. The library is built against Angular 20 so a single
  package links on all three majors.
- **New service API.** `Ng2MultiModalService.open(content, options)` returns a typed
  `ModalRef` and replaces the signal-typed `create(config)` (kept as a deprecated wrapper).
  `ModalOptions` fields are now **plain values**, not signals.
- **`@angular/animations` removed.** Open/close/minimize/dock animations are pure CSS; you
  no longer need `provideAnimations()`.
- Theme file renamed `materia-design.css` → **`material-design.css`**.

### Added
- **`provideNg2MultiModal()`** for global defaults + i18n (`NG2_MULTI_MODAL_CONFIG`).
- **`ModalRef`** with `afterClosed()`, `close(result)`, `maximize/minimize/restore/focus/bringToFront`.
- **Component as content** via `open(MyComponent, { data })` with **`NG2_MODAL_DATA`** injection.
- **Accessibility**: `role="dialog"`, `aria-modal`, `aria-labelledby`/`aria-label`, real
  `<button>` controls with localized labels, Escape-to-close, focus trap + focus restoration
  (blocking mode), keyboard move/resize.
- **Theming**: `theme: 'auto'` (follows `prefers-color-scheme`), `prefers-reduced-motion`
  support, responsive full-screen under 600px, new **`win11`** and **`glass`** themes, a
  `.ng-modal-theme-light` hook, `@layer ng2-multi-modal`, dedicated dock/backdrop/loading
  variables, and a combined `ng2-multi-modal/styles.css` bundle.
- **Configurable i18n** (`en`/`es` built in, fully overridable).
- Real unit-test suite and a CI matrix that builds a consumer on Angular 20/21/22.

### Changed
- Rewritten to be **SSR-safe** (`DOCUMENT`, `PLATFORM_ID`, `Renderer2`; no direct
  `window`/`document`), **`OnPush`** on every component, and `inject()`-based DI.
- Drag/resize migrated to **Pointer Events** (mouse + touch); global listeners are attached
  only during an active gesture.
- Styles authored in **SCSS**, compiled to CSS; deep style subpaths declared in `exports`.

### Fixed
- `outOfBounds` bounds checks were dead (signal read without invocation).
- `@HostListener('window: resize')` typo (stray space) — resize handling now works.
- `minimizable` / `maximizable` are now honored in the template.
- Minimize animation duration mismatch; maximize white-flash in dark theme; dead CSS
  variables/selectors; scrollbar theming; broken `material-design` import path.

## 1.0.3
- Angular 19 signals/zoneless release.
