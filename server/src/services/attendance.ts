import prisma from '../db/prisma.js';
import { calculateAttendancePercentage } from 'shared';

export interface AttendanceEntryInput {
  enrollmentId: string;
  date: string; // ISO date YYYY-MM-DD
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  session?: 'FULL_DAY' | 'FORENOON' | 'AFTERNOON';
  remarks?: string;
}

export class AttendanceService {
  /**
   * Records or updates daily attendance for multiple students in a section
   */
  static async recordSectionAttendance(
    entries: AttendanceEntryInput[],
    recordedById?: string
  ) {
    const results = [];

    for (const entry of entries) {
      const parsedDate = new Date(entry.date);
      // normalize date to start of day
      parsedDate.setUTCHours(0, 0, 0, 0);

      const session = entry.session || 'FULL_DAY';

      const record = await prisma.studentAttendance.upsert({
        where: {
          enrollmentId_date_session: {
            enrollmentId: entry.enrollmentId,
            date: parsedDate,
            session
          }
        },
        update: {
          status: entry.status,
          remarks: entry.remarks || null,
          recordedById: recordedById || null
        },
        create: {
          enrollmentId: entry.enrollmentId,
          date: parsedDate,
          status: entry.status,
          session,
          remarks: entry.remarks || null,
          recordedById: recordedById || null
        }
      });
      results.push(record);
    }

    return results;
  }

  /**
   * Retrieves section attendance records for a specific date
   */
  static async getSectionAttendanceForDate(sectionId: string, dateStr: string) {
    const targetDate = new Date(dateStr);
    targetDate.setUTCHours(0, 0, 0, 0);

    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId, status: 'ACTIVE' },
      include: {
        student: true,
        attendanceRecords: {
          where: { date: targetDate }
        }
      },
      orderBy: { rollNumber: 'asc' }
    });

    return enrollments.map(e => ({
      enrollmentId: e.id,
      studentId: e.student.id,
      admissionNumber: e.student.admissionNumber,
      studentName: `${e.student.firstName} ${e.student.lastName}`,
      rollNumber: e.rollNumber,
      attendanceRecord: e.attendanceRecords[0] || null,
      currentStatus: e.attendanceRecords[0]?.status || 'PRESENT'
    }));
  }

  /**
   * Aggregates attendance summary for a section over a date range
   */
  static async getSectionAttendanceSummary(sectionId: string, startDate?: Date, endDate?: Date) {
    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId, status: 'ACTIVE' },
      include: {
        student: true,
        attendanceRecords: {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      },
      orderBy: { rollNumber: 'asc' }
    });

    return enrollments.map(e => {
      const total = e.attendanceRecords.length;
      const present = e.attendanceRecords.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      const absent = e.attendanceRecords.filter(a => a.status === 'ABSENT').length;
      const late = e.attendanceRecords.filter(a => a.status === 'LATE').length;
      const excused = e.attendanceRecords.filter(a => a.status === 'EXCUSED').length;
      const percentage = calculateAttendancePercentage(present, total);

      return {
        enrollmentId: e.id,
        studentId: e.student.id,
        admissionNumber: e.student.admissionNumber,
        studentName: `${e.student.firstName} ${e.student.lastName}`,
        rollNumber: e.rollNumber,
        totalDays: total,
        presentDays: present,
        absentDays: absent,
        lateDays: late,
        excusedDays: excused,
        attendancePercentage: percentage,
        flaggedLow: percentage < 75.0
      };
    });
  }
}
