import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { analyzeAttendance } from '../utils/attendance';
import { ProgressBar } from '../components/ProgressBar';
import { AddSubjectModal } from '../components/AddSubjectModal';
import { EditSubjectModal } from '../components/EditSubjectModal';
import { Subject } from '../types';

export function Subjects() {
  const { subjects, markAttendance } = useAttendance();
  const { userProfile } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const minAttendance = userProfile?.minAttendance || 75;

  const filtered = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4 max-w-5xl text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Subjects
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
            {subjects.length} course{subjects.length === 1 ? '' : 's'} registered &bull; Minimum requirement: {minAttendance}%
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:border-gray-500"
          />
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3 py-1.5 rounded bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-medium whitespace-nowrap"
          >
            + Add Subject
          </button>
        </div>
      </div>

      {/* Main Subjects Table */}
      {subjects.length === 0 ? (
        <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-md p-8 text-center text-gray-500">
          <p>No subjects added yet.</p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="mt-3 px-3 py-1.5 rounded bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-medium"
          >
            + Add Subject
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-850 border-b border-gray-200 dark:border-gray-800 text-[11px] text-gray-500 uppercase font-semibold">
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-3">Faculty / Room</th>
                  <th className="py-2.5 px-3 text-center">Attended</th>
                  <th className="py-2.5 px-3 text-center">Total</th>
                  <th className="py-2.5 px-3">Attendance</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-4">Bunk Recommendation</th>
                  <th className="py-2.5 px-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                {filtered.map((sub) => {
                  const analysis = analyzeAttendance(
                    sub.attended,
                    sub.total,
                    sub.minAttendance || minAttendance
                  );

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {sub.name}
                        </div>
                        {sub.code && (
                          <span className="text-gray-400 font-mono text-[11px]">
                            {sub.code}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-gray-500">
                        {sub.faculty || '—'}
                        {sub.room && <span className="block text-gray-400">{sub.room}</span>}
                      </td>

                      <td className="py-3 px-3 text-center font-medium">
                        {sub.attended}
                      </td>

                      <td className="py-3 px-3 text-center text-gray-500">
                        {sub.total}
                      </td>

                      <td className="py-3 px-3 min-w-[120px]">
                        <div className="font-semibold mb-1">
                          {analysis.percentage.toFixed(1)}%
                        </div>
                        <ProgressBar
                          percentage={analysis.percentage}
                          minPercentage={sub.minAttendance || minAttendance}
                          height="sm"
                        />
                      </td>

                      <td className="py-3 px-3 text-center">
                        {analysis.health === 'safe' ? (
                          <span className="text-green-700 dark:text-green-400 font-medium">
                            Safe
                          </span>
                        ) : analysis.health === 'warning' ? (
                          <span className="text-amber-700 dark:text-amber-400 font-medium">
                            Warning
                          </span>
                        ) : (
                          <span className="text-red-700 dark:text-red-400 font-medium">
                            Critical
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs">
                        {sub.total === 0 ? (
                          <span className="text-gray-400">0 classes held</span>
                        ) : analysis.health === 'critical' ? (
                          <span className="text-red-700 dark:text-red-400 font-medium">
                            Attend next {analysis.requiredToCatchUp} classes to reach {sub.minAttendance || minAttendance}%
                          </span>
                        ) : analysis.safeBunks === 0 ? (
                          <span className="text-amber-700 dark:text-amber-400 font-medium">
                            0 safe bunks left (on border)
                          </span>
                        ) : (
                          <span className="text-green-700 dark:text-green-400 font-medium">
                            You can miss {analysis.safeBunks} more class{analysis.safeBunks === 1 ? '' : 'es'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => markAttendance(sub.id, 'present')}
                            className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 text-[11px] font-medium"
                            title="Mark 1 Present"
                          >
                            +Present
                          </button>
                          <button
                            onClick={() => markAttendance(sub.id, 'absent')}
                            className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 text-[11px] font-medium"
                            title="Mark 1 Absent"
                          >
                            +Absent
                          </button>
                          <button
                            onClick={() => setEditingSubject(sub)}
                            className="px-2 py-1 rounded text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-[11px] underline ml-1"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddSubjectModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <EditSubjectModal
        subject={editingSubject}
        isOpen={!!editingSubject}
        onClose={() => setEditingSubject(null)}
      />
    </div>
  );
}
