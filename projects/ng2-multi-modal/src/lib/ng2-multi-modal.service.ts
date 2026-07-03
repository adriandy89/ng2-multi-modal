import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ApplicationRef,
  ComponentRef,
  DestroyRef,
  EnvironmentInjector,
  Injectable,
  Injector,
  PLATFORM_ID,
  Renderer2,
  RendererFactory2,
  TemplateRef,
  Type,
  computed,
  createComponent,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { DockComponent } from './components/dock/dock.component';
import { mergeLocales } from './i18n';
import { ModalLanguage, ModalOptions, ModalTheme } from './models';
import { ModalRef } from './modal-ref';
import { Ng2MultiModalComponent } from './ng2-multi-modal.component';
import { NG2_MODAL_DATA, NG2_MULTI_MODAL_CONFIG } from './tokens';

/** Content accepted by {@link Ng2MultiModalService.open}. */
export type ModalContent = TemplateRef<unknown> | Type<unknown> | string;

/** @deprecated Use {@link ModalOptions} with {@link Ng2MultiModalService.open} instead. */
export interface ModalConfig extends ModalOptions {
  content?: TemplateRef<unknown> | string | null;
}

/**
 * Creates and manages `ng2-multi-modal` windows: dynamic creation, z-index /
 * focus stacking, the minimized-window dock, i18n and global theming. Signals-
 * based and zoneless-safe.
 */
