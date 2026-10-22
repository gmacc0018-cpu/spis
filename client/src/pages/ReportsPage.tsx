import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ShieldCheck,
  FileSpreadsheet,
  GraduationCap,
  CalendarCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ReportsPage: React.FC = () => {
  const { token, user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetch('/api/students', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(st => {
        setStudents(st);
        if (st.length > 0) setSelectedStudentId(st[0].id);
      });

    fetch('/api/academic/sections', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(sec => {
        setSections(sec);
        if (sec.length > 0) setSelectedSectionId(sec[0].id);
      });

    if (user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN') {
      setLoadingLogs(true);
      fetch('/api/reports/audit', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(logs => {
          setAuditLogs(logs);
          setLoadingLogs(false);
        });
    }
  }, [token, user]);

  const handleDownloadStudentPdf = () => {
    if (!selectedStudentId) return;
    window.open(`/api/reports/student/${selectedStudentId}/pdf?token=${token}`, '_blank');
  };

  const handleDownloadSectionExcel = () => {
    if (!selectedSectionId) return;
    window.open(`/api/reports/section/${selectedSectionId}/xlsx?token=${token}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-5 glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Academic Reports & Export Center
          </h2>
          <p className="text-xs text-slate-400">
            Generate printable student report cards, export multi-subject gradebooks in XLSX, and inspect compliance audit logs.
          </p>
        </div>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Student PDF Report Card */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Individual Student Report Card (PDF)
              </h3>
              <p className="text-xs text-slate-400">
                Official printable report containing revision test growth, subject mastery, attendance summary, and teacher recommendations.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Select Student</label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-medium"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.admissionNumber})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownloadStudentPdf}
            className="w-full btn btn-primary text-xs font-semibold shadow-sm flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Generate Printable PDF Report
          </button>
        </div>

        {/* Card 2: Section Performance Workbook */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Section Performance Matrix (Excel XLSX)
              </h3>
              <p className="text-xs text-slate-400">
                Comprehensive spreadsheet matrix of all students in a section, subject-by-subject scores, overall %, and attendance rates.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Select Section</label>
            <select
              value={selectedSectionId}
              onChange={e => setSelectedSectionId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-medium"
            >
              {sections.map(sec => (
                <option key={sec.id} value={sec.id}>
                  {sec.grade.name} - Section {sec.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownloadSectionExcel}
            className="w-full btn btn-success text-xs font-semibold shadow-sm flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Complete XLSX Workbook
          </button>
        </div>
      </div>

      {/* Audit Trail Log for Compliance */}
      {(user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN') && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-500" /> System Audit Trail & Modification Records
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Immutable Compliance Log</span>
          </div>

          {loadingLogs ? (
            <div className="p-8 text-center text-slate-400">Loading audit records...</div>
          ) : (
            <div className="overflow-x-auto max-h-72">
              <table className="spreadsheet-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Entity Type</th>
                    <th>Performed By</th>
                    <th>Audit Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log: any) => (
                    <tr key={log.id}>
                      <td className="font-mono text-[11px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <span className="badge badge-good font-mono text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="font-mono text-xs">{log.entityType}</td>
                      <td className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {log.user ? `${log.user.name} (${log.user.role})` : 'System'}
                      </td>
                      <td className="font-mono text-[11px] text-slate-500 max-w-xs truncate">
                        {log.detailsJson || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
