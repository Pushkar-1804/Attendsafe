import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Subject, AttendanceRecord, TimetableSlot, AttendanceStatus } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

export interface ToastInfo {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface AttendanceContextType {
  subjects: Subject[];
  attendanceRecords: AttendanceRecord[];
  timetable: TimetableSlot[];
  loadingData: boolean;
  toasts: ToastInfo[];
  showToast: (message: string, type?: ToastInfo['type']) => void;
  removeToast: (id: string) => void;
  addSubject: (data: Omit<Subject, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  batchImportSubjects: (
    items: Array<Omit<Subject, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ) => Promise<void>;
  updateSubject: (id: string, data: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  markAttendance: (
    subjectId: string,
    status: AttendanceStatus,
    date?: string,
    time?: string,
    note?: string
  ) => Promise<void>;
  deleteAttendanceRecord: (recordId: string) => Promise<void>;
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateTimetableSlot: (id: string, slot: Partial<TimetableSlot>) => Promise<void>;
  deleteTimetableSlot: (id: string) => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

const GUEST_SUBJECTS_KEY = 'attendancesafe_guest_subjects';
const GUEST_RECORDS_KEY = 'attendancesafe_guest_records';
const GUEST_TIMETABLE_KEY = 'attendancesafe_guest_timetable';

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  const showToast = (message: string, type: ToastInfo['type'] = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (!currentUser) {
      setSubjects([]);
      setAttendanceRecords([]);
      setTimetable([]);
      setLoadingData(false);
      return;
    }

    const uid = currentUser.uid;

    // Handle local guest storage
    if (uid.startsWith('guest_local_')) {
      const savedSubs = localStorage.getItem(GUEST_SUBJECTS_KEY);
      const savedRecs = localStorage.getItem(GUEST_RECORDS_KEY);
      const savedTime = localStorage.getItem(GUEST_TIMETABLE_KEY);

      setSubjects(savedSubs ? JSON.parse(savedSubs) : []);
      setAttendanceRecords(savedRecs ? JSON.parse(savedRecs) : []);
      setTimetable(savedTime ? JSON.parse(savedTime) : []);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);

    // Subscriptions for Firestore
    const subjectsPath = `users/${uid}/subjects`;
    const subjectsRef = collection(db, 'users', uid, 'subjects');
    const unsubSubjects = onSnapshot(
      subjectsRef,
      (snapshot) => {
        const list: Subject[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Subject);
        });
        setSubjects(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, subjectsPath);
      }
    );

    const recordsPath = `users/${uid}/attendanceRecords`;
    const recordsRef = collection(db, 'users', uid, 'attendanceRecords');
    const recordsQuery = query(recordsRef, orderBy('createdAt', 'desc'));
    const unsubRecords = onSnapshot(
      recordsQuery,
      (snapshot) => {
        const list: AttendanceRecord[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as AttendanceRecord);
        });
        setAttendanceRecords(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, recordsPath);
      }
    );

