import { Router, Response } from 'express';
import prisma from '../db/prisma.js';
import { AnalyticsService } from '../services/analytics.js';
import { AuthenticatedRequest, authenticateToken, getSchoolScope } from '../middleware/auth.js';
import { calculateMean, calculateMedian, calculatePassingRate } from 'shared';

const router = Router();
router.use(authenticateToken);

// Root analytics info
router.get('/', (req, res) => {
  res.json({ message: 'Analytics API endpoint. Use /api/analytics/principal, /api/analytics/teacher, /api/analytics/student/:id, or /api/analytics/compare' });
});

// Principal / Headmaster Dashboard Analytics
router.get('/principal', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = getSchoolScope(req);
    if (!schoolId) {
      res.status(400).json({ error: 'School scope required' });
      return;
    }

    const { academicYearId, gradeId } = req.query;

    // Get current or selected academic year
    const activeYear = academicYearId
      ? await prisma.academicYear.findUnique({ where: { id: String(academicYearId) } })
      : await prisma.academicYear.findFirst({ where: { schoolId, isCurrent: true } });

    if (!activeYear) {
      res.json({ message: 'No academic year configured yet.', empty: true });
      return;
    }

    // Get sections under target grade or all grades
    const sections = await prisma.section.findMany({
      where: {
        academicYearId: activeYear.id,
        gradeId: gradeId ? String(gradeId) : undefined
      },
      include: {
        grade: true,
        enrollments: {
          include: {
            assessmentResults: true,
            attendanceRecords: true
          }
        }
      }
    });

    // Section comparison aggregates
    const sectionComparisons = sections.map(sec => {
      const allResults = sec.enrollments.flatMap(e => e.assessmentResults);
      const validPercentages = allResults
        .map(r => r.percentage)
        .filter((p): p is number => typeof p === 'number');

      const allAttendance = sec.enrollments.flatMap(e => e.attendanceRecords);
      const presentCount = allAttendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      const attendanceRate = allAttendance.length > 0 ? Math.round((presentCount / allAttendance.length) * 10000) / 100 : 100;

      return {
        sectionId: sec.id,
        sectionName: `${sec.grade.name} - ${sec.name}`,
        enrolledCount: sec.enrollments.length,
        averagePercentage: calculateMean(validPercentages),
        medianPercentage: calculateMedian(validPercentages),
        passingRate: calculatePassingRate(validPercentages),
        attendanceRate
      };
    });

    // Recent examinations
    const examinations = await prisma.examination.findMany({
      where: {
        schoolId,
        academicYearId: activeYear.id
      },
      include: {
        grade: true,
        examinationSubjects: {
          include: {
            subject: true,
            assessmentResults: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 6
    });

    // Compute subject-wise school averages across the most recent exams
    const subjectMap = new Map<string, { name: string; percentages: number[] }>();
    for (const exam of examinations) {
      for (const es of exam.examinationSubjects) {
        if (!subjectMap.has(es.subjectId)) {
          subjectMap.set(es.subjectId, { name: es.subject.name, percentages: [] });
        }
        for (const res of es.assessmentResults) {
          if (res.percentage !== null && res.percentage !== undefined) {
            subjectMap.get(es.subjectId)!.percentages.push(res.percentage);
          }
        }
      }
    }

    const subjectAverages = Array.from(subjectMap.entries()).map(([subjectId, d]) => ({
      subjectId,
      subjectName: d.name,
      averagePercentage: calculateMean(d.percentages)
    })).sort((a, b) => b.averagePercentage - a.averagePercentage);

    // Identify students needing academic support (< 50% average across valid results)
    const enrollments = sections.flatMap(s => s.enrollments);
    const supportStudents = [];
    const enrichmentStudents = [];

    for (const enr of enrollments) {
      const pcts = enr.assessmentResults.map(r => r.percentage).filter((p): p is number => typeof p === 'number');
      if (pcts.length > 0) {
        const avg = calculateMean(pcts);
        if (avg < 50.0) {
          supportStudents.push({ enrollmentId: enr.id, studentId: enr.studentId, average: avg });
        } else if (avg >= 85.0) {
          enrichmentStudents.push({ enrollmentId: enr.id, studentId: enr.studentId, average: avg });
        }
      }
    }

    res.json({
      schoolId,
      academicYear: activeYear.name,
      totalStudentsEnrolled: enrollments.length,
      schoolAverage: calculateMean(sectionComparisons.map(s => s.averagePercentage)),
      sectionComparisons,
      subjectAverages,
      supportCount: supportStudents.length,
      enrichmentCount: enrichmentStudents.length,
      recentExaminations: examinations.map(e => ({
        id: e.id,
        name: e.name,
        examType: e.examType,
        status: e.status,
        gradeName: e.grade.name,
        subjectCount: e.examinationSubjects.length
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch principal analytics' });
  }
});

// Teacher Dashboard Analytics
router.get('/teacher', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Get assignments
    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId },
      include: {
        section: {
          include: {
            grade: true,
            enrollments: {
              where: { status: 'ACTIVE' },
              include: {
                student: true,
                assessmentResults: {
                  include: {
                    examinationSubject: {
                      include: { subject: true, examination: true }
                    }
                  }
                }
              }
            }
          }
        },
        subject: true
      }
    });

    const classes = assignments.map(a => {
      const students = a.section.enrollments.map(e => {
        // Results in this teacher's subject
        const subjectResults = e.assessmentResults.filter(
          r => r.examinationSubject.subjectId === a.subjectId && r.percentage !== null
        );
        const pcts = subjectResults.map(r => r.percentage as number);
        const avg = calculateMean(pcts);

        return {
          enrollmentId: e.id,
          studentId: e.student.id,
          name: `${e.student.firstName} ${e.student.lastName}`,
          rollNumber: e.rollNumber,
          averagePercentage: avg,
          latestResult: subjectResults[subjectResults.length - 1]?.percentage ?? null,
          needsSupport: avg > 0 && avg < 50.0
        };
      });

      const validStudentAvgs = students.map(s => s.averagePercentage).filter(a => a > 0);

      return {
        assignmentId: a.id,
        className: `${a.section.grade.name} - ${a.section.name}`,
        subjectName: a.subject.name,
        subjectCode: a.subject.code,
        isClassTeacher: a.isClassTeacher,
        studentCount: students.length,
        classAverage: calculateMean(validStudentAvgs),
        passingRate: calculatePassingRate(validStudentAvgs),
        students
      };
    });

    res.json({ classes });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch teacher analytics' });
  }
});

// Student Individual Academic Analytics
router.get('/student/:studentId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;

    // Check student privacy permission: Student role can only access self
    if (req.user?.role === 'STUDENT' && req.user.studentId !== studentId) {
      res.status(403).json({ error: 'Access denied. You can only view your own records.' });
      return;
    }

    const analytics = await AnalyticsService.getStudentAnalytics(studentId);
    if (!analytics) {
      res.status(404).json({ error: 'Student analytics not found' });
      return;
    }

    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch student analytics' });
  }
});

// Compare two examinations and generate verified insights
router.get('/compare', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prevExamId, currExamId, sectionId } = req.query;

    if (!prevExamId || !currExamId) {
      res.status(400).json({ error: 'prevExamId and currExamId are required' });
      return;
    }

    const comparisons = await AnalyticsService.compareExaminations(
      String(prevExamId),
      String(currExamId),
      sectionId ? String(sectionId) : undefined
    );

    // Rule-based insights
    const insights = AnalyticsService.generateInsights(comparisons, 2, 4);

    res.json({
      comparisons,
      insights
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to compare examinations' });
  }
});

// Organization overview (Super Admin only)
router.get('/organization', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schools = await prisma.school.findMany({
      include: {
        _count: {
          select: {
            students: true,
            examinations: true,
            users: true
          }
        }
      }
    });

    res.json({
      totalSchools: schools.length,
      schools: schools.map(s => ({
        id: s.id,
        name: s.name,
        code: s.code,
        boardType: s.boardType,
        studentCount: s._count.students,
        examCount: s._count.examinations,
        userCount: s._count.users
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch organization analytics' });
  }
});

export default router;
