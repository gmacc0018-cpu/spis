import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Lock,
  CheckCircle,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ExamsPage: React.FC = () => {
  const { token, user } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [showModal, setShowModal] = useState(false);
  const [grades, setGrades] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [examType, setExamType] = useState('REVISION_TEST');
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedYearId, setSelectedYearId] = useState('');
  const [maxMarks, setMaxMarks] = useState('60');
  const [passMarks, setPassMarks] = useState('24');

  const loadExams = () => {
    setLoading(true);
    fetch('/api/exams', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(d => {
        setExams(d);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadExams();

    fetch('/api/academic/grades', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(g => {
        setGrades(g);
        if (g.length > 0) setSelectedGradeId(g[0].id);
      });

    fetch('/api/academic/years', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(y => {
        setYears(y);
        if (y.length > 0) setSelectedYearId(y[0].id);
      });

    fetch('/api/academic/subjects', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(s => setSubjects(s));
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          examType,
          academicYearId: selectedYearId,
          gradeId: selectedGradeId,
          subjects: subjects.map(s => ({
            subjectId: s.id,
            maxMarks: Number(maxMarks),
            passingMarks: Number(passMarks)
          }))
        })
      });

      if (!res.ok) throw new Error('Failed to create examination');
      setShowModal(false);
      setName('');
      loadExams();
    } catch (err: any) {
      alert(err.message || 'Error creating exam');
    }
  };

  const handleUpdateStatus = async (examId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/exams/${examId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (!res.ok) throw new Error('Failed to update status');
      loadExams();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-5 glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" /> Examination Series & Lock Management
          </h2>
          <p className="text-xs text-slate-400">
            Define multi-subject examination series, control marks-entry status workflows, and lock official results.
          </p>
        </div>

        {(user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN') && (
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary text-xs font-semibold shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Schedule New Examination
          </button>
        )}
      </div>

      {/* Examinations Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading examinations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {exams.map(ex => (
            <div key={ex.id} className="glass-card p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {ex.examType.replace('_', ' ')}
                  </span>
                  <span className={`badge ${
                    ex.status === 'LOCKED' ? 'badge-support' :
                    ex.status === 'APPROVED' ? 'badge-strong' :
                    ex.status === 'OPEN' ? 'badge-good' :
                    'badge-developing'
                  }`}>
                    {ex.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {ex.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Standard: <strong>{ex.grade.name}</strong> • Year: {ex.academicYear.name}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div>Subjects Included: <strong>{ex.examinationSubjects?.length || 0}</strong></div>
                  <div>Default Max Marks: <strong>{ex.examinationSubjects?.[0]?.maxMarks || 60}</strong></div>
                  <div>Passing Marks: <strong>{ex.examinationSubjects?.[0]?.passingMarks || 24}</strong></div>
                </div>
              </div>

              {/* Status Action Buttons */}
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN') && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  {ex.status === 'OPEN' && (
                    <button
                      onClick={() => handleUpdateStatus(ex.id, 'APPROVED')}
                      className="btn btn-secondary text-xs text-emerald-600 font-semibold"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve Results
                    </button>
                  )}
                  {ex.status === 'APPROVED' && (
                    <button
                      onClick={() => handleUpdateStatus(ex.id, 'LOCKED')}
                      className="btn btn-secondary text-xs text-amber-600 font-semibold"
                    >
                      <Lock className="w-3.5 h-3.5" /> Lock Results
                    </button>
                  )}
                  {ex.status === 'LOCKED' && (
                    <button
                      onClick={() => handleUpdateStatus(ex.id, 'OPEN')}
                      className="btn btn-secondary text-xs text-blue-600 font-semibold"
                    >
                      Unlock for Edits
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Schedule New Examination
            </h3>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Examination Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Revision Test 3"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Type</label>
                  <select
                    value={examType}
                    onChange={e => setExamType(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                  >
                    <option value="REVISION_TEST">Revision Test</option>
                    <option value="UNIT_TEST">Unit Test</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="HALF_YEARLY">Half Yearly</option>
                    <option value="PRE_FINAL">Pre Final</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Grade</label>
                  <select
                    value={selectedGradeId}
                    onChange={e => setSelectedGradeId(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                  >
                    {grades.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Max Marks (Per Subject)</label>
                  <input
                    type="number"
                    required
                    value={maxMarks}
                    onChange={e => setMaxMarks(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Passing Marks</label>
                  <input
                    type="number"
                    required
                    value={passMarks}
                    onChange={e => setPassMarks(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
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
                  Create Examination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
