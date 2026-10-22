import React from 'react';
import { Sun, Moon, LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout, theme, toggleTheme, switchDemoUser } = useAuth();

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
          Academic Analytics & Intelligence
        </h2>
        <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          Academic Year 2026–2027
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Role Switcher for instant testing */}
        <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Role:</span>
          <button
            onClick={() => switchDemoUser('SCHOOL_ADMIN')}
            className={`px-2 py-1 rounded font-medium transition ${
              user?.role === 'SCHOOL_ADMIN'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Principal
          </button>
          <button
            onClick={() => switchDemoUser('TEACHER')}
            className={`px-2 py-1 rounded font-medium transition ${
              user?.role === 'TEACHER'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Teacher
          </button>
          <button
            onClick={() => switchDemoUser('STUDENT')}
            className={`px-2 py-1 rounded font-medium transition ${
              user?.role === 'STUDENT'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Student
          </button>
          <button
            onClick={() => switchDemoUser('SUPER_ADMIN')}
            className={`px-2 py-1 rounded font-medium transition ${
              user?.role === 'SUPER_ADMIN'
                ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Super Admin
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          aria-label="Sign out"
          title="Sign out"
          className="p-2 text-rose-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
