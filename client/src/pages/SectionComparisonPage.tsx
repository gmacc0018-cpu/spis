import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  Sparkles,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SectionComparisonPage: React.FC = () => {
  const { token } = useAuth();
  const [comparison, setComparison] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [prevExamId, setPrevExamId] = useState<string>('');
  const [currExamId, setCurrExamId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/exams', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setExams(data);
        if (data.length >= 2) {
          setPrevExamId(data[1].id);
          setCurrExamId(data[0].id);
        }
      });
  }, [token]);

  const loadComparison = () => {
    if (!prevExamId || !currExamId) return;
    setLoading(true);

    fetch(`/api/analytics/compare?prevExamId=${prevExamId}&currExamId=${currExamId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(d => {
        setComparison(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadComparison();
  }, [prevExamId, currExamId]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-5 glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" /> Assessment & Section Growth Intelligence
          </h2>
          <p className="text-xs text-slate-400">
            Compare growth across revision tests, measure percentage point differentials, and uncover learning trends.
          </p>
        </div>
      </div>

      {/* Comparison Selectors */}
      <div className="glass-card p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Baseline Assessment (Previous)</label>
          <select
            value={prevExamId}
            onChange={e => setPrevExamId(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-medium"
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.examType})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Comparative Assessment (Current)</label>
          <select
            value={currExamId}
            onChange={e => setCurrExamId(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-medium"
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.examType})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Verified AI Insights */}
      {comparison?.insights && comparison.insights.length > 0 && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-900 dark:text-indigo-200 text-xs space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" /> Evidence-Backed Academic Findings
          </div>
          {comparison.insights.map((insight: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
              <span>•</span>
              <span>{insight}</span>
            </div>
          ))}
        </div>
      )}

      {/* Subject Growth Differential Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 font-semibold text-xs text-slate-700 dark:text-slate-300">
          Comparable Subject Growth (Percentage Points)
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Analyzing assessment growth...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="spreadsheet-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Baseline Average</th>
                  <th>Current Average</th>
                  <th>Growth (Percentage Points)</th>
                  <th>Trend Direction</th>
                </tr>
              </thead>
              <tbody>
                {comparison?.comparisons?.map((c: any) => {
                  const isUp = c.growthPoints > 0;
                  const isDown = c.growthPoints < 0;

                  return (
                    <tr key={c.subjectId}>
                      <td className="font-semibold text-slate-900 dark:text-white">{c.subjectName}</td>
                      <td className="font-mono">{c.previousAverage}%</td>
                      <td className="font-mono font-bold">{c.currentAverage}%</td>
                      <td className="font-mono font-bold">
                        <span className={`inline-flex items-center gap-1 ${
                          isUp ? 'text-emerald-500' : isDown ? 'text-rose-500' : 'text-slate-500'
                        }`}>
                          {isUp ? <ArrowUpRight className="w-4 h-4" /> : isDown ? <ArrowDownRight className="w-4 h-4" /> : null}
                          {isUp ? `+${c.growthPoints}%` : `${c.growthPoints}%`}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          isUp ? 'badge-strong' : isDown ? 'badge-support' : 'badge-good'
                        }`}>
                          {c.direction}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
