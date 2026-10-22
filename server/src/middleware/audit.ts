import prisma from '../db/prisma.js';

export interface AuditLogOptions {
  schoolId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, any> | string;
  ipAddress?: string;
}

export async function logAudit(options: AuditLogOptions): Promise<void> {
  try {
    const detailsJson = typeof options.details === 'object'
      ? JSON.stringify(options.details)
      : options.details;

    await prisma.auditLog.create({
      data: {
        schoolId: options.schoolId || null,
        userId: options.userId || null,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId || null,
        detailsJson: detailsJson || null,
        ipAddress: options.ipAddress || null,
      }
    });
  } catch (error) {
    // Non-blocking for primary transaction, but logged
    console.error('Failed to write audit log entry:', error);
  }
}
