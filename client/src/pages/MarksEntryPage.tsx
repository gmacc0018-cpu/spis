import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Save,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Lock,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const MarksEntryPage: React.FC = () => {
  const { token } = useAuth();

  // Filters
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  // Grid Data
  const [gridData, setGridData] = useState<any>(null);
  const [entries, setEntries] = useState<Record<string, { marks: string; status: string; remarks: string }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importReport, setImportReport] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  // Load initial examinations
  useEffect(() => {
    fetch('/api/exams', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setExams(data);
        if (data.length > 0) {
          setSelectedExamId(data[0].id);
          if (data[0].examinationSubjects?.length > 0) {
            setSelectedSubjectId(data[0].examinationSubjects[0].id);
          }
        }
      });

    fetch('/api/academic/sections', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setSections(data);
        if (data.length > 0) {
          setSelectedSectionId(data[0].id);
        }
      });
  }, [token]);

  // When selected exam changes, update available subjects
  const currentExam = exams.find(e => e.id === selectedExamId);
  useEffect(() => {
    if (currentExam && currentExam.examinationSubjects?.length > 0) {
      setSelectedSubjectId(currentExam.examinationSubjects[0].id);
    }
  }, [selectedExamId, currentExam]);

  // Load marks grid when exam subject and section are selected
  const loadGrid = () => {
    if (!selectedSubjectId || !selectedSectionId) return;
    setLoading(true);
    setFeedback(null);

    fetch(`/api/marks/grid?examinationSubjectId=${selectedSubjectId}&sectionId=${selectedSectionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setGridData(data);
        const map: Record<string, any> = {};
        for (const st of data.students || []) {
          map[st.enrollmentId] = {
            marks: st.marksObtained !== null ? String(st.marksObtained) : '',
            status: st.status || 'PRESENT',
            remarks: st.remarks || ''
          };
        }
        setEntries(map);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadGrid();
  }, [selectedSubjectId, selectedSectionId]);

  const handleMarkChange = (enrollmentId: string, val: string) => {
    setEntries(prev => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        marks: val
      }
    }));
  };

  const handleStatusChange = (enrollmentId: string, status: string) => {
    setEntries(prev => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        status,
        marks: status !== 'PRESENT' ? '' : prev[enrollmentId]?.marks || ''
      }
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = document.getElementById(`mark-input-${index + 1}`);
      nextInput?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.getElementById(`mark-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSaveMarks = async () => {
    if (!selectedSubjectId || !gridData) return;
    setSaving(true);
    setFeedback(null);

    const payload = {
      examinationSubjectId: selectedSubjectId,
      entries: Object.entries(entries).map(([enrollmentId, val]) => ({
        enrollmentId,
        marksObtained: val.status === 'PRESENT' && val.marks !== '' ? Number(val.marks) : null,
        status: val.status,
        remarks: val.remarks
      }))
    };

    try {
      const res = await fetch('/api/marks/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || result.details?.join(' ') || 'Failed to save');
      }

      setFeedback({ type: 'success', message: `Successfully saved marks for ${result.updatedCount} students.` });
      loadGrid();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open(`/api/marks/template?examinationSubjectId=${selectedSubjectId}&sectionId=${selectedSectionId}`, '_blank');
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    setImportReport(null);

    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('examinationSubjectId', selectedSubjectId);
    formData.append('sectionId', selectedSectionId);

    try {
      const res = await fetch('/api/marks/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImportReport(data);

      // Pre-fill valid rows into entries
      if (data.validRows) {
        setEntries(prev => {
          const next = { ...prev };
          for (const row of data.validRows) {
            next[row.enrollmentId] = {
              marks: row.marksObtained !== null ? String(row.marksObtained) : '',
              status: row.status,
              remarks: row.remarks || ''
            };
          }
          return next;
        });
      }
    } catch (err: any) {
      alert(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const isLocked = gridData?.examSubject?.examStatus === 'LOCKED';

  return (
    <div className="space-y-6">
      {/* Control Filter Bar */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" /> Fast Marks-Entry Grid
            </h2>
            <p className="text-xs text-slate-400">
              Keyboard-optimized table with instant validation and status control.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="btn btn-secondary text-xs font-semibold"
              title="Download Excel import template"
            >
              <Download className="w-3.5 h-3.5" /> Template
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="btn btn-secondary text-xs font-semibold"
            >
              <Upload className="w-3.5 h-3.5" /> Import Excel/CSV
            </button>
            <button
              onClick={handleSaveMarks}
              disabled={saving || isLocked}
              className="btn btn-primary text-xs font-semibold shadow-sm"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Results'}
            </button>
          </div>
        </div>

        {/* Selection Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Examination</label>
            <select
              value={selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
              className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              {exams.map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.grade.name} - {ex.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              {currentExam?.examinationSubjects?.map((es: any) => (
                <option key={es.id} value={es.id}>
                  {es.subject.name} (Max: {es.maxMarks}, Pass: {es.passingMarks})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Section</label>
            <select
              value={selectedSectionId}
              onChange={e => setSelectedSectionId(e.target.value)}
              className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              {sections.map(sec => (
                <option key={sec.id} value={sec.id}>
                  {sec.grade.name} - Section {sec.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lock Notification if Exam is Locked */}
      {isLocked && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs flex items-center gap-3">
          <Lock className="w-5 h-5 flex-shrink-0" />
          <div>
            <span className="font-bold">Examination is LOCKED:</span> Official results have been finalized. 
            All marks are in read-only mode to prevent unauthorized modifications.
          </div>
        </div>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-500'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Spreadsheet Grid Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Max Marks: <strong className="text-slate-900 dark:text-white">{gridData?.examSubject?.maxMarks || 0}</strong></span>
          <span>Passing Threshold: <strong className="text-slate-900 dark:text-white">{gridData?.examSubject?.passingMarks || 0}</strong></span>
          <span>Total Students: <strong className="text-slate-900 dark:text-white">{gridData?.students?.length || 0}</strong></span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading student marks grid...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="spreadsheet-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Roll No</th>
                  <th style={{ width: '130px' }}>Admission No</th>
                  <th>Student Name</th>
                  <th style={{ width: '130px' }}>Status</th>
                  <th style={{ width: '140px' }}>Marks Obtained</th>
                  <th style={{ width: '110px' }}>Percentage</th>
                  <th style={{ width: '90px' }}>Result</th>
                </tr>
              </thead>
              <tbody>
                {gridData?.students?.map((st: any, idx: number) => {
                  const entry = entries[st.enrollmentId] || { marks: '', status: 'PRESENT', remarks: '' };
                  const maxM = gridData?.examSubject?.maxMarks || 60;
                  const marksNum = Number(entry.marks);
                  const isPresent = entry.status === 'PRESENT';
                  const pct = isPresent && entry.marks !== '' && !isNaN(marksNum)
                    ? Math.round((marksNum / maxM) * 1000) / 10
                    : null;
                  const isPass = pct !== null ? pct >= ((gridData?.examSubject?.passingMarks || 24) / maxM * 100) : null;
                  const isInvalid = isPresent && entry.marks !== '' && (marksNum < 0 || marksNum > maxM);

                  return (
                    <tr key={st.enrollmentId}>
                      <td className="font-mono text-xs font-semibold">{st.rollNumber}</td>
                      <td className="font-mono text-xs text-slate-500">{st.admissionNumber}</td>
                      <td className="font-medium text-slate-900 dark:text-white">{st.studentName}</td>
                      <td>
                        <select
                          disabled={isLocked}
                          value={entry.status}
                          onChange={e => handleStatusChange(st.enrollmentId, e.target.value)}
                          className="w-full text-xs p-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                        >
                          <option value="PRESENT">PRESENT</option>
                          <option value="ABSENT">ABSENT</option>
                          <option value="EXEMPTED">EXEMPTED</option>
                          <option value="PENDING">PENDING</option>
                        </select>
                      </td>
                      <td>
                        <input
                          id={`mark-input-${idx}`}
                          type="number"
                          disabled={isLocked || !isPresent}
                          value={entry.marks}
                          placeholder={isPresent ? `0 - ${maxM}` : '—'}
                          onChange={e => handleMarkChange(st.enrollmentId, e.target.value)}
                          onKeyDown={e => handleKeyDown(e, idx)}
                          className={`grid-input text-right font-bold ${
                            isInvalid
                              ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                        />
                      </td>
                      <td className="font-mono font-bold text-right text-xs">
                        {pct !== null ? `${pct}%` : '—'}
                      </td>
                      <td>
                        {isPass === true ? (
                          <span className="badge badge-strong">Pass</span>
                        ) : isPass === false ? (
                          <span className="badge badge-support">Fail</span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Import Marks from Spreadsheet
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Upload an Excel (.xlsx) file containing student marks. Invalid rows will be flagged and reported.
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <input
                type="file"
                accept=".xlsx, .csv"
                required
                onChange={e => setImportFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />

              {importReport && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="text-emerald-500 font-semibold">
                    ✓ Valid entries parsed: {importReport.validCount}
                  </div>
                  {importReport.errorCount > 0 && (
                    <div className="text-rose-500 font-semibold">
                      ✗ Error rows detected: {importReport.errorCount}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="btn btn-primary text-xs"
                >
                  {importing ? 'Processing...' : 'Upload & Preview'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
