import React from 'react';

interface ProgressBarProps {
  percentage: number;
  minPercentage?: number;
  height?: 'sm' | 'md';
}

export function ProgressBar({
  percentage,
  minPercentage = 75,
  height = 'md',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage));

  let barColor = 'bg-green-600';
  if (clamped < minPercentage) {
    barColor = 'bg-red-600';
  } else if (clamped < minPercentage + 4) {
    barColor = 'bg-amber-600';
  }

  const h = height === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-sm overflow-hidden ${h}`}>
      <div
        className={`${barColor} ${h} rounded-sm`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
