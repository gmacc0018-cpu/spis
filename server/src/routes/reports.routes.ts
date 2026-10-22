import { Router, Response } from 'express';
import prisma from '../db/prisma.js';
import { AnalyticsService } from '../services/analytics.js';
import { ExportService } from '../services/export.js';
import { AuthenticatedRequest, authenticateToken, requireRole, getSchoolScope } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();
router.use(authenticateToken);

// Root reports info
router.get('/', (req, res) => {
  res.json({ message: 'Reports API endpoint. Use /api/reports/student/:id/pdf, /api/reports/section/:id/xlsx, or /api/reports/audit' });
});

// Download printable student PDF report card
router.get('/student/:studentId/pdf', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;

    // Student privacy check
    if (req.user?.role === 'STUDENT' && req.user.studentId !== studentId) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const analytics = await AnalyticsService.getStudentAnalytics(studentId);
    if (!analytics) {
      res.status(404).json({ error: 'Student analytics not found' });
      return;
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        school: true,
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { grade: true, section: true, academicYear: true }
        }
      }
    });

    const activeEnrollment = student?.enrollments[0];
    const insights = [
      analytics.overallAverage >= 75
        ? 'Demonstrates consistent academic diligence and strong subject mastery.'
        : 'Recommended for targeted practice in identified growth areas.',
      analytics.attendance.attendancePercentage >= 90
        ? 'Excellent attendance record positively reinforces subject learning.'
        : 'Attendance needs improvement to ensure consistent classroom coverage.'
    ];

    await logAudit({
      schoolId: student?.schoolId,
      userId: req.user?.id,
      action: 'REPORT_EXPORT_PDF',
      entityType: 'Student',
      entityId: studentId,
      details: { format: 'PDF', studentName: analytics.fullName },
      ipAddress: req.ip
    });

    ExportService.generateStudentReportCardPdf(res, {
      studentName: analytics.fullName,
      admissionNumber: analytics.admissionNumber,
      schoolName: student?.school.name || 'School Performance Intelligence System',
      gradeName: activeEnrollment?.grade.name || 'Standard 10',
      sectionName: activeEnrollment?.section.name || 'A',
      rollNumber: activeEnrollment?.rollNumber || '1',
      academicYear: activeEnrollment?.academicYear.name || '2026-2027',
      overallAverage: analytics.overallAverage,
      attendancePercentage: analytics.attendance.attendancePercentage,
      subjects: analytics.subjectProfiles.map(s => ({
        subjectName: s.subjectName,
        averagePercentage: s.averagePercentage,
        personalBest: s.personalBest,
        growthPoints: s.growthPoints,
        masteryLevel: s.masteryLevel
      })),
      recentExams: analytics.allResults.map(r => ({
        examName: r.examName,
        subjectName: r.subjectName,
        marksObtained: r.marksObtained,
        maxMarks: r.maxMarks,
        percentage: r.percentage,
        status: r.status
      })),
      insights
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate PDF report' });
  }
});

// Download section performance comparison XLSX
router.get('/section/:sectionId/xlsx', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sectionId } = req.params;

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        grade: true,
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            student: true,
            assessmentResults: {
              include: { examinationSubject: { include: { subject: true } } }
            },
            attendanceRecords: true
          },
          orderBy: { rollNumber: 'asc' }
        }
      }
    });

    if (!section) {
      res.status(404).json({ error: 'Section not found' });
      return;
    }

    // Extract subjects
    const subjectSet = new Set<string>();
    for (const e of section.enrollments) {
      for (const r of e.assessmentResults) {
        subjectSet.add(r.examinationSubject.subject.name);
      }
    }
    const subjects = Array.from(subjectSet);

    const studentsData = section.enrollments.map(e => {
      const marks: Record<string, number | null> = {};
      const validPcts: number[] = [];

      for (const r of e.assessmentResults) {
        marks[r.examinationSubject.subject.name] = r.percentage;
        if (r.percentage !== null) validPcts.push(r.percentage);
      }

      const totalPct = validPcts.length > 0 ? Math.round((validPcts.reduce((a, b) => a + b, 0) / validPcts.length) * 10) / 10 : 0;
      const presentCount = e.attendanceRecords.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      const attendancePct = e.attendanceRecords.length > 0 ? Math.round((presentCount / e.attendanceRecords.length) * 100) : 100;

      return {
        rollNumber: e.rollNumber,
        admissionNumber: e.student.admissionNumber,
        studentName: `${e.student.firstName} ${e.student.lastName}`,
        marks,
        totalPercentage: totalPct,
        attendancePct
      };
    });

    await logAudit({
      schoolId: section.grade.schoolId,
      userId: req.user?.id,
      action: 'REPORT_EXPORT_XLSX',
      entityType: 'Section',
      entityId: sectionId,
      details: { format: 'XLSX', sectionName: section.name },
      ipAddress: req.ip
    });

    await ExportService.generateSectionPerformanceExcel(
      res,
      `${section.grade.name}_${section.name}`,
      subjects,
      studentsData
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate Excel report' });
  }
});

// Audit logs
router.get('/audit', requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = getSchoolScope(req);
    const logs = await prisma.auditLog.findMany({
      where: schoolId ? { schoolId } : undefined,
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
