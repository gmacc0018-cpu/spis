export const DEFAULT_ACADEMIC_YEAR = '2026-2027';

export const USER_ROLES = [
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'TEACHER',
  'STUDENT',
  'PARENT',
  'COORDINATOR'
] as const;

export const EXAM_TYPES = [
  'REVISION_TEST',
  'UNIT_TEST',
  'QUARTERLY',
  'HALF_YEARLY',
  'PRE_FINAL',
  'ANNUAL',
  'CUSTOM'
] as const;

export const ATTENDANCE_STATUSES = [
  'PRESENT',
  'ABSENT',
  'LATE',
  'EXCUSED'
] as const;

export const SESSIONS = [
  'FULL_DAY',
  'FORENOON',
  'AFTERNOON'
] as const;

export const RESULT_STATUSES = [
  'PRESENT',
  'ABSENT',
  'EXEMPTED',
  'PENDING'
] as const;
