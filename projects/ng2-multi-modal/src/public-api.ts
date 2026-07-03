/*
 * Public API surface of ng2-multi-modal (v2).
 */

// Core
export * from './lib/ng2-multi-modal.service';
export * from './lib/ng2-multi-modal.component';
export * from './lib/modal-ref';

// Configuration & DI
export * from './lib/provider';
export * from './lib/tokens';
export * from './lib/models';
export { NG2_MULTI_MODAL_LOCALES } from './lib/i18n';

// Building blocks
export * from './lib/components/dock/dock.component';
export * from './lib/components/icon/close.icon';
export * from './lib/components/icon/maximize.icon';
export * from './lib/components/icon/minimize.icon';
export * from './lib/components/icon/maximized.icon';
export * from './lib/components/icon/loading.icon';
export * from './lib/directive/string-template-outlet.directive';
