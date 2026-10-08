import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  onOpenSidebar: () => void;
}

export function Navbar({ onOpenSidebar }: NavbarProps) {
  const { userProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <header className="h-13 bg-white dark:bg-[#18181b] border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="md:hidden p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Toggle navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {todayFormatted}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
          Requirement: <span className="font-semibold text-gray-800 dark:text-gray-200">{userProfile?.minAttendance || 75}%</span>
        </span>

        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium cursor-pointer transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-3.5 h-3.5 text-gray-600" />
              <span>Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Light</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
