import { ComponentRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import type { Ng2MultiModalComponent } from './ng2-multi-modal.component';

/**
 * Handle to an opened modal, returned by {@link Ng2MultiModalService.open} and
 * injectable inside component content. Lets callers drive the window and await
 * its result without reaching into the component internals.
 *
 * @typeParam R type of the value passed to {@link ModalRef.close}.
 * @typeParam D type of the injected {@link NG2_MODAL_DATA} payload.
 */
export class ModalRef<R = unknown, D = unknown> {
  private readonly _afterClosed = new Subject<R | undefined>();
  private _result: R | undefined;

  /** Reference to the created content component, if `open()` received a component class. */
  get contentRef(): ComponentRef<unknown> | undefined {
    return this.componentInstance.contentRef;
  }

  constructor(
    /** Unique id of this window. */
    readonly id: string,
    /** The underlying window component instance. */
    readonly componentInstance: Ng2MultiModalComponent,
    /** The `data` payload passed to `open(content, { data })`. */
    readonly data: D | null = null,
  ) {}

  /** Emits the close result once, then completes. */
  afterClosed(): Observable<R | undefined> {
    return this._afterClosed.asObservable();
  }

  /** Close the window, optionally returning a result to {@link afterClosed}. */
  close(result?: R): void {
    this._result = result;
    this.componentInstance.close();
  }

  /** Toggle maximize/restore. Resolves when the transition is scheduled. */
  maximize(): Promise<boolean> {
    return this.componentInstance.maximize();
  }

  /** Toggle minimize to the dock / restore from it. */
  minimize(): void {
    this.componentInstance.minimize();
  }

  /** Restore the window from either the minimized or maximized state. */
  restore(): void {
    this.componentInstance.restoreWindow();
  }

  /** Move keyboard focus into the window. */
  focus(): void {
    this.componentInstance.focusWindow();
  }

  /** Raise the window above all others and mark it selected. */
  bringToFront(): void {
    this.componentInstance.bringToFront();
  }

  /** Whether the window is currently minimized (reactive signal). */
  get minimized() {
    return this.componentInstance.minimized;
  }

  /** Whether the window is currently maximized (reactive signal). */
  get maximized() {
    return this.componentInstance.maximized;
  }

  /** @internal Resolves {@link afterClosed} with the stored result. Called by the service. */
  _complete(): void {
    this._afterClosed.next(this._result);
    this._afterClosed.complete();
  }
}
