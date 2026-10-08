import React from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import { calculateAttendance } from '../utils/attendance';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function AnalyticsPage() {
  const { subjects, attendanceRecords } = useAttendance();
  const { userProfile } = useAuth();
  const minAttendance = userProfile?.minAttendance || 75;

  if (subjects.length === 0 || attendanceRecords.length === 0) {
    return (
      <div className="space-y-4 max-w-4xl text-xs">
        <div className="pb-3 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">
            Subject attendance comparison and progress over time.
          </p>
        </div>

        <div className="p-8 rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#18181b] text-center text-gray-500">
          No attendance data yet. Start marking your classes to see your analytics.
        </div>
      </div>
    );
  }

  // 1. Bar Chart: Subject Attendance
  const subjectLabels = subjects.map((s) => s.code || s.name);
  const subjectPercentages = subjects.map((s) => calculateAttendance(s.attended, s.total));
  const barBackgrounds = subjectPercentages.map((pct) =>
    pct < minAttendance ? '#dc2626' : pct < minAttendance + 4 ? '#d97706' : '#16a34a'
  );

  const barData = {
    labels: subjectLabels,
    datasets: [
      {
        data: subjectPercentages,
        backgroundColor: barBackgrounds,
        borderRadius: 2,
        maxBarThickness: 32,
      },
    ],
  };

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Attendance: ${context.raw}%`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (v) => `${v}%`,
          stepSize: 25,
          font: { size: 11 },
        },
        grid: { color: 'rgba(150, 150, 150, 0.15)' },
      },
      x: {
        ticks: { font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  // 2. Line Chart: Cumulative Attendance Over Time
  const sortedRecords = [...attendanceRecords].sort((a, b) => a.date.localeCompare(b.date));
  let runningAttended = 0;
  let runningTotal = 0;
  const historyLabels: string[] = [];
  const historyData: number[] = [];

  const dateGroups: { [date: string]: { present: number; absent: number } } = {};
  for (const r of sortedRecords) {
    if (!dateGroups[r.date]) dateGroups[r.date] = { present: 0, absent: 0 };
    if (r.status === 'present') dateGroups[r.date].present += 1;
    if (r.status === 'absent') dateGroups[r.date].absent += 1;
  }

  Object.keys(dateGroups)
    .sort()
    .forEach((date) => {
      const g = dateGroups[date];
      runningAttended += g.present;
      runningTotal += g.present + g.absent;
      if (runningTotal > 0) {
        historyLabels.push(date.slice(5)); // MM-DD
        historyData.push(Math.round((runningAttended / runningTotal) * 1000) / 10);
      }
    });

  const lineChartData = {
    labels: historyLabels,
    datasets: [
      {
        data: historyData,
        borderColor: '#2563eb',
        borderWidth: 2,
        pointRadius: 2.5,
        pointBackgroundColor: '#2563eb',
        fill: false,
      },
    ],
  };

  const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Overall: ${context.raw}%`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (v) => `${v}%`,
          stepSize: 25,
          font: { size: 11 },
        },
        grid: { color: 'rgba(150, 150, 150, 0.15)' },
      },
      x: {
        ticks: { font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="space-y-5 max-w-4xl text-xs">
      {/* Header */}
      <div className="pb-3 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Analytics
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5">
          Basic attendance comparison across subjects and history over time.
        </p>
      </div>

      {/* Chart 1: Subject Attendance */}
      <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            Subject Attendance (%)
          </span>
          <span className="text-gray-500 text-[11px]">
            Target line: {minAttendance}%
          </span>
        </div>

        <div className="h-56 w-full">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>

      {/* Chart 2: History Over Time */}
      <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-md p-4 space-y-3">
        <span className="font-semibold text-gray-800 dark:text-gray-200 block">
          Attendance History Over Time (%)
        </span>

        <div className="h-56 w-full">
          {historyData.length > 0 ? (
            <Line data={lineChartData} options={lineOptions} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Not enough daily logs to plot history line.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
