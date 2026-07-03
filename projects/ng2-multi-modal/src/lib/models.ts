import { TemplateRef } from '@angular/core';

/** Corner the modal position is anchored to. */
export type ModalAlign = 'leftTop' | 'rightTop' | 'leftBottom' | 'rightBottom';

/** Visual theme of a modal. `'auto'` follows the OS `prefers-color-scheme`. */
export type ModalTheme = 'light' | 'dark' | 'auto';

/** Built-in locales shipped with the library. */
export type ModalLanguage = 'en' | 'es';

/** Geometry snapshot emitted by resize/move/maximize/minimize outputs. */
export interface ModalSize {
  offsetX: number;
  offsetY: number;
  align: ModalAlign;
  width: number;
  height: number;
}

/** Set of UI strings used by a modal (title tooltips + aria-labels). */
export interface ModalLocale {
  close: string;
  minimize: string;
  maximize: string;
  restore: string;
  windowMode: string;
  loading: string;
}

/**
 * Options accepted by {@link Ng2MultiModalService.open}. All fields are plain
 * values (not signals) — a big DX improvement over the v1 signal-typed config.
 *
 * @typeParam D type of the `data` payload injected into content components via {@link NG2_MODAL_DATA}.
 */
export interface ModalOptions<D = unknown> {
  /** Content to render. A `TemplateRef`, a component class or a plain string. */
  content?: TemplateRef<unknown> | string | null;
  /** Arbitrary data injected into a component-content instance via {@link NG2_MODAL_DATA}. */
  data?: D;

  title?: string | TemplateRef<unknown>;
  icon?: string | TemplateRef<unknown> | null;
  align?: ModalAlign;

  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  offsetX?: number;
  offsetY?: number;
  zIndex?: number;

  closable?: boolean;
  maximizable?: boolean;
  minimizable?: boolean;
  resizable?: boolean;
  draggable?: boolean;
  outOfBounds?: boolean;

  loading?: boolean;
  loadingTip?: string | TemplateRef<unknown>;
  theme?: ModalTheme;
  contentScrollable?: boolean;
  bodyStyle?: Record<string, string | number>;

  closeOnNavigation?: boolean;
  minimized?: boolean;
  maximized?: boolean;

  // ── v2 additions ────────────────────────────────────────────────────────
  /** Render a blurred backdrop behind the window and trap focus inside it. */
  blocking?: boolean;
  /** Close when the user presses Escape (defaults to `true`). */
  closeOnEscape?: boolean;
  /** Close when the backdrop is clicked (only meaningful with `blocking`). */
  closeOnBackdropClick?: boolean;
  /** Restore focus to the previously focused element on close (defaults to `true`). */
  restoreFocus?: boolean;
  /** Explicit accessible label when no textual `title` is provided. */
  ariaLabel?: string;
  /** `id` of an element that describes the dialog (maps to `aria-describedby`). */
  ariaDescribedBy?: string;
  /** Extra class(es) added to the window element for scoped styling. */
  panelClass?: string | string[];
  /** Enable open/close/minimize CSS animations (defaults to `true`). */
  animate?: boolean;
}

/**
 * Global defaults + i18n configuration provided through {@link provideNg2MultiModal}.
 * Any {@link ModalOptions} field acts as a fallback for every modal opened.
 */
export interface Ng2MultiModalConfig extends Partial<Omit<ModalOptions, 'content' | 'data'>> {
  /** Active language for the built-in/overridden locale strings. */
  language?: ModalLanguage;
  /** Partial per-language overrides merged over the built-in locales. */
  locale?: Partial<Record<ModalLanguage, Partial<ModalLocale>>>;
  /** Base z-index for the first window (defaults to `1000`). */
  zIndexBase?: number;
}
