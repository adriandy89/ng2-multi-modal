import { Component, computed, signal } from '@angular/core';
import { Ng2MultiModalComponent } from "../../ng2-multi-modal.component";
import { Ng2MultiModalService } from "../../ng2-multi-modal.service";
import { animate, style, transition, trigger } from "@angular/animations";
import { CommonModule } from "@angular/common";
import { CloseIcon } from "../icon/close.icon";
import { StringTemplateOutletDirective } from "../../directive/string-template-outlet.directive";

@Component({
  selector: 'dock',
  imports: [CommonModule, CloseIcon, StringTemplateOutletDirective],
  template: `
      <div [ngClass]="['ng-modal-dock', 'ng-modal-theme' + themeSuffix()]">
        @for (dock of docks(); track dock) {
          <ng-container>
              <div class="ng-modal-dock-item"
                   [@dockAnimation]
                   (click)="restore(dock)"
                   [title]="dock.title()">
                  <ng-container *stringTemplateOutlet="dock.icon()">
                    @if (dock.icon()) {
                      <img class="icon" draggable="false" [src]="dock.icon()" alt="icon"/>
                    }
                  </ng-container>
                  <ng-container *stringTemplateOutlet="dock.title()">{{ dock.title() }}</ng-container>
                  <close-icon (click)="$event.stopPropagation(); close(dock)"/>
              </div>
          </ng-container>
        }
      </div>
  `,
  animations: [
    trigger('dockAnimation', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateY(10px) scale(0.9)',
          filter: 'blur(2px)'
        }),
        animate('350ms cubic-bezier(0.05, 0.7, 0.1, 1.0)',
          style({
            opacity: 1,
            transform: 'translateY(0) scale(1)',
            filter: 'blur(0)'
          })
        )
      ]),
      transition(':leave', [
        style({
          opacity: 1,
          transform: 'translateY(0) scale(1)',
          filter: 'blur(0)'
        }),
        animate('280ms cubic-bezier(0.3, 0.0, 0.8, 0.15)',
          style({
            opacity: 0,
            transform: 'translateY(10px) scale(0.9)',
            filter: 'blur(2px)'
          })
        )
      ])
    ])
  ],
  standalone: true
})
export class DockComponent {
  constructor(private windowService: Ng2MultiModalService) { }

  readonly docks = signal<Ng2MultiModalComponent[]>([]);

  readonly themeSuffix = computed(() =>
    (this.windowService.dockTheme() === 'dark' ? '-dark' : '')
  );

  restore(win: Ng2MultiModalComponent) {
    this.docks.update(prev => prev.filter(dock => dock !== win));
    win.minimize();
    this.windowService.selectedWindow.set(win.modalId());
    const zIdx = this.windowService.maxZIndex++;
    win.zIndex.set(zIdx);
  }

  close(win: Ng2MultiModalComponent) {
    this.docks.update(prev => prev.filter(dock => dock !== win));
    win.close();
  }
}
