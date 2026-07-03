import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  DestroyRef,
  ElementRef,
  Injector,
  OnDestroy,
  PLATFORM_ID,
  Renderer2,
  TemplateRef,
  Type,
  ViewContainerRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CloseIcon } from './components/icon/close.icon';
import { LoadingIcon } from './components/icon/loading.icon';
import { MaximizeIcon } from './components/icon/maximize.icon';
import { MinimizeIcon } from './components/icon/minimize.icon';
import { MaximizeDIcon } from './components/icon/maximized.icon';
import { StringTemplateOutletDirective } from './directive/string-template-outlet.directive';
import { ModalAlign, ModalSize, ModalTheme } from './models';
import { Ng2MultiModalService } from './ng2-multi-modal.service';

/** Which edges are currently active for a resize gesture. */
interface ResizeEdges {
  left?: boolean;
  right?: boolean;
  top?: boolean;
  bottom?: boolean;
}

/**
 * A draggable / resizable / maximizable / minimizable window ("modal").
 *
 * Can be used declaratively (`<ng2-multi-modal>…</ng2-multi-modal>`) or created
 * imperatively through {@link Ng2MultiModalService.open}. Fully signals-based and
 * zoneless-safe; runs with `OnPush` change detection on Angular 20, 21 and 22.
 */
