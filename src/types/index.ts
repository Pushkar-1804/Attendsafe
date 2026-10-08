export interface UserProfile {
  userId: string;
  email?: string;
  displayName: string;
  college?: string;
  semester?: string;
  rollNumber?: string;
  minAttendance: number;
  theme?: 'light' | 'dark';
  createdAt?: string;
  updatedAt?: string;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  code?: string;
  attended: number;
  total: number;
  cancelled?: number;
  minAttendance?: number;
  room?: string;
  faculty?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'cancelled';

export interface AttendanceRecord {
  id: string;
  userId: string;
  subjectId: string;
  subjectName?: string;
  date: string; // YYYY-MM-DD
  time?: string;
  status: AttendanceStatus;
  note?: string;
  createdAt?: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface TimetableSlot {
  id: string;
  userId: string;
  day: DayOfWeek;
  subjectId: string;
  subjectName?: string;
  startTime: string; // e.g. "09:00 AM"
  endTime?: string;   // e.g. "10:00 AM"
  room?: string;
  faculty?: string;
  createdAt?: string;
}

export type AttendanceHealth = 'safe' | 'warning' | 'critical';

export interface AttendanceAnalysis {
  percentage: number;
  health: AttendanceHealth;
  safeBunks: number;
  requiredToCatchUp: number;
  missed: number;
  statusText: string;
}
