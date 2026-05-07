import { User } from 'firebase/auth';
import { ViewState } from '../../types';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  LineChart, 
  FileText, 
  LogOut, 
  Hotel,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  activeView: ViewState;
  setView: (view: ViewState) => void;
  logout: () => void;
  user: User;
  isOpen?: boolean;
  close?: () => void;
}

export default function Sidebar({ activeView, setView, logout, user, isOpen, close }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'income' as const, label: 'Income', icon: TrendingUp },
    { id: 'expenses' as const, label: 'Expenses', icon: TrendingDown },
    { id: 'prediction' as const, label: 'AI Prediction', icon: LineChart },
    { id: 'reports' as const, label: 'Reports', icon: FileText },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm md:hidden"
          onClick={close}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out md:static md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-20 items-center justify-between px-8 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-100">
              <Hotel className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">Hotel Insight</span>
          </div>
        </div>

      <nav className="flex-1 space-y-1.5 p-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn(
              "group flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
              activeView === item.id
                ? "bg-indigo-50 text-indigo-700 shadow-sm"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className={cn(
                "h-5 w-5",
                activeView === item.id ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-900"
              )} />
              {item.label}
            </div>
            {activeView === item.id && (
              <ChevronRight className="h-4 w-4 animate-in fade-in slide-in-from-left-1" />
            )}
          </button>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-6">
        <div className="mb-6 flex items-center gap-3 overflow-hidden rounded-2xl bg-gray-50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold uppercase">
            {user.email?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{user.email?.split('@')[0]}</p>
            <p className="truncate text-xs text-gray-500">Administrator</p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 active:scale-95"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
    </>
  );
}
