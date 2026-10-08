import React from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useAttendance();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none text-xs">
      {toasts.map((toast) => {
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center justify-between p-2.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#18181b] text-gray-800 dark:text-gray-200"
          >
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
