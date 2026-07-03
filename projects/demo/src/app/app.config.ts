import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNg2MultiModal } from 'ng2-multi-modal';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideNg2MultiModal({
      theme: 'auto',
      language: 'es',
      zIndexBase: 1000,
      closeOnEscape: true,
    }),
  ],
};
