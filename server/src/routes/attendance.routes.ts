import { Router, Response } from 'express';
import { AttendanceService } from '../services/attendance.js';
import { AuthenticatedRequest, authenticateToken, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = Router();
router.use(authenticateToken);

// Root attendance info
router.get('/', (req, res) => {
  res.json({ message: 'Attendance API endpoint. Use /api/attendance/section?sectionId=...&date=... or /api/attendance/summary?sectionId=...' });
});

// Get section attendance for a specific date
router.get('/section', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sectionId, date } = req.query;

    if (!sectionId || !date) {
      res.status(400).json({ error: 'sectionId and date (YYYY-MM-DD) are required' });
      return;
    }

    const records = await AttendanceService.getSectionAttendanceForDate(
      String(sectionId),
      String(date)
    );
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch attendance' });
  }
});

// Record batch attendance for a section
router.post('/batch', requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'COORDINATOR'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sectionId, entries } = req.body;
    // entries: Array<{ enrollmentId: string, date: string, status: string, session?: string, remarks?: string }>

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      res.status(400).json({ error: 'Entries array is required' });
      return;
    }

    const results = await AttendanceService.recordSectionAttendance(entries, req.user?.id);

    await logAudit({
      userId: req.user?.id,
      action: 'ATTENDANCE_BATCH_RECORD',
      entityType: 'StudentAttendance',
      details: { count: results.length, sectionId },
      ipAddress: req.ip
    });

    res.json({ message: 'Attendance recorded successfully', count: results.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to record attendance' });
  }
});

// Get section attendance summary
router.get('/summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sectionId, startDate, endDate } = req.query;

    if (!sectionId) {
      res.status(400).json({ error: 'sectionId is required' });
      return;
    }

    const start = startDate ? new Date(String(startDate)) : undefined;
    const end = endDate ? new Date(String(endDate)) : undefined;

    const summary = await AttendanceService.getSectionAttendanceSummary(String(sectionId), start, end);
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch attendance summary' });
  }
});

export default router;
