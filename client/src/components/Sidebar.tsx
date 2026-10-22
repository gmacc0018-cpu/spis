import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  GraduationCap,
  Users,
  FileSpreadsheet,
  CalendarCheck,
  TrendingUp,
  FileText,
  ShieldCheck,
  Building2,
  BookOpen,
  Award,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const navItems = [
    // Common / Principal views
    ...(role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN' ? [
      { to: '/', label: 'Overview', icon: BarChart3 },
      { to: '/classes', label: 'Section Comparison', icon: TrendingUp },
      { to: '/students', label: 'Students Directory', icon: GraduationCap },
      { to: '/exams', label: 'Examinations', icon: BookOpen },
    ] : []),

    // Teacher views
    ...(role === 'TEACHER' ? [
      { to: '/', label: 'Teacher Dashboard', icon: BarChart3 },
      { to: '/students', label: 'My Students', icon: GraduationCap },
    ] : []),

    // Marks Entry & Attendance (Admin & Teachers)
    ...(role === 'SCHOOL_ADMIN' || role === 'TEACHER' || role === 'SUPER_ADMIN' ? [
      { to: '/marks', label: 'Enter Marks', icon: FileSpreadsheet },
      { to: '/attendance', label: 'Attendance Register', icon: CalendarCheck },
      { to: '/interventions', label: 'Interventions & Remedials', icon: Sparkles },
      { to: '/reports', label: 'Reports & Exports', icon: FileText },
    ] : []),

    // Student / Parent Portal
    ...(role === 'STUDENT' || role === 'PARENT' ? [
      { to: '/', label: 'My Academic Growth', icon: TrendingUp },
      { to: '/student/attendance', label: 'Attendance Records', icon: CalendarCheck },
      { to: '/student/badges', label: 'Achievements & Goals', icon: Award },
      { to: '/reports', label: 'My Report Card', icon: FileText },
    ] : []),

    // Super Admin views
    ...(role === 'SUPER_ADMIN' ? [
      { to: '/schools', label: 'Schools Network', icon: Building2 },
      { to: '/audit', label: 'Audit Trail', icon: ShieldCheck },
    ] : [])
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen sticky top-0 transition-all select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
            SPIS
          </h1>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
            Performance Intelligence
          </p>
        </div>
      </div>

      {/* School Badge */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
          Current Context
        </div>
        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
          {user.schoolName || 'Global Educational Network'}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {user.name}
            </p>
            <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {user.role.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