@Injectable({ providedIn: 'root' })
export class Ng2MultiModalService {
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly injector = inject(Injector);
  private readonly doc = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly router = inject(Router, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderer: Renderer2 = inject(RendererFactory2).createRenderer(null, null);
  private readonly config = inject(NG2_MULTI_MODAL_CONFIG, { optional: true }) ?? {};

  // ── i18n ────────────────────────────────────────────────────────────────────
  readonly language = signal<ModalLanguage>(this.config.language ?? 'en');
  private readonly locales = mergeLocales(this.config.locale);
  /** Active locale strings (reactive). */
  readonly locale = computed(() => this.locales[this.language()]);

  // ── Theming ──────────────────────────────────────────────────────────────────
  /** Theme applied to the global dock. */
  readonly dockTheme = signal<ModalTheme>(this.config.theme ?? 'light');
  /** Whether the OS prefers a dark color scheme (drives `theme: 'auto'`). */
  readonly prefersDark = signal(false);

  // ── Window state ─────────────────────────────────────────────────────────────
  readonly selectedWindow = signal<string | null>(null);
  readonly minimizedModals = signal<Ng2MultiModalComponent[]>([]);

  private readonly instances: ComponentRef<Ng2MultiModalComponent>[] = [];
  private readonly refs = new Map<string, ModalRef<any, any>>();
  private topZIndex = this.config.zIndexBase ?? 1000;
  private dockRef: ComponentRef<DockComponent> | null = null;
  private wrapper: HTMLElement | null = null;

  constructor() {
    if (this.isBrowser) {
      const win = this.doc.defaultView;
      if (win?.matchMedia) {
        const mql = win.matchMedia('(prefers-color-scheme: dark)');
        this.prefersDark.set(mql.matches);
        const handler = (e: MediaQueryListEvent) => this.prefersDark.set(e.matches);
        mql.addEventListener('change', handler);
        this.destroyRef.onDestroy(() => mql.removeEventListener('change', handler));
      }
    }

    this.router?.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        for (const ref of [...this.instances]) {
          if (ref.instance.closeOnNavigation()) ref.instance.close();
        }
      }
    });
  }

  /** Change the active language for all modals. */
  setLocale(language: ModalLanguage): void {
    this.language.set(language);
  }

  /**
   * Open a modal window.
   *
   * @param content a `TemplateRef`, a component class, or a plain string.
   * @param options per-modal options (merged over global {@link provideNg2MultiModal} defaults).
   * @returns a {@link ModalRef} to drive the window and await its result.
   */
  open<R = unknown, D = unknown>(
    content?: ModalContent | null,
    options: ModalOptions<D> = {},
  ): ModalRef<R, D> {
    const { language, locale, zIndexBase, ...defaults } = this.config;
    const opts: ModalOptions<D> = { ...(defaults as ModalOptions<D>), ...options };

    const componentRef = createComponent(Ng2MultiModalComponent, {
      environmentInjector: this.envInjector,
      elementInjector: this.injector,
    });
    const instance = componentRef.instance;
    const id = instance.modalId();
    const modalRef = new ModalRef<R, D>(id, instance, (opts.data ?? null) as D | null);

    // Resolve the content shape.
    const resolved = content ?? opts.content ?? null;
    if (typeof resolved === 'function') {
      const childInjector = Injector.create({
        parent: this.envInjector,
        providers: [
          { provide: NG2_MODAL_DATA, useValue: opts.data ?? null },
          { provide: ModalRef, useValue: modalRef },
        ],
      });
      componentRef.setInput('contentComponent', resolved as Type<unknown>);
      componentRef.setInput('contentInjector', childInjector);
    } else if (resolved != null) {
      componentRef.setInput('content', resolved);
    }

    // Apply remaining options to matching component inputs/models.
    for (const [key, value] of Object.entries(opts)) {
      if (value === undefined || key === 'data' || key === 'content') continue;
      try {
        componentRef.setInput(key, value);
      } catch {
        /* not a public input — ignore */
      }
    }

    // Clamp initial position into the viewport (unless outOfBounds).
    if (this.isBrowser && !opts.outOfBounds) {
      const win = this.doc.defaultView!;
      const w = instance.width();
      const h = instance.height();
      if (instance.offsetX() + w > win.innerWidth) {
        componentRef.setInput('offsetX', Math.max(win.innerWidth - w - 10, 0));
      }
      if (instance.offsetY() + h > win.innerHeight) {
        componentRef.setInput('offsetY', Math.max(win.innerHeight - h - 10, 0));
      }
    }

    instance.zIndex.set(++this.topZIndex);

    this.instances.push(componentRef);
    this.refs.set(id, modalRef);

    if (this.isBrowser) {
      this.ensureWrapper();
      this.ensureDock();
      this.appRef.attachView(componentRef.hostView);
      this.renderer.appendChild(this.wrapper, componentRef.location.nativeElement);
    }

    this.selectedWindow.set(id);

    instance.onClose.subscribe((closedId: string) => this.handleClose(closedId));
    componentRef.changeDetectorRef.detectChanges();

    return modalRef;
  }

  /**
   * @deprecated Use {@link open} instead. Thin compatibility wrapper for v1 code.
   */
  create(config: ModalConfig): Promise<Ng2MultiModalComponent> {
    const { content, ...options } = config;
    const ref = this.open(content ?? null, options);
    return Promise.resolve(ref.componentInstance);
  }

  /** Raise a window above all others and mark it selected. */
  bringToFront(id: string): void {
    const ref = this.instances.find((r) => r.instance.modalId() === id);
    if (!ref) return;
    ref.instance.zIndex.set(++this.topZIndex);
    this.selectedWindow.set(id);
  }

  /** Mark a window as selected without changing its z-index. */
  select(id: string): void {
    this.selectedWindow.set(id);
  }

  /** Add a window to the minimized dock. */
  addToDock(win: Ng2MultiModalComponent): void {
    this.minimizedModals.update((list) => (list.includes(win) ? list : [...list, win]));
  }

  /** Remove a window from the minimized dock. */
  removeFromDock(win: Ng2MultiModalComponent): void {
    this.minimizedModals.update((list) => list.filter((w) => w !== win));
  }

  /** Look up the {@link ModalRef} for an open window. */
  getRef<R = unknown, D = unknown>(id: string): ModalRef<R, D> | undefined {
    return this.refs.get(id) as ModalRef<R, D> | undefined;
  }

  /** Close every open window. */
  closeAll(): void {
    for (const ref of [...this.instances]) ref.instance.close();
  }

  private handleClose(id: string): void {
    const ref = this.instances.find((r) => r.instance.modalId() === id);
    const modalRef = this.refs.get(id);
    this.minimizedModals.update((list) => list.filter((w) => w.modalId() !== id));
    if (ref) {
      this.appRef.detachView(ref.hostView);
      ref.destroy();
      const index = this.instances.indexOf(ref);
      if (index >= 0) this.instances.splice(index, 1);
    }
    if (this.selectedWindow() === id) this.selectedWindow.set(null);
    this.refs.delete(id);
    modalRef?._complete();
    if (!this.instances.length) {
      this.destroyDock();
      this.destroyWrapper();
    }
  }

  // ── Global host elements ─────────────────────────────────────────────────────
  private ensureWrapper(): void {
    if (this.wrapper) return;
    const wrapper = this.renderer.createElement('div') as HTMLElement;
    this.renderer.setAttribute(wrapper, 'id', 'ng-modal-wrapper');
    this.renderer.appendChild(this.doc.body, wrapper);
    this.wrapper = wrapper;
  }

  private destroyWrapper(): void {
    if (this.wrapper) {
      this.renderer.removeChild(this.doc.body, this.wrapper);
      this.wrapper = null;
    }
  }

  private ensureDock(): void {
    if (this.dockRef) return;
    this.dockRef = createComponent(DockComponent, {
      environmentInjector: this.envInjector,
      elementInjector: this.injector,
    });
    this.appRef.attachView(this.dockRef.hostView);
    this.renderer.appendChild(this.doc.body, this.dockRef.location.nativeElement);
  }

  private destroyDock(): void {
    if (this.dockRef) {
      this.appRef.detachView(this.dockRef.hostView);
      this.dockRef.destroy();
      this.dockRef = null;
    }
  }
}
