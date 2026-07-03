import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CloseIcon } from '../icon/close.icon';
import { StringTemplateOutletDirective } from '../../directive/string-template-outlet.directive';
import type { Ng2MultiModalComponent } from '../../ng2-multi-modal.component';
import { Ng2MultiModalService } from '../../ng2-multi-modal.service';

/**
 * Taskbar ("dock") listing the currently minimized windows. Rendered once,
 * globally, by {@link Ng2MultiModalService}. Uses pure CSS animations — no
 * dependency on `@angular/animations` — so it stays zoneless-friendly.
 */
@Component({
  selector: 'ng2-multi-modal-dock',
  imports: [CloseIcon, StringTemplateOutletDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ng-modal-dock" [class]="'ng-modal-theme-' + theme()">
      @for (win of docks(); track win.modalId()) {
        <div class="ng-modal-dock-item" (click)="restore(win)" [title]="win.title()">
          <ng-container *stringTemplateOutlet="win.icon()">
            @if (win.icon()) {
              <img class="icon" draggable="false" [src]="win.icon()" alt="" />
            }
          </ng-container>
          <span class="ng-modal-dock-label">
            <ng-container *stringTemplateOutlet="win.title()">{{ win.title() }}</ng-container>
          </span>
          <button
            type="button"
            class="ng-modal-dock-close"
            [attr.aria-label]="service.locale().close"
            [title]="service.locale().close"
            (click)="$event.stopPropagation(); close(win)"
          >
            <close-icon />
          </button>
        </div>
      }
    </div>
  `,
})
export class DockComponent {
  protected readonly service = inject(Ng2MultiModalService);

  readonly docks = this.service.minimizedModals;
  readonly theme = computed(() =>
    this.service.dockTheme() === 'auto'
      ? this.service.prefersDark()
        ? 'dark'
        : 'light'
      : this.service.dockTheme(),
  );

  restore(win: Ng2MultiModalComponent): void {
    win.restoreWindow();
  }

  close(win: Ng2MultiModalComponent): void {
    win.close();
  }
}
