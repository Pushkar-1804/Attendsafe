import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  signInAnonymously,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
}

interface AuthContextType {
  currentUser: AppUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    displayName: string,
    college?: string,
    semester?: string
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_STORAGE_KEY = 'attendancesafe_guest_session';
const GUEST_PROFILE_KEY = 'attendancesafe_guest_profile';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch or create user profile document
  const fetchOrCreateProfile = async (
    user: AppUser,
    defaultName = '',
    college = '',
    semester = ''
  ) => {
    // If local guest user
    if (user.uid.startsWith('guest_local_')) {
      const saved = localStorage.getItem(GUEST_PROFILE_KEY);
      if (saved) {
        setUserProfile(JSON.parse(saved));
      } else {
        const guestProf: UserProfile = {
          userId: user.uid,
          email: 'guest@student.local',
          displayName: defaultName || 'Guest Student',
          college: college || 'Sample College',
          semester: semester || '1st Semester',
          rollNumber: 'GUEST-01',
          minAttendance: 75,
          theme: 'light',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(guestProf));
        setUserProfile(guestProf);
      }
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const path = `users/${user.uid}`;
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile(data);
      } else {
        const newProfile: UserProfile = {
          userId: user.uid,
          email: user.email || '',
          displayName:
            defaultName ||
            user.displayName ||
            (user.isAnonymous ? 'Guest Student' : user.email?.split('@')[0]) ||
            'Student',
          college: college || '',
          semester: semester || '',
          rollNumber: '',
          minAttendance: 75,
          theme: 'light',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  };

  useEffect(() => {
    // Check if local guest session exists
    const localGuest = localStorage.getItem(GUEST_STORAGE_KEY);
    if (localGuest && !auth.currentUser) {
      const guestObj: AppUser = JSON.parse(localGuest);
      setCurrentUser(guestObj);
      fetchOrCreateProfile(guestObj, 'Guest Student');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const appUser: AppUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          isAnonymous: user.isAnonymous,
        };
        setCurrentUser(appUser);
        try {
          await fetchOrCreateProfile(appUser);
        } catch (err) {
          console.error('Error fetching profile:', err);
        }
      } else {
        // If not signed in to Firebase and no local guest session
        const currentLocal = localStorage.getItem(GUEST_STORAGE_KEY);
        if (!currentLocal) {
          setCurrentUser(null);
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    localStorage.removeItem(GUEST_PROFILE_KEY);
    const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const appUser: AppUser = {
      uid: res.user.uid,
      email: res.user.email,
      displayName: res.user.displayName,
      isAnonymous: false,
    };
    await fetchOrCreateProfile(appUser);
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    college = '',
    semester = ''
  ) => {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    localStorage.removeItem(GUEST_PROFILE_KEY);
    const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    await updateFirebaseProfile(res.user, { displayName });
    const appUser: AppUser = {
      uid: res.user.uid,
      email: res.user.email,
      displayName,
      isAnonymous: false,
    };
    await fetchOrCreateProfile(appUser, displayName, college, semester);
  };

  const loginWithGoogle = async () => {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    localStorage.removeItem(GUEST_PROFILE_KEY);
    const res = await signInWithPopup(auth, googleProvider);
    const appUser: AppUser = {
      uid: res.user.uid,
      email: res.user.email,
      displayName: res.user.displayName,
      isAnonymous: false,
    };
    await fetchOrCreateProfile(appUser);
  };

  const loginAsGuest = async () => {
    try {
      // First attempt Firebase anonymous auth
      const res = await signInAnonymously(auth);
      const appUser: AppUser = {
        uid: res.user.uid,
        email: null,
        displayName: 'Guest Student',
        isAnonymous: true,
      };
      await fetchOrCreateProfile(appUser, 'Guest Student');
    } catch {
      // If Anonymous auth is restricted or not yet enabled in Firebase Console,
      // fallback smoothly to local guest session so the user can test immediately!
      const localGuestId = `guest_local_${Date.now()}`;
      const guestObj: AppUser = {
        uid: localGuestId,
        email: null,
        displayName: 'Guest Student',
        isAnonymous: true,
      };
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestObj));
      setCurrentUser(guestObj);
      await fetchOrCreateProfile(guestObj, 'Guest Student');
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    localStorage.removeItem(GUEST_PROFILE_KEY);
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setUserProfile(null);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;

    if (currentUser.uid.startsWith('guest_local_')) {
      const updated = {
        ...(userProfile || {}),
        ...data,
        updatedAt: new Date().toISOString(),
      } as UserProfile;
      localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(updated));
      setUserProfile(updated);
      return;
    }

    const path = `users/${currentUser.uid}`;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const updatePayload = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(userDocRef, updatePayload);
      setUserProfile((prev) => (prev ? { ...prev, ...updatePayload } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        loginWithEmail,
        signUpWithEmail,
        loginWithGoogle,
        loginAsGuest,
        resetPassword,
        logout,
        updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
