import { ModalLanguage, ModalLocale } from './models';

/** Built-in, fully translated locale strings shipped with the library. */
export const NG2_MULTI_MODAL_LOCALES: Record<ModalLanguage, ModalLocale> = {
  en: {
    close: 'Close',
    minimize: 'Minimize',
    maximize: 'Maximize',
    restore: 'Restore',
    windowMode: 'Window mode',
    loading: 'Loading…',
  },
  es: {
    close: 'Cerrar',
    minimize: 'Minimizar',
    maximize: 'Maximizar',
    restore: 'Restaurar',
    windowMode: 'Modo ventana',
    loading: 'Cargando…',
  },
};

/**
 * Merge a set of partial per-language overrides over the built-in locales.
 * Returns a brand-new map so the defaults are never mutated.
 */
export function mergeLocales(
  overrides?: Partial<Record<ModalLanguage, Partial<ModalLocale>>>,
): Record<ModalLanguage, ModalLocale> {
  const languages = Object.keys(NG2_MULTI_MODAL_LOCALES) as ModalLanguage[];
  const merged = {} as Record<ModalLanguage, ModalLocale>;
  for (const lang of languages) {
    merged[lang] = { ...NG2_MULTI_MODAL_LOCALES[lang], ...(overrides?.[lang] ?? {}) };
  }
  return merged;
}
