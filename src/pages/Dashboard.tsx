import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
import {
  analyzeAttendance,
  calculateAttendance,
} from '../utils/attendance';
import { ProgressBar } from '../components/ProgressBar';
import { AddSubjectModal } from '../components/AddSubjectModal';
import { EditSubjectModal } from '../components/EditSubjectModal';
import { Subject, DayOfWeek } from '../types';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

const DAYS_MAP: DayOfWeek[] = [
  'Sunday' as DayOfWeek,
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function Dashboard({ onNavigate }: DashboardProps) {
  const { userProfile } = useAuth();
  const { subjects, timetable, attendanceRecords, markAttendance } = useAttendance();

  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const minAttendance = userProfile?.minAttendance || 75;

  // Aggregate totals
  const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
  const totalConducted = subjects.reduce((sum, s) => sum + s.total, 0);
  const overallAnalysis = analyzeAttendance(totalAttended, totalConducted, minAttendance);

  // Today's classes from Timetable
  const currentDayIndex = new Date().getDay();
  const currentDayName = DAYS_MAP[currentDayIndex];
  const isSunday = currentDayIndex === 0;

  const todayClasses = timetable
    .filter((slot) => slot.day === currentDayName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const todayDateStr = new Date().toISOString().split('T')[0];

  const getTodayRecord = (subjectId: string) => {
    return attendanceRecords.find(
      (r) => r.subjectId === subjectId && r.date === todayDateStr
    );
  };

  const getStatusText = (health: 'safe' | 'warning' | 'critical') => {
    if (health === 'safe') {
      return (
        <span className="text-green-700 dark:text-green-400 font-medium">Safe</span>
      );
    }
    if (health === 'warning') {
      return (
        <span className="text-amber-700 dark:text-amber-400 font-medium">Warning</span>
      );
    }
    return (
      <span className="text-red-700 dark:text-red-400 font-medium">Critical</span>
    );
  };

  // If no subjects yet
  if (subjects.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-8 text-xs">
        <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-md p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Welcome, {userProfile?.displayName || 'Student'}
          </h2>
          <p className="mt-1.5 text-gray-600 dark:text-gray-400">
            You haven't added any subjects yet. Add your first subject to start tracking your attendance and calculating safe bunks.
          </p>
          <div className="mt-4">
            <button
              onClick={() => setIsAddSubjectOpen(true)}
              className="px-3 py-1.5 rounded bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-medium"
            >
              + Add First Subject
            </button>
          </div>
        </div>

        <AddSubjectModal
          isOpen={isAddSubjectOpen}
          onClose={() => setIsAddSubjectOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
            Minimum required attendance: {minAttendance}%
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('calculator')}
            className="px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
          >
            What-If Bunk
          </button>
          <button
            onClick={() => setIsAddSubjectOpen(true)}
            className="px-3 py-1.5 rounded bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-medium"
          >
            + Add Subject
          </button>
        </div>
      </div>

      {/* Section 1: Overall Attendance */}
      <section className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-md p-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide text-[11px]">
            Overall Attendance
          </span>
          <span className="text-gray-500">
            {totalAttended} / {totalConducted} classes conducted
          </span>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {overallAnalysis.percentage.toFixed(1)}%
          </span>
          <span className="text-xs">{getStatusText(overallAnalysis.health)}</span>
        </div>

        <ProgressBar
          percentage={overallAnalysis.percentage}
          minPercentage={minAttendance}
          height="md"
        />

        <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80 text-gray-700 dark:text-gray-300 font-medium">
          {totalConducted === 0 ? (
            <span>No classes conducted yet.</span>
          ) : overallAnalysis.health === 'critical' ? (
            <span className="text-red-700 dark:text-red-400">
              You need to attend the next {overallAnalysis.requiredToCatchUp} consecutive classes to reach {minAttendance}%.
            </span>
          ) : overallAnalysis.safeBunks === 0 ? (
            <span className="text-amber-700 dark:text-amber-400">
              You are right on the edge of {minAttendance}%. Missing the next class will drop your attendance below {minAttendance}%.
            </span>
          ) : (
            <span className="text-green-700 dark:text-green-400">
              You can miss {overallAnalysis.safeBunks} more class{overallAnalysis.safeBunks === 1 ? '' : 'es'} without falling below {minAttendance}%.
            </span>
          )}
        </div>
      </section>

      {/* Section 2: Today's Classes */}
      <section className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-md p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
            Today's Classes ({currentDayName})
          </h2>
          <button
            onClick={() => onNavigate('timetable')}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 underline"
          >
            Manage Timetable
          </button>
        </div>

        {isSunday ? (
          <p className="text-gray-500 py-1">No classes scheduled on Sunday.</p>
        ) : todayClasses.length === 0 ? (
          <div className="text-gray-500 py-2 flex items-center justify-between">
            <span>No classes scheduled in timetable for {currentDayName}.</span>
            <button
              onClick={() => onNavigate('timetable')}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              + Add {currentDayName} Class
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {todayClasses.map((slot) => {
              const sub = subjects.find((s) => s.id === slot.subjectId);
              const record = getTodayRecord(slot.subjectId);

              return (
                <div
                  key={slot.id}
                  className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {slot.startTime}
                      </span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {slot.subjectName || sub?.name}
                      </span>
                      {slot.room && (
                        <span className="text-gray-400">&bull; {slot.room}</span>
                      )}
                    </div>
                    {slot.faculty && (
                      <p className="text-gray-500 text-[11px]">{slot.faculty}</p>
                    )}
                  </div>

                  {record ? (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Marked:</span>
                      <span
                        className={`font-semibold capitalize px-2 py-0.5 rounded text-[11px] ${
                          record.status === 'present'
                            ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:border-green-800'
                            : record.status === 'absent'
                            ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:border-red-800'
                            : 'bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                        }`}
                      >
                        {record.status}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => markAttendance(slot.subjectId, 'present')}
                        className="px-2.5 py-1 rounded border border-green-600 bg-white text-green-700 hover:bg-green-50 dark:bg-transparent dark:hover:bg-green-950/40 font-medium"
                      >
                        Present
                      </button>
                      <button
                        onClick={() => markAttendance(slot.subjectId, 'absent')}
                        className="px-2.5 py-1 rounded border border-red-600 bg-white text-red-700 hover:bg-red-50 dark:bg-transparent dark:hover:bg-red-950/40 font-medium"
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => markAttendance(slot.subjectId, 'cancelled')}
                        title="Cancelled class does not affect attendance"
                        className="px-2.5 py-1 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:bg-transparent dark:border-gray-700 dark:text-gray-300 font-medium"
                      >
                        Cancelled
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 3: Subjects Table */}
      <section className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
            Subjects
          </h2>
          <button
            onClick={() => onNavigate('subjects')}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 underline"
          >
            All Subjects
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-850 border-b border-gray-200 dark:border-gray-800 text-[11px] text-gray-500 uppercase font-semibold">
                <th className="py-2.5 px-4">Subject</th>
                <th className="py-2.5 px-3 text-center">Attended</th>
                <th className="py-2.5 px-3 text-center">Total</th>
                <th className="py-2.5 px-3">Attendance</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Bunk Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
              {subjects.map((sub) => {
                const analysis = analyzeAttendance(
                  sub.attended,
                  sub.total,
                  sub.minAttendance || minAttendance
                );

                return (
                  <tr
                    key={sub.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                    onClick={() => setEditingSubject(sub)}
                  >
                    <td className="py-2.5 px-4">
                      <span className="font-semibold">{sub.name}</span>
                      {sub.code && (
                        <span className="text-gray-400 ml-1.5 font-normal">
                          ({sub.code})
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium">
                      {sub.attended}
                    </td>
                    <td className="py-2.5 px-3 text-center text-gray-500">
                      {sub.total}
                    </td>
                    <td className="py-2.5 px-3 min-w-[110px]">
                      <div className="font-medium mb-1">
                        {analysis.percentage.toFixed(1)}%
                      </div>
                      <ProgressBar
                        percentage={analysis.percentage}
                        minPercentage={sub.minAttendance || minAttendance}
                        height="sm"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {getStatusText(analysis.health)}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {analysis.health === 'critical' ? (
                        <span className="text-red-700 dark:text-red-400 font-medium">
                          Attend next {analysis.requiredToCatchUp}
                        </span>
                      ) : analysis.safeBunks === 0 ? (
                        <span className="text-amber-700 dark:text-amber-400 font-medium">
                          0 safe bunks
                        </span>
                      ) : (
                        <span className="text-green-700 dark:text-green-400 font-medium">
                          Can miss {analysis.safeBunks}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <AddSubjectModal
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
      />

      <EditSubjectModal
        subject={editingSubject}
        isOpen={!!editingSubject}
        onClose={() => setEditingSubject(null)}
      />
    </div>
  );
}
