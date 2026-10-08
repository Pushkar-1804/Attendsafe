import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddSubjectModal({ isOpen, onClose }: AddSubjectModalProps) {
  const { addSubject } = useAttendance();
  const { userProfile } = useAuth();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [attended, setAttended] = useState('0');
  const [total, setTotal] = useState('0');
  const [room, setRoom] = useState('');
  const [faculty, setFaculty] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Subject name is required.');
      return;
    }

    const attNum = Math.max(0, parseInt(attended, 10) || 0);
    const totNum = Math.max(0, parseInt(total, 10) || 0);

    if (attNum > totNum) {
      setError('Attended classes cannot exceed total conducted classes.');
      return;
    }

    setSubmitting(true);
    try {
      await addSubject({
        name: trimmedName,
        code: code.trim().toUpperCase(),
        attended: attNum,
        total: totNum,
        cancelled: 0,
        minAttendance: userProfile?.minAttendance || 75,
        room: room.trim(),
        faculty: faculty.trim(),
      });
      setName('');
      setCode('');
      setAttended('0');
      setTotal('0');
      setRoom('');
      setFaculty('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subject');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white dark:bg-[#18181b] border border-gray-300 dark:border-gray-700 rounded-md max-w-md w-full p-5 relative">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Add Subject
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
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Data Structures"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Course Code
              </label>
              <input
                type="text"
                placeholder="e.g. CS201"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
              />
            </div>
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
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
              Faculty / Professor
            </label>
            <input
              type="text"
              placeholder="e.g. Prof. Smith"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
            />
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <span className="block font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Current Attendance (if class is already underway)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-500 mb-1">Attended Classes</label>
                <input
                  type="number"
                  min="0"
                  value={attended}
                  onChange={(e) => setAttended(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Total Conducted</label>
                <input
                  type="number"
                  min="0"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
                />
              </div>
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
              {submitting ? 'Saving...' : 'Add Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
