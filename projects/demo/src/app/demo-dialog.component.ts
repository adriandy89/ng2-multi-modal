import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ModalRef, NG2_MODAL_DATA } from 'ng2-multi-modal';

export interface DemoDialogData {
  name: string;
}

/** Example of a component used as modal content, with injected data + ModalRef. */
@Component({
  selector: 'demo-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host { display: block; }
      .actions { margin-top: 16px; display: flex; gap: 8px; }
      button { padding: 6px 14px; border-radius: 6px; border: 1px solid #ccc; cursor: pointer; }
      .primary { background: #2684ff; color: #fff; border-color: #2684ff; }
    `,
  ],
  template: `
    <h3 style="margin-top:0">Hola, {{ data.name }} 👋</h3>
    <p>Este contenido es un <strong>componente dinámico</strong> con datos inyectados
       vía <code>NG2_MODAL_DATA</code> y un <code>ModalRef</code> tipado.</p>
    <div class="actions">
      <button class="primary" (click)="ref.close('confirmed')">Confirmar</button>
      <button (click)="ref.close('cancelled')">Cancelar</button>
    </div>
  `,
})
export class DemoDialogComponent {
  readonly data = inject<DemoDialogData>(NG2_MODAL_DATA);
  readonly ref = inject<ModalRef<string>>(ModalRef);
}
