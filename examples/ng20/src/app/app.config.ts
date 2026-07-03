import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideNg2MultiModal } from 'ng2-multi-modal';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideNg2MultiModal({ theme: 'auto' }),
  ],
};
