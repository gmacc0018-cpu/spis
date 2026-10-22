import React, { useState } from 'react';
import { GraduationCap, ArrowRight, ShieldCheck, UserCheck, BookOpen, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, demoPass);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 items-center justify-center text-white shadow-xl shadow-blue-500/25 mb-3">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight font-display">SPIS Portal</h1>
          <p className="text-xs text-slate-400 mt-1">
            School Performance Intelligence System — Academic Analytics
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@school.edu"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950/70 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950/70 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-semibold text-sm text-white shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to SPIS'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              One-Click Persona Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('principal@oakridge.edu', 'Principal@123')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition text-left"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold text-slate-200">Principal</div>
                  <div className="text-[10px] text-slate-400">Dr. Pendelton</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('math.teacher@oakridge.edu', 'Teacher@123')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition text-left"
              >
                <BookOpen className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="font-semibold text-slate-200">Math Teacher</div>
                  <div className="text-[10px] text-slate-400">Prof. Rajesh</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('student.aarav@oakridge.edu', 'Student@123')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition text-left"
              >
                <User className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-semibold text-slate-200">Student</div>
                  <div className="text-[10px] text-slate-400">Aarav Sharma</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('superadmin@spis.edu', 'Admin@123')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 transition text-left"
              >
                <UserCheck className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="font-semibold text-slate-200">Super Admin</div>
                  <div className="text-[10px] text-slate-400">Dr. Vance</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-6">
          SPIS v1.0.0 — Educational Data Privacy & RBAC Compliant
        </p>
      </div>
    </div>
  );
};
