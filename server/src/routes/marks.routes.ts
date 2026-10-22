import { Router, Response } from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import prisma from '../db/prisma.js';
import { AuthenticatedRequest, authenticateToken, requireRole } from '../middleware/auth.js';
import { calculatePercentage } from 'shared';
import { logAudit } from '../middleware/audit.js';

const router = Router();
router.use(authenticateToken);
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Root marks info
router.get('/', (req, res) => {
  res.json({ message: 'Marks API endpoint. Use /api/marks/grid?examinationSubjectId=...&sectionId=... to view marks grid.' });
});

// Get spreadsheet grid data for marks entry
router.get('/grid', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examinationSubjectId, sectionId } = req.query;

    if (!examinationSubjectId || !sectionId) {
      res.status(400).json({ error: 'examinationSubjectId and sectionId are required' });
      return;
    }

    const examSubject = await prisma.examinationSubject.findUnique({
      where: { id: String(examinationSubjectId) },
      include: {
        examination: true,
        subject: true
      }
    });

    if (!examSubject) {
      res.status(404).json({ error: 'Examination subject not found' });
      return;
    }

    // Get active enrollments for this section
    const enrollments = await prisma.enrollment.findMany({
      where: {
        sectionId: String(sectionId),
        status: 'ACTIVE'
      },
      include: {
        student: true,
        assessmentResults: {
          where: {
            examinationSubjectId: String(examinationSubjectId)
          }
        }
      },
      orderBy: { rollNumber: 'asc' }
    });

    const rows = enrollments.map(e => {
      const result = e.assessmentResults[0] || null;
      return {
        enrollmentId: e.id,
        studentId: e.student.id,
        admissionNumber: e.student.admissionNumber,
        studentName: `${e.student.firstName} ${e.student.lastName}`,
        rollNumber: e.rollNumber,
        resultId: result?.id || null,
        marksObtained: result?.marksObtained ?? null,
        status: result?.status || 'PRESENT',
        percentage: result?.percentage ?? null,
        isPassing: result?.isPassing ?? null,
        remarks: result?.remarks || ''
      };
    });

    res.json({
      examSubject: {
        id: examSubject.id,
        examId: examSubject.examination.id,
        examName: examSubject.examination.name,
        examStatus: examSubject.examination.status,
        subjectName: examSubject.subject.name,
        subjectCode: examSubject.subject.code,
        maxMarks: examSubject.maxMarks,
        passingMarks: examSubject.passingMarks
      },
      students: rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch marks entry grid data' });
  }
});

// Save / Batch update marks
router.post('/batch', requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'COORDINATOR'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examinationSubjectId, entries } = req.body;
    // entries: Array<{ enrollmentId: string, marksObtained: number | null, status: string, remarks?: string }>

    if (!examinationSubjectId || !Array.isArray(entries)) {
      res.status(400).json({ error: 'examinationSubjectId and entries array are required' });
      return;
    }

    const examSubject = await prisma.examinationSubject.findUnique({
      where: { id: examinationSubjectId },
      include: { examination: true }
    });

    if (!examSubject) {
      res.status(404).json({ error: 'Examination subject not found' });
      return;
    }

    if (examSubject.examination.status === 'LOCKED') {
      res.status(403).json({ error: 'Cannot enter or modify marks for a LOCKED examination. Request an administrative unlock first.' });
      return;
    }

    const validationErrors: string[] = [];
    const maxMarks = examSubject.maxMarks;
    const passingMarks = examSubject.passingMarks;

    // Validate entries before executing
    for (const entry of entries) {
      if (entry.status === 'PRESENT') {
        if (entry.marksObtained === null || entry.marksObtained === undefined || isNaN(Number(entry.marksObtained))) {
          validationErrors.push(`Enrollment ${entry.enrollmentId}: Marks must be specified when status is PRESENT.`);
        } else {
          const num = Number(entry.marksObtained);
          if (num < 0) {
            validationErrors.push(`Marks cannot be negative (got ${num}).`);
          }
          if (num > maxMarks) {
            validationErrors.push(`Marks (${num}) exceed configured maximum of ${maxMarks}.`);
          }
        }
      }
    }

    if (validationErrors.length > 0) {
      res.status(400).json({ error: 'Validation failed', details: validationErrors });
      return;
    }

    // Upsert results in a transaction
    const savedResults = await prisma.$transaction(async (tx) => {
      const records = [];

      for (const entry of entries) {
        const isPresent = entry.status === 'PRESENT';
        const marksObtained = isPresent ? Number(entry.marksObtained) : null;
        const percentage = isPresent ? calculatePercentage(marksObtained, maxMarks) : null;
        const isPassing = percentage !== null ? percentage >= (passingMarks / maxMarks * 100) : null;

        const record = await tx.assessmentResult.upsert({
          where: {
            examinationSubjectId_enrollmentId: {
              examinationSubjectId,
              enrollmentId: entry.enrollmentId
            }
          },
          update: {
            marksObtained,
            status: entry.status || 'PRESENT',
            percentage,
            isPassing,
            remarks: entry.remarks || null,
            updatedById: req.user?.id
          },
          create: {
            examinationSubjectId,
            enrollmentId: entry.enrollmentId,
            marksObtained,
            status: entry.status || 'PRESENT',
            percentage,
            isPassing,
            remarks: entry.remarks || null,
            enteredById: req.user?.id,
            updatedById: req.user?.id
          }
        });
        records.push(record);
      }
      return records;
    });

    await logAudit({
      schoolId: examSubject.examination.schoolId,
      userId: req.user?.id,
      action: 'MARKS_BATCH_UPDATE',
      entityType: 'AssessmentResult',
      entityId: examinationSubjectId,
      details: { count: entries.length, examId: examSubject.examinationId },
      ipAddress: req.ip
    });

    res.json({ message: 'Marks updated successfully', updatedCount: savedResults.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save marks' });
  }
});

