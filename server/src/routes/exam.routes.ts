import { Router, Response } from 'express';
import prisma from '../db/prisma.js';
import { AuthenticatedRequest, authenticateToken, requireRole, getSchoolScope } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();
router.use(authenticateToken);

// List examinations
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = getSchoolScope(req);
    const { academicYearId, gradeId, status } = req.query;

    const exams = await prisma.examination.findMany({
      where: {
        schoolId: schoolId || undefined,
        academicYearId: academicYearId ? String(academicYearId) : undefined,
        gradeId: gradeId ? String(gradeId) : undefined,
        status: status ? String(status) : undefined
      },
      include: {
        academicYear: true,
        grade: true,
        examinationSubjects: {
          include: { subject: true }
        },
        _count: {
          select: { examinationSubjects: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch examinations' });
  }
});

// Get single examination details
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const exam = await prisma.examination.findUnique({
      where: { id },
      include: {
        school: true,
        academicYear: true,
        grade: {
          include: { sections: true }
        },
        examinationSubjects: {
          include: {
            subject: true,
            _count: {
              select: { assessmentResults: true }
            }
          }
        },
        approvals: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!exam) {
      res.status(404).json({ error: 'Examination not found' });
      return;
    }

    res.json(exam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch examination details' });
  }
});

// Create examination with subjects and criteria
router.post('/', requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'COORDINATOR'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = getSchoolScope(req);
    if (!schoolId) {
      res.status(400).json({ error: 'School scope required' });
      return;
    }

    const {
      name,
      examType,
      academicYearId,
      gradeId,
      startDate,
      endDate,
      subjects // Array<{ subjectId: string, maxMarks: number, passingMarks: number, weightage?: number }>
    } = req.body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      res.status(400).json({ error: 'At least one examination subject is required.' });
      return;
    }

    const exam = await prisma.$transaction(async (tx) => {
      const createdExam = await tx.examination.create({
        data: {
          schoolId,
          name,
          examType,
          academicYearId,
          gradeId,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          status: 'OPEN',
          createdById: req.user?.id
        }
      });

      for (const sub of subjects) {
        await tx.examinationSubject.create({
          data: {
            examinationId: createdExam.id,
            subjectId: sub.subjectId,
            maxMarks: Number(sub.maxMarks),
            passingMarks: Number(sub.passingMarks || Math.round(Number(sub.maxMarks) * 0.4)),
            weightage: Number(sub.weightage || 1.0)
          }
        });
      }

      return createdExam;
    });

    await logAudit({
      schoolId,
      userId: req.user?.id,
      action: 'EXAM_CREATE',
      entityType: 'Examination',
      entityId: exam.id,
      details: { name, examType, subjectCount: subjects.length },
      ipAddress: req.ip
    });

    res.status(201).json(exam);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create examination' });
  }
});

// Transition examination status (Workflow: OPEN -> SUBMITTED -> APPROVED -> LOCKED)
router.put('/:id/status', requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'COORDINATOR'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    const allowed = ['OPEN', 'SUBMITTED', 'APPROVED', 'LOCKED'];
    if (!allowed.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
      return;
    }

    const exam = await prisma.$transaction(async (tx) => {
      const updated = await tx.examination.update({
        where: { id },
        data: {
          status,
          approvedById: (status === 'APPROVED' || status === 'LOCKED') ? req.user?.id : undefined
        }
      });

      await tx.resultApproval.create({
        data: {
          examinationId: id,
          action: status,
          userId: req.user!.id,
          comments: comments || null
        }
      });

      return updated;
    });

    await logAudit({
      schoolId: exam.schoolId,
      userId: req.user?.id,
      action: `EXAM_STATUS_${status}`,
      entityType: 'Examination',
      entityId: id,
      details: { previousStatus: exam.status, newStatus: status, comments },
      ipAddress: req.ip
    });

    res.json(exam);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update exam status' });
  }
});

export default router;
