import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { Ng2MultiModalConfig } from './models';
import { NG2_MULTI_MODAL_CONFIG } from './tokens';

/**
 * Registers global defaults and i18n for `ng2-multi-modal`. Add it to your
 * application (or a route/feature) providers.
 *
 * @example
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideZonelessChangeDetection(),
 *     provideNg2MultiModal({
 *       theme: 'auto',
 *       language: 'es',
 *       closeOnEscape: true,
 *       zIndexBase: 2000,
 *     }),
 *   ],
 * };
 */
export function provideNg2MultiModal(config: Ng2MultiModalConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: NG2_MULTI_MODAL_CONFIG, useValue: config },
  ]);
}
