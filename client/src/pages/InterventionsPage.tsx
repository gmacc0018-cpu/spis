import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BookOpen,
  User,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const InterventionsPage: React.FC = () => {
  const { token, user } = useAuth();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Intervention Modal
  const [showModal, setShowModal] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [gapDesc, setGapDesc] = useState('');
  const [targetPct, setTargetPct] = useState('60');
  const [actionPlan, setActionPlan] = useState('');

  // Review Modal
  const [reviewingPlanId, setReviewingPlanId] = useState<string | null>(null);
  const [reviewSummary, setReviewSummary] = useState('');
  const [postPct, setPostPct] = useState('');
  const [outcomeStatus, setOutcomeStatus] = useState('IMPROVED');

  const loadInterventions = () => {
    setLoading(true);
    fetch('/api/interventions', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(d => {
        setInterventions(d);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadInterventions();

    fetch('/api/students', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(st => {
        setStudents(st);
        if (st.length > 0) setSelectedStudentId(st[0].id);
      });

    fetch('/api/academic/subjects', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(sub => {
        setSubjects(sub);
        if (sub.length > 0) setSelectedSubjectId(sub[0].id);
      });
  }, [token]);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/interventions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
          subjectId: selectedSubjectId,
          title,
          learningGapDescription: gapDesc,
          targetPercentage: Number(targetPct),
          actionPlan
        })
      });

      if (!res.ok) throw new Error('Failed to create intervention plan');
      setShowModal(false);
      setTitle('');
      setGapDesc('');
      setActionPlan('');
      loadInterventions();
    } catch (err: any) {
      alert(err.message || 'Error creating plan');
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingPlanId) return;

    try {
      const res = await fetch(`/api/interventions/${reviewingPlanId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          evaluationSummary: reviewSummary,
          postInterventionPercentage: postPct ? Number(postPct) : null,
          outcomeStatus
        })
      });

      if (!res.ok) throw new Error('Failed to record review');
      setReviewingPlanId(null);
      setReviewSummary('');
      setPostPct('');
      loadInterventions();
    } catch (err: any) {
      alert(err.message || 'Error recording review');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-5 glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" /> Remedial & Enrichment Interventions
          </h2>
          <p className="text-xs text-slate-400">
            Targeted teaching support for students with identified learning gaps, with follow-up outcome evaluations.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary text-xs font-semibold shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Intervention Plan
        </button>
      </div>

      {/* Intervention Plans Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading intervention records...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {interventions.map((plan: any) => (
            <div key={plan.id} className="glass-card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    {plan.subject.name} Remedial Plan
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {plan.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Target Student: <strong>{plan.student.firstName} {plan.student.lastName}</strong> ({plan.student.admissionNumber})
                  </p>
                </div>
                <span className={`badge ${
                  plan.status === 'COMPLETED' ? 'badge-strong' :
                  plan.status === 'IN_PROGRESS' ? 'badge-good' :
                  'badge-developing'
                }`}>
                  {plan.status.replace('_', ' ')}
                </span>
              </div>

              {/* Diagnosis and Action Plan */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Identified Learning Gap: </span>
                  <span className="text-slate-600 dark:text-slate-400">{plan.learningGapDescription}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Target Benchmark: </span>
                  <span className="font-mono font-bold text-blue-600">{plan.targetPercentage}%</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Action Plan: </span>
                  <span className="text-slate-600 dark:text-slate-400">{plan.actionPlan}</span>
                </div>
              </div>

              {/* Reviews and Evaluations Timeline */}
              {plan.reviews && plan.reviews.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">Outcome Evaluations:</div>
                  {plan.reviews.map((r: any) => (
                    <div key={r.id} className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-emerald-700 dark:text-emerald-400">
                        <span>Outcome: {r.outcomeStatus}</span>
                        {r.postInterventionPercentage !== null && (
                          <span className="font-mono font-bold">New Score: {r.postInterventionPercentage}%</span>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px]">{r.evaluationSummary}</p>
                    </div>
                  ))}
                </div>
              )}

              {plan.status !== 'COMPLETED' && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setReviewingPlanId(plan.id)}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1"
                  >
                    Log Follow-up Review <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Create Targeted Remedial Plan
            </h3>

            <form onSubmit={handleCreatePlan} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Student</label>
                  <select
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNumber})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Subject</label>
                  <select
                    value={selectedSubjectId}
                    onChange={e => setSelectedSubjectId(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Intervention Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  placeholder="e.g. Remedial Quadratic Equations Practice"
                  onChange={e => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Identified Learning Gap</label>
                <textarea
                  required
                  rows={2}
                  value={gapDesc}
                  placeholder="Specific topics, concepts, or problem-types where student needs support..."
                  onChange={e => setGapDesc(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Target Mastery (%)</label>
                  <input
                    type="number"
                    required
                    value={targetPct}
                    onChange={e => setTargetPct(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Action Plan & Schedule</label>
                <textarea
                  required
                  rows={2}
                  value={actionPlan}
                  placeholder="e.g. 3 weekly 45-min peer tutoring sessions and worksheet reviews."
                  onChange={e => setActionPlan(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary text-xs">
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewingPlanId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Record Follow-up Outcome Evaluation
            </h3>

            <form onSubmit={handleAddReview} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Outcome Status</label>
                <select
                  value={outcomeStatus}
                  onChange={e => setOutcomeStatus(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                >
                  <option value="IMPROVED">IMPROVED</option>
                  <option value="MAINTAINED">MAINTAINED</option>
                  <option value="NEEDS_FURTHER_ACTION">NEEDS_FURTHER_ACTION</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Post-Intervention Score (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={postPct}
                  placeholder="e.g. 62.5"
                  onChange={e => setPostPct(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Evaluation Summary</label>
                <textarea
                  required
                  rows={3}
                  value={reviewSummary}
                  placeholder="Describe student progress and test evidence..."
                  onChange={e => setReviewSummary(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingPlanId(null)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary text-xs">
                  Save Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
