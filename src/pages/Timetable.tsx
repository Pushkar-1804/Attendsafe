import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { DayOfWeek } from '../types';
import { AddTimetableModal } from '../components/AddTimetableModal';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function TimetablePage() {
  const { timetable, subjects, deleteTimetableSlot } = useAttendance();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const slotsForDay = timetable
    .filter((slot) => slot.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-4 max-w-4xl text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Weekly Timetable
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
            Configure your regular class schedule for fast daily attendance logging.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          disabled={subjects.length === 0}
          className="px-3 py-1.5 rounded bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-medium disabled:opacity-50"
        >
          + Add Timetable Slot
        </button>
      </div>

      {subjects.length === 0 && (
        <div className="p-3 rounded border border-gray-200 bg-gray-50 dark:bg-gray-850 dark:border-gray-800 text-gray-600 dark:text-gray-400">
          Add at least one subject first before scheduling timetable classes.
        </div>
      )}

      {/* Days Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-1 overflow-x-auto">
        {DAYS.map((day) => {
          const count = timetable.filter((s) => s.day === day).length;
          const active = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {day} {count > 0 && <span className="text-gray-400 font-normal">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Day Schedule Table */}
      <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden">
        <div className="p-3.5 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-850">
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {selectedDay} Schedule
          </span>
          <span className="text-gray-500">
            {slotsForDay.length} class{slotsForDay.length === 1 ? '' : 'es'}
          </span>
        </div>

        {slotsForDay.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No classes scheduled for {selectedDay}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-[11px] text-gray-500 uppercase font-semibold">
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-3">Room</th>
                  <th className="py-2.5 px-3">Faculty</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                {slotsForDay.map((slot) => {
                  const sub = subjects.find((s) => s.id === slot.subjectId);

                  return (
                    <tr key={slot.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50">
                      <td className="py-2.5 px-4 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {slot.startTime} {slot.endTime ? `– ${slot.endTime}` : ''}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-medium">{slot.subjectName || sub?.name}</span>
                        {sub?.code && <span className="text-gray-400 ml-1">({sub.code})</span>}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500">
                        {slot.room || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500">
                        {slot.faculty || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => deleteTimetableSlot(slot.id)}
                          className="text-red-600 hover:text-red-800 text-[11px] underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddTimetableModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        initialDay={selectedDay}
      />
    </div>
  );
}
