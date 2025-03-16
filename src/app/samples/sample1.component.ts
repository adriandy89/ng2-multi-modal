import { Component, effect, model, OnInit, TemplateRef, viewChild } from '@angular/core';
import { Ng2MultiModalComponent } from "../../../projects/ng2-multi-modal/src/lib/ng2-multi-modal.component";
import { Ng2MultiModalService } from "../../../projects/ng2-multi-modal/src/lib/ng2-multi-modal.service";

@Component({
  selector: 'sample1-component',
  template: `
    <div class="body">
      <button (click)="openModal()">open modal</button>
      <button (click)="toggleTheme()">toggle theme</button>
      <ng-template #tpl>
        this is modal x
      </ng-template>
    </div>
  `,
  styles: [`
    .body {
      width: 100%;
      height: 100%;
    }
  `],
  standalone: true
})
export class Sample1Component implements OnInit {
  readonly theme = model<'light' | 'dark'>('dark');
  // @ViewChild('tpl', { static: true }) tpl!: TemplateRef<any>;
  tpl = viewChild.required('tpl', {
    read: TemplateRef,
  });

  modals: {
    [key: string]: {
      modal: Ng2MultiModalComponent | null,
      visible: boolean,
    };
  } = {};

  constructor(private _modal: Ng2MultiModalService) {
    effect(() => {
      // toggle theme
      console.log(this.theme());
      this._modal.dockTheme.set(this.theme());
    });
  }

  toggleTheme() {
    this.theme.update(prev => (prev === 'light' ? 'dark' : 'light'));
  }

  openModal() {
    this._modal.create({
      content: this.tpl(),
      theme: this.theme
    }).then((modal: Ng2MultiModalComponent) => {
      const key = modal.modalId();
      this.modals[key] = {
        modal,
        visible: true,
      };
      modal.maximized.set(false);
      modal.onClose.subscribe(() => {
        this.modals[key].visible = false;
        this.modals[key].modal = null
      });
    });
  }

  ngOnInit(): void {
    this._modal.create({
      content: this.tpl(),
      theme: this.theme
    }).then((modals: Ng2MultiModalComponent) => {
      this.modals[modals.modalId()] = {
        modal: modals,
        visible: true,
      };

      modals.onClose.subscribe(() => {
        this.modals[modals.modalId()].visible = false;
        this.modals[modals.modalId()].modal = null
      });
    });
    this._modal.create({
      content: this.tpl(),
      theme: this.theme
    }).then((win: Ng2MultiModalComponent) => {
      this.modals[win.modalId()] = {
        modal: win,
        visible: true,
      };

      win.onClose.subscribe(() => {
        this.modals[win.modalId()].visible = false;
        this.modals[win.modalId()].modal = null
      });
    });
  }
}
