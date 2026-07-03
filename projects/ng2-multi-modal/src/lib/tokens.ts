import { InjectionToken } from '@angular/core';
import { Ng2MultiModalConfig } from './models';

/**
 * Data payload passed via `open(content, { data })`, injectable inside a
 * component used as modal content (mirrors Angular Material's `MAT_DIALOG_DATA`).
 *
 * @example
 * const data = inject<MyData>(NG2_MODAL_DATA);
 */
export const NG2_MODAL_DATA = new InjectionToken<unknown>('NG2_MODAL_DATA');

/**
 * Global configuration & defaults for every modal. Register it through
 * {@link provideNg2MultiModal}. The service reads it with `inject(..., { optional: true })`.
 */
export const NG2_MULTI_MODAL_CONFIG = new InjectionToken<Ng2MultiModalConfig>(
  'NG2_MULTI_MODAL_CONFIG',
);
