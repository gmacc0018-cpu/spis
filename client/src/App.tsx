import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { PrincipalDashboard } from './pages/PrincipalDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { MarksEntryPage } from './pages/MarksEntryPage';
import { AttendancePage } from './pages/AttendancePage';
import { SectionComparisonPage } from './pages/SectionComparisonPage';
import { InterventionsPage } from './pages/InterventionsPage';
import { ReportsPage } from './pages/ReportsPage';
import { StudentsPage } from './pages/StudentsPage';
import { ExamsPage } from './pages/ExamsPage';
import { SchoolsPage } from './pages/SchoolsPage';

export const App: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  // Determine root dashboard component based on role
  const RootDashboard = () => {
    if (user.role === 'TEACHER') {
      return <TeacherDashboard />;
    }
    if (user.role === 'STUDENT' || user.role === 'PARENT') {
      return <StudentDashboard />;
    }
    return <PrincipalDashboard />;
  };

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 p-6 max-w-7xl w-full mx-auto animate-fade-in">
            <Routes>
              <Route path="/" element={<RootDashboard />} />
              <Route path="/classes" element={<SectionComparisonPage />} />
              <Route path="/marks" element={<MarksEntryPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/student/attendance" element={<AttendancePage />} />
              <Route path="/interventions" element={<InterventionsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/exams" element={<ExamsPage />} />
              <Route path="/schools" element={<SchoolsPage />} />
              <Route path="/audit" element={<ReportsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
