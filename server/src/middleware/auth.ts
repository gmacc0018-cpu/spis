import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthUser, UserRole } from 'shared';

const JWT_SECRET = process.env.JWT_SECRET || 'spis-secret-educational-analytics-key-2026-production-ready';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId || null,
      organizationId: user.organizationId || null,
      studentId: user.studentId || null
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || !decoded) {
      res.status(403).json({ error: 'Invalid or expired authentication token.' });
      return;
    }
    req.user = decoded as AuthUser;
    next();
  });
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not authorized to perform this action.`
      });
      return;
    }
    next();
  };
}

/**
 * Resolves the school ID for the current request.
 * - Non-superadmins are strictly restricted to their own schoolId.
 * - Superadmins can inspect any school via query parameter ?schoolId=..., or their own.
 */
export function getSchoolScope(req: AuthenticatedRequest): string | null {
  if (!req.user) return null;
  if (req.user.role === 'SUPER_ADMIN') {
    const requestedSchoolId = (req.query.schoolId as string) || (req.body?.schoolId as string);
    if (requestedSchoolId) return requestedSchoolId;
    return req.user.schoolId || null;
  }
  return req.user.schoolId || null;
}

/**
 * Enforces that non-superadmins cannot access records outside their own school.
 */
export function verifySchoolAccess(req: AuthenticatedRequest, targetSchoolId: string | null | undefined): boolean {
  if (!req.user) return false;
  if (req.user.role === 'SUPER_ADMIN') return true;
  if (!targetSchoolId || !req.user.schoolId) return false;
  return req.user.schoolId === targetSchoolId;
}
