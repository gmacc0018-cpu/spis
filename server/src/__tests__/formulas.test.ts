import { describe, it, expect } from 'vitest';
import {
  calculatePercentage,
  calculateGrowthPoints,
  getMasteryLevel,
  calculateMean,
  calculateMedian,
  calculatePassingRate,
  calculateAttendancePercentage
} from 'shared';

describe('SPIS Core Educational Calculations', () => {
  it('Criterion 1: Marks of 42/60 correctly produce 70%', () => {
    const percentage = calculatePercentage(42, 60);
    expect(percentage).toBe(70.0);
  });

  it('Criterion 2: An increase from 70% to 85% correctly produces +15 percentage points', () => {
    const growth = calculateGrowthPoints(85.0, 70.0);
    expect(growth).toBe(15.0);
  });

  it('Criterion 3: Results with different maximum marks are compared using percentages', () => {
    // Test 1: 42/60 = 70%
    const p1 = calculatePercentage(42, 60);
    // Test 2: 75/100 = 75%
    const p2 = calculatePercentage(75, 100);
    expect(p1).toBe(70.0);
    expect(p2).toBe(75.0);
    const growth = calculateGrowthPoints(p2, p1);
    expect(growth).toBe(5.0); // +5 pp growth even though maxMarks changed from 60 to 100
  });

  it('Criterion 4: Missing and absent results are handled according to explicit status rules', () => {
    const pctNull = calculatePercentage(null, 60);
    const pctUndefined = calculatePercentage(undefined, 60);
    expect(pctNull).toBeNull();
    expect(pctUndefined).toBeNull();

    // Growth with missing previous assessment returns null
    const growthAbsent = calculateGrowthPoints(75.0, null);
    expect(growthAbsent).toBeNull();
  });

  it('Criterion 5: A zero denominator never causes a division error', () => {
    const zeroDenominator = calculatePercentage(42, 0);
    const negativeDenominator = calculatePercentage(42, -50);
    expect(zeroDenominator).toBeNull();
    expect(negativeDenominator).toBeNull();
  });

  it('Criterion 6: Mastery level thresholds classification', () => {
    expect(getMasteryLevel(85.0)).toBe('STRONG');
    expect(getMasteryLevel(92.5)).toBe('STRONG');
    expect(getMasteryLevel(70.0)).toBe('GOOD');
    expect(getMasteryLevel(84.9)).toBe('GOOD');
    expect(getMasteryLevel(50.0)).toBe('DEVELOPING');
    expect(getMasteryLevel(69.9)).toBe('DEVELOPING');
    expect(getMasteryLevel(49.9)).toBe('NEEDS_SUPPORT');
    expect(getMasteryLevel(20.0)).toBe('NEEDS_SUPPORT');
    expect(getMasteryLevel(null)).toBeNull();
  });

  it('Criterion 7: Class averages and passing rates calculation', () => {
    const scores = [85, 70, 50, 35, null, undefined];
    const mean = calculateMean(scores);
    // (85 + 70 + 50 + 35) / 4 = 240 / 4 = 60
    expect(mean).toBe(60.0);

    const median = calculateMedian(scores);
    // sorted: [35, 50, 70, 85]. Middle two: (50+70)/2 = 60
    expect(median).toBe(60.0);

    // Passing threshold 40%: 85, 70, 50 pass (3 out of 4) -> 75%
    const passingRate = calculatePassingRate(scores, 40);
    expect(passingRate).toBe(75.0);
  });

  it('Criterion 8: Student attendance calculation', () => {
    const attendance = calculateAttendancePercentage(18, 20);
    expect(attendance).toBe(90.0);

    // Zero sessions handling
    const zeroSessions = calculateAttendancePercentage(0, 0);
    expect(zeroSessions).toBe(100.0);
  });
});
