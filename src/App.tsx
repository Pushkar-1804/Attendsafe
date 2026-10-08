import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AttendanceProvider } from './context/AttendanceContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/Toast';

import { LandingPage } from './pages/Landing';
import { AuthPage } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Subjects } from './pages/Subjects';
import { AttendancePage } from './pages/Attendance';
import { TimetablePage } from './pages/Timetable';
import { CalculatorPage } from './pages/Calculator';
import { AnalyticsPage } from './pages/Analytics';
import { SettingsPage } from './pages/Settings';

function AppContent() {
  const { currentUser, loading, loginAsGuest } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unauthView, setUnauthView] = useState<'landing' | 'login' | 'signup'>('landing');

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-500">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium">Loading AttendSafe...</p>
      </div>
    );
  }

  // Unauthenticated - Strict Access Control
  if (!currentUser) {
    if (unauthView === 'landing') {
      return (
        <LandingPage
          onGetStarted={() => setUnauthView('signup')}
          onSignIn={() => setUnauthView('login')}
          onGuestLogin={() => loginAsGuest()}
        />
      );
    }
    return <AuthPage initialMode={unauthView === 'signup' ? 'signup' : 'login'} />;
  }

  // Authenticated Dashboard Shell
  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#121214] text-gray-900 dark:text-gray-100 flex">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-56 min-w-0">
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6 max-w-5xl w-full mx-auto">
          {currentTab === 'dashboard' && <Dashboard onNavigate={setCurrentTab} />}
          {currentTab === 'subjects' && <Subjects />}
          {currentTab === 'timetable' && <TimetablePage />}
          {currentTab === 'attendance' && <AttendancePage />}
          {currentTab === 'calculator' && <CalculatorPage />}
          {currentTab === 'analytics' && <AnalyticsPage />}
          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AttendanceProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AttendanceProvider>
    </AuthProvider>
  );
}
