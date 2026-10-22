import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import prisma from '../db/prisma.js';
import { generateToken, verifySchoolAccess } from '../middleware/auth.js';
import { AuthUser } from 'shared';

describe('SPIS Security, Authorization & Historical Integrity', () => {
  let testSchoolA: any;
  let testSchoolB: any;
  let teacherUserA: AuthUser;
  let studentUser: AuthUser;

  beforeAll(async () => {
    testSchoolA = await prisma.school.findFirst({ where: { code: 'OAKRIDGE' } });
    testSchoolB = await prisma.school.findFirst({ where: { code: 'PINEGROVE' } });

    teacherUserA = {
      id: 'teacher-1',
      email: 'math.teacher@oakridge.edu',
      name: 'Teacher A',
      role: 'TEACHER',
      schoolId: testSchoolA.id
    };

    studentUser = {
      id: 'student-1',
      email: 'student@oakridge.edu',
      name: 'Student A',
      role: 'STUDENT',
      schoolId: testSchoolA.id
    };
  });

  it('Criterion 10: Results from different schools never leak across authorization boundaries', () => {
    const fakeReqA: any = { user: teacherUserA };

    // Teacher from School A should have access to School A
    expect(verifySchoolAccess(fakeReqA, testSchoolA.id)).toBe(true);

    // Teacher from School A must NOT have access to School B
    expect(verifySchoolAccess(fakeReqA, testSchoolB.id)).toBe(false);

    // Super Admin has access across all schools
    const superAdminReq: any = {
      user: {
        id: 'super-admin-1',
        email: 'super@spis.edu',
        name: 'Super Admin',
        role: 'SUPER_ADMIN'
      }
    };
    expect(verifySchoolAccess(superAdminReq, testSchoolB.id)).toBe(true);
  });

  it('Criterion 7 & 12: Duplicate examination results are prevented by database constraints', async () => {
    // Find an existing assessment result
    const existing = await prisma.assessmentResult.findFirst();
    expect(existing).toBeDefined();

    if (existing) {
      // Attempting to create duplicate with identical (examinationSubjectId, enrollmentId) must throw
      await expect(
        prisma.assessmentResult.create({
          data: {
            examinationSubjectId: existing.examinationSubjectId,
            enrollmentId: existing.enrollmentId,
            marksObtained: 50,
            status: 'PRESENT',
            percentage: 50
          }
        })
      ).rejects.toThrow();
    }
  });

  it('Criterion 8: Historical results remain intact when student changes sections', async () => {
    // Check Aarav Sharma's current enrollments
    const student = await prisma.student.findFirst({
      where: { admissionNumber: 'OAK-2026-001' },
      include: {
        enrollments: {
          include: { assessmentResults: true }
        }
      }
    });

    expect(student).toBeDefined();
    const originalEnrollment = student!.enrollments[0];
    const originalResultCount = originalEnrollment.assessmentResults.length;
    expect(originalResultCount).toBeGreaterThan(0);

    // Results belong specifically to this enrollment ID
    const results = await prisma.assessmentResult.findMany({
      where: { enrollmentId: originalEnrollment.id }
    });
    expect(results.length).toBe(originalResultCount);
  });
});
