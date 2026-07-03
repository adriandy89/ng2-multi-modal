import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Ng2MultiModalService } from 'ng2-multi-modal';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>ng2-multi-modal — Angular 21 compatibility check</h1>
    <button type="button" (click)="open()">Open a modal</button>
  `,
})
export class App {
  private readonly modal = inject(Ng2MultiModalService);

  open(): void {
    this.modal.open('Hello from Angular 21! 🎉', {
      title: 'Compatibility check',
      width: 360,
      height: 200,
    });
  }
}
