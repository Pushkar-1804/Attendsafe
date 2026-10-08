import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  CheckSquare,
  BarChart2,
  Calculator,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ currentTab, setCurrentTab, isOpen, onClose }: SidebarProps) {
  const { userProfile, currentUser, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'timetable', label: 'Timetable', icon: CalendarDays },
    { id: 'attendance', label: 'Attendance', icon: CheckSquare },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-56 bg-white dark:bg-[#18181b] border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-150 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h1 className="text-sm font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Attendance Tracker
            </h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              College Bunk Planner
            </p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-left transition-colors ${
                  active
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-850 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile & Actions */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-800 space-y-1">
          <button
            onClick={() => {
              setCurrentTab('settings');
              onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-left transition-colors ${
              currentTab === 'settings'
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-850 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0 text-gray-400" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-left text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0 text-gray-400" />
            <span>Logout</span>
          </button>

          {/* User mini status */}
          <div className="pt-2 px-3 pb-1 border-t border-gray-100 dark:border-gray-800/80 text-[11px] text-gray-500 dark:text-gray-400">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[110px]">
                {userProfile?.displayName || 'Student'}
              </span>
              {currentUser?.isAnonymous && (
                <span className="px-1 py-0.2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-[10px] text-gray-600 dark:text-gray-300">
                  Guest
                </span>
              )}
            </div>
            {userProfile?.college && (
              <p className="truncate text-gray-400 text-[10px] mt-0.5">
                {userProfile.college}
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
