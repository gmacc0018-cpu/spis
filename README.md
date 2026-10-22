# School Performance Intelligence System (SPIS)

SPIS is a production-oriented, full-stack educational analytics platform built to record, analyze, visualize, compare, and improve student academic performance and attendance across examinations, subjects, sections, classes, and academic years.

---

## 🌟 Key Capabilities

1. **Organizational Hierarchy & Multi-School Governance**:
   - Organization &rarr; School &rarr; Academic Year &rarr; Grade/Standard &rarr; Section &rarr; Student &rarr; Subject &rarr; Examination &rarr; Marks & Attendance.
   - Built-in multi-tenant isolation with server-side Role-Based Access Control (RBAC).

2. **Spreadsheet-Like Marks Entry & Validation**:
   - Fast, keyboard-friendly data entry grid with arrow/enter navigation.
   - Real-time range validation ($0 \le \text{marks} \le \text{maxMarks}$).
   - Explicit result status support (`PRESENT`, `ABSENT`, `EXEMPTED`, `PENDING`) — absent/exempted results are never converted to zero marks.
   - Downloadable Excel template and bulk CSV/XLSX import with validation reports.
   - Controlled status lifecycle: `DRAFT` &rarr; `OPEN` &rarr; `SUBMITTED` &rarr; `APPROVED` &rarr; `LOCKED`.

3. **Core Performance Analytics Engine**:
   - Percentage calculation with zero-denominator guards:
     $$\text{Percentage} = \frac{\text{Marks Obtained}}{\text{Maximum Marks}} \times 100$$
   - Normalized growth across comparable assessment series:
     $$\text{Growth (pp)} = \text{Current Percentage} - \text{Previous Percentage}$$
   - Configurable mastery thresholds:
     - $\ge 85\%$: Strong Performance
     - $70\% \text{ to } < 85\%$: Good Performance
     - $50\% \text{ to } < 70\%$: Developing
     - $< 50\%$: Needs Academic Support
   - Class and section aggregates: Arithmetic Mean, Median, Passing Rates, and score distributions.

4. **Student Attendance Intelligence**:
   - Daily session register (`FULL_DAY`, `FORENOON`, `AFTERNOON`) with statuses (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`).
   - One-click "Mark All Present" toggle.
   - Attendance percentage calculation:
     $$\text{Attendance Rate} = \frac{\text{Present Sessions}}{\text{Total Sessions}} \times 100$$
   - Automatic low-attendance warning when student falls below the threshold (e.g. $< 75\%$).
   - Correlation between student attendance and academic scores.

5. **Visual Dashboards**:
   - **Principal / Headmaster Dashboard**: School average, Section 10-A/10-B/10-C comparison bar chart, subject mastery radar chart, AI-assisted briefing, and alert indicators.
   - **Teacher Dashboard**: Assigned classes & subjects, class averages, latest results, and students requiring remedial follow-up.
   - **Student / Parent Dashboard**: Multi-subject radar profile, historical progression curve across revision tests, achievement recognition badges, attendance percentage, and printable report card download.

6. **Targeted Remedial & Enrichment Interventions**:
   - Diagnosis of specific learning gaps and concept difficulties.
   - Target benchmark mastery setting and custom action plans.
   - Follow-up evaluation tracking (`IMPROVED`, `MAINTAINED`, `NEEDS_FURTHER_ACTION`) with post-intervention score verification.

7. **Printable Reports & File Exports**:
   - Individual Student Report Card (PDF stream via `pdfkit`).
   - Section Performance Matrix (Excel XLSX workbook via `exceljs`).
   - Immutable audit logs for marks modifications, status approvals, attendance tracking, and report downloads.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ or v24+)
- npm (v9+)

### Installation & Initialization
```bash
# 1. Install root and workspace dependencies
npm install

# 2. Build shared contracts
npm --workspace=shared run build

# 3. Synchronize database schema (Prisma)
npx prisma db push

# 4. Seed realistic educational dataset
npx tsx server/src/db/seed.ts
```

### Running the System
```bash
# In Terminal 1: Start Backend API (Port 4000)
npm --workspace=server run dev

# In Terminal 2: Start Frontend Application (Port 5173)
npm --workspace=client run dev
```

Visit **http://localhost:5173** in your web browser.

---

## 🔑 Demo Accounts (Pre-Seeded)

| Role | Email | Password | Access Highlights |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@spis.edu` | `Admin@123` | Multi-school network oversight, audit logs |
| **Principal** | `principal@oakridge.edu` | `Principal@123` | School analytics, section comparison, approvals |
| **Teacher** | `math.teacher@oakridge.edu` | `Teacher@123` | Marks entry grid, daily attendance, remedials |
| **Student** | `student.aarav@oakridge.edu` | `Student@123` | Personal growth curve, radar profile, PDF report |
| **Parent** | `parent.sharma@example.com` | `Parent@123` | Linked student progress & attendance |

*Note: The web UI also includes a quick **1-Click Persona Switcher** in the top navbar.*

---

## 🧪 Automated Test Suite

Run the automated test suite verifying mathematical formulas, percentage point calculations, zero denominator protection, absent result rules, multi-tenant isolation, and database constraints:

```bash
npm test
```
