export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'rj-theme';
export const EXPERIENCE_STORAGE_KEY = 'rj-experience';

/**
 * Runs inline in <head> before first paint, so the correct theme is applied before any
 * pixels are drawn (no flash of the wrong theme, no layout shift). Kept tiny and
 * dependency-free; failures fall back to the CSS prefers-color-scheme path.
 */
export const themeInitScript = `(function(){try{var d=document.documentElement,s=localStorage.getItem('${THEME_STORAGE_KEY}'),m=window.matchMedia('(prefers-color-scheme: dark)').matches,t=s==='light'||s==='dark'?s:(m?'dark':'light');d.dataset.theme=t;d.style.colorScheme=t;if(localStorage.getItem('${EXPERIENCE_STORAGE_KEY}')==='classic')d.dataset.experience='classic';}catch(e){}})();`;
