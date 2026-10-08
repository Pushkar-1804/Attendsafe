import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { DayOfWeek } from '../types';

const DAYS_NAME: DayOfWeek[] = [
  'Sunday' as DayOfWeek,
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function AttendancePage() {
  const {
    subjects,
    timetable,
    attendanceRecords,
    markAttendance,
    deleteAttendanceRecord,
  } = useAttendance();

  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const selectedDateObj = new Date(selectedDate + 'T12:00:00');
  const dayOfWeekIndex = selectedDateObj.getDay();
  const dayOfWeekName = DAYS_NAME[dayOfWeekIndex];

  const scheduledSlots = timetable
    .filter((slot) => slot.day === dayOfWeekName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const recordsOnDate = attendanceRecords.filter((r) => r.date === selectedDate);

  const [manualSubjectId, setManualSubjectId] = useState(subjects[0]?.id || '');
  const [manualStatus, setManualStatus] = useState<'present' | 'absent' | 'cancelled'>('present');

  const handleManualMark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSubjectId) return;
    markAttendance(manualSubjectId, manualStatus, selectedDate);
  };

  return (
    <div className="space-y-5 max-w-4xl text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Attendance
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
            Log lectures as Present, Absent, or Cancelled.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-gray-600 dark:text-gray-400 font-medium">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
          />
        </div>
      </div>

      {/* Scheduled Classes for Selected Date */}
      <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden">
        <div className="p-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 flex items-center justify-between">
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            Scheduled for {dayOfWeekName} ({selectedDate})
          </span>
          <span className="text-gray-500">
            {scheduledSlots.length} lecture{scheduledSlots.length === 1 ? '' : 's'}
          </span>
        </div>

        {scheduledSlots.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No scheduled classes found in timetable for {dayOfWeekName}.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {scheduledSlots.map((slot) => {
              const sub = subjects.find((s) => s.id === slot.subjectId);
              const record = recordsOnDate.find((r) => r.subjectId === slot.subjectId);

              return (
                <div
                  key={slot.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {slot.startTime} {slot.endTime ? `– ${slot.endTime}` : ''}
                      </span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {slot.subjectName || sub?.name}
                      </span>
                      {slot.room && <span className="text-gray-400">&bull; {slot.room}</span>}
                    </div>
                    {slot.faculty && (
                      <p className="text-gray-500 text-[11px] mt-0.5">{slot.faculty}</p>
                    )}
                  </div>

                  {record ? (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Status:</span>
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
                      <button
                        onClick={() => deleteAttendanceRecord(record.id)}
                        className="text-gray-400 hover:text-red-600 text-[11px] underline ml-2"
                      >
                        Undo
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => markAttendance(slot.subjectId, 'present', selectedDate)}
                        className="px-2.5 py-1 rounded border border-green-600 bg-white text-green-700 hover:bg-green-50 dark:bg-transparent dark:hover:bg-green-950/40 font-medium"
                      >
                        Present
                      </button>
                      <button
                        onClick={() => markAttendance(slot.subjectId, 'absent', selectedDate)}
                        className="px-2.5 py-1 rounded border border-red-600 bg-white text-red-700 hover:bg-red-50 dark:bg-transparent dark:hover:bg-red-950/40 font-medium"
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => markAttendance(slot.subjectId, 'cancelled', selectedDate)}
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
      </div>

      {/* Manual Class Log */}
      {subjects.length > 0 && (
        <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-md p-3.5 space-y-2">
          <span className="font-semibold text-gray-800 dark:text-gray-200 block text-xs">
            Log Extra / Unscheduled Lecture for {selectedDate}
          </span>
          <form onSubmit={handleManualMark} className="flex flex-wrap items-center gap-2">
            <select
              value={manualSubjectId}
              onChange={(e) => setManualSubjectId(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `(${s.code})` : ''}
                </option>
              ))}
            </select>

            <select
              value={manualStatus}
              onChange={(e) =>
                setManualStatus(e.target.value as 'present' | 'absent' | 'cancelled')
              }
              className="px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs"
            >
              <option value="present">Present (+1)</option>
              <option value="absent">Absent (0)</option>
              <option value="cancelled">Cancelled (neutral)</option>
            </select>

            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-medium"
            >
              Save Record
            </button>
          </form>
        </div>
      )}

      {/* History Log Table */}
      <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden">
        <div className="p-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 font-semibold text-gray-800 dark:text-gray-200">
          Attendance Log History
        </div>

        {attendanceRecords.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No attendance entries logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-[11px] text-gray-500 uppercase font-semibold">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                {attendanceRecords.slice(0, 15).map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50">
                    <td className="py-2.5 px-4 font-mono text-[11px]">{rec.date}</td>
                    <td className="py-2.5 px-4 font-medium">{rec.subjectName || 'Subject'}</td>
                    <td className="py-2.5 px-3 text-gray-500">{rec.time || '—'}</td>
                    <td className="py-2.5 px-3 text-center capitalize">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          rec.status === 'present'
                            ? 'bg-green-50 text-green-700'
                            : rec.status === 'absent'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => deleteAttendanceRecord(rec.id)}
                        className="text-red-600 hover:text-red-800 text-[11px] underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
