import { AttendanceAnalysis, AttendanceHealth } from '../types';

/**
 * Calculates current attendance percentage rounded to 1 decimal place.
 */
export function calculateAttendance(attended: number, total: number): number {
  if (total <= 0) return 0;
  const safeAttended = Math.max(0, attended);
  const safeTotal = Math.max(safeAttended, total);
  const percent = (safeAttended / safeTotal) * 100;
  return Math.round(percent * 10) / 10;
}

/**
 * Calculates how many consecutive upcoming classes a student can skip
 * without their attendance dropping below the required minimum percentage.
 */
export function calculateSafeBunks(attended: number, total: number, minPercentage = 75): number {
  if (total <= 0 || minPercentage <= 0) return 0;
  const currentPct = (attended / total) * 100;
  if (currentPct < minPercentage) return 0;

  // Formula: attended / (total + B) >= minPercentage / 100
  // B <= (attended * 100 / minPercentage) - total
  const maxAdditionalMisses = (attended * 100) / minPercentage - total;
  return Math.max(0, Math.floor(maxAdditionalMisses));
}

/**
 * Calculates how many consecutive upcoming classes a student must attend
 * (with 0 absences) to bring their attendance up to the required minimum percentage.
 */
export function calculateRequiredClasses(attended: number, total: number, minPercentage = 75): number {
  if (total <= 0) return 0;
  const currentPct = (attended / total) * 100;
  if (currentPct >= minPercentage) return 0;

  if (minPercentage >= 100) {
    // If you already missed any class, you can never mathematically reach 100%
    return attended < total ? 999 : 0;
  }

  // Formula: (attended + N) / (total + N) >= minPercentage / 100
  // N >= (minPercentage * total - 100 * attended) / (100 - minPercentage)
  const required = (minPercentage * total - 100 * attended) / (100 - minPercentage);
  return Math.max(0, Math.ceil(required));
}

/**
 * Calculates projected attendance if student attends X and misses Y future classes.
 */
export function calculateProjectedAttendance(
  currentAttended: number,
  currentTotal: number,
  futureAttended: number,
  futureMissed: number
): { percentage: number; diff: number } {
  const newAttended = Math.max(0, currentAttended + futureAttended);
  const newTotal = Math.max(0, currentTotal + futureAttended + futureMissed);
  const currentPct = calculateAttendance(currentAttended, currentTotal);
  const newPct = calculateAttendance(newAttended, newTotal);
  const diff = Math.round((newPct - currentPct) * 10) / 10;

  return { percentage: newPct, diff };
}

/**
 * Determines health status (Safe, Warning, Critical) based on attendance and bunk margin.
 */
export function getAttendanceHealth(attended: number, total: number, minPercentage = 75): AttendanceHealth {
  if (total <= 0) return 'safe';
  const pct = calculateAttendance(attended, total);
  if (pct < minPercentage) {
    return 'critical';
  }
  const safeBunks = calculateSafeBunks(attended, total, minPercentage);
  if (safeBunks <= 1) {
    return 'warning';
  }
  return 'safe';
}

/**
 * Returns full analysis object for a subject or aggregated totals.
 */
export function analyzeAttendance(attended: number, total: number, minPercentage = 75): AttendanceAnalysis {
  const percentage = calculateAttendance(attended, total);
  const health = getAttendanceHealth(attended, total, minPercentage);
  const safeBunks = calculateSafeBunks(attended, total, minPercentage);
  const requiredToCatchUp = calculateRequiredClasses(attended, total, minPercentage);
  const missed = Math.max(0, total - attended);

  let statusText = '';
  if (total === 0) {
    statusText = 'No classes conducted yet';
  } else if (percentage < minPercentage) {
    statusText = `Attend next ${requiredToCatchUp} class${requiredToCatchUp === 1 ? '' : 'es'} to reach ${minPercentage}%`;
  } else if (safeBunks === 0) {
    statusText = `On the borderline. Cannot miss next class.`;
  } else {
    statusText = `You can miss ${safeBunks} more class${safeBunks === 1 ? '' : 'es'}`;
  }

  return {
    percentage,
    health,
    safeBunks,
    requiredToCatchUp,
    missed,
    statusText,
  };
}
