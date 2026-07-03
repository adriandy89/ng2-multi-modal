import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  ModalAlign,
  ModalTheme,
  Ng2MultiModalComponent,
  Ng2MultiModalService,
} from 'ng2-multi-modal';
import { DemoDialogComponent } from './demo-dialog.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Ng2MultiModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly modal = inject(Ng2MultiModalService);
  private readonly doc = inject(DOCUMENT);

  readonly theme = signal<ModalTheme>('auto');
  readonly language = this.modal.language;
  readonly declarativeOpen = signal(false);
  readonly lastResult = signal<string | null>(null);

  readonly aligns: ModalAlign[] = ['leftTop', 'rightTop', 'leftBottom', 'rightBottom'];

  readonly tpl = viewChild.required<TemplateRef<unknown>>('tpl');

  constructor() {
    effect(() => {
      const t = this.theme();
      this.modal.dockTheme.set(t);
      const dark = t === 'dark' || (t === 'auto' && this.modal.prefersDark());
      this.doc.body.classList.toggle('demo-dark', dark);
    });
  }

  openBasic(): void {
    this.modal.open(this.tpl(), {
      title: 'Ventana básica',
      theme: this.theme(),
      width: 380,
      height: 240,
    });
  }

  openAt(align: ModalAlign): void {
    this.modal.open(this.tpl(), {
      title: `Alineación: ${align}`,
      align,
      theme: this.theme(),
      offsetX: 48,
      offsetY: 48,
      width: 320,
      height: 200,
    });
  }

  openBlocking(): void {
    this.modal.open(this.tpl(), {
      title: 'Modal bloqueante (focus trap)',
      blocking: true,
      theme: this.theme(),
      width: 440,
      height: 260,
    });
  }

  openLoading(): void {
    const ref = this.modal.open(this.tpl(), {
      title: 'Con estado de carga',
      loading: true,
      theme: this.theme(),
      width: 380,
      height: 240,
    });
    setTimeout(() => ref.componentInstance.loading.set(false), 1600);
  }

  openComponentContent(): void {
    const ref = this.modal.open<string, { name: string }>(DemoDialogComponent, {
      title: 'Componente como contenido',
      data: { name: 'Adrián' },
      width: 440,
      height: 240,
      theme: this.theme(),
    });
    ref.afterClosed().subscribe((result) => this.lastResult.set(result ?? '(cerrado sin resultado)'));
  }

  openCloseOnNav(): void {
    this.modal.open(this.tpl(), {
      title: 'Se cierra al navegar',
      closeOnNavigation: true,
      theme: this.theme(),
      width: 360,
      height: 200,
    });
  }

  openMany(): void {
    for (let i = 1; i <= 3; i++) {
      this.modal.open(this.tpl(), {
        title: `Ventana ${i}`,
        theme: this.theme(),
        offsetX: 60 + i * 36,
        offsetY: 60 + i * 36,
        width: 320,
        height: 200,
      });
    }
  }

  toggleLanguage(): void {
    this.modal.setLocale(this.language() === 'es' ? 'en' : 'es');
  }

  setTheme(theme: ModalTheme): void {
    this.theme.set(theme);
  }

  closeAll(): void {
    this.modal.closeAll();
  }
}
