import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  ArrowRightLeft,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const StudentsPage: React.FC = () => {
  const { token, user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Admit Modal
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [newAdmissionNumber, setNewAdmissionNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  // Transfer Modal
  const [transferringStudent, setTransferringStudent] = useState<any | null>(null);
  const [targetSectionId, setTargetSectionId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const loadStudents = () => {
    setLoading(true);
    fetch(`/api/students?search=${encodeURIComponent(search)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(d => {
        setStudents(d);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadStudents();

    fetch('/api/academic/sections', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(sec => {
        setSections(sec);
        if (sec.length > 0) {
          setSelectedSectionId(sec[0].id);
          setTargetSectionId(sec[0].id);
        }
      });

    fetch('/api/academic/years', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(y => setYears(y));
  }, [token, search]);

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const section = sections.find(s => s.id === selectedSectionId);
    if (!section) return;

    try {
      const res = await fetch('/api/students/admit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          admissionNumber: newAdmissionNumber,
          firstName,
          lastName,
          gradeId: section.gradeId,
          sectionId: section.id,
          academicYearId: section.academicYearId,
          rollNumber
        })
      });

      if (!res.ok) throw new Error('Failed to admit student');
      setShowAdmitModal(false);
      setNewAdmissionNumber('');
      setFirstName('');
      setLastName('');
      setRollNumber('');
      loadStudents();
    } catch (err: any) {
      alert(err.message || 'Error admitting student');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringStudent) return;

    try {
      const res = await fetch(`/api/students/${transferringStudent.id}/transfer-section`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetSectionId,
          reason: transferReason
        })
      });

      if (!res.ok) throw new Error('Transfer failed');
      setTransferringStudent(null);
      loadStudents();
    } catch (err: any) {
      alert(err.message || 'Error transferring student');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-5 glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" /> Student Directory & Historical Enrollments
          </h2>
          <p className="text-xs text-slate-400">
            Admit students, manage current sections, and transfer students while retaining 100% of historical exam results.
          </p>
        </div>

        {(user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN') && (
          <button
            onClick={() => setShowAdmitModal(true)}
            className="btn btn-primary text-xs font-semibold shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Admit New Student
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name or admission number..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading student directory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="spreadsheet-table">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Class & Section</th>
                  <th>Roll No</th>
                  <th>Enrollment Status</th>
                  <th style={{ width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(st => {
                  const activeEnr = st.enrollments?.[0];

                  return (
                    <tr key={st.id}>
                      <td className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {st.admissionNumber}
                      </td>
                      <td className="font-medium text-slate-900 dark:text-white">
                        {st.firstName} {st.lastName}
                      </td>
                      <td>
                        {activeEnr ? `${activeEnr.grade.name} - ${activeEnr.section.name}` : 'Not Assigned'}
                      </td>
                      <td className="font-mono">{activeEnr?.rollNumber || '—'}</td>
                      <td>
                        <span className="badge badge-strong">{st.status}</span>
                      </td>
                      <td>
                        {(user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN') && (
                          <button
                            onClick={() => setTransferringStudent(st)}
                            className="btn btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1"
                            title="Transfer Section (preserves history)"
                          >
                            <ArrowRightLeft className="w-3 h-3" /> Transfer
                          </button>
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

      {/* Admit Modal */}
      {showAdmitModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Admit New Student
            </h3>

            <form onSubmit={handleAdmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Admission Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OAK-2026-025"
                  value={newAdmissionNumber}
                  onChange={e => setNewAdmissionNumber(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned Section</label>
                  <select
                    value={selectedSectionId}
                    onChange={e => setSelectedSectionId(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                  >
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.grade.name} - {s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 05"
                    value={rollNumber}
                    onChange={e => setRollNumber(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdmitModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary text-xs">
                  Admit Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Section Modal */}
      {transferringStudent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Transfer Section — Historical Preservation
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Transferring <strong>{transferringStudent.firstName} {transferringStudent.lastName}</strong>.
              All existing marks and attendance in their previous section will be permanently preserved.
            </p>

            <form onSubmit={handleTransfer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Destination Section</label>
                <select
                  value={targetSectionId}
                  onChange={e => setTargetSectionId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                >
                  {sections.map(s => (
                    <option key={s.id} value={s.id}>{s.grade.name} - Section {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Transfer Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Academic rebalancing / student request"
                  value={transferReason}
                  onChange={e => setTransferReason(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferringStudent(null)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary text-xs">
                  Complete Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
