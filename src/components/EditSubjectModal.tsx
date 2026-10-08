import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAttendance } from '../context/AttendanceContext';
import { Subject } from '../types';

interface EditSubjectModalProps {
  subject: Subject | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditSubjectModal({ subject, isOpen, onClose }: EditSubjectModalProps) {
  const { updateSubject, deleteSubject } = useAttendance();

  const [name, setName] = useState(subject?.name || '');
  const [code, setCode] = useState(subject?.code || '');
  const [attended, setAttended] = useState(String(subject?.attended ?? 0));
  const [total, setTotal] = useState(String(subject?.total ?? 0));
  const [room, setRoom] = useState(subject?.room || '');
  const [faculty, setFaculty] = useState(subject?.faculty || '');
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !subject) return null;

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
      await updateSubject(subject.id, {
        name: trimmedName,
        code: code.trim().toUpperCase(),
        attended: attNum,
        total: totNum,
        room: room.trim(),
        faculty: faculty.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await deleteSubject(subject.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subject');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white dark:bg-[#18181b] border border-gray-300 dark:border-gray-700 rounded-md max-w-md w-full p-5 relative">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Edit Subject: {subject.name}
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
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
            />
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <span className="block font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Adjust Attendance Count
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

          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="px-2.5 py-1 rounded bg-red-600 text-white hover:bg-red-700 font-medium text-xs"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 text-gray-500 hover:text-gray-700 text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-red-600 hover:text-red-700 dark:text-red-400 text-xs font-medium"
              >
                Delete Subject
              </button>
            )}

            <div className="flex items-center gap-2">
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
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
