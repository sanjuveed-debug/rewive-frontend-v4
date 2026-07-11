import { useQuery } from '@tanstack/react-query';
import type { AuditEntityType, AuditLogEntry } from './types';

// REALITY GAP: the real backend has an internal fpa_audit_log table + a
// log_audit() helper called by mutating endpoints, but no public GET route
// was ever exposed to read it back. Rather than fabricate history, resolve
// honestly to an empty list — no network call is made. Consumers (e.g.
// ConnectionsTable's history row) should render this through the same
// "nothing yet" empty-state pattern used elsewhere.
export function useAuditLog(entityType?: AuditEntityType, entityId?: string) {
  return useQuery({
    queryKey: ['audit-log', entityType, entityId],
    queryFn: async (): Promise<AuditLogEntry[]> => [],
    enabled: !!entityType && !!entityId,
  });
}
