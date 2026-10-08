import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface LandingProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onGuestLogin: () => void;
}

export function LandingPage({ onGetStarted, onSignIn, onGuestLogin }: LandingProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#121214] flex flex-col justify-between text-gray-900 dark:text-gray-100 font-sans text-xs">
      {/* Top Header */}
      <header className="h-12 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#18181b] px-4 md:px-8 flex items-center justify-between">
        <span className="font-bold text-sm tracking-tight">
          Attendance Tracker
        </span>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
          </button>
          <button
            onClick={onGuestLogin}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Guest Mode
          </button>
          <button
            onClick={onSignIn}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Login
          </button>
          <button
            onClick={onGetStarted}
            className="px-2.5 py-1 rounded bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-medium"
          >
            Create Account
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-xl mx-auto px-4 py-16 flex flex-col justify-center text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Attendance Tracker
        </h1>

        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
          Keep track of your college attendance and know exactly how many classes you can safely miss.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={onSignIn}
            className="px-4 py-2 rounded bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-medium text-xs"
          >
            Login
          </button>
          <button
            onClick={onGetStarted}
            className="px-4 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 font-medium text-xs"
          >
            Create Account
          </button>
          <button
            onClick={onGuestLogin}
            className="px-3.5 py-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs"
          >
            Continue as Guest
          </button>
        </div>

        {/* Features List */}
        <div className="mt-14 pt-8 border-t border-gray-200 dark:border-gray-800 text-left grid grid-cols-2 gap-4">
          <div className="p-3 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Attendance Tracking
            </h3>
            <p className="text-gray-500 text-[11px] mt-0.5">
              Mark Present, Absent, or Cancelled lectures day by day.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Safe Bunk Calculator
            </h3>
            <p className="text-gray-500 text-[11px] mt-0.5">
              Know how many classes you can skip while staying above 75%.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Weekly Timetable
            </h3>
            <p className="text-gray-500 text-[11px] mt-0.5">
              Add your classes by day, time, room, and professor.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Attendance History
            </h3>
            <p className="text-gray-500 text-[11px] mt-0.5">
              Review simple history logs and subject comparison charts.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-3 text-center text-gray-400 text-[11px]">
        Built for students &bull; No ads &bull; Private data
      </footer>
    </div>
  );
}
