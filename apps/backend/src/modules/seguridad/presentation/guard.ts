import type { RequestHandler } from 'express';
import type { AuditLog } from '../../../shared/audit/audit.js';
import { forbidden, unauthorized } from '../../../shared/http/errors.js';
import { hasPermission, type Permission } from '../domain/permissions.js';

/**
 * Exige un usuario interno con el permiso indicado (RF-13.07). Cada rechazo queda en la auditoría
 * con el permiso y la ruta (spec 008, Historia 3, escenario 3).
 */
export function guardFactory(audit: AuditLog) {
  return (permission: Permission): RequestHandler => (req, _res, next) => {
    const p = req.principal;
    if (!p) return next(unauthorized());
    if (p.type === 'STAFF' && hasPermission(p.roles, permission)) return next();
    audit
      .record({
        actorUserId: p.userId, action: 'access.denied', resourceType: 'route', resourceId: `${req.method} ${req.baseUrl}${req.path}`.slice(0, 60),
        after: { permission, roles: p.roles }, requestId: req.requestId, ipHash: req.ipHash, userAgent: req.get('user-agent') ?? null,
      })
      .then(() => next(forbidden('No tienes permiso para esta sección.')))
      .catch(next);
  };
}
