import { z } from 'zod';
// Audit log schemas
export const auditLogSchema = z.object({
    id: z.string(),
    actor: z.string(),
    action: z.string(),
    module: z.string(),
    details: z.record(z.unknown()).nullable(),
    ipAddress: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
// System log schemas
export const logSourceSchema = z.object({
    id: z.string(),
    name: z.string(),
    token: z.string(),
});
export const logSchema = z.object({
    id: z.string(),
    eventMessage: z.string(),
    timestamp: z.string(),
    body: z.record(z.string(), z.unknown()),
    source: z.string().optional(),
});
export const logStatsSchema = z.object({
    source: z.string(),
    count: z.number(),
    lastActivity: z.string(),
});
//# sourceMappingURL=logs.schema.js.map