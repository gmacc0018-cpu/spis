import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Save,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Calendar,
  Clock,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AttendancePage: React.FC = () => {
  const { token } = useAuth();

  // Mode: Daily Register vs Section Summary
  const [activeTab, setActiveTab] = useState<'daily' | 'summary'>('daily');

  // Filters
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [date, setDate] = useState<string>(() => {
    // default to 2026-10-21 (current academic date in context)
    return '2026-10-21';
  });

  // Daily entries
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: string; remarks: string }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Summary data
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    fetch('/api/academic/sections', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setSections(data);
        if (data.length > 0) {
          setSelectedSectionId(data[0].id);
        }
      });
  }, [token]);

  const loadDailyAttendance = () => {
    if (!selectedSectionId || !date) return;
    setLoading(true);
    setFeedback(null);

    fetch(`/api/attendance/section?sectionId=${selectedSectionId}&date=${date}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        const map: Record<string, any> = {};
        for (const st of data) {
          map[st.enrollmentId] = {
            status: st.currentStatus || 'PRESENT',
            remarks: st.attendanceRecord?.remarks || ''
          };
        }
        setAttendanceMap(map);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const loadSummary = () => {
    if (!selectedSectionId) return;
    setSummaryLoading(true);

    fetch(`/api/attendance/summary?sectionId=${selectedSectionId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setSummaryData(data);
        setSummaryLoading(false);
      })
      .catch(err => {
        console.error(err);
        setSummaryLoading(false);
      });
  };

  useEffect(() => {
    if (activeTab === 'daily') {
      loadDailyAttendance();
    } else {
      loadSummary();
    }
  }, [selectedSectionId, date, activeTab]);

  const handleStatusChange = (enrollmentId: string, status: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        status
      }
    }));
  };

  const handleMarkAllPresent = () => {
    setAttendanceMap(prev => {
      const next: Record<string, any> = {};
      for (const st of students) {
        next[st.enrollmentId] = {
          ...prev[st.enrollmentId],
          status: 'PRESENT'
        };
      }
      return next;
    });
  };

  const handleSaveAttendance = async () => {
    if (!selectedSectionId || students.length === 0) return;
    setSaving(true);
    setFeedback(null);

    const entries = students.map(st => ({
      enrollmentId: st.enrollmentId,
      date,
      status: attendanceMap[st.enrollmentId]?.status || 'PRESENT',
      session: 'FULL_DAY',
      remarks: attendanceMap[st.enrollmentId]?.remarks || ''
    }));

    try {
      const res = await fetch('/api/attendance/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sectionId: selectedSectionId, entries })
      });

      if (!res.ok) throw new Error('Failed to save attendance');
      const data = await res.json();
      setFeedback({ type: 'success', message: `Attendance successfully recorded for ${data.count} students.` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error saving attendance' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 glass-card">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-600" /> Student Attendance & Session Analytics
          </h2>
          <p className="text-xs text-slate-400">
            Track daily instructional sessions, compute attendance percentages, and flag persistent absenteeism.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('daily')}
            className={`btn text-xs font-semibold ${
              activeTab === 'daily' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Daily Register
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`btn text-xs font-semibold ${
              activeTab === 'summary' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            <Filter className="w-3.5 h-3.5" /> Attendance Analytics
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Class Section</label>
            <select
              value={selectedSectionId}
              onChange={e => setSelectedSectionId(e.target.value)}
              className="text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-medium"
            >
              {sections.map(sec => (
                <option key={sec.id} value={sec.id}>
                  {sec.grade.name} - Section {sec.name}
                </option>
              ))}
            </select>
          </div>

          {activeTab === 'daily' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Session Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-medium"
              />
            </div>
          )}
        </div>

        {activeTab === 'daily' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllPresent}
              className="btn btn-secondary text-xs"
            >
              <UserCheck className="w-3.5 h-3.5" /> Mark All Present
            </button>
            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="btn btn-success text-xs font-semibold shadow-sm"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        )}
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-500'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tab 1: Daily Register */}
      {activeTab === 'daily' && (
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading attendance register...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="spreadsheet-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Roll No</th>
                    <th style={{ width: '130px' }}>Admission No</th>
                    <th>Student Name</th>
                    <th style={{ width: '320px' }}>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(st => {
                    const current = attendanceMap[st.enrollmentId]?.status || 'PRESENT';

                    return (
                      <tr key={st.enrollmentId}>
                        <td className="font-mono text-xs font-semibold">{st.rollNumber}</td>
                        <td className="font-mono text-xs text-slate-500">{st.admissionNumber}</td>
                        <td className="font-medium text-slate-900 dark:text-white">{st.studentName}</td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map(status => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleStatusChange(st.enrollmentId, status)}
                                className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition ${
                                  current === status
                                    ? status === 'PRESENT'
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : status === 'ABSENT'
                                      ? 'bg-rose-600 text-white shadow-sm'
                                      : status === 'LATE'
                                      ? 'bg-amber-600 text-white shadow-sm'
                                      : 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Section Summary & Attendance Intelligence */}
      {activeTab === 'summary' && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between text-xs text-slate-500">
            <span>Aggregated Attendance Profile</span>
            <span className="font-medium text-amber-500 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Flag threshold: &lt; 75%
            </span>
          </div>

          {summaryLoading ? (
            <div className="p-12 text-center text-slate-400">Computing attendance summary...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="spreadsheet-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Admission No</th>
                    <th>Student Name</th>
                    <th>Total Sessions</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late / Excused</th>
                    <th>Attendance Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.map(row => (
                    <tr key={row.enrollmentId}>
                      <td className="font-mono text-xs font-semibold">{row.rollNumber}</td>
                      <td className="font-mono text-xs text-slate-500">{row.admissionNumber}</td>
                      <td className="font-medium text-slate-900 dark:text-white">{row.studentName}</td>
                      <td>{row.totalDays}</td>
                      <td className="text-emerald-600 font-semibold">{row.presentDays}</td>
                      <td className="text-rose-600 font-semibold">{row.absentDays}</td>
                      <td>{row.lateDays + row.excusedDays}</td>
                      <td className="font-mono font-bold text-sm">
                        {row.attendancePercentage}%
                      </td>
                      <td>
                        {row.flaggedLow ? (
                          <span className="badge badge-support flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Low Attendance
                          </span>
                        ) : (
                          <span className="badge badge-strong">Regular</span>
                        )}
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