@Component({
  selector: 'ng2-multi-modal',
  templateUrl: 'ng2-multi-modal.component.html',
  imports: [
    CloseIcon,
    LoadingIcon,
    MaximizeIcon,
    MinimizeIcon,
    MaximizeDIcon,
    StringTemplateOutletDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ng2MultiModalComponent implements OnDestroy {
  private readonly modalService = inject(Ng2MultiModalService);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly win = this.doc.defaultView;

  // ── Identity & derived state ──────────────────────────────────────────────
  readonly modalId = signal('window-' + Math.floor(Math.random() * 1_000_000));
  readonly locale = this.modalService.locale;

  // ── Inputs ────────────────────────────────────────────────────────────────
  readonly title = input<string | TemplateRef<unknown>>('');
  readonly icon = input<string | TemplateRef<unknown> | null>(null);
  readonly align = input<ModalAlign>('leftTop');
  readonly bodyStyle = input<Record<string, string | number>>({});
  readonly closeOnNavigation = input(false);
  readonly closable = input(true);
  readonly content = input<TemplateRef<unknown> | string | null>(null);
  readonly minHeight = input(100);
  readonly minWidth = input(175);
  readonly maximizable = input(true);
  readonly minimizable = input(true);
  readonly resizable = input(true);
  readonly outOfBounds = input(false);
  readonly loadingTip = input<string | TemplateRef<unknown> | null>(null);
  readonly blocking = input(false);
  readonly closeOnEscape = input(true);
  readonly closeOnBackdropClick = input(true);
  readonly restoreFocus = input(true);
  readonly ariaLabel = input<string | null>(null);
  readonly ariaDescribedBy = input<string | null>(null);
  readonly panelClass = input<string | string[]>('');
  readonly animate = input(true);
  /** Component class rendered as content (set by the service for `open(Type)`). */
  readonly contentComponent = input<Type<unknown> | null>(null);
  /** Injector used to create {@link contentComponent} (carries `NG2_MODAL_DATA`, `ModalRef`). */
  readonly contentInjector = input<Injector | null>(null);

  // ── Models (two-way) ────────────────────────────────────────────────────────
  readonly height = model(300);
  readonly width = model(320);
  readonly zIndex = model(0);
  readonly offsetY = model(120);
  readonly offsetX = model(120);
  readonly loading = model(false);
  readonly theme = model<ModalTheme>('light');
  readonly draggable = model(true);
  readonly contentScrollable = model(true);
  readonly minimized = model(false);
  readonly maximized = model(false);

  // ── Outputs ─────────────────────────────────────────────────────────────────
  readonly onReady = output<Ng2MultiModalComponent>();
  readonly onClose = output<string>();
  readonly onResize = output<ModalSize>();
  readonly onMaximize = output<ModalSize>();
  readonly onMaximizeRestore = output<ModalSize>();
  readonly onMinimize = output<ModalSize>();
  readonly onMinimizeRestore = output<ModalSize>();
  readonly onSelected = output<string>();
  readonly onMove = output<ModalSize>();

  // ── View queries ──────────────────────────────────────────────────────────
  private readonly windowEl = viewChild<ElementRef<HTMLElement>>('windowEl');
  private readonly titleBarEl = viewChild<ElementRef<HTMLElement>>('titleBar');
  private readonly contentHost = viewChild('contentHost', { read: ViewContainerRef });
  /** ComponentRef of a component rendered as content, if any. */
  contentRef?: ComponentRef<unknown>;

  // ── Internal reactive state ─────────────────────────────────────────────────
  readonly position = signal<Record<string, string | null>>({});
  readonly display = signal<'none' | 'block'>('none');
  readonly cursorStyle = signal('auto');
  private readonly dragging = signal(false);
  private readonly resizing = signal(false);
  private readonly edges = signal<ResizeEdges>({});
  private readonly viewport = signal({ w: this.win?.innerWidth ?? 0, h: this.win?.innerHeight ?? 0 });
  private readonly prefersDark = this.modalService.prefersDark;
  private readonly propertyBeforeMaximize = signal<ModalSize | null>(null);

  private readonly borderWidth = 6;
  private clickedX = 0;
  private clickedY = 0;
  private previouslyFocused: HTMLElement | null = null;
  private dragUnlisteners: Array<() => void> = [];

  // ── Derived signals ─────────────────────────────────────────────────────────
  /** Resolves `'auto'` to the OS preference; otherwise the explicit theme. */
  readonly resolvedTheme = computed<'light' | 'dark'>(() =>
    this.theme() === 'auto' ? (this.prefersDark() ? 'dark' : 'light') : (this.theme() as 'light' | 'dark'),
  );

  readonly windowClasses = computed(() => {
    const extra = this.panelClass();
    const list = Array.isArray(extra) ? extra : extra ? [extra] : [];
    return [
      'ng-modal',
      'ng-modal-theme-' + this.resolvedTheme(),
      this.selected() ? 'selected' : '',
      this.minimized() ? 'minimized' : '',
      this.maximized() ? 'maximized' : '',
      this.animate() ? 'ng-modal-animate' : '',
      ...list,
    ].filter(Boolean);
  });

  readonly windowSize = computed<ModalSize>(() => ({
    offsetX: this.offsetX(),
    offsetY: this.offsetY(),
    align: this.align(),
    width: this.width(),
    height: this.height(),
  }));

  readonly selected = computed(() => this.modalService.selectedWindow() === this.modalId());

  /** Full inline style map for the window element. */
  readonly windowStyle = computed<Record<string, string | null>>(() => ({
    ...this.position(),
    width: this.width() + 'px',
    height: this.height() + 'px',
    'z-index': String(this.zIndex()),
    cursor: this.cursorStyle(),
    display: this.display(),
  }));

  /** Stable DOM id for the title text, used by `aria-labelledby`. */
  readonly titleId = computed(() => 'ng-modal-title-' + this.modalId());
  private readonly titleIsString = computed(
    () => typeof this.title() === 'string' && (this.title() as string).length > 0,
  );
  /** `aria-labelledby` target when the title is textual; otherwise null. */
  readonly titleTextId = computed(() => (this.titleIsString() ? this.titleId() : null));
  /** `aria-label` fallback when there is no textual title. */
  readonly ariaLabelText = computed(() =>
    this.titleIsString() ? null : (this.ariaLabel() ?? 'dialog'),
  );

  private readonly leftEdge = computed(() =>
    this.align() === 'leftTop' || this.align() === 'leftBottom'
      ? this.offsetX()
      : this.viewport().w - this.width() - this.offsetX(),
  );

  private readonly topEdge = computed(() =>
    this.align() === 'leftTop' || this.align() === 'rightTop'
      ? this.offsetY()
      : this.viewport().h - this.height() - this.offsetY(),
  );

  private readonly rightRef = computed(() =>
    this.align() === 'rightTop' || this.align() === 'rightBottom'
      ? this.viewport().w - this.offsetX()
      : this.width() + this.offsetX(),
  );

  private readonly bottomRef = computed(() =>
    this.align() === 'leftBottom' || this.align() === 'rightBottom'
      ? this.viewport().h - this.offsetY()
      : this.height() + this.offsetY(),
  );

  constructor() {
    // Keep the viewport signal in sync and pull the window back on shrink.
    if (this.isBrowser && this.win) {
      const onResize = () => {
        this.viewport.set({ w: this.win!.innerWidth, h: this.win!.innerHeight });
        if (this.maximized()) {
          this.width.set(this.win!.innerWidth);
          this.height.set(this.win!.innerHeight);
          this.applyPosition();
          return;
        }
        if (!this.outOfBounds()) this.clampIntoViewport();
      };
      this.win.addEventListener('resize', onResize);
      this.destroyRef.onDestroy(() => this.win!.removeEventListener('resize', onResize));
    }

    // Render a component-as-content once the host container is available.
    effect(() => {
      const host = this.contentHost();
      const type = this.contentComponent();
      if (host && type && !this.contentRef) {
        this.contentRef = host.createComponent(type, {
          injector: this.contentInjector() ?? undefined,
        });
        this.contentRef.changeDetectorRef.markForCheck();
      }
    });

    // Initial placement / focus / ready, once the first render has happened.
    afterNextRender({
      write: () => {
        if (this.restoreFocus() && this.isBrowser) {
          this.previouslyFocused = this.doc.activeElement as HTMLElement | null;
        }
        if (this.maximized()) {
          this.maximized.set(false);
          void this.maximize();
        }
        this.display.set('block');
        this.applyPosition();
        if (this.blocking()) this.focusWindow();
        this.onReady.emit(this);
      },
    });
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  ngOnDestroy(): void {
    this.stopPointerTracking();
    this.setBodyScroll(true);
    if (this.restoreFocus() && this.previouslyFocused?.isConnected) {
      this.previouslyFocused.focus();
    }
    this.contentRef?.destroy();
  }

  // ── Positioning ─────────────────────────────────────────────────────────────
  private applyPosition(): void {
    const ax = this.align();
    const x = this.offsetX() + 'px';
    const y = this.offsetY() + 'px';
    this.position.set({
      left: ax === 'leftTop' || ax === 'leftBottom' ? x : null,
      right: ax === 'rightTop' || ax === 'rightBottom' ? x : null,
      top: ax === 'leftTop' || ax === 'rightTop' ? y : null,
      bottom: ax === 'leftBottom' || ax === 'rightBottom' ? y : null,
    });
  }

  private setOffsetX(value: number): void {
    this.offsetX.set(value);
    this.applyPosition();
  }

  private setOffsetY(value: number): void {
    this.offsetY.set(value);
    this.applyPosition();
  }

  private clampIntoViewport(): void {
    const { w, h } = this.viewport();
    if (this.offsetX() + this.width() > w) this.setOffsetX(Math.max(w - this.width(), 0));
    if (this.offsetY() + this.height() > h) this.setOffsetY(Math.max(h - this.height(), 0));
    if (this.offsetX() < 0) this.setOffsetX(0);
    if (this.offsetY() < 0) this.setOffsetY(0);
  }

  // ── Pointer: selection, border hover, drag & resize ─────────────────────────
  onWindowPointerDown(event: PointerEvent): void {
    this.bringToFront();
    if (event.button === 2) return;
    const edges = this.edges();
    const onBorder = !!(edges.left || edges.right || edges.top || edges.bottom);
    if (onBorder && this.resizable() && !this.maximized()) {
      event.preventDefault();
      this.resizing.set(true);
      this.preventTextSelection(true);
      this.startPointerTracking();
    }
  }

  onWindowPointerMove(event: PointerEvent): void {
    // Only update hover cursor/edges when idle and resizable.
    if (this.dragging() || this.resizing() || !this.resizable() || this.maximized()) return;
    this.updateResizeEdges(event.clientX, event.clientY);
  }

  onTitlePointerDown(event: PointerEvent): void {
    if (event.button === 2 || !this.draggable() || this.maximized()) return;
    event.preventDefault();
    this.bringToFront();
    this.dragging.set(true);
    this.clickedX = event.clientX - this.leftEdge();
    this.clickedY = event.clientY - this.topEdge();
    this.preventTextSelection(true);
    this.startPointerTracking();
  }

  private startPointerTracking(): void {
    if (!this.isBrowser || this.dragUnlisteners.length) return;
    this.dragUnlisteners.push(
      this.renderer.listen('document', 'pointermove', (e: PointerEvent) => this.onDocumentPointerMove(e)),
      this.renderer.listen('document', 'pointerup', () => this.stopPointerTracking()),
      this.renderer.listen('document', 'pointercancel', () => this.stopPointerTracking()),
    );
  }

  private stopPointerTracking(): void {
    this.dragging.set(false);
    this.resizing.set(false);
    this.preventTextSelection(false);
    for (const off of this.dragUnlisteners) off();
    this.dragUnlisteners = [];
  }

  private onDocumentPointerMove(event: PointerEvent): void {
    if (this.dragging()) {
      this.dragTo(event.clientX, event.clientY);
    } else if (this.resizing()) {
      this.resizeTo(event.clientX, event.clientY);
    }
  }

  private dragTo(clientX: number, clientY: number): void {
    const { w, h } = this.viewport();
    const bounded = !this.outOfBounds();
    const ax = this.align();

    let nextX =
      ax === 'leftTop' || ax === 'leftBottom'
        ? clientX - this.clickedX
        : w - clientX + this.clickedX - this.width();
    let nextY =
      ax === 'leftTop' || ax === 'rightTop'
        ? clientY - this.clickedY
        : h - clientY + this.clickedY - this.height();

    if (bounded) {
      nextX = Math.min(Math.max(nextX, 0), Math.max(w - this.width(), 0));
      nextY = Math.min(Math.max(nextY, 0), Math.max(h - this.height(), 0));
    }
    this.setOffsetX(nextX);
    this.setOffsetY(nextY);
    this.onMove.emit(this.windowSize());
  }

  private updateResizeEdges(x: number, y: number): void {
    const left = this.leftEdge();
    const top = this.topEdge();
    const bw = this.borderWidth;
    const onLeft = Math.abs(left - x) <= bw;
    const onRight = Math.abs(left + this.width() - x) <= bw;
    const withinY = y > top && y < top + this.height();
    const onTop = Math.abs(top - y) <= bw;
    const onBottom = Math.abs(top + this.height() - y) <= bw;
    const withinX = x > left && x < left + this.width();

    let cursor = 'auto';
    let edges: ResizeEdges = {};
    if (onLeft && onTop) { cursor = 'nw-resize'; edges = { left: true, top: true }; }
    else if (onRight && onTop) { cursor = 'ne-resize'; edges = { right: true, top: true }; }
    else if (onLeft && onBottom) { cursor = 'sw-resize'; edges = { left: true, bottom: true }; }
    else if (onRight && onBottom) { cursor = 'se-resize'; edges = { right: true, bottom: true }; }
    else if (onLeft && withinY) { cursor = 'w-resize'; edges = { left: true }; }
    else if (onRight && withinY) { cursor = 'e-resize'; edges = { right: true }; }
    else if (onTop && withinX) { cursor = 'n-resize'; edges = { top: true }; }
    else if (onBottom && withinX) { cursor = 's-resize'; edges = { bottom: true }; }

    this.cursorStyle.set(cursor);
    this.edges.set(edges);
  }

  private resizeTo(clientX: number, clientY: number): void {
    const edges = this.edges();
    const { w, h } = this.viewport();
    const isLeftAligned = this.align().toLowerCase().includes('left');
    const isTopAligned = this.align().toLowerCase().includes('top');

    if (edges.left) {
      if (isLeftAligned) {
        const right = this.rightRef();
        this.setOffsetX(Math.max(clientX, this.outOfBounds() ? -Infinity : 0));
        this.width.set(right - this.leftEdge());
      } else {
        this.width.set(this.rightRef() - clientX);
      }
    }
    if (edges.right) {
      if (isLeftAligned) {
        this.width.update((prev) => prev + clientX - this.rightRef());
      } else {
        this.width.update((prev) => prev + clientX - this.rightRef());
        this.setOffsetX(Math.max(w - clientX, this.outOfBounds() ? -Infinity : 0));
      }
    }
    if (edges.top) {
      if (isTopAligned) {
        const bottom = this.bottomRef();
        this.setOffsetY(Math.max(clientY, this.outOfBounds() ? -Infinity : 0));
        this.height.set(bottom - this.topEdge());
      } else {
        this.height.set(this.bottomRef() - clientY);
      }
    }
    if (edges.bottom) {
      if (isTopAligned) {
        this.height.update((prev) => prev + clientY - this.bottomRef());
      } else {
        this.height.update((prev) => prev + clientY - this.bottomRef());
        this.setOffsetY(Math.max(h - clientY, this.outOfBounds() ? -Infinity : 0));
      }
    }

    if (this.height() < this.minHeight()) this.height.set(this.minHeight());
    if (this.width() < this.minWidth()) this.width.set(this.minWidth());
    if (!this.outOfBounds()) this.clampIntoViewport();
    this.onResize.emit(this.windowSize());
  }

  // ── Keyboard ────────────────────────────────────────────────────────────────
  onKeydown(event: KeyboardEvent): void {
    if (this.blocking() && event.key === 'Tab') {
      this.onTrapKeydown(event);
      return;
    }
    if (event.key === 'Escape' && this.closeOnEscape() && this.closable()) {
      event.stopPropagation();
      this.close();
      return;
    }
    // Arrow-key move/resize while the title bar has focus.
    const target = event.target as HTMLElement | null;
    const onTitle = !!target?.closest('.win-title-bar');
    if (!onTitle || this.maximized()) return;
    const step = event.shiftKey ? 20 : 5;
    const resize = event.altKey && this.resizable();
    let handled = true;
    switch (event.key) {
      case 'ArrowLeft':
        resize ? this.width.update((w) => Math.max(w - step, this.minWidth())) : this.setOffsetX(Math.max(this.offsetX() - step, 0));
        break;
      case 'ArrowRight':
        resize ? this.width.update((w) => w + step) : this.setOffsetX(this.offsetX() + step);
        break;
      case 'ArrowUp':
        resize ? this.height.update((h) => Math.max(h - step, this.minHeight())) : this.setOffsetY(Math.max(this.offsetY() - step, 0));
        break;
      case 'ArrowDown':
        resize ? this.height.update((h) => h + step) : this.setOffsetY(this.offsetY() + step);
        break;
      default:
        handled = false;
    }
    if (handled) {
      event.preventDefault();
      if (!this.outOfBounds()) this.clampIntoViewport();
      this.onResize.emit(this.windowSize());
    }
  }

  onBackdropClick(): void {
    if (this.blocking() && this.closeOnBackdropClick() && this.closable()) this.close();
  }

  /** Focus-trap Tab handling for blocking modals. */
  onTrapKeydown(event: KeyboardEvent): void {
    if (!this.blocking() || event.key !== 'Tab') return;
    const host = this.windowEl()?.nativeElement;
    if (!host) return;
    const focusables = host.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])',
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = this.doc.activeElement as HTMLElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  // ── Public window actions (used by ModalRef / dock / template) ───────────────
  bringToFront(): void {
    this.modalService.bringToFront(this.modalId());
    this.onSelected.emit(this.modalId());
  }

  focusWindow(): void {
    this.windowEl()?.nativeElement.focus();
  }

  close(): void {
    if (!this.closable()) return;
    this.setBodyScroll(true);
    this.display.set('none');
    this.onClose.emit(this.modalId());
  }

  minimize(): void {
    if (this.minimized()) {
      this.restoreWindow();
      return;
    }
    if (!this.minimizable()) return;
    this.setBodyScroll(true);
    this.minimized.set(true);
    this.modalService.addToDock(this);
    this.onMinimize.emit(this.windowSize());
    this.onResize.emit(this.windowSize());
  }

  maximize(): Promise<boolean> {
    if (!this.maximizable()) return Promise.resolve(false);
    if (this.maximized() && this.propertyBeforeMaximize()) {
      // restore
      this.setBodyScroll(true);
      this.maximized.set(false);
      const prev = this.propertyBeforeMaximize()!;
      this.width.set(prev.width);
      this.height.set(prev.height);
      this.setOffsetX(prev.offsetX);
      this.setOffsetY(prev.offsetY);
      this.draggable.set(true);
      this.onResize.emit(this.windowSize());
      this.onMaximizeRestore.emit(this.windowSize());
      return Promise.resolve(true);
    }
    // maximize
    this.propertyBeforeMaximize.set(this.windowSize());
    this.setBodyScroll(false);
    this.maximized.set(true);
    this.draggable.set(false);
    this.setOffsetX(0);
    this.setOffsetY(0);
    this.width.set(this.viewport().w);
    this.height.set(this.viewport().h);
    this.onResize.emit(this.windowSize());
    this.onMaximize.emit(this.windowSize());
    return Promise.resolve(true);
  }

  /** Restore from minimized and/or maximized state back to a normal window. */
  restoreWindow(): void {
    if (this.minimized()) {
      this.minimized.set(false);
      this.display.set('block');
      this.modalService.removeFromDock(this);
      this.onMinimizeRestore.emit(this.windowSize());
      this.onResize.emit(this.windowSize());
      this.bringToFront();
    }
    if (this.maximized()) void this.maximize();
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  /** Loading tip text/template with locale fallback. */
  readonly resolvedLoadingTip = computed<string | TemplateRef<unknown>>(
    () => this.loadingTip() ?? this.locale().loading,
  );

  private setBodyScroll(enabled: boolean): void {
    if (!this.isBrowser || !this.blocking()) return;
    this.renderer.setStyle(this.doc.body, 'overflow', enabled ? '' : 'hidden');
  }

  private preventTextSelection(prevent: boolean): void {
    if (!this.isBrowser) return;
    if (prevent) this.renderer.addClass(this.doc.body, 'ng2-modal-no-select');
    else this.renderer.removeClass(this.doc.body, 'ng2-modal-no-select');
  }
}
