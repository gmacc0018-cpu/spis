import bcrypt from 'bcryptjs';
import prisma from './prisma.js';
import { calculatePercentage } from 'shared';

async function main() {
  console.log('Seeding SPIS educational database...');

  // Clean existing records in correct relation order
  await prisma.auditLog.deleteMany();
  await prisma.studentAttendance.deleteMany();
  await prisma.assessmentResult.deleteMany();
  await prisma.resultApproval.deleteMany();
  await prisma.examinationSubject.deleteMany();
  await prisma.examination.deleteMany();
  await prisma.interventionReview.deleteMany();
  await prisma.interventionPlan.deleteMany();
  await prisma.studentGoal.deleteMany();
  await prisma.guardianLink.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.teacherAssignment.deleteMany();
  await prisma.section.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.schoolSettings.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();
  await prisma.organization.deleteMany();

  // 1. Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Global Horizon Educational Trust',
      code: 'GHET'
    }
  });

  // 2. Schools
  const schoolA = await prisma.school.create({
    data: {
      organizationId: org.id,
      name: 'Oakridge International Academy',
      code: 'OAKRIDGE',
      address: '42 Knowledge Boulevard, Tech Corridor',
      boardType: 'CBSE',
      schoolSettings: {
        create: {
          rankingVisibility: 'ANONYMIZED_ONLY',
          allowStudentPeerComparison: true,
          attendanceThresholdPct: 75.0,
          remedialThresholdPct: 50.0,
          enrichmentThresholdPct: 85.0
        }
      }
    }
  });

  const schoolB = await prisma.school.create({
    data: {
      organizationId: org.id,
      name: 'Pinegrove Public School',
      code: 'PINEGROVE',
      address: '15 Heritage Valley Road',
      boardType: 'ICSE',
      schoolSettings: {
        create: {
          rankingVisibility: 'ANONYMIZED_ONLY',
          allowStudentPeerComparison: true,
          attendanceThresholdPct: 75.0,
          remedialThresholdPct: 50.0,
          enrichmentThresholdPct: 85.0
        }
      }
    }
  });

  // Common password hash for test accounts
  const superAdminHash = await bcrypt.hash('Admin@123', 10);
  const principalHash = await bcrypt.hash('Principal@123', 10);
  const teacherHash = await bcrypt.hash('Teacher@123', 10);
  const studentHash = await bcrypt.hash('Student@123', 10);
  const parentHash = await bcrypt.hash('Parent@123', 10);

  // 3. Users
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@spis.edu',
      passwordHash: superAdminHash,
      name: 'Dr. Evelyn Vance (Chief Executive)',
      role: 'SUPER_ADMIN',
      organizationId: org.id
    }
  });

  const principal = await prisma.user.create({
    data: {
      schoolId: schoolA.id,
      organizationId: org.id,
      email: 'principal@oakridge.edu',
      passwordHash: principalHash,
      name: 'Dr. Arthur Pendelton',
      role: 'SCHOOL_ADMIN'
    }
  });

  const teacherMath = await prisma.user.create({
    data: {
      schoolId: schoolA.id,
      organizationId: org.id,
      email: 'math.teacher@oakridge.edu',
      passwordHash: teacherHash,
      name: 'Prof. Rajesh Ramanujan',
      role: 'TEACHER'
    }
  });

  const teacherScience = await prisma.user.create({
    data: {
      schoolId: schoolA.id,
      organizationId: org.id,
      email: 'science.teacher@oakridge.edu',
      passwordHash: teacherHash,
      name: 'Dr. Maya Sundaram',
      role: 'TEACHER'
    }
  });

  const teacherEnglish = await prisma.user.create({
    data: {
      schoolId: schoolA.id,
      organizationId: org.id,
      email: 'english.teacher@oakridge.edu',
      passwordHash: teacherHash,
      name: 'Ms. Sarah Jenkins',
      role: 'TEACHER'
    }
  });

  // 4. Academic Year
  const year2026 = await prisma.academicYear.create({
    data: {
      schoolId: schoolA.id,
      name: '2026-2027',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-04-30'),
      isCurrent: true
    }
  });

  // 5. Grade & Sections
  const grade10 = await prisma.grade.create({
    data: {
      schoolId: schoolA.id,
      name: 'Standard 10',
      numericLevel: 10
    }
  });

  const sectionA = await prisma.section.create({
    data: {
      gradeId: grade10.id,
      academicYearId: year2026.id,
      name: 'A',
      roomNumber: 'Room 101'
    }
  });

  const sectionB = await prisma.section.create({
    data: {
      gradeId: grade10.id,
      academicYearId: year2026.id,
      name: 'B',
      roomNumber: 'Room 102'
    }
  });

  const sectionC = await prisma.section.create({
    data: {
      gradeId: grade10.id,
      academicYearId: year2026.id,
      name: 'C',
      roomNumber: 'Room 103'
    }
  });

  // 6. Subjects
  const subMath = await prisma.subject.create({
    data: { schoolId: schoolA.id, name: 'Mathematics', code: 'MATH101', category: 'CORE' }
  });
  const subSci = await prisma.subject.create({
    data: { schoolId: schoolA.id, name: 'Science', code: 'SCI101', category: 'CORE' }
  });
  const subEng = await prisma.subject.create({
    data: { schoolId: schoolA.id, name: 'English', code: 'ENG101', category: 'LANGUAGE' }
  });
  const subSoc = await prisma.subject.create({
    data: { schoolId: schoolA.id, name: 'Social Science', code: 'SOC101', category: 'CORE' }
  });
  const subTam = await prisma.subject.create({
    data: { schoolId: schoolA.id, name: 'Tamil', code: 'TAM101', category: 'LANGUAGE' }
  });

  const allSubjects = [subMath, subSci, subEng, subSoc, subTam];

  // 7. Teacher Assignments
  await prisma.teacherAssignment.create({
    data: {
      schoolId: schoolA.id,
      teacherId: teacherMath.id,
      sectionId: sectionA.id,
      subjectId: subMath.id,
      academicYearId: year2026.id,
      isClassTeacher: true
    }
  });
  await prisma.teacherAssignment.create({
    data: {
      schoolId: schoolA.id,
      teacherId: teacherMath.id,
      sectionId: sectionB.id,
      subjectId: subMath.id,
      academicYearId: year2026.id,
      isClassTeacher: false
    }
  });
  await prisma.teacherAssignment.create({
    data: {
      schoolId: schoolA.id,
      teacherId: teacherScience.id,
      sectionId: sectionA.id,
      subjectId: subSci.id,
      academicYearId: year2026.id,
      isClassTeacher: false
    }
  });
  await prisma.teacherAssignment.create({
    data: {
      schoolId: schoolA.id,
      teacherId: teacherEnglish.id,
      sectionId: sectionA.id,
      subjectId: subEng.id,
      academicYearId: year2026.id,
      isClassTeacher: false
    }
  });

  // 8. Students & Enrollments
  // Student 1: Aarav Sharma (has user account)
  const aaravUser = await prisma.user.create({
    data: {
      schoolId: schoolA.id,
      organizationId: org.id,
      email: 'student.aarav@oakridge.edu',
      passwordHash: studentHash,
      name: 'Aarav Sharma',
      role: 'STUDENT'
    }
  });

  const parentUser = await prisma.user.create({
    data: {
      schoolId: schoolA.id,
      organizationId: org.id,
      email: 'parent.sharma@example.com',
      passwordHash: parentHash,
      name: 'Vikram Sharma (Guardian)',
      role: 'PARENT'
    }
  });

  const studentAarav = await prisma.student.create({
    data: {
      schoolId: schoolA.id,
      userId: aaravUser.id,
      admissionNumber: 'OAK-2026-001',
      firstName: 'Aarav',
      lastName: 'Sharma',
      dateOfBirth: new Date('2011-04-12'),
      gender: 'MALE',
      status: 'ACTIVE'
    }
  });

  await prisma.guardianLink.create({
    data: {
      userId: parentUser.id,
      studentId: studentAarav.id,
      relationship: 'FATHER',
      isPrimary: true
    }
  });

  // Enrollments for Section A
  const enrolledStudentsSecA = [studentAarav];

  const studentNamesSecA = [
    { first: 'Diya', last: 'Krishnan', adm: 'OAK-2026-002', gender: 'FEMALE' },
    { first: 'Rohan', last: 'Varma', adm: 'OAK-2026-003', gender: 'MALE' },
    { first: 'Ananya', last: 'Iyer', adm: 'OAK-2026-004', gender: 'FEMALE' },
    { first: 'Kavya', last: 'Nair', adm: 'OAK-2026-005', gender: 'FEMALE' }
  ];

  for (const s of studentNamesSecA) {
    const created = await prisma.student.create({
      data: {
        schoolId: schoolA.id,
        admissionNumber: s.adm,
        firstName: s.first,
        lastName: s.last,
        dateOfBirth: new Date('2011-06-15'),
        gender: s.gender,
        status: 'ACTIVE'
      }
    });
    enrolledStudentsSecA.push(created);
  }

  const enrollmentsA = [];
  for (let i = 0; i < enrolledStudentsSecA.length; i++) {
    const enr = await prisma.enrollment.create({
      data: {
        studentId: enrolledStudentsSecA[i].id,
        academicYearId: year2026.id,
        gradeId: grade10.id,
        sectionId: sectionA.id,
        rollNumber: String(i + 1).padStart(2, '0'),
        status: 'ACTIVE'
      }
    });
    enrollmentsA.push(enr);
  }

  // Section B Students
  const studentNamesSecB = [
    { first: 'Siddharth', last: 'Menon', adm: 'OAK-2026-006', gender: 'MALE' },
    { first: 'Pooja', last: 'Reddy', adm: 'OAK-2026-007', gender: 'FEMALE' },
    { first: 'Aditya', last: 'Patel', adm: 'OAK-2026-008', gender: 'MALE' },
    { first: 'Meera', last: 'Chopra', adm: 'OAK-2026-009', gender: 'FEMALE' }
  ];

  const enrollmentsB = [];
  for (let i = 0; i < studentNamesSecB.length; i++) {
    const s = studentNamesSecB[i];
    const created = await prisma.student.create({
      data: {
        schoolId: schoolA.id,
        admissionNumber: s.adm,
        firstName: s.first,
        lastName: s.last,
        dateOfBirth: new Date('2011-08-20'),
        gender: s.gender,
        status: 'ACTIVE'
      }
    });
    const enr = await prisma.enrollment.create({
      data: {
        studentId: created.id,
        academicYearId: year2026.id,
        gradeId: grade10.id,
        sectionId: sectionB.id,
        rollNumber: String(i + 1).padStart(2, '0'),
        status: 'ACTIVE'
      }
    });
    enrollmentsB.push(enr);
  }

  // Section C Students
  const studentNamesSecC = [
    { first: 'Varun', last: 'Deshmukh', adm: 'OAK-2026-010', gender: 'MALE' },
    { first: 'Sneha', last: 'Rao', adm: 'OAK-2026-011', gender: 'FEMALE' },
    { first: 'Nikhil', last: 'Gupta', adm: 'OAK-2026-012', gender: 'MALE' }
  ];

  const enrollmentsC = [];
  for (let i = 0; i < studentNamesSecC.length; i++) {
    const s = studentNamesSecC[i];
    const created = await prisma.student.create({
      data: {
        schoolId: schoolA.id,
        admissionNumber: s.adm,
        firstName: s.first,
        lastName: s.last,
        dateOfBirth: new Date('2011-09-10'),
        gender: s.gender,
        status: 'ACTIVE'
      }
    });
    const enr = await prisma.enrollment.create({
      data: {
        studentId: created.id,
        academicYearId: year2026.id,
        gradeId: grade10.id,
        sectionId: sectionC.id,
        rollNumber: String(i + 1).padStart(2, '0'),
        status: 'ACTIVE'
      }
    });
    enrollmentsC.push(enr);
  }

  // 9. Examinations
  // Exam 1: Revision Test 1 (Max 60, Pass 24)
  const examRev1 = await prisma.examination.create({
    data: {
      schoolId: schoolA.id,
      academicYearId: year2026.id,
      gradeId: grade10.id,
      name: 'Revision Test 1',
      examType: 'REVISION_TEST',
      status: 'APPROVED',
      startDate: new Date('2026-07-15'),
      endDate: new Date('2026-07-22'),
      createdById: principal.id,
      approvedById: principal.id
    }
  });

  // Exam 2: Revision Test 2 (Max 60, Pass 24)
  const examRev2 = await prisma.examination.create({
    data: {
      schoolId: schoolA.id,
      academicYearId: year2026.id,
      gradeId: grade10.id,
      name: 'Revision Test 2',
      examType: 'REVISION_TEST',
      status: 'APPROVED',
      startDate: new Date('2026-08-20'),
      endDate: new Date('2026-08-27'),
      createdById: principal.id,
      approvedById: principal.id
    }
  });

  // Exam 3: Quarterly Examination (Max 100, Pass 40)
  const examQuarterly = await prisma.examination.create({
    data: {
      schoolId: schoolA.id,
      academicYearId: year2026.id,
      gradeId: grade10.id,
      name: 'Quarterly Examination',
      examType: 'QUARTERLY',
      status: 'OPEN',
      startDate: new Date('2026-09-25'),
      endDate: new Date('2026-10-05'),
      createdById: principal.id
    }
  });

  // Create ExaminationSubjects for each exam
  const examSubjectsRev1: Record<string, any> = {};
  const examSubjectsRev2: Record<string, any> = {};
  const examSubjectsQuarterly: Record<string, any> = {};

  for (const sub of allSubjects) {
    examSubjectsRev1[sub.id] = await prisma.examinationSubject.create({
      data: {
        examinationId: examRev1.id,
        subjectId: sub.id,
        maxMarks: 60,
        passingMarks: 24,
        weightage: 1.0
      }
    });

    examSubjectsRev2[sub.id] = await prisma.examinationSubject.create({
      data: {
        examinationId: examRev2.id,
        subjectId: sub.id,
        maxMarks: 60,
        passingMarks: 24,
        weightage: 1.0
      }
    });

    examSubjectsQuarterly[sub.id] = await prisma.examinationSubject.create({
      data: {
        examinationId: examQuarterly.id,
        subjectId: sub.id,
        maxMarks: 100,
        passingMarks: 40,
        weightage: 1.0
      }
    });
  }

  // 10. Populate Assessment Results with realistic growth and mastery levels
  // Specific required verification case:
  // Aarav Sharma in Math:
  // Revision 1: 42/60 = 70.0%
  // Revision 2: 51/60 = 85.0% -> (+15.0 percentage points growth)
  const aaravEnrollment = enrollmentsA[0];

  // Helper to record result
  async function addResult(examSubject: any, enrollment: any, marks: number | null, status = 'PRESENT') {
    const isPresent = status === 'PRESENT';
    const marksObtained = isPresent ? marks : null;
    const percentage = isPresent && marks !== null ? calculatePercentage(marks, examSubject.maxMarks) : null;
    const isPassing = percentage !== null ? percentage >= (examSubject.passingMarks / examSubject.maxMarks * 100) : null;

    return prisma.assessmentResult.create({
      data: {
        examinationSubjectId: examSubject.id,
        enrollmentId: enrollment.id,
        marksObtained,
        status,
        percentage,
        isPassing,
        enteredById: teacherMath.id,
        updatedById: teacherMath.id
      }
    });
  }

  // Seed Revision 1 and Revision 2 for Section A
  // Aarav:
  await addResult(examSubjectsRev1[subMath.id], aaravEnrollment, 42); // 70%
  await addResult(examSubjectsRev2[subMath.id], aaravEnrollment, 51); // 85% (+15%)
  await addResult(examSubjectsRev1[subSci.id], aaravEnrollment, 48); // 80%
  await addResult(examSubjectsRev2[subSci.id], aaravEnrollment, 54); // 90%
  await addResult(examSubjectsRev1[subEng.id], aaravEnrollment, 50); // 83.33%
  await addResult(examSubjectsRev2[subEng.id], aaravEnrollment, 52); // 86.67%
  await addResult(examSubjectsRev1[subSoc.id], aaravEnrollment, 45); // 75%
  await addResult(examSubjectsRev2[subSoc.id], aaravEnrollment, 49); // 81.67%
  await addResult(examSubjectsRev1[subTam.id], aaravEnrollment, 40); // 66.67%
  await addResult(examSubjectsRev2[subTam.id], aaravEnrollment, 46); // 76.67%

  // Diya (High achiever)
  await addResult(examSubjectsRev1[subMath.id], enrollmentsA[1], 56);
  await addResult(examSubjectsRev2[subMath.id], enrollmentsA[1], 58);
  await addResult(examSubjectsRev1[subSci.id], enrollmentsA[1], 55);
  await addResult(examSubjectsRev2[subSci.id], enrollmentsA[1], 57);

  // Rohan (Needs support in Math, improving in Science)
  await addResult(examSubjectsRev1[subMath.id], enrollmentsA[2], 22); // 36.67% (needs support)
  await addResult(examSubjectsRev2[subMath.id], enrollmentsA[2], 26); // 43.33% (developing)
  await addResult(examSubjectsRev1[subSci.id], enrollmentsA[2], 35);
  await addResult(examSubjectsRev2[subSci.id], enrollmentsA[2], 38);

  // Ananya (Absent in Revision 1 Math, present in Rev 2)
  await addResult(examSubjectsRev1[subMath.id], enrollmentsA[3], null, 'ABSENT');
  await addResult(examSubjectsRev2[subMath.id], enrollmentsA[3], 44);
  await addResult(examSubjectsRev1[subSci.id], enrollmentsA[3], 46);
  await addResult(examSubjectsRev2[subSci.id], enrollmentsA[3], 48);

  // Kavya (Consistent)
  await addResult(examSubjectsRev1[subMath.id], enrollmentsA[4], 45);
  await addResult(examSubjectsRev2[subMath.id], enrollmentsA[4], 47);
  await addResult(examSubjectsRev1[subSci.id], enrollmentsA[4], 42);
  await addResult(examSubjectsRev2[subSci.id], enrollmentsA[4], 45);

  // Populate Section B
  for (const enr of enrollmentsB) {
    await addResult(examSubjectsRev1[subMath.id], enr, Math.floor(30 + Math.random() * 25));
    await addResult(examSubjectsRev2[subMath.id], enr, Math.floor(32 + Math.random() * 25));
    await addResult(examSubjectsRev1[subSci.id], enr, Math.floor(35 + Math.random() * 20));
    await addResult(examSubjectsRev2[subSci.id], enr, Math.floor(38 + Math.random() * 20));
  }

  // Populate Section C
  for (const enr of enrollmentsC) {
    await addResult(examSubjectsRev1[subMath.id], enr, Math.floor(25 + Math.random() * 30));
    await addResult(examSubjectsRev2[subMath.id], enr, Math.floor(28 + Math.random() * 30));
    await addResult(examSubjectsRev1[subSci.id], enr, Math.floor(30 + Math.random() * 25));
    await addResult(examSubjectsRev2[subSci.id], enr, Math.floor(32 + Math.random() * 25));
  }

  // 11. Populate Attendance records (last 20 school days)
  console.log('Generating attendance timeline...');
  const allEnrollments = [...enrollmentsA, ...enrollmentsB, ...enrollmentsC];
  const today = new Date('2026-10-21');

  for (let d = 20; d >= 1; d--) {
    const attendanceDate = new Date(today);
    attendanceDate.setDate(today.getDate() - d);
    attendanceDate.setUTCHours(0, 0, 0, 0);

    // Skip weekends
    if (attendanceDate.getDay() === 0 || attendanceDate.getDay() === 6) continue;

    for (const enr of allEnrollments) {
      // Rohan has occasional absences to test low-attendance flagging
      let status = 'PRESENT';
      if (enr.studentId === enrolledStudentsSecA[2].id && (d === 5 || d === 12 || d === 15)) {
        status = 'ABSENT';
      } else if (d === 8 && enr.studentId === enrolledStudentsSecA[3].id) {
        status = 'EXCUSED';
      }

      await prisma.studentAttendance.create({
        data: {
          enrollmentId: enr.id,
          date: attendanceDate,
          status,
          session: 'FULL_DAY',
          recordedById: teacherMath.id
        }
      });
    }
  }

  // 12. Create Remedial Intervention Plan for Rohan Varma
  const plan = await prisma.interventionPlan.create({
    data: {
      studentId: enrolledStudentsSecA[2].id, // Rohan
      subjectId: subMath.id,
      teacherId: teacherMath.id,
      title: 'Targeted Remedial: Quadratic Equations & Polynomials',
      learningGapDescription: 'Difficulties with factoring quadratic polynomials in Revision Test 1 (scored 36.67%).',
      targetPercentage: 55.0,
      actionPlan: 'Three weekly 45-minute peer problem-solving sessions with step-by-step visual worksheets.',
      status: 'IN_PROGRESS'
    }
  });

  await prisma.interventionReview.create({
    data: {
      interventionPlanId: plan.id,
      reviewDate: new Date('2026-08-28'),
      evaluationSummary: 'Student showed positive response, raising Math score from 36.67% to 43.33% in Revision Test 2.',
      postInterventionPercentage: 43.33,
      outcomeStatus: 'IMPROVED'
    }
  });

  // 13. Student Personal Goal for Aarav
  await prisma.studentGoal.create({
    data: {
      studentId: studentAarav.id,
      subjectId: subMath.id,
      targetScore: 90.0,
      deadline: new Date('2026-12-15'),
      achieved: false,
      notes: 'Achieve 90%+ in Half-Yearly Mathematics examination.'
    }
  });

  console.log('✅ SPIS database seeded successfully!');
  console.log('Test Accounts:');
  console.log('  Super Admin:  superadmin@spis.edu      (Password: Admin@123)');
  console.log('  Principal:    principal@oakridge.edu   (Password: Principal@123)');
  console.log('  Math Teacher: math.teacher@oakridge.edu(Password: Teacher@123)');
  console.log('  Student:      student.aarav@oakridge.edu(Password: Student@123)');
  console.log('  Parent:       parent.sharma@example.com (Password: Parent@123)');
}

main()
  .catch(e => {
    console.error('Seed script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
