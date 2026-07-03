# ng2-multi-modal

A powerful, **signals-based, zoneless** multi-window modal library for Angular.
Windows can be **dragged, resized, maximized, minimized (to a dock)**, stacked with
automatic z-index/focus management, themed, and made fully **accessible**. Create them
**declaratively** in a template or **imperatively** through a service — including rendering
a **component as content** with injected data and an awaitable result.

- ✅ Angular **20, 21 and 22** — single published build
- ✅ 100% signals, `OnPush`, **no `zone.js`** required
- ✅ SSR-safe (no direct `window`/`document` access)
- ✅ Accessible: `role="dialog"`, focus trap, keyboard control, localized labels
- ✅ 7 built-in themes + ~70 CSS custom properties
- ✅ No runtime dependencies beyond `tslib`

![screenshot](https://github.com/adriandy89/ng2-multi-modal/blob/master/public/screenshot.png?raw=true)

## Compatibility

| ng2-multi-modal | Angular            | Node                                   | TypeScript |
| --------------- | ------------------ | -------------------------------------- | ---------- |
| **2.x**         | 20 · 21 · 22       | ^20.19 \|\| ^22.12 \|\| >=24           | ≥ 5.8      |
| 1.x             | 19                 | 18.19+ / 20.11+                        | 5.5–5.7    |

The library is compiled in Angular's *partial* (Ivy) format against the lowest supported
major (20), so a single package links cleanly into apps running 20, 21 or 22. Every release
is verified by CI building a real consumer app on each version.

## Installation

```bash
npm install ng2-multi-modal
```

## Setup

`ng2-multi-modal` is zoneless-first. Register the (optional) global config provider and,
if your app is not already zoneless, enable zoneless change detection:

```ts
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideNg2MultiModal } from 'ng2-multi-modal';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(), // not needed on Angular 22 (zoneless by default)
    provideNg2MultiModal({
      theme: 'auto',        // 'light' | 'dark' | 'auto' (follows prefers-color-scheme)
      language: 'es',       // 'en' | 'es' (or your own via `locale`)
      zIndexBase: 1000,
      closeOnEscape: true,
    }),
  ],
};
```

Import the styles once (global stylesheet). Either the convenience bundle:

```scss
@use 'ng2-multi-modal/styles.css';
```

…or pick the structural sheet + the theme(s) you want:

```scss
@use 'ng2-multi-modal/styles/style.css';
@use 'ng2-multi-modal/styles/theme/default.css';
@use 'ng2-multi-modal/styles/theme/default-dark.css';
/* other themes: macos, material-design, ant-design, win11, glass */
```

## Usage

### Open with the service

```ts
import { Component, inject } from '@angular/core';
import { Ng2MultiModalService } from 'ng2-multi-modal';

@Component({ /* … */ })
export class AppComponent {
  private readonly modal = inject(Ng2MultiModalService);

  openText() {
    this.modal.open('Hello world', { title: 'Greeting', width: 360, height: 200 });
  }

  openTemplate(tpl: TemplateRef<unknown>) {
    this.modal.open(tpl, { title: 'From a template', theme: 'dark' });
  }
}
```

### Open a component as content (with data + result)

```ts
import { ModalRef, NG2_MODAL_DATA } from 'ng2-multi-modal';

@Component({
  template: `<h3>Hi {{ data.name }}</h3>
             <button (click)="ref.close('ok')">OK</button>`,
})
export class MyDialog {
  readonly data = inject<{ name: string }>(NG2_MODAL_DATA);
  readonly ref = inject<ModalRef<string>>(ModalRef);
}

// caller
const ref = this.modal.open<string, { name: string }>(MyDialog, {
  title: 'Confirm',
  data: { name: 'Ada' },
  blocking: true,
});
ref.afterClosed().subscribe(result => console.log(result)); // 'ok'
```

### Declarative usage

```html
<ng2-multi-modal title="My window" [theme]="'auto'" (onClose)="onClosed()">
  <p>Any projected content goes here.</p>
</ng2-multi-modal>
```

## API

### `Ng2MultiModalService`

| Member | Description |
| ------ | ----------- |
| `open<R, D>(content?, options?): ModalRef<R, D>` | Open a window. `content` = `TemplateRef` \| component class \| string. |
| `create(config)` | **@deprecated** v1 compatibility wrapper (returns a `Promise`). |
| `bringToFront(id)` / `select(id)` | Raise / select a window. |
| `addToDock(win)` / `removeFromDock(win)` | Dock management. |
| `getRef(id)` | Get the `ModalRef` of an open window. |
| `closeAll()` | Close every open window. |
| `setLocale(lang)` | Switch language. |
| `language`, `locale`, `dockTheme`, `prefersDark`, `selectedWindow`, `minimizedModals` | Reactive signals. |

### `ModalRef<R, D>`

`afterClosed(): Observable<R>` · `close(result?)` · `maximize()` · `minimize()` ·
`restore()` · `focus()` · `bringToFront()` · `componentInstance` · `contentRef` ·
`data` · `id` · `minimized` / `maximized` signals.

### `ModalOptions` / component inputs

`title`, `icon`, `align` (`leftTop|rightTop|leftBottom|rightBottom`), `width`, `height`,
`minWidth`, `minHeight`, `offsetX`, `offsetY`, `zIndex`, `closable`, `maximizable`,
`minimizable`, `resizable`, `draggable`, `outOfBounds`, `loading`, `loadingTip`,
`theme` (`light|dark|auto`), `contentScrollable`, `bodyStyle`, `closeOnNavigation`,
`minimized`, `maximized`, and the v2 additions: `blocking`, `closeOnEscape`,
`closeOnBackdropClick`, `restoreFocus`, `ariaLabel`, `ariaDescribedBy`, `panelClass`,
`animate`, `data`.

Outputs: `onReady`, `onClose`, `onResize`, `onMaximize`, `onMaximizeRestore`,
`onMinimize`, `onMinimizeRestore`, `onSelected`, `onMove`.

## Theming

Override any CSS custom property globally (`:root` / `.ng-modal-theme-light`) or per dark
theme (`.ng-modal-theme-dark`). Rules ship inside `@layer ng2-multi-modal`, so your app
styles win without specificity hacks.

```css
:root {
  --window-border-radius: 14px;
  --window-title-bar-bg-color: #101828;
  --window-title-bar-color: #fff;
  --focus-ring-color: #22d3ee;
}
```

Common variables (see `styles/theme/_tokens.scss` for the full catalog): `--window-bg-color`,
`--window-body-bg-color`, `--window-body-color`, `--window-border-radius`,
`--window-box-shadow`, `--selected-window-box-shadow`, `--window-back-drop-filter`,
`--window-title-bar-*` (height, color, bg-color, radius, border, text-align, font-*),
`--win-icon-*`, `--close-icon-bg-color-hover`, `--window-body-padding`, `--content-radius`,
`--scrollbar-thumb`, `--back-drop-bg-color`, `--loading-*`, `--dock-*`, `--focus-ring-color`.

Built-in themes: `default`, `default-dark`, `macos`, `material-design`, `ant-design`,
`win11`, `glass`. `theme: 'auto'` follows the OS `prefers-color-scheme`; animations respect
`prefers-reduced-motion`; below 600px windows go full-screen.

## Accessibility

- `role="dialog"`, `aria-modal` (in `blocking` mode), `aria-labelledby`/`aria-label`.
- Window controls are real `<button>`s with localized `aria-label`s.
- **Escape** closes (when `closeOnEscape` + `closable`); a lightweight **focus trap** and
  **focus restoration** run in `blocking` mode.
- Keyboard move/resize: focus the title bar, then arrow keys move (Shift = larger step,
  Alt = resize).

## i18n

Built-in `en` and `es`. Override or add strings via the config provider:

```ts
provideNg2MultiModal({
  language: 'es',
  locale: { es: { close: 'Cerrar ventana' } },
});
```

## Migrating from v1

- `Ng2MultiModalService.create(config)` → **`open(content, options)`** returning a `ModalRef`
  (`create()` still works, deprecated). Options are now **plain values**, not signals.
- `provideAnimations()` is **no longer required** — animations are pure CSS.
- Theme file `materia-design.css` → **`material-design.css`**; new `win11` and `glass` themes.
- New `provideNg2MultiModal()` for global defaults & i18n, plus `NG2_MODAL_DATA` for
  component content.
- Deep style imports are now declared in `exports`; a combined `ng2-multi-modal/styles.css`
  is available.

## Development

```bash
npm install
npm run build:lib     # compile styles + library + patch exports
npm test              # library unit tests (headless Chrome)
npm start             # run the demo app (projects/demo)
```

## License

MIT © Adrian Duardo
