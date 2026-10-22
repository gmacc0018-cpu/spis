export type UserRole = 
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'TEACHER'
  | 'STUDENT'
  | 'PARENT'
  | 'COORDINATOR';

export type ExamType = 
  | 'REVISION_TEST'
  | 'UNIT_TEST'
  | 'QUARTERLY'
  | 'HALF_YEARLY'
  | 'PRE_FINAL'
  | 'ANNUAL'
  | 'CUSTOM';

export type ExamStatus = 
  | 'DRAFT'
  | 'OPEN'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'LOCKED';

export type ResultStatus = 
  | 'PRESENT'
  | 'ABSENT'
  | 'EXEMPTED'
  | 'PENDING';

export type AttendanceStatus = 
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'EXCUSED';

export type AttendanceSession = 
  | 'FULL_DAY'
  | 'FORENOON'
  | 'AFTERNOON';

export type MasteryLevel = 
  | 'STRONG'
  | 'GOOD'
  | 'DEVELOPING'
  | 'NEEDS_SUPPORT';

export type StudentStatus = 
  | 'ACTIVE'
  | 'TRANSFERRED'
  | 'GRADUATED'
  | 'INACTIVE';

export type InterventionStatus = 
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type InterventionOutcome = 
  | 'IMPROVED'
  | 'MAINTAINED'
  | 'NEEDS_FURTHER_ACTION';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId?: string | null;
  organizationId?: string | null;
  studentId?: string | null;
}

export interface MasteryThresholds {
  strong: number;       // default 85
  good: number;         // default 70
  developing: number;   // default 50
  passingPct: number;   // default 40
}

export interface StudentGrowthMetric {
  subjectId: string;
  subjectName: string;
  previousExamId: string;
  previousExamName: string;
  previousPercentage: number;
  currentExamId: string;
  currentExamName: string;
  currentPercentage: number;
  growthPoints: number; // current - previous
  direction: 'IMPROVED' | 'DECLINED' | 'STABLE';
}

export interface SubjectAnalyticsSummary {
  subjectId: string;
  subjectName: string;
  averagePercentage: number;
  medianPercentage: number;
  highestPercentage: number;
  lowestPercentage: number;
  passingRate: number;
  totalValidResults: number;
  absentCount: number;
  exemptedCount: number;
  masteryDistribution: {
    strong: number;
    good: number;
    developing: number;
    needsSupport: number;
  };
}

export interface SectionComparisonMetric {
  sectionId: string;
  sectionName: string;
  enrolledStudents: number;
  validResults: number;
  averagePercentage: number;
  medianPercentage: number;
  passingRate: number;
  attendanceRate: number;
}

export interface StudentAttendanceSummary {
  studentId: string;
  studentName: string;
  rollNumber: string;
  totalSessions: number;
  presentSessions: number;
  absentSessions: number;
  lateSessions: number;
  excusedSessions: number;
  attendancePercentage: number;
  flaggedLowAttendance: boolean; // below threshold e.g. 75%
}
