import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import {
  TrendingUp,
  Users,
  Award,
  CalendarCheck,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const PrincipalDashboard: React.FC = () => {
  const { token, theme } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/principal', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dashboard:', err);
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

  if (!data || data.empty) {
    return (
      <div className="p-8 text-center text-slate-500">
        No active academic data found for this school context.
      </div>
    );
  }

  const textColor = theme === 'dark' ? '#94a3b8' : '#475569';
  const gridColor = theme === 'dark' ? '#1e293b' : '#f1f5f9';

  // Section comparison chart data
  const sectionChartData = {
    labels: data.sectionComparisons?.map((s: any) => s.sectionName) || [],
    datasets: [
      {
        label: 'Average Score (%)',
        data: data.sectionComparisons?.map((s: any) => s.averagePercentage) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 8
      },
      {
        label: 'Attendance Rate (%)',
        data: data.sectionComparisons?.map((s: any) => s.attendanceRate) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 8
      }
    ]
  };

  // Subject performance radar data
  const subjectRadarData = {
    labels: data.subjectAverages?.map((s: any) => s.subjectName) || [],
    datasets: [
      {
        label: 'Subject Average (%)',
        data: data.subjectAverages?.map((s: any) => s.averagePercentage) || [],
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
        borderColor: '#6366f1',
        pointBackgroundColor: '#6366f1',
        fill: true
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with AI Insights */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30 border border-blue-500/20 backdrop-blur-md flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 mt-0.5">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            AI-Assisted Educational Intelligence Briefing
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Standard 10 demonstrates positive growth across revision tests. Section 10-A leads in Mathematics (+15.0% growth in Revision Test 2). 
            Targeted remedial practice recommended for quadratic polynomials.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              School Average
            </span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {data.schoolAverage || 0}%
            </span>
            <span className="text-xs font-bold text-emerald-500 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +4.2%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all completed assessments</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {data.totalStudentsEnrolled || 0}
            </span>
            <span className="text-xs font-medium text-slate-400">100% active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across Sections 10-A, 10-B, 10-C</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              High Mastery Band
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {data.enrichmentCount || 0}
            </span>
            <span className="text-xs font-medium text-emerald-500">&ge; 85% score</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Candidates for enrichment</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Remedial Support
            </span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-500">
              {data.supportCount || 0}
            </span>
            <span className="text-xs font-medium text-slate-400">&lt; 50% score</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Action plans in progress</p>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Comparison Chart */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Section Performance & Attendance
              </h3>
              <p className="text-xs text-slate-400">Comparing Standard 10 Sections</p>
            </div>
          </div>
          <div className="h-64">
            <Bar
              data={sectionChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { grid: { color: gridColor }, ticks: { color: textColor } },
                  y: { min: 0, max: 100, grid: { color: gridColor }, ticks: { color: textColor } }
                },
                plugins: { legend: { labels: { color: textColor } } }
              }}
            />
          </div>
        </div>

        {/* Subject Radar Profile */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Subject Mastery Distribution
              </h3>
              <p className="text-xs text-slate-400">School-wide academic strengths profile</p>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center">
            <Radar
              data={subjectRadarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  r: {
                    min: 0,
                    max: 100,
                    grid: { color: gridColor },
                    angleLines: { color: gridColor },
                    pointLabels: { color: textColor, font: { size: 11, weight: 'bold' } },
                    ticks: { display: false }
                  }
                },
                plugins: { legend: { display: false } }
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Examinations List */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          Recent Assessment Series & Status
        </h3>
        <div className="overflow-x-auto">
          <table className="spreadsheet-table">
            <thead>
              <tr>
                <th>Examination Name</th>
                <th>Type</th>
                <th>Grade</th>
                <th>Subjects</th>
                <th>Workflow Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentExaminations?.map((exam: any) => (
                <tr key={exam.id}>
                  <td className="font-semibold text-slate-900 dark:text-white">
                    {exam.name}
                  </td>
                  <td>{exam.examType.replace('_', ' ')}</td>
                  <td>{exam.gradeName}</td>
                  <td>{exam.subjectCount} subjects</td>
                  <td>
                    <span className={`badge ${
                      exam.status === 'APPROVED' ? 'badge-strong' :
                      exam.status === 'LOCKED' ? 'badge-developing' :
                      'badge-good'
                    }`}>
                      {exam.status}
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
