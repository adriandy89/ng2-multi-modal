import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  selector: 'demo-page-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Página <strong>Inicio</strong>. Abre un modal con <code>closeOnNavigation: true</code> y navega a "Otra" para verlo cerrarse.</p>`,
})
export class PageHomeComponent {}

@Component({
  selector: 'demo-page-other',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Página <strong>Otra</strong>. Si un modal tenía <code>closeOnNavigation</code>, ya se cerró.</p>`,
})
export class PageOtherComponent {}

export const routes: Routes = [
  { path: '', component: PageHomeComponent },
  { path: 'other', component: PageOtherComponent },
];
