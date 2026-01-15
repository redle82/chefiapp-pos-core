/**
 * DOMAIN WRITE AUTHORITY CONTRACT - ENFORCEMENT GATE
 * 
 * "The Gatekeeper of State"
 * 
 * Intercepts all direct database writes.
 * - PURE Mode: BLOCKS ALL.
 * - HYBRID Mode: CHECKS ExceptionRegistry.
 */
import { supabase } from '../supabase';
import { isAuthorized, AllowedOperation } from './ExceptionRegistry';
import { Logger } from '../logger/Logger';

// Configuration (Environment)
// Default to HYBRID to prevent immediate production crash before migration
const KERNEL_WRITE_MODE = (import.meta.env.VITE_KERNEL_MODE || 'HYBRID') as 'HYBRID' | 'PURE';

export class ConstitutionalBreachError extends Error {
    constructor(message: string, public metadata: any) {
        super(message);
        this.name = 'CRITICAL_CONSTITUTIONAL_BREACH';
    }
}

export class DbWriteGate {
    /**
     * Authorized Insert
     */
    static async insert<T = any>(
        callerTag: string,
        table: string,
        data: any,
        context: { tenantId?: string }
    ) {
        this.enforce('INSERT', callerTag, table, context);
        return supabase.from(table).insert(data);
    }

    /**
     * Authorized Update
     */
    static async update<T = any>(
        callerTag: string,
        table: string,
        data: any,
        match: Record<string, any>,
        context: { tenantId?: string }
    ) {
        this.enforce('UPDATE', callerTag, table, context);
        let query = supabase.from(table).update(data);

        // Apply match filters
        Object.entries(match).forEach(([key, value]) => {
            query = query.eq(key, value);
        });

        return query;
    }

    /**
     * Authorized Delete
     */
    static async delete(
        callerTag: string,
        table: string,
        match: Record<string, any>,
        context: { tenantId?: string }
    ) {
        this.enforce('DELETE', callerTag, table, context);
        let query = supabase.from(table).delete();

        // Apply match filters
        Object.entries(match).forEach(([key, value]) => {
            query = query.eq(key, value);
        });

        return query;
    }

    /**
     * Authorized Upsert
     */
    static async upsert<T = any>(
        callerTag: string,
        table: string,
        data: any,
        context: { tenantId?: string }
    ) {
        this.enforce('UPSERT', callerTag, table, context);
        return supabase.from(table).upsert(data);
    }

    /**
     * The Enforcer (Law 6)
     */
    private static enforce(
        op: AllowedOperation,
        callerTag: string,
        table: string,
        ctx: { tenantId?: string }
    ) {
        // 1. PURE MODE CHECK (Law 3 - Kill Switch)
        if (KERNEL_WRITE_MODE === 'PURE') {
            const error = new ConstitutionalBreachError(
                `Direct DB write attempted in PURE mode by ${callerTag}`,
                { op, table, tenantId: ctx.tenantId }
            );
            Logger.error('CRITICAL_CONSTITUTIONAL_BREACH', error, { op, table, ctx });
            throw error;
        }

        // 2. HYBRID MODE CHECK (Law 2 - Registry)
        if (!isAuthorized(callerTag, table, op)) {
            const error = new ConstitutionalBreachError(
                `Unauthorized Direct DB write by ${callerTag} on ${table}`,
                { op, table, tenantId: ctx.tenantId }
            );
            Logger.error('UNAUTHORIZED_DB_WRITE', error, { op, table, ctx });
            throw error;
        }

        // 3. TENANT CONTEXT CHECK (Architecture Invariant)
        if (!ctx.tenantId && table.startsWith('gm_')) {
            Logger.warn('DB_WRITE_WITHOUT_TENANT_ID', { op, table, callerTag });
            // Could throw here too if we want to be strict about multi-tenancy
        }
    }
}
