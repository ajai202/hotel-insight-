/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from './lib/firebase';
import { ViewState } from './types';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import IncomeManager from './components/finance/IncomeManager';
import ExpenseManager from './components/finance/ExpenseManager';
import PredictionView from './components/prediction/PredictionView';
import ReportGenerator from './components/reports/ReportGenerator';
import { LogIn, Hotel } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f5f5f5] p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-gray-200/50"
        >
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200">
              <Hotel className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Hotel Insight</h1>
            <p className="mt-2 text-sm text-gray-500">Income & Expense Prediction System</p>
          </div>
          
          <button
            onClick={handleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-gray-900 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:shadow-lg active:scale-95"
          >
            <LogIn className="h-4 w-4" />
            Sign in as Administrator
          </button>
          
          <p className="mt-6 text-center text-xs text-gray-400">
            Secure admin-only access. Professional dashboard for hotel financial management.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50 flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4 md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-100">
            <Hotel className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">Hotel Insight</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <Sidebar 
        activeView={activeView} 
        setView={(v) => { setActiveView(v); setIsSidebarOpen(false); }} 
        logout={handleLogout} 
        user={user} 
        isOpen={isSidebarOpen}
        close={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeView === 'dashboard' && <Dashboard />}
              {activeView === 'income' && <IncomeManager />}
              {activeView === 'expenses' && <ExpenseManager />}
              {activeView === 'prediction' && <PredictionView />}
              {activeView === 'reports' && <ReportGenerator />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

