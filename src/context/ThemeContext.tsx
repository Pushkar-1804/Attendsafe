import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { userProfile, updateProfileData } = useAuth();

  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('app_theme');
      if (saved === 'dark' || saved === 'light') {
        applyTheme(saved);
        return saved;
      }
    } catch {
      // ignore
    }
    applyTheme('light');
    return 'light';
  });

  // Apply to DOM on change
  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem('app_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Synchronize from userProfile ONLY if no localStorage preference was explicitly set
  useEffect(() => {
    try {
      const saved = localStorage.getItem('app_theme');
      if (!saved && userProfile?.theme && (userProfile.theme === 'dark' || userProfile.theme === 'light')) {
        setThemeState(userProfile.theme);
      }
    } catch {
      // ignore
    }
  }, [userProfile?.userId]);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setThemeState(nextTheme);
    applyTheme(nextTheme);
    try {
      localStorage.setItem('app_theme', nextTheme);
    } catch {
      // ignore
    }
    if (userProfile) {
      updateProfileData({ theme: nextTheme }).catch(() => {});
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    try {
      localStorage.setItem('app_theme', newTheme);
    } catch {
      // ignore
    }
    if (userProfile) {
      updateProfileData({ theme: newTheme }).catch(() => {});
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
