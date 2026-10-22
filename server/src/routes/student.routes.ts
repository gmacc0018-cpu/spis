import { Router, Response } from 'express';
import prisma from '../db/prisma.js';
import { AuthenticatedRequest, authenticateToken, requireRole, getSchoolScope } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();
router.use(authenticateToken);

// List students with filters
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = getSchoolScope(req);
    if (!schoolId) {
      res.status(400).json({ error: 'School scope required' });
      return;
    }

    const { gradeId, sectionId, academicYearId, search, status = 'ACTIVE' } = req.query;

    const where: any = {
      schoolId,
      status: status ? String(status) : undefined
    };

    if (search) {
      const searchStr = String(search).trim();
      where.OR = [
        { firstName: { contains: searchStr } },
        { lastName: { contains: searchStr } },
        { admissionNumber: { contains: searchStr } }
      ];
    }

    if (gradeId || sectionId || academicYearId) {
      where.enrollments = {
        some: {
          gradeId: gradeId ? String(gradeId) : undefined,
          sectionId: sectionId ? String(sectionId) : undefined,
          academicYearId: academicYearId ? String(academicYearId) : undefined,
          status: 'ACTIVE'
        }
      };
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            grade: true,
            section: true,
            academicYear: true
          }
        }
      },
      orderBy: { lastName: 'asc' },
      take: 100
    });

    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get single student profile with full historical timeline
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = getSchoolScope(req);

    // If current user is STUDENT, ensure they only view themselves
    if (req.user?.role === 'STUDENT' && req.user.studentId !== id) {
      res.status(403).json({ error: 'Access denied. You can only view your own records.' });
      return;
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        school: true,
        enrollments: {
          include: {
            grade: true,
            section: true,
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
            attendanceRecords: {
              orderBy: { date: 'desc' },
              take: 30
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        goals: {
          include: { subject: true }
        },
        interventions: {
          include: { subject: true, teacher: true, reviews: true }
        }
      }
    });

    if (!student || (schoolId && student.schoolId !== schoolId && req.user?.role !== 'SUPER_ADMIN')) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student details' });
  }
});

// Admit new student
router.post('/admit', requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = getSchoolScope(req);
    if (!schoolId) {
      res.status(400).json({ error: 'School scope required' });
      return;
    }

    const {
      admissionNumber,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      academicYearId,
      gradeId,
      sectionId,
      rollNumber
    } = req.body;

    const student = await prisma.$transaction(async (tx) => {
      const newStudent = await tx.student.create({
        data: {
          schoolId,
          admissionNumber,
          firstName,
          lastName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender: gender || null,
          status: 'ACTIVE'
        }
      });

      await tx.enrollment.create({
        data: {
          studentId: newStudent.id,
          academicYearId,
          gradeId,
          sectionId,
          rollNumber,
          status: 'ACTIVE'
        }
      });

      return newStudent;
    });

    await logAudit({
      schoolId,
      userId: req.user?.id,
      action: 'STUDENT_ADMISSION',
      entityType: 'Student',
      entityId: student.id,
      details: { admissionNumber, name: `${firstName} ${lastName}` },
      ipAddress: req.ip
    });

    res.status(201).json(student);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to admit student' });
  }
});

// Section transfer / Academic promotion (Preserves all historical enrollments and marks)
router.post('/:id/transfer-section', requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { targetSectionId, newRollNumber, reason } = req.body;

    const targetSection = await prisma.section.findUnique({
      where: { id: targetSectionId },
      include: { grade: true, academicYear: true }
    });

    if (!targetSection) {
      res.status(404).json({ error: 'Target section not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Find current active enrollment
      const activeEnrollment = await tx.enrollment.findFirst({
        where: { studentId: id, status: 'ACTIVE' }
      });

      if (activeEnrollment) {
        // Mark current enrollment as TRANSFERRED (does NOT delete marks or attendance)
        await tx.enrollment.update({
          where: { id: activeEnrollment.id },
          data: {
            status: 'TRANSFERRED',
            endDate: new Date()
          }
        });
      }

      // Create new enrollment under target section
      await tx.enrollment.create({
        data: {
          studentId: id,
          academicYearId: targetSection.academicYearId,
          gradeId: targetSection.gradeId,
          sectionId: targetSection.id,
          rollNumber: newRollNumber || (activeEnrollment?.rollNumber ?? '1'),
          status: 'ACTIVE',
          startDate: new Date()
        }
      });
    });

    await logAudit({
      schoolId: targetSection.grade.schoolId,
      userId: req.user?.id,
      action: 'STUDENT_SECTION_TRANSFER',
      entityType: 'Student',
      entityId: id,
      details: { targetSection: targetSection.name, reason },
      ipAddress: req.ip
    });

    res.json({ message: 'Student successfully transferred while retaining all historical records.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to transfer section' });
  }
});

export default router;