    const timetablePath = `users/${uid}/timetable`;
    const timetableRef = collection(db, 'users', uid, 'timetable');
    const unsubTimetable = onSnapshot(
      timetableRef,
      (snapshot) => {
        const list: TimetableSlot[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as TimetableSlot);
        });
        setTimetable(list);
        setLoadingData(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, timetablePath);
        setLoadingData(false);
      }
    );

    return () => {
      unsubSubjects();
      unsubRecords();
      unsubTimetable();
    };
  }, [currentUser]);

  // Subject Actions
  const addSubject = async (
    data: Omit<Subject, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const subjectId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newSubject: Subject = {
      ...data,
      id: subjectId,
      userId: uid,
      attended: Number(data.attended) || 0,
      total: Number(data.total) || 0,
      cancelled: Number(data.cancelled) || 0,
      createdAt: now,
      updatedAt: now,
    };

    if (uid.startsWith('guest_local_')) {
      const nextList = [...subjects, newSubject];
      setSubjects(nextList);
      localStorage.setItem(GUEST_SUBJECTS_KEY, JSON.stringify(nextList));
      showToast('Subject added successfully.');
      return;
    }

    const path = `users/${uid}/subjects/${subjectId}`;
    try {
      await setDoc(doc(db, 'users', uid, 'subjects', subjectId), newSubject);
      showToast('Subject added successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const batchImportSubjects = async (
    items: Array<Omit<Subject, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ) => {
    if (!currentUser || items.length === 0) return;
    const uid = currentUser.uid;
    const now = new Date().toISOString();

    const prepared = items.map((item, index) => {
      // Check if existing subject with similar name exists
      const existing = subjects.find(
        (s) => s.name.toLowerCase().trim() === item.name.toLowerCase().trim()
      );
      const id = existing ? existing.id : `sub_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 5)}`;
      return {
        ...item,
        id,
        userId: uid,
        attended: Number(item.attended) || 0,
        total: Number(item.total) || 0,
        cancelled: Number(item.cancelled) || 0,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      } as Subject;
    });

    if (uid.startsWith('guest_local_')) {
      const merged = [...subjects];
      prepared.forEach((p) => {
        const idx = merged.findIndex((m) => m.id === p.id);
        if (idx >= 0) {
          merged[idx] = p;
        } else {
          merged.push(p);
        }
      });
      setSubjects(merged);
      localStorage.setItem(GUEST_SUBJECTS_KEY, JSON.stringify(merged));
      showToast(`Successfully imported ${items.length} subjects.`);
      return;
    }

    try {
      for (const p of prepared) {
        await setDoc(doc(db, 'users', uid, 'subjects', p.id), p);
      }
      showToast(`Successfully imported ${items.length} subjects.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}/subjects/batch`);
    }
  };

  const updateSubject = async (id: string, data: Partial<Subject>) => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    if (uid.startsWith('guest_local_')) {
      const nextList = subjects.map((s) =>
        s.id === id
          ? {
              ...s,
              ...data,
              attended: typeof data.attended === 'number' ? data.attended : s.attended,
              total: typeof data.total === 'number' ? data.total : s.total,
              cancelled: typeof data.cancelled === 'number' ? data.cancelled : s.cancelled,
              updatedAt: new Date().toISOString(),
            }
          : s
      );
      setSubjects(nextList);
      localStorage.setItem(GUEST_SUBJECTS_KEY, JSON.stringify(nextList));
      showToast('Subject updated.');
      return;
    }

    const path = `users/${uid}/subjects/${id}`;
    try {
      const docRef = doc(db, 'users', uid, 'subjects', id);
      const payload: Partial<Subject> = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      if (typeof payload.attended === 'number') payload.attended = Number(payload.attended);
      if (typeof payload.total === 'number') payload.total = Number(payload.total);
      if (typeof payload.cancelled === 'number') payload.cancelled = Number(payload.cancelled);

      await updateDoc(docRef, payload);
      showToast('Subject updated.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteSubject = async (id: string) => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    if (uid.startsWith('guest_local_')) {
      const nextList = subjects.filter((s) => s.id !== id);
      setSubjects(nextList);
      localStorage.setItem(GUEST_SUBJECTS_KEY, JSON.stringify(nextList));

      const nextTimetable = timetable.filter((s) => s.subjectId !== id);
      setTimetable(nextTimetable);
      localStorage.setItem(GUEST_TIMETABLE_KEY, JSON.stringify(nextTimetable));

      showToast('Subject deleted.');
      return;
    }

    const path = `users/${uid}/subjects/${id}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'subjects', id));
      const relatedSlots = timetable.filter((s) => s.subjectId === id);
      for (const slot of relatedSlots) {
        await deleteDoc(doc(db, 'users', uid, 'timetable', slot.id));
      }
      showToast('Subject deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Attendance Actions
  const markAttendance = async (
    subjectId: string,
    status: AttendanceStatus,
    dateStr?: string,
    timeStr?: string,
    noteStr?: string
  ) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    const recordId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const today = dateStr || now.toISOString().split('T')[0];
    const time = timeStr || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newRecord: AttendanceRecord = {
      id: recordId,
      userId: uid,
      subjectId,
      subjectName: subject.name,
      date: today,
      time,
      status,
      note: noteStr || '',
      createdAt: now.toISOString(),
    };

    let newAttended = subject.attended;
    let newTotal = subject.total;
    let newCancelled = subject.cancelled || 0;

    if (status === 'present') {
      newAttended += 1;
      newTotal += 1;
    } else if (status === 'absent') {
      newTotal += 1;
    } else if (status === 'cancelled') {
      newCancelled += 1;
    }

    if (uid.startsWith('guest_local_')) {
      const nextRecords = [newRecord, ...attendanceRecords];
      setAttendanceRecords(nextRecords);
      localStorage.setItem(GUEST_RECORDS_KEY, JSON.stringify(nextRecords));

      const nextSubjects = subjects.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              attended: newAttended,
              total: newTotal,
              cancelled: newCancelled,
              updatedAt: now.toISOString(),
            }
          : s
      );
      setSubjects(nextSubjects);
      localStorage.setItem(GUEST_SUBJECTS_KEY, JSON.stringify(nextSubjects));

      if (status === 'present') {
        showToast('Attendance marked as Present.');
      } else if (status === 'absent') {
        showToast('Attendance marked as Absent.', 'warning');
      } else {
        showToast('Class marked as Cancelled.', 'info');
      }
      return;
    }

    const recordPath = `users/${uid}/attendanceRecords/${recordId}`;
    const subjectPath = `users/${uid}/subjects/${subjectId}`;

    try {
      await setDoc(doc(db, 'users', uid, 'attendanceRecords', recordId), newRecord);
      await updateDoc(doc(db, 'users', uid, 'subjects', subjectId), {
        attended: newAttended,
        total: newTotal,
        cancelled: newCancelled,
        updatedAt: now.toISOString(),
      });

      if (status === 'present') {
        showToast('Attendance marked as Present.');
      } else if (status === 'absent') {
        showToast('Attendance marked as Absent.', 'warning');
      } else {
        showToast('Class marked as Cancelled.', 'info');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${recordPath} & ${subjectPath}`);
    }
  };

  const deleteAttendanceRecord = async (recordId: string) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const record = attendanceRecords.find((r) => r.id === recordId);
    if (!record) return;

    const subject = subjects.find((s) => s.id === record.subjectId);

    let revAttended = subject ? subject.attended : 0;
    let revTotal = subject ? subject.total : 0;
    let revCancelled = subject ? subject.cancelled || 0 : 0;

    if (subject) {
      if (record.status === 'present') {
        revAttended = Math.max(0, revAttended - 1);
        revTotal = Math.max(0, revTotal - 1);
      } else if (record.status === 'absent') {
        revTotal = Math.max(0, revTotal - 1);
      } else if (record.status === 'cancelled') {
        revCancelled = Math.max(0, revCancelled - 1);
      }
    }

    if (uid.startsWith('guest_local_')) {
      const nextRecords = attendanceRecords.filter((r) => r.id !== recordId);
      setAttendanceRecords(nextRecords);
      localStorage.setItem(GUEST_RECORDS_KEY, JSON.stringify(nextRecords));

      if (subject) {
        const nextSubjects = subjects.map((s) =>
          s.id === subject.id
            ? {
                ...s,
                attended: revAttended,
                total: revTotal,
                cancelled: revCancelled,
                updatedAt: new Date().toISOString(),
              }
            : s
        );
        setSubjects(nextSubjects);
        localStorage.setItem(GUEST_SUBJECTS_KEY, JSON.stringify(nextSubjects));
      }
      showToast('Attendance record removed.', 'info');
      return;
    }

    const path = `users/${uid}/attendanceRecords/${recordId}`;
    try {
      if (subject) {
        await updateDoc(doc(db, 'users', uid, 'subjects', subject.id), {
          attended: revAttended,
          total: revTotal,
          cancelled: revCancelled,
          updatedAt: new Date().toISOString(),
        });
      }

      await deleteDoc(doc(db, 'users', uid, 'attendanceRecords', recordId));
      showToast('Attendance record removed.', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Timetable Actions
  const addTimetableSlot = async (
    slot: Omit<TimetableSlot, 'id' | 'userId' | 'createdAt'>
  ) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const slotId = `slot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newSlot: TimetableSlot = {
      ...slot,
      id: slotId,
      userId: uid,
      createdAt: now,
    };

    if (uid.startsWith('guest_local_')) {
      const nextTimetable = [...timetable, newSlot];
      setTimetable(nextTimetable);
      localStorage.setItem(GUEST_TIMETABLE_KEY, JSON.stringify(nextTimetable));
      showToast('Timetable class slot added.');
      return;
    }

    const path = `users/${uid}/timetable/${slotId}`;
    try {
      await setDoc(doc(db, 'users', uid, 'timetable', slotId), newSlot);
      showToast('Timetable class slot added.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const updateTimetableSlot = async (id: string, slot: Partial<TimetableSlot>) => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    if (uid.startsWith('guest_local_')) {
      const nextTimetable = timetable.map((s) => (s.id === id ? { ...s, ...slot } : s));
      setTimetable(nextTimetable);
      localStorage.setItem(GUEST_TIMETABLE_KEY, JSON.stringify(nextTimetable));
      showToast('Timetable slot updated.');
      return;
    }

    const path = `users/${uid}/timetable/${id}`;
    try {
      await updateDoc(doc(db, 'users', uid, 'timetable', id), slot);
      showToast('Timetable slot updated.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteTimetableSlot = async (id: string) => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    if (uid.startsWith('guest_local_')) {
      const nextTimetable = timetable.filter((s) => s.id !== id);
      setTimetable(nextTimetable);
      localStorage.setItem(GUEST_TIMETABLE_KEY, JSON.stringify(nextTimetable));
      showToast('Class slot removed from timetable.');
      return;
    }

    const path = `users/${uid}/timetable/${id}`;
    try {
      await deleteDoc(doc(db, 'users', uid, 'timetable', id));
      showToast('Class slot removed from timetable.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return (
    <AttendanceContext.Provider
      value={{
        subjects,
        attendanceRecords,
        timetable,
        loadingData,
        toasts,
        showToast,
        removeToast,
        addSubject,
        batchImportSubjects,
        updateSubject,
        deleteSubject,
        markAttendance,
        deleteAttendanceRecord,
        addTimetableSlot,
        updateTimetableSlot,
        deleteTimetableSlot,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
}
