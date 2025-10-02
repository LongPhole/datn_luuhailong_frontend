import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Get theme from localStorage or default to 'system'
    try {
      const stored = localStorage.getItem('hrm-theme') as Theme;
      return stored || 'system';
    } catch {
      return 'system';
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    // Store theme preference
    try {
      localStorage.setItem('hrm-theme', theme);
    } catch {
      // Ignore localStorage errors
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  const setThemeValue = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  // Get the actual computed theme (useful when theme is 'system')
  const getComputedTheme = (): 'light' | 'dark' => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return theme;
  };

  return {
    theme,
    setTheme: setThemeValue,
    toggleTheme,
    getComputedTheme,
  };
};