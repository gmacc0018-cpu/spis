import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import authRoutes from './routes/auth.routes.js';
import academicRoutes from './routes/academic.routes.js';
import studentRoutes from './routes/student.routes.js';
import examRoutes from './routes/exam.routes.js';
import marksRoutes from './routes/marks.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import interventionRoutes from './routes/interventions.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import schoolRoutes from './routes/schools.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

export const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Healthcheck
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: 'School Performance Intelligence System (SPIS)',
    frontendUrl: 'http://localhost:5173',
    backendUrl: 'http://localhost:4000'
  });
});

// API Root Index
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'School Performance Intelligence System (SPIS) API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      me: '/api/auth/me',
      academic: '/api/academic/years | /grades | /sections | /subjects',
      students: '/api/students',
      exams: '/api/exams',
      marks: '/api/marks/grid',
      attendance: '/api/attendance/section | /summary',
      analytics: '/api/analytics/principal | /teacher | /compare | /organization',
      interventions: '/api/interventions',
      reports: '/api/reports/student/:id/pdf | /reports/section/:id/xlsx | /reports/audit',
      schools: '/api/schools'
    }
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/schools', schoolRoutes);

// Serve Static Frontend Assets from client/dist if present
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // Single-Page Application (SPA) Fallback for non-API routes
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
      return;
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // If client/dist is not built yet, provide a friendly landing page at root
  app.get('/', (req: Request, res: Response) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SPIS Backend API</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
            .card { background: #1e293b; border: 1px solid #334155; padding: 2rem; border-radius: 1rem; max-width: 500px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            h1 { color: #60a5fa; margin-top: 0; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
            a { display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px; }
            a:hover { background: #1d4ed8; }
            .badge { display: inline-block; background: #064e3b; color: #34d399; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: bold; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">● Backend API Active on Port 4000</span>
            <h1>SPIS Educational System</h1>
            <p>The backend API services and database are running smoothly. The frontend application is accessible at:</p>
            <a href="http://localhost:5173">Open Web App on Port 5173 &rarr;</a>
          </div>
        </body>
      </html>
    `);
  });

  // Handle any other unmatched route gracefully
  app.use((req: Request, res: Response) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.path}` });
    } else {
      res.redirect('http://localhost:5173' + req.path);
    }
  });
}

// Centralized error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected internal error occurred.',
    path: req.path
  });
});

export default app;
