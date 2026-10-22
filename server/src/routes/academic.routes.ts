import { Router, Response } from 'express';
import prisma from '../db/prisma.js';
import { AuthenticatedRequest, authenticateToken, requireRole, getSchoolScope } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// Academic Years
router.get('/years', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = getSchoolScope(req);
    if (!schoolId) {
      res.status(400).json({ error: 'School context required.' });
      return;
    }

    const years = await prisma.academicYear.findMany({
      where: { schoolId },
      orderBy: { startDate: 'desc' }
    });
    res.json(years);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch academic years' });
  }
});

router.post('/years', requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = getSchoolScope(req);
    if (!schoolId) {
      res.status(400).json({ error: 'School context required.' });
      return;
    }
    const { name, startDate, endDate, isCurrent } = req.body;

    if (isCurrent) {
      await prisma.academicYear.updateMany({
        where: { schoolId },
        data: { isCurrent: false }
      });
    }

    const year = await prisma.academicYear.create({
      data: {
        schoolId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent: Boolean(isCurrent)
      }
    });
    res.status(201).json(year);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create academic year' });
  }
});

// Grades / Standards
router.get('/grades', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = getSchoolScope(req);
    if (!schoolId) {
      res.status(400).json({ error: 'School context required.' });
      return;
    }

    const grades = await prisma.grade.findMany({
      where: { schoolId },
      include: {
        sections: true
      },
      orderBy: { numericLevel: 'asc' }
    });
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

router.post('/grades', requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = getSchoolScope(req);
    if (!schoolId) {
      res.status(400).json({ error: 'School context required.' });
      return;
    }
    const { name, numericLevel } = req.body;

    const grade = await prisma.grade.create({
      data: {
        schoolId,
        name,
        numericLevel: Number(numericLevel)
      }
    });
    res.status(201).json(grade);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create grade' });
  }
});

// Sections
router.get('/sections', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = getSchoolScope(req);
    const { gradeId, academicYearId } = req.query;

    const sections = await prisma.section.findMany({
      where: {
        grade: { schoolId: schoolId || undefined },
        gradeId: gradeId ? String(gradeId) : undefined,
        academicYearId: academicYearId ? String(academicYearId) : undefined
      },
      include: {
        grade: true,
        academicYear: true,
        _count: {
          select: { enrollments: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

router.post('/sections', requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { gradeId, academicYearId, name, roomNumber } = req.body;
    const section = await prisma.section.create({
      data: {
        gradeId,
        academicYearId,
        name,
        roomNumber
      }
    });
    res.status(201).json(section);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create section' });
  }
});

// Subjects
router.get('/subjects', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = getSchoolScope(req);
    if (!schoolId) {
      res.status(400).json({ error: 'School context required.' });
      return;
    }

    const subjects = await prisma.subject.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' }
    });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

router.post('/subjects', requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = getSchoolScope(req);
    if (!schoolId) {
      res.status(400).json({ error: 'School context required.' });
      return;
    }
    const { name, code, category } = req.body;

    const subject = await prisma.subject.create({
      data: {
        schoolId,
        name,
        code: code.toUpperCase().trim(),
        category: category || 'CORE'
      }
    });
    res.status(201).json(subject);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create subject' });
  }
});

// Teacher Assignments
router.get('/teacher-assignments', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = getSchoolScope(req);
    const { teacherId, sectionId, academicYearId } = req.query;

    const assignments = await prisma.teacherAssignment.findMany({
      where: {
        schoolId: schoolId || undefined,
        teacherId: teacherId ? String(teacherId) : undefined,
        sectionId: sectionId ? String(sectionId) : undefined,
        academicYearId: academicYearId ? String(academicYearId) : undefined
      },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        section: { include: { grade: true } },
        subject: true,
        academicYear: true
      }
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teacher assignments' });
  }
});

export default router;
