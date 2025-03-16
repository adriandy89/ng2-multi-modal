import { Component, OnInit, TemplateRef, viewChild, ViewChild } from '@angular/core';
import { Ng2MultiModalComponent } from "../../../projects/ng2-multi-modal/src/lib/ng2-multi-modal.component";
import { Ng2MultiModalService } from "../../../projects/ng2-multi-modal/src/lib/ng2-multi-modal.service";

@Component({
  selector: 'sample1-component',
  template: `
    <div class="body">
      <button (click)="openModal()">open modal</button>
      <ng-template #tpl>
        this is modal x
      </ng-template>
    </div>
  `,
  styles: [`
    .body {
      width: 100vw;
      height: 100vh;
    }
  `],
  standalone: true
})
export class Sample1Component implements OnInit {
  constructor(private _modal: Ng2MultiModalService) {
  }

  @ViewChild('tpl', { static: true }) tpl!: TemplateRef<any>;
  // tpl = viewChild.required('tpl', {
  //   read: TemplateRef,
  // });

  modals: {
    [key: string]: {
      modal: Ng2MultiModalComponent | null,
      visible: boolean,
    };
  } = {}
  count = 3;

  openModal() {
    this._modal.dockTheme = 'dark';
    this._modal.create({
      content: this.tpl,
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
      content: this.tpl,
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
      content: this.tpl,
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
