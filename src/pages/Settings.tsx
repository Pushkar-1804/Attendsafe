import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAttendance } from '../context/AttendanceContext';

export function SettingsPage() {
  const { userProfile, updateProfileData, logout, currentUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useAttendance();

  const [name, setName] = useState(userProfile?.displayName || '');
  const [rollNumber, setRollNumber] = useState(userProfile?.rollNumber || '');
  const [college, setCollege] = useState(userProfile?.college || '');
  const [semester, setSemester] = useState(userProfile?.semester || '');
  const [minAttendance, setMinAttendance] = useState(String(userProfile?.minAttendance || 75));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const minNum = Math.min(100, Math.max(1, parseFloat(minAttendance) || 75));
      await updateProfileData({
        displayName: name.trim() || 'Student',
        rollNumber: rollNumber.trim(),
        college: college.trim(),
        semester: semester.trim(),
        minAttendance: minNum,
      });
      showToast('Settings saved successfully.');
    } catch {
      showToast('Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-xl text-xs">
      {/* Header */}
      <div className="pb-3 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5">
          Student profile, attendance requirement, and appearance.
        </p>
      </div>

      {currentUser?.isAnonymous && (
        <div className="p-3 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-700 dark:text-gray-300">
          <p className="font-semibold">Guest Session</p>
          <p className="text-gray-500 mt-0.5">
            You are browsing as a guest. Logout anytime to sign in or register with email/Google.
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-md p-4">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-gray-500 mb-1">Email</label>
            <input
              type="text"
              readOnly
              disabled
              value={currentUser?.email || (currentUser?.isAnonymous ? 'guest@student.local' : 'N/A')}
              className="w-full px-2.5 py-1.5 rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-500 cursor-not-allowed text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Student Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Roll Number
              </label>
              <input
                type="text"
                placeholder="e.g. 21BCE1048"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                College
              </label>
              <input
                type="text"
                placeholder="e.g. State University"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Semester
              </label>
              <input
                type="text"
                placeholder="e.g. 4th"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
              Minimum Required Attendance (%)
            </label>
            <p className="text-gray-500 text-[11px] mb-2">
              Default is usually 75%. Safe bunk formulas use this threshold.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="50"
                max="100"
                value={minAttendance}
                onChange={(e) => setMinAttendance(e.target.value)}
                className="w-20 px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs font-semibold focus:outline-none focus:border-gray-500"
              />
              {[75, 80, 85].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMinAttendance(String(preset))}
                  className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 text-[11px]"
                >
                  {preset}%
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Theme
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`px-3 py-1.5 rounded border text-xs font-medium ${
                  theme === 'light'
                    ? 'border-gray-900 bg-gray-100 text-gray-900 font-bold dark:border-gray-100 dark:bg-gray-800 dark:text-gray-100'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`px-3 py-1.5 rounded border text-xs font-medium ${
                  theme === 'dark'
                    ? 'border-gray-900 bg-gray-100 text-gray-900 font-bold dark:border-gray-100 dark:bg-gray-800 dark:text-gray-100'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                Dark
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-3.5 py-1.5 rounded bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      <div className="p-4 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-md flex items-center justify-between">
        <div>
          <span className="font-semibold text-gray-800 dark:text-gray-200 block">
            Logout
          </span>
          <span className="text-gray-500">
            Sign out of your account on this browser.
          </span>
        </div>
        <button
          onClick={() => logout()}
          className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-red-600 font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
