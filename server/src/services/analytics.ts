import prisma from '../db/prisma.js';
import {
  calculatePercentage,
  calculateGrowthPoints,
  calculateMean,
  calculateMedian,
  calculatePassingRate,
  getMasteryLevel,
  DEFAULT_MASTERY_THRESHOLDS
} from 'shared';

export interface SubjectStats {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  maxMarks: number;
  averagePercentage: number;
  medianPercentage: number;
  highestPercentage: number;
  lowestPercentage: number;
  passingRate: number;
  totalValid: number;
  absentCount: number;
  exemptedCount: number;
  bands: {
    strong: number;
    good: number;
    developing: number;
    needsSupport: number;
  };
}

export class AnalyticsService {
  /**
   * Calculates subject-level statistics for an examination subject
   */
  static async getSubjectStats(examinationSubjectId: string): Promise<SubjectStats | null> {
    const examSubject = await prisma.examinationSubject.findUnique({
      where: { id: examinationSubjectId },
      include: {
        subject: true,
        assessmentResults: {
          include: {
            enrollment: true
          }
        }
      }
    });

    if (!examSubject) return null;

    const validPercentages: number[] = [];
    let absentCount = 0;
    let exemptedCount = 0;
    const bands = { strong: 0, good: 0, developing: 0, needsSupport: 0 };

    for (const res of examSubject.assessmentResults) {
      if (res.status === 'ABSENT') {
        absentCount++;
      } else if (res.status === 'EXEMPTED') {
        exemptedCount++;
      } else if (res.percentage !== null && res.percentage !== undefined) {
        validPercentages.push(res.percentage);
        const band = getMasteryLevel(res.percentage);
        if (band === 'STRONG') bands.strong++;
        else if (band === 'GOOD') bands.good++;
        else if (band === 'DEVELOPING') bands.developing++;
        else if (band === 'NEEDS_SUPPORT') bands.needsSupport++;
      }
    }

    const average = calculateMean(validPercentages);
    const median = calculateMedian(validPercentages);
    const passingRate = calculatePassingRate(validPercentages, (examSubject.passingMarks / examSubject.maxMarks) * 100);
    const highest = validPercentages.length > 0 ? Math.max(...validPercentages) : 0;
    const lowest = validPercentages.length > 0 ? Math.min(...validPercentages) : 0;

    return {
      subjectId: examSubject.subjectId,
      subjectName: examSubject.subject.name,
      subjectCode: examSubject.subject.code,
      maxMarks: examSubject.maxMarks,
      averagePercentage: average,
      medianPercentage: median,
      highestPercentage: highest,
      lowestPercentage: lowest,
      passingRate,
      totalValid: validPercentages.length,
      absentCount,
      exemptedCount,
      bands
    };
  }

  /**
   * Compares two examinations for growth across common subjects in a section or grade
   */
  static async compareExaminations(
    prevExamId: string,
    currExamId: string,
    sectionId?: string
  ) {
    const [prevExam, currExam] = await Promise.all([
      prisma.examination.findUnique({
        where: { id: prevExamId },
        include: { examinationSubjects: { include: { subject: true } } }
      }),
      prisma.examination.findUnique({
        where: { id: currExamId },
        include: { examinationSubjects: { include: { subject: true } } }
      })
    ]);

    if (!prevExam || !currExam) throw new Error('One or both examinations not found.');

    // Find overlapping subjects
    const prevSubjectsMap = new Map(prevExam.examinationSubjects.map(es => [es.subjectId, es]));
    const currSubjectsMap = new Map(currExam.examinationSubjects.map(es => [es.subjectId, es]));

    const comparisons = [];

    for (const [subjectId, currEs] of currSubjectsMap.entries()) {
      const prevEs = prevSubjectsMap.get(subjectId);
      if (!prevEs) continue;

      const whereClause: any = {
        examinationSubjectId: { in: [prevEs.id, currEs.id] }
      };
      if (sectionId) {
        whereClause.enrollment = { sectionId };
      }

      const results = await prisma.assessmentResult.findMany({
        where: whereClause,
        include: { enrollment: { include: { student: true } } }
      });

      const prevPctList: number[] = [];
      const currPctList: number[] = [];

      for (const r of results) {
        if (r.percentage === null || r.percentage === undefined) continue;
        if (r.examinationSubjectId === prevEs.id) prevPctList.push(r.percentage);
        if (r.examinationSubjectId === currEs.id) currPctList.push(r.percentage);
      }

      const prevAvg = calculateMean(prevPctList);
      const currAvg = calculateMean(currPctList);
      const growthPoints = calculateGrowthPoints(currAvg, prevAvg) || 0;

      comparisons.push({
        subjectId,
        subjectName: currEs.subject.name,
        previousExamName: prevExam.name,
        currentExamName: currExam.name,
        previousAverage: prevAvg,
        currentAverage: currAvg,
        growthPoints,
        direction: growthPoints > 0 ? 'IMPROVED' : growthPoints < 0 ? 'DECLINED' : 'STABLE'
      });
    }

    return comparisons;
  }

