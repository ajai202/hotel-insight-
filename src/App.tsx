/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from './lib/firebase';
import { ViewState } from './types';
import Sidebar from './components/layout/Sidebar';
import { LogIn, Hotel } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load view components
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const IncomeManager = lazy(() => import('./components/finance/IncomeManager'));
const ExpenseManager = lazy(() => import('./components/finance/ExpenseManager'));
const PredictionView = lazy(() => import('./components/prediction/PredictionView'));
const ReportGenerator = lazy(() => import('./components/reports/ReportGenerator'));

const LoadingFallback = () => (
  <div className="flex h-full w-full items-center justify-center p-20">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
  </div>
);

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
      <div className="flex h-screen w-full items-center justify-center bg-stone-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-stone-50 flex-col md:flex-row font-sans selection:bg-stone-900 selection:text-white">
      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between border-b border-stone-200/50 bg-white/70 backdrop-blur-xl p-4 md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-stone-900 shadow-sm">
            <Hotel className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-stone-900 font-serif">Hotel Insight</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="rounded-sm p-2 text-stone-600 hover:bg-stone-100"
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
              <Suspense fallback={<LoadingFallback />}>
                {activeView === 'dashboard' && <Dashboard />}
                {activeView === 'income' && <IncomeManager />}
                {activeView === 'expenses' && <ExpenseManager />}
                {activeView === 'prediction' && <PredictionView />}
                {activeView === 'reports' && <ReportGenerator />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

