import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import {
  calculateAttendance,
  calculateSafeBunks,
  calculateRequiredClasses,
  getAttendanceHealth,
} from '../utils/attendance';

export function CalculatorPage() {
  const { subjects } = useAttendance();
  const { userProfile } = useAuth();
  const minAttendance = userProfile?.minAttendance || 75;

  const [targetId, setTargetId] = useState<string>('overall');
  const [bunkCount, setBunkCount] = useState<number>(1);
  const [attendCount, setAttendCount] = useState<number>(0);

  let baseAttended = 0;
  let baseTotal = 0;
  let targetName = 'Overall Attendance (All Subjects)';

  if (targetId === 'overall') {
    baseAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
    baseTotal = subjects.reduce((sum, s) => sum + s.total, 0);
  } else {
    const found = subjects.find((s) => s.id === targetId);
    if (found) {
      baseAttended = found.attended;
      baseTotal = found.total;
      targetName = found.name;
    }
  }

  const currentPct = calculateAttendance(baseAttended, baseTotal);
  const currentSafeBunks = calculateSafeBunks(baseAttended, baseTotal, minAttendance);
  const currentRequired = calculateRequiredClasses(baseAttended, baseTotal, minAttendance);

  const projectedAttended = baseAttended + attendCount;
  const projectedTotal = baseTotal + attendCount + bunkCount;
  const projectedPct = calculateAttendance(projectedAttended, projectedTotal);
  const projectedDiff = Math.round((projectedPct - currentPct) * 10) / 10;
  const projectedHealth = getAttendanceHealth(projectedAttended, projectedTotal, minAttendance);

  const quickPresets = [1, 2, 3, 5, 8, 10];

  return (
    <div className="space-y-5 max-w-2xl text-xs">
      {/* Header */}
      <div className="pb-3 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          What If I Bunk?
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5">
          Simulate how missing or attending future classes will change your attendance percentage.
        </p>
      </div>

      {subjects.length === 0 ? (
        <div className="p-6 rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#18181b] text-gray-500 text-center">
          Add at least one subject to use the calculator.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Form */}
          <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-md p-4 space-y-4">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Subject
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs"
              >
                <option value="overall">Overall Attendance (All Subjects)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({calculateAttendance(s.attended, s.total)}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-gray-700 dark:text-gray-300">
                  Number of classes to miss (bunk):
                </label>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{bunkCount}</span>
              </div>
              <input
                type="number"
                min="0"
                max="50"
                value={bunkCount}
                onChange={(e) => setBunkCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs"
              />

              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-gray-400">Quick set:</span>
                {quickPresets.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setBunkCount(num)}
                    className={`px-2 py-0.5 rounded border text-[11px] ${
                      bunkCount === num
                        ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 font-semibold'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-gray-700 dark:text-gray-300">
                  Number of classes to attend (recovery):
                </label>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{attendCount}</span>
              </div>
              <input
                type="number"
                min="0"
                max="50"
                value={attendCount}
                onChange={(e) => setAttendCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs"
              />
            </div>
          </div>

          {/* Results Box */}
          <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-md p-4 space-y-3">
            <span className="font-semibold text-gray-900 dark:text-gray-100 block pb-2 border-b border-gray-100 dark:border-gray-800">
              Calculation: {targetName}
            </span>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500 block">Current Attendance</span>
                <span className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  {currentPct.toFixed(1)}%
                </span>
                <span className="block text-gray-400 text-[11px]">
                  {baseAttended} / {baseTotal} classes
                </span>
              </div>

              <div>
                <span className="text-gray-500 block">
                  After missing {bunkCount} class{bunkCount === 1 ? '' : 'es'}
                  {attendCount > 0 ? ` & attending ${attendCount}` : ''}
                </span>
                <span
                  className={`text-xl font-bold ${
                    projectedPct >= minAttendance
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  {projectedPct.toFixed(1)}%
                </span>
                <span className="block text-gray-500 text-[11px]">
                  {projectedDiff > 0 ? `+${projectedDiff}` : projectedDiff}% ({projectedAttended} / {projectedTotal})
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Status: </span>
              {projectedHealth === 'safe' ? (
                <span className="text-green-700 dark:text-green-400 font-bold">
                  Safe (above {minAttendance}%)
                </span>
              ) : projectedHealth === 'warning' ? (
                <span className="text-amber-700 dark:text-amber-400 font-bold">
                  Warning (borderline {minAttendance}%)
                </span>
              ) : (
                <span className="text-red-700 dark:text-red-400 font-bold">
                  Critical (below {minAttendance}%)
                </span>
              )}
            </div>

            {projectedHealth === 'critical' && (
              <p className="text-red-700 dark:text-red-400 text-xs">
                If you take this bunk, you will need to attend{' '}
                <strong>
                  {calculateRequiredClasses(projectedAttended, projectedTotal, minAttendance)} consecutive classes
                </strong>{' '}
                without missing any to restore your attendance to {minAttendance}%.
              </p>
            )}

            {currentSafeBunks > 0 && projectedHealth === 'safe' && (
              <p className="text-gray-500 text-xs">
                Currently, you have a buffer of {currentSafeBunks} safe bunks remaining.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
