import { MasteryLevel, MasteryThresholds } from './types.js';

export const DEFAULT_MASTERY_THRESHOLDS: MasteryThresholds = {
  strong: 85.0,
  good: 70.0,
  developing: 50.0,
  passingPct: 40.0
};

/**
 * Calculates percentage from obtained and maximum marks.
 * Returns null if obtained is null, or if maxMarks is <= 0.
 * Rounds to 2 decimal places.
 */
export function calculatePercentage(
  marksObtained: number | null | undefined,
  maxMarks: number
): number | null {
  if (marksObtained === null || marksObtained === undefined || isNaN(marksObtained)) {
    return null;
  }
  if (!maxMarks || maxMarks <= 0 || isNaN(maxMarks)) {
    return null;
  }
  const pct = (marksObtained / maxMarks) * 100;
  return Math.round(pct * 100) / 100;
}

/**
 * Calculates growth in percentage points between two comparable assessments.
 * Example: 70% to 85% produces +15.0 percentage points.
 */
export function calculateGrowthPoints(
  currentPercentage: number | null,
  previousPercentage: number | null
): number | null {
  if (
    currentPercentage === null ||
    currentPercentage === undefined ||
    previousPercentage === null ||
    previousPercentage === undefined
  ) {
    return null;
  }
  const diff = currentPercentage - previousPercentage;
  return Math.round(diff * 100) / 100;
}

/**
 * Categorizes a percentage into a configurable Mastery Level.
 */
export function getMasteryLevel(
  percentage: number | null,
  thresholds: MasteryThresholds = DEFAULT_MASTERY_THRESHOLDS
): MasteryLevel | null {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return null;
  }
  if (percentage >= thresholds.strong) {
    return 'STRONG';
  }
  if (percentage >= thresholds.good) {
    return 'GOOD';
  }
  if (percentage >= thresholds.developing) {
    return 'DEVELOPING';
  }
  return 'NEEDS_SUPPORT';
}

/**
 * Computes arithmetic mean of an array of numbers, ignoring null/undefined.
 */
export function calculateMean(values: (number | null | undefined)[]): number {
  const valid = values.filter((v): v is number => typeof v === 'number' && !isNaN(v));
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / valid.length) * 100) / 100;
}

/**
 * Computes median of an array of numbers.
 */
export function calculateMedian(values: (number | null | undefined)[]): number {
  const valid = values.filter((v): v is number => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
  if (valid.length === 0) return 0;
  const mid = Math.floor(valid.length / 2);
  if (valid.length % 2 !== 0) {
    return valid[mid];
  }
  return Math.round(((valid[mid - 1] + valid[mid]) / 2) * 100) / 100;
}

/**
 * Calculates passing rate percentage.
 */
export function calculatePassingRate(
  percentages: (number | null | undefined)[],
  passingThreshold = 40.0
): number {
  const valid = percentages.filter((p): p is number => typeof p === 'number' && !isNaN(p));
  if (valid.length === 0) return 0;
  const passed = valid.filter(p => p >= passingThreshold).length;
  return Math.round((passed / valid.length) * 10000) / 100;
}

/**
 * Calculates student attendance percentage.
 */
export function calculateAttendancePercentage(
  presentSessions: number,
  totalSessions: number
): number {
  if (!totalSessions || totalSessions <= 0) return 100.0;
  const pct = (presentSessions / totalSessions) * 100;
  return Math.round(pct * 100) / 100;
}
