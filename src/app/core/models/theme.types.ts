export type TThemeMode = 'system' | 'light' | 'dark';

/** The order the header toggle cycles through. */
export const THEME_MODES: readonly TThemeMode[] = ['system', 'light', 'dark'];

/** localStorage key; the pre-boot script in index.html reads the same key. */
export const THEME_STORAGE_KEY = 'gif-search.theme';
