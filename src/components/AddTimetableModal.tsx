import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { DayOfWeek } from '../types';

interface AddTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDay?: DayOfWeek;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AddTimetableModal({ isOpen, onClose, initialDay }: AddTimetableModalProps) {
  const { subjects, addTimetableSlot } = useAttendance();

  const [day, setDay] = useState<DayOfWeek>(initialDay || 'Monday');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('10:00 AM');
  const [room, setRoom] = useState('');
  const [faculty, setFaculty] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubjectChange = (id: string) => {
    setSubjectId(id);
    const sub = subjects.find((s) => s.id === id);
    if (sub) {
      if (sub.room && !room) setRoom(sub.room);
      if (sub.faculty && !faculty) setFaculty(sub.faculty);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!subjectId) {
      setError('Please select a subject.');
      return;
    }

    const sub = subjects.find((s) => s.id === subjectId);
    if (!sub) {
      setError('Subject not found.');
      return;
    }

    setSubmitting(true);
    try {
      await addTimetableSlot({
        day,
        subjectId,
        subjectName: sub.name,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        room: room.trim() || sub.room || '',
        faculty: faculty.trim() || sub.faculty || '',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add timetable slot');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white dark:bg-[#18181b] border border-gray-300 dark:border-gray-700 rounded-md max-w-md w-full p-5 relative">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Add Timetable Class
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="my-3 p-2 rounded border border-red-200 bg-red-50 text-red-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 mt-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Day *
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value as DayOfWeek)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject *
              </label>
              <select
                value={subjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time *
              </label>
              <input
                type="text"
                required
                placeholder="09:00 AM"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Time
              </label>
              <input
                type="text"
                placeholder="10:00 AM"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Room
              </label>
              <input
                type="text"
                placeholder="e.g. Room 204"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Faculty
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Vance"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1.5 rounded bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-medium disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Add Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
