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
  user: User | null;
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
          className="fixed inset-0 z-40 bg-stone-900/80 backdrop-blur-md md:hidden transition-opacity"
          onClick={close}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-[#1A1A1A] border-r border-stone-800 transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) md:static md:translate-x-0 cursor-default",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex justify-center h-28 items-center px-8 border-b border-white/5">
          <div className="flex items-center gap-4 w-full">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-white text-stone-950">
              <Hotel className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white font-serif italic">Hotel Insight</span>
          </div>
        </div>

      <nav className="flex-1 space-y-2 p-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn(
              "group flex w-full items-center justify-between px-4 py-3 text-[0.95rem] tracking-wide transition-all duration-300",
              activeView === item.id
                ? "text-white font-semibold"
                : "text-stone-400 hover:text-stone-200"
            )}
          >
            <div className="flex items-center gap-4">
              <item.icon className={cn(
                "h-[1.15rem] w-[1.15rem] transition-colors",
                activeView === item.id ? "text-white" : "text-stone-500 group-hover:text-stone-300"
              )} />
              {item.label}
            </div>
            {activeView === item.id && (
              <ChevronRight className="h-4 w-4 text-stone-500 animate-in fade-in slide-in-from-left-1" />
            )}
          </button>
        ))}
      </nav>

      {user && (
        <div className="border-t border-white/5 p-6">
          <div className="mb-6 flex items-center gap-3.5 overflow-hidden p-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-stone-800 text-stone-300 text-sm font-bold uppercase">
              {user.email?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-stone-300">{user.email?.split('@')[0]}</p>
              <p className="truncate text-[0.65rem] uppercase tracking-widest text-stone-500 font-bold mt-1">Admin</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="flex w-full items-center gap-4 px-4 py-3 text-[0.9rem] font-medium text-stone-500 transition-colors hover:text-red-400"
          >
            <LogOut className="h-[1.15rem] w-[1.15rem]" />
            Sign out
          </button>
        </div>
      )}
    </aside>
    </>
  );
}
