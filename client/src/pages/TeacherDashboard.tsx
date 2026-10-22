import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  FileSpreadsheet,
  CalendarCheck,
  AlertTriangle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const TeacherDashboard: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/teacher', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load teacher dashboard:', err);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const classes = data?.classes || [];

  return (
    <div className="space-y-6">
      {/* Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 glass-card bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
        <div>
          <h2 className="text-lg font-bold">Teacher Academic Workspace</h2>
          <p className="text-xs text-blue-100 mt-0.5">
            Manage your assigned sections, enter marks, review learning gaps, and record daily attendance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/marks" className="btn btn-secondary bg-white text-blue-700 hover:bg-blue-50 text-xs font-semibold">
            <FileSpreadsheet className="w-4 h-4" /> Enter Marks
          </Link>
          <Link to="/attendance" className="btn btn-secondary bg-white text-blue-700 hover:bg-blue-50 text-xs font-semibold">
            <CalendarCheck className="w-4 h-4" /> Attendance Register
          </Link>
        </div>
      </div>

      {/* Assigned Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classes.map((cls: any) => (
          <div key={cls.assignmentId} className="glass-card p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {cls.subjectCode} • {cls.subjectName}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Section {cls.className}
                </h3>
              </div>
              {cls.isClassTeacher && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Class Teacher
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-slate-800 text-center">
              <div>
                <div className="text-xs text-slate-400">Students</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">{cls.studentCount}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Class Average</div>
                <div className="text-base font-bold text-blue-600 dark:text-blue-400">{cls.classAverage}%</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Passing Rate</div>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{cls.passingRate}%</div>
              </div>
            </div>

            {/* Students requiring attention */}
            <div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                <span>Enrolled Students Overview</span>
                <span className="text-[11px] text-slate-400 font-normal">Latest Scores</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {cls.students.map((st: any) => (
                  <div
                    key={st.enrollmentId}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 font-medium">#{st.rollNumber}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{st.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {st.needsSupport && (
                        <span className="badge badge-support flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Needs Support
                        </span>
                      )}
                      <span className="font-bold text-slate-900 dark:text-white">
                        {st.latestResult !== null ? `${st.latestResult}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Link
                to={`/interventions?section=${cls.assignmentId}`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
              >
                Plan Remedial Support <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
