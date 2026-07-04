import { create } from 'zustand';

export const useThemeStore = create((set, get) => {
  // Check persisted preferences, falling back to system preference
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'dark';
    const persisted = localStorage.getItem('theme');
    if (persisted) return persisted;

    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemPrefersDark ? 'dark' : 'light';
  };

  // Set root node attributes
  const applyTheme = (theme) => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  };

  // Perform initialization immediately on script evaluation
  if (typeof window !== 'undefined') {
    applyTheme(getInitialTheme());
  }

  return {
    theme: getInitialTheme(),
    
    /**
     * Toggle current theme active state.
     */
    toggleTheme: () => {
      const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
      set({ theme: nextTheme });
      applyTheme(nextTheme);
    },
    
    /**
     * Set explicit theme value.
     * @param {string} theme - Theme name ('light' or 'dark')
     */
    setTheme: (theme) => {
      set({ theme });
      applyTheme(theme);
    },
  };
});

export default useThemeStore;
