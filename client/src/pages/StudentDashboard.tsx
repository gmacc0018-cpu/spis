import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
} from 'chart.js';
import { Radar, Line } from 'react-chartjs-2';
import {
  TrendingUp,
  Award,
  CalendarCheck,
  Download,
  Sparkles,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
);

export const StudentDashboard: React.FC = () => {
  const { user, token, theme } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // If logged in as student, use their linked studentId; otherwise fallback to Aarav Sharma's ID from seed
  const studentId = user?.studentId || 'OAK-2026-001';

  useEffect(() => {
    // Look up student details
    fetch(`/api/students?search=Aarav`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(students => {
        const targetId = user?.studentId || (students[0] && students[0].id);
        if (targetId) {
          fetch(`/api/analytics/student/${targetId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(res => res.json())
            .then(d => {
              setData(d);
              setLoading(false);
            });
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [token, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500">
        No student profile or academic records found.
      </div>
    );
  }

  const textColor = theme === 'dark' ? '#94a3b8' : '#475569';
  const gridColor = theme === 'dark' ? '#1e293b' : '#f1f5f9';

  // Radar chart of subject mastery
  const radarData = {
    labels: data.subjectProfiles.map((s: any) => s.subjectName),
    datasets: [
      {
        label: 'My Average Score (%)',
        data: data.subjectProfiles.map((s: any) => s.averagePercentage),
        backgroundColor: 'rgba(59, 130, 246, 0.25)',
        borderColor: '#3b82f6',
        pointBackgroundColor: '#3b82f6',
        fill: true
      }
    ]
  };

  // Progression Line chart across assessments for Mathematics
  const mathResults = data.allResults.filter((r: any) => r.subjectName === 'Mathematics');
  const lineData = {
    labels: mathResults.map((r: any) => r.examName),
    datasets: [
      {
        label: 'Mathematics Growth (%)',
        data: mathResults.map((r: any) => r.percentage),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  const handleDownloadPdf = () => {
    window.open(`/api/reports/student/${data.studentId}/pdf?token=${token}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Student Welcome & Profile Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-blue-500/10">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider">
            Student Academic Profile
          </span>
          <h2 className="text-2xl font-black mt-2 font-display">{data.fullName}</h2>
          <p className="text-xs text-blue-100 mt-0.5">
            Admission No: {data.admissionNumber} • Standard 10 - Section A • Roll #01
          </p>
        </div>

        <button
          onClick={handleDownloadPdf}
          className="btn btn-secondary bg-white text-blue-700 hover:bg-blue-50 text-xs font-semibold shadow-md flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Download Official Report Card (PDF)
        </button>
      </div>

      {/* Highlights & Attendance Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Overall Academic Average
            </span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {data.overallAverage}%
            </span>
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> Strong
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Calculated across 5 academic subjects</p>
        </div>

        {/* Attendance Summary */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Student Attendance
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {data.attendance.attendancePercentage}%
            </span>
            <span className="text-xs font-medium text-slate-400">
              ({data.attendance.presentSessions} / {data.attendance.totalSessions} sessions)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {data.attendance.flaggedLow ? (
              <span className="text-rose-500 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Attendance below 75% threshold
              </span>
            ) : (
              <span className="text-emerald-500 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Excellent classroom attendance
              </span>
            )}
          </p>
        </div>

        {/* Motivation & Achievement Badges */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Academic Recognition
            </span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="badge badge-strong flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Math Growth: +15%
            </span>
            <span className="badge badge-good">Consistent Performer</span>
            <span className="badge badge-strong">Top Attendance</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Earned across Revision Test Series</p>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Radar Profile */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Multi-Subject Performance Profile
              </h3>
              <p className="text-xs text-slate-400">Balanced academic evaluation across subjects</p>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <Radar
              data={radarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  r: {
                    min: 0,
                    max: 100,
                    grid: { color: gridColor },
                    pointLabels: { color: textColor, font: { size: 11, weight: 'bold' } },
                    ticks: { display: false }
                  }
                },
                plugins: { legend: { display: false } }
              }}
            />
          </div>
        </div>

        {/* Growth Curve */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Subject Growth Progression (Mathematics)
              </h3>
              <p className="text-xs text-slate-400">Revision Test 1 (70%) &rarr; Revision Test 2 (85%)</p>
            </div>
          </div>
          <div className="h-64">
            <Line
              data={lineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { grid: { color: gridColor }, ticks: { color: textColor } },
                  y: { min: 40, max: 100, grid: { color: gridColor }, ticks: { color: textColor } }
                },
                plugins: { legend: { labels: { color: textColor } } }
              }}
            />
          </div>
        </div>
      </div>

      {/* Detailed Subject Breakdown Table */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Subject-wise Mastery & Progress Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="spreadsheet-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Overall Average</th>
                <th>Personal Best</th>
                <th>Recent Growth</th>
                <th>Mastery Classification</th>
              </tr>
            </thead>
            <tbody>
              {data.subjectProfiles.map((sub: any) => (
                <tr key={sub.subjectId}>
                  <td className="font-semibold text-slate-900 dark:text-white">{sub.subjectName}</td>
                  <td>{sub.averagePercentage}%</td>
                  <td className="text-indigo-600 dark:text-indigo-400 font-bold">{sub.personalBest}%</td>
                  <td>
                    {sub.growthPoints !== null ? (
                      <span className={`font-bold flex items-center gap-1 ${
                        sub.growthPoints > 0 ? 'text-emerald-500' : sub.growthPoints < 0 ? 'text-rose-500' : 'text-slate-500'
                      }`}>
                        {sub.growthPoints > 0 ? `+${sub.growthPoints}%` : `${sub.growthPoints}%`}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>
                    <span className={`badge ${
                      sub.masteryLevel === 'STRONG' ? 'badge-strong' :
                      sub.masteryLevel === 'GOOD' ? 'badge-good' :
                      sub.masteryLevel === 'DEVELOPING' ? 'badge-developing' :
                      'badge-support'
                    }`}>
                      {sub.masteryLevel?.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