  /**
   * Generates student-specific historical progress curve and radar data
   */
  static async getStudentAnalytics(studentId: string, academicYearId?: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: academicYearId ? { academicYearId } : undefined,
          include: {
            section: true,
            grade: true,
            academicYear: true,
            assessmentResults: {
              include: {
                examinationSubject: {
                  include: {
                    examination: true,
                    subject: true
                  }
                }
              }
            },
            attendanceRecords: true
          }
        }
      }
    });

    if (!student) return null;

    // Collect all results ordered chronologically
    const allResults = student.enrollments.flatMap(e =>
      e.assessmentResults.map(r => ({
        enrollmentId: e.id,
        academicYear: e.academicYear.name,
        gradeName: e.grade.name,
        sectionName: e.section.name,
        examId: r.examinationSubject.examination.id,
        examName: r.examinationSubject.examination.name,
        examType: r.examinationSubject.examination.examType,
        examDate: r.examinationSubject.examination.startDate || r.createdAt,
        subjectId: r.examinationSubject.subject.id,
        subjectName: r.examinationSubject.subject.name,
        subjectCode: r.examinationSubject.subject.code,
        marksObtained: r.marksObtained,
        maxMarks: r.examinationSubject.maxMarks,
        percentage: r.percentage,
        status: r.status,
        isPassing: r.isPassing
      }))
    );

    // Group by subject to calculate strengths, weaknesses, and personal bests
    const subjectMap = new Map<string, {
      subjectName: string;
      percentages: number[];
      recentPercentage: number | null;
      highestPercentage: number;
      growth: number | null;
    }>();

    for (const r of allResults) {
      if (!subjectMap.has(r.subjectId)) {
        subjectMap.set(r.subjectId, {
          subjectName: r.subjectName,
          percentages: [],
          recentPercentage: null,
          highestPercentage: 0,
          growth: null
        });
      }
      if (r.percentage !== null && r.percentage !== undefined) {
        const item = subjectMap.get(r.subjectId)!;
        item.percentages.push(r.percentage);
        item.recentPercentage = r.percentage;
        if (r.percentage > item.highestPercentage) {
          item.highestPercentage = r.percentage;
        }
      }
    }

    // Compute growth across the last two assessments for each subject
    const subjectProfiles = Array.from(subjectMap.entries()).map(([subjectId, data]) => {
      let growthPoints: number | null = null;
      if (data.percentages.length >= 2) {
        const prev = data.percentages[data.percentages.length - 2];
        const curr = data.percentages[data.percentages.length - 1];
        growthPoints = calculateGrowthPoints(curr, prev);
      }
      const avg = calculateMean(data.percentages);
      return {
        subjectId,
        subjectName: data.subjectName,
        averagePercentage: avg,
        recentPercentage: data.recentPercentage,
        personalBest: data.highestPercentage,
        growthPoints,
        masteryLevel: getMasteryLevel(avg),
        assessmentCount: data.percentages.length
      };
    });

    // Attendance summary
    const totalSessions = student.enrollments.reduce((sum, e) => sum + e.attendanceRecords.length, 0);
    const presentSessions = student.enrollments.reduce(
      (sum, e) => sum + e.attendanceRecords.filter(a => a.status === 'PRESENT').length,
      0
    );
    const attendancePercentage = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 10000) / 100 : 100;

    return {
      studentId: student.id,
      admissionNumber: student.admissionNumber,
      fullName: `${student.firstName} ${student.lastName}`,
      status: student.status,
      enrollments: student.enrollments.map(e => ({
        enrollmentId: e.id,
        year: e.academicYear.name,
        grade: e.grade.name,
        section: e.section.name,
        rollNumber: e.rollNumber,
        status: e.status
      })),
      subjectProfiles,
      overallAverage: calculateMean(subjectProfiles.map(s => s.averagePercentage)),
      attendance: {
        totalSessions,
        presentSessions,
        attendancePercentage,
        flaggedLow: attendancePercentage < 75.0
      },
      allResults
    };
  }

  /**
   * Generates rule-based, evidence-backed educational insights
   */
  static generateInsights(comparisonData: Array<{
    subjectName: string;
    previousAverage: number;
    currentAverage: number;
    growthPoints: number;
  }>, supportStudentsCount: number, enrichmentStudentsCount: number) {
    const insights: string[] = [];

    // Top improved subjects
    const improved = comparisonData.filter(c => c.growthPoints > 0).sort((a, b) => b.growthPoints - a.growthPoints);
    if (improved.length > 0) {
      const top = improved[0];
      insights.push(`Strongest progress observed in ${top.subjectName}, improving by +${top.growthPoints}% (from ${top.previousAverage}% to ${top.currentAverage}%).`);
    }

    // Declining subjects
    const declining = comparisonData.filter(c => c.growthPoints < -2).sort((a, b) => a.growthPoints - b.growthPoints);
    if (declining.length > 0) {
      const drop = declining[0];
      insights.push(`Caution: ${drop.subjectName} declined by ${Math.abs(drop.growthPoints)}% (from ${drop.previousAverage}% to ${drop.currentAverage}%). Focus remedial practice on recent syllabus topics.`);
    }

    if (supportStudentsCount > 0) {
      insights.push(`${supportStudentsCount} student(s) are performing below the 50% mastery threshold. Recommended: Create targeted remedial intervention plans.`);
    }

    if (enrichmentStudentsCount > 0) {
      insights.push(`${enrichmentStudentsCount} student(s) achieved above 85% mastery consistently and are candidates for advanced enrichment assignments.`);
    }

    if (insights.length === 0) {
      insights.push('Performance is consistent across recent assessments. Continue standard instructional pacing.');
    }

    return insights;
  }
}
