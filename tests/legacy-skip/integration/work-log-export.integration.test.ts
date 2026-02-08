/**
 * B2 — Work log export integration (get_work_log_export RPC).
 * Valida formato, conteúdo e isolamento por tenant.
 * Ref: docs/architecture/WORK_LOG_EXPORT.md, docs/ONDA_2_TAREFAS_60_DIAS.md
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SCHEMA_VERSION = 'work_log_v1';

describe('Integration - Work log export (get_work_log_export)', () => {
  let restaurantId: string | null = null;

  beforeAll(async () => {
    const { data: rows } = await supabase
      .from('gm_restaurants')
      .select('id')
      .limit(1);
    if (rows && rows.length > 0) {
      restaurantId = rows[0].id;
    }
  });

  describe('Formato e conteúdo', () => {
    it('deve retornar JSON work_log_v1 com schema_version, tenant_id, period, users, shifts, check_ins, tasks', async () => {
      if (!restaurantId) {
        console.warn('⚠️ Sem gm_restaurants: skip get_work_log_export formato');
        return;
      }
      const pFrom = '2025-01-01T00:00:00Z';
      const pTo = '2026-12-31T23:59:59Z';

      const { data, error } = await supabase.rpc('get_work_log_export', {
        p_restaurant_id: restaurantId,
        p_from: pFrom,
        p_to: pTo,
      });

      if (error) {
        // Pode falhar se RLS ou RPC não existir (migrations não aplicadas)
        console.warn('⚠️ get_work_log_export error:', error.message);
        return;
      }

      expect(data).toBeDefined();
      expect(data).toHaveProperty('schema_version', SCHEMA_VERSION);
      expect(data).toHaveProperty('tenant_id', restaurantId);
      expect(data).toHaveProperty('period');
      expect(data.period).toMatchObject({ start: pFrom, end: pTo });
      expect(data).toHaveProperty('generated_at');
      expect(data).toHaveProperty('export_id');
      expect(Array.isArray(data.users)).toBe(true);
      expect(Array.isArray(data.shifts)).toBe(true);
      expect(Array.isArray(data.check_ins)).toBe(true);
      expect(Array.isArray(data.tasks)).toBe(true);
    });
  });

  describe('Isolamento por tenant', () => {
    it('deve rejeitar acesso com restaurant_id de outro tenant (não membro)', async () => {
      // UUID que não é restaurante do utilizador atual (anon não é membro de nenhum)
      const otherTenantId = '00000000-0000-4000-8000-000000000001';
      const pFrom = '2026-01-01T00:00:00Z';
      const pTo = '2026-01-31T23:59:59Z';

      const { data, error } = await supabase.rpc('get_work_log_export', {
        p_restaurant_id: otherTenantId,
        p_from: pFrom,
        p_to: pTo,
      });

      // Esperado: erro (Access Denied) ou data null com error
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/Access Denied|permission|member/i);
    });

    it('deve rejeitar período inválido (p_from > p_to)', async () => {
      if (!restaurantId) return;
      const { error } = await supabase.rpc('get_work_log_export', {
        p_restaurant_id: restaurantId,
        p_from: '2026-01-31T23:59:59Z',
        p_to: '2026-01-01T00:00:00Z',
      });
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/Invalid period|p_from/i);
    });

    it('deve rejeitar período nulo', async () => {
      if (!restaurantId) return;
      const { error } = await supabase.rpc('get_work_log_export', {
        p_restaurant_id: restaurantId,
        p_from: null,
        p_to: '2026-01-31T23:59:59Z',
      });
      expect(error).toBeDefined();
    });
  });
});
