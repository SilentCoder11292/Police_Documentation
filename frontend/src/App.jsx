import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  // Show premium loading spinner when checking for active local storage sessions
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 dark:bg-gov-950 dark:text-white font-sans transition-colors duration-200">
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Bihar Gold spinner element */}
          <div className="h-10 w-10 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin"></div>
          <div className="text-center space-y-1.5">
            <h2 className="text-xs tracking-[0.25em] uppercase font-bold text-gold-500">Bihar Police Portal Node</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">Establishing TLS Verification Gateway...</p>
          </div>
        </div>
      </div>
    );
  }

  // Session-based routing
  return isAuthenticated ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