// Download blank/pre-filled Excel template for marks entry
router.get('/template', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examinationSubjectId, sectionId } = req.query;

    if (!examinationSubjectId || !sectionId) {
      res.status(400).json({ error: 'examinationSubjectId and sectionId are required' });
      return;
    }

    const examSubject = await prisma.examinationSubject.findUnique({
      where: { id: String(examinationSubjectId) },
      include: { examination: true, subject: true }
    });

    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId: String(sectionId), status: 'ACTIVE' },
      include: { student: true },
      orderBy: { rollNumber: 'asc' }
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Marks Entry Template');

    sheet.columns = [
      { header: 'Admission Number', key: 'admissionNumber', width: 18 },
      { header: 'Roll Number', key: 'rollNumber', width: 12 },
      { header: 'Student Name', key: 'studentName', width: 25 },
      { header: `Marks (Max: ${examSubject?.maxMarks})`, key: 'marksObtained', width: 20 },
      { header: 'Status (PRESENT/ABSENT/EXEMPTED)', key: 'status', width: 30 },
      { header: 'Remarks', key: 'remarks', width: 25 }
    ];

    sheet.getRow(1).font = { bold: true };

    for (const e of enrollments) {
      sheet.addRow({
        admissionNumber: e.student.admissionNumber,
        rollNumber: e.rollNumber,
        studentName: `${e.student.firstName} ${e.student.lastName}`,
        marksObtained: '',
        status: 'PRESENT',
        remarks: ''
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Marks_Template_${examSubject?.subject.code}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// Bulk spreadsheet import preview and commit
router.post('/import', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examinationSubjectId, sectionId } = req.body;
    if (!req.file) {
      res.status(400).json({ error: 'Spreadsheet file (.xlsx or .csv) is required.' });
      return;
    }

    const examSubject = await prisma.examinationSubject.findUnique({
      where: { id: String(examinationSubjectId) },
      include: { examination: true }
    });

    if (!examSubject) {
      res.status(404).json({ error: 'Examination subject not found.' });
      return;
    }

    if (examSubject.examination.status === 'LOCKED') {
      res.status(403).json({ error: 'Cannot import into a LOCKED examination.' });
      return;
    }

    // Load active enrollments map for verification
    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId: String(sectionId), status: 'ACTIVE' },
      include: { student: true }
    });

    const admissionMap = new Map(enrollments.map(e => [e.student.admissionNumber.toLowerCase(), e]));
    const rollMap = new Map(enrollments.map(e => [e.rollNumber.toLowerCase(), e]));

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer as any);
    const sheet = workbook.worksheets[0];

    const validRows: any[] = [];
    const errorRows: Array<{ rowNumber: number; reason: string }> = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const admNo = row.getCell(1).value?.toString().trim();
      const rollNo = row.getCell(2).value?.toString().trim();
      const rawMarks = row.getCell(4).value;
      const status = (row.getCell(5).value?.toString().toUpperCase().trim()) || 'PRESENT';
      const remarks = row.getCell(6).value?.toString().trim() || '';

      const matchedEnrollment = (admNo && admissionMap.get(admNo.toLowerCase())) ||
        (rollNo && rollMap.get(rollNo.toLowerCase()));

      if (!matchedEnrollment) {
        errorRows.push({ rowNumber, reason: `Student identifier not found: ${admNo || rollNo || 'empty'}` });
        return;
      }

      if (status === 'PRESENT') {
        const marksNum = Number(rawMarks);
        if (rawMarks === null || rawMarks === undefined || isNaN(marksNum)) {
          errorRows.push({ rowNumber, reason: `Invalid marks value for student ${matchedEnrollment.student.admissionNumber}` });
          return;
        }
        if (marksNum < 0 || marksNum > examSubject.maxMarks) {
          errorRows.push({ rowNumber, reason: `Marks ${marksNum} outside allowed range [0, ${examSubject.maxMarks}]` });
          return;
        }
        validRows.push({
          enrollmentId: matchedEnrollment.id,
          studentName: `${matchedEnrollment.student.firstName} ${matchedEnrollment.student.lastName}`,
          admissionNumber: matchedEnrollment.student.admissionNumber,
          marksObtained: marksNum,
          status: 'PRESENT',
          remarks
        });
      } else if (['ABSENT', 'EXEMPTED', 'PENDING'].includes(status)) {
        validRows.push({
          enrollmentId: matchedEnrollment.id,
          studentName: `${matchedEnrollment.student.firstName} ${matchedEnrollment.student.lastName}`,
          admissionNumber: matchedEnrollment.student.admissionNumber,
          marksObtained: null,
          status,
          remarks
        });
      } else {
        errorRows.push({ rowNumber, reason: `Unrecognized status '${status}'` });
      }
    });

    res.json({
      totalRead: validRows.length + errorRows.length,
      validCount: validRows.length,
      errorCount: errorRows.length,
      validRows,
      errorRows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to parse import spreadsheet' });
  }
});

export default router;
