import { Router, Response } from 'express';
import prisma from '../db/prisma.js';
import { AuthenticatedRequest, authenticateToken, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();
router.use(authenticateToken);

// List intervention plans
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId, teacherId, status } = req.query;

    const interventions = await prisma.interventionPlan.findMany({
      where: {
        studentId: studentId ? String(studentId) : undefined,
        teacherId: teacherId ? String(teacherId) : undefined,
        status: status ? String(status) : undefined
      },
      include: {
        student: true,
        subject: true,
        teacher: { select: { id: true, name: true, email: true } },
        reviews: { orderBy: { reviewDate: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(interventions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch intervention plans' });
  }
});

// Create an intervention plan
router.post('/', requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'COORDINATOR'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId, subjectId, title, learningGapDescription, targetPercentage, actionPlan } = req.body;

    const plan = await prisma.interventionPlan.create({
      data: {
        studentId,
        subjectId,
        teacherId: req.user!.id,
        title,
        learningGapDescription,
        targetPercentage: Number(targetPercentage),
        actionPlan,
        status: 'IN_PROGRESS'
      }
    });

    await logAudit({
      userId: req.user?.id,
      action: 'INTERVENTION_PLAN_CREATE',
      entityType: 'InterventionPlan',
      entityId: plan.id,
      details: { studentId, title, targetPercentage },
      ipAddress: req.ip
    });

    res.status(201).json(plan);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create intervention plan' });
  }
});

// Add a review evaluation to an intervention plan
router.post('/:id/reviews', requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'COORDINATOR'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { evaluationSummary, postInterventionPercentage, outcomeStatus } = req.body;

    const review = await prisma.interventionReview.create({
      data: {
        interventionPlanId: id,
        evaluationSummary,
        postInterventionPercentage: postInterventionPercentage !== undefined ? Number(postInterventionPercentage) : null,
        outcomeStatus: outcomeStatus || 'IMPROVED'
      }
    });

    if (outcomeStatus === 'IMPROVED') {
      await prisma.interventionPlan.update({
        where: { id },
        data: { status: 'COMPLETED' }
      });
    }

    res.status(201).json(review);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create intervention review' });
  }
});

export default router;
