import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  ShieldCheck,
  Settings,
  Users,
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SchoolsPage: React.FC = () => {
  const { token, user } = useAuth();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New School Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [boardType, setBoardType] = useState('CBSE');
  const [address, setAddress] = useState('');

  const loadSchools = () => {
    setLoading(true);
    fetch('/api/schools', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(d => {
        setSchools(d);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadSchools();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (schools.length === 0) return;
    try {
      const res = await fetch('/api/schools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          code,
          boardType,
          address,
          organizationId: schools[0].organizationId
        })
      });

      if (!res.ok) throw new Error('Failed to create school');
      setShowModal(false);
      setName('');
      setCode('');
      setAddress('');
      loadSchools();
    } catch (err: any) {
      alert(err.message || 'Error creating school');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-5 glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" /> Educational Organization & Multi-School Governance
          </h2>
          <p className="text-xs text-slate-400">
            Network oversight across affiliated schools, board frameworks, and policy-governed data isolation.
          </p>
        </div>

        {user?.role === 'SUPER_ADMIN' && (
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary text-xs font-semibold shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Provision New School
          </button>
        )}
      </div>

      {/* Schools Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading educational network...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schools.map(sch => (
            <div key={sch.id} className="glass-card p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Board: {sch.boardType} • Code: {sch.code}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {sch.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{sch.address || 'Address on file'}</p>
                </div>
                <span className="badge badge-strong">{sch.status}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-slate-800 text-center">
                <div>
                  <div className="text-xs text-slate-400">Students</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {sch._count?.students || 0}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Examinations</div>
                  <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                    {sch._count?.examinations || 0}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Academic Years</div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {sch._count?.academicYears || 0}
                  </div>
                </div>
              </div>

              {/* Policy Settings Preview */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ranking Policy:</span>
                  <span className="font-semibold">{sch.schoolSettings?.rankingVisibility || 'ANONYMIZED_ONLY'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Attendance Flag Threshold:</span>
                  <span className="font-semibold">{sch.schoolSettings?.attendanceThresholdPct || 75}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Remedial Support Threshold:</span>
                  <span className="font-semibold">&lt; {sch.schoolSettings?.remedialThresholdPct || 50}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Provision Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Provision New School under Network
            </h3>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">School Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cambridge Heights Academy"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">School Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CAMBRIDGE"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Board Framework</label>
                  <select
                    value={boardType}
                    onChange={e => setBoardType(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700"
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="STATE">State Board</option>
                    <option value="IB">International Baccalaureate (IB)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Campus Address</label>
                <input
                  type="text"
                  placeholder="e.g. 100 University Avenue"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
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
                  Provision School
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
