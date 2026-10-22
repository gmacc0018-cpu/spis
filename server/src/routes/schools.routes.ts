import { Router, Response } from 'express';
import prisma from '../db/prisma.js';
import { AuthenticatedRequest, authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// List all schools (Super Admin can see all, other roles see their own)
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const schools = await prisma.school.findMany({
      where: isSuperAdmin ? undefined : { id: req.user?.schoolId || undefined },
      include: {
        organization: true,
        schoolSettings: true,
        _count: {
          select: {
            students: true,
            academicYears: true,
            grades: true,
            examinations: true
          }
        }
      }
    });
    res.json(schools);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

// Create new school (Super Admin only)
router.post('/', requireRole('SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, code, organizationId, address, boardType } = req.body;

    const school = await prisma.school.create({
      data: {
        name,
        code: code.toUpperCase().trim(),
        organizationId,
        address: address || null,
        boardType: boardType || 'CBSE',
        schoolSettings: {
          create: {
            rankingVisibility: 'ANONYMIZED_ONLY',
            allowStudentPeerComparison: true,
            attendanceThresholdPct: 75.0
          }
        }
      },
      include: {
        schoolSettings: true
      }
    });

    res.status(201).json(school);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create school' });
  }
});

// Update school settings
router.put('/:id/settings', requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rankingVisibility, allowStudentPeerComparison, attendanceThresholdPct, remedialThresholdPct, enrichmentThresholdPct } = req.body;

    const updated = await prisma.schoolSettings.upsert({
      where: { schoolId: id },
      update: {
        rankingVisibility,
        allowStudentPeerComparison: allowStudentPeerComparison !== undefined ? Boolean(allowStudentPeerComparison) : undefined,
        attendanceThresholdPct: attendanceThresholdPct !== undefined ? Number(attendanceThresholdPct) : undefined,
        remedialThresholdPct: remedialThresholdPct !== undefined ? Number(remedialThresholdPct) : undefined,
        enrichmentThresholdPct: enrichmentThresholdPct !== undefined ? Number(enrichmentThresholdPct) : undefined
      },
      create: {
        schoolId: id,
        rankingVisibility: rankingVisibility || 'ANONYMIZED_ONLY',
        allowStudentPeerComparison: Boolean(allowStudentPeerComparison ?? true),
        attendanceThresholdPct: Number(attendanceThresholdPct || 75.0),
        remedialThresholdPct: Number(remedialThresholdPct || 50.0),
        enrichmentThresholdPct: Number(enrichmentThresholdPct || 85.0)
      }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update school settings' });
  }
});

export default router;
