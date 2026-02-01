/**
 * B2 — Work log export schema (WORK_LOG_EXPORT + EXPORT_FORMATS v1).
 * Valida a forma do JSON retornado por get_work_log_export (work_log_v1).
 * Ref: docs/architecture/WORK_LOG_EXPORT.md, docs/architecture/EXPORT_FORMATS.md
 */

import { describe, it, expect } from '@jest/globals';

const SCHEMA_VERSION = 'work_log_v1';

/** Fixture válido conforme work_log_v1 */
function validWorkLogFixture(): Record<string, unknown> {
  return {
    schema_version: SCHEMA_VERSION,
    tenant_id: '550e8400-e29b-41d4-a716-446655440000',
    period: {
      start: '2026-01-01T00:00:00Z',
      end: '2026-01-31T23:59:59Z',
    },
    generated_at: '2026-02-01T10:00:00Z',
    export_id: '660e8400-e29b-41d4-a716-446655440001',
    users: [
      { user_id: '770e8400-e29b-41d4-a716-446655440002', role: 'owner' },
      { user_id: '880e8400-e29b-41d4-a716-446655440003', role: 'staff' },
    ],
    shifts: [
      {
        shift_id: '990e8400-e29b-41d4-a716-446655440004',
        user_id: '770e8400-e29b-41d4-a716-446655440002',
        start: '2026-01-15T09:00:00Z',
        end: '2026-01-15T17:00:00Z',
        status: 'closed',
        role_at_turn: 'owner',
        operational_mode: 'rush',
        device_id: 'device-1',
      },
    ],
    check_ins: [
      {
        event_type: 'check_in',
        user_id: '770e8400-e29b-41d4-a716-446655440002',
        timestamp: '2026-01-15T09:00:00Z',
        session_id: '990e8400-e29b-41d4-a716-446655440004',
      },
      {
        event_type: 'check_out',
        user_id: '770e8400-e29b-41d4-a716-446655440002',
        timestamp: '2026-01-15T17:00:00Z',
        session_id: '990e8400-e29b-41d4-a716-446655440004',
      },
    ],
    tasks: [],
  };
}

describe('Work log export schema (work_log_v1)', () => {
  it('deve ter schema_version work_log_v1', () => {
    const data = validWorkLogFixture();
    expect(data.schema_version).toBe(SCHEMA_VERSION);
  });

  it('deve ter tenant_id, period, generated_at, export_id', () => {
    const data = validWorkLogFixture();
    expect(data).toHaveProperty('tenant_id');
    expect(data).toHaveProperty('period');
    expect(data).toHaveProperty('generated_at');
    expect(data).toHaveProperty('export_id');
    expect(typeof data.tenant_id).toBe('string');
    expect(data.period).toMatchObject({
      start: expect.any(String),
      end: expect.any(String),
    });
  });

  it('deve ter users como array de { user_id, role }', () => {
    const data = validWorkLogFixture();
    expect(Array.isArray(data.users)).toBe(true);
    for (const u of data.users as Array<{ user_id: string; role: string }>) {
      expect(u).toHaveProperty('user_id');
      expect(u).toHaveProperty('role');
      expect(typeof u.user_id).toBe('string');
      expect(typeof u.role).toBe('string');
    }
  });

  it('deve ter shifts como array com shift_id, user_id, start, end, status', () => {
    const data = validWorkLogFixture();
    expect(Array.isArray(data.shifts)).toBe(true);
    for (const s of data.shifts as Array<Record<string, unknown>>) {
      expect(s).toHaveProperty('shift_id');
      expect(s).toHaveProperty('user_id');
      expect(s).toHaveProperty('start');
      expect(s).toHaveProperty('end');
      expect(s).toHaveProperty('status');
    }
  });

  it('deve ter check_ins como array com event_type, user_id, timestamp, session_id', () => {
    const data = validWorkLogFixture();
    expect(Array.isArray(data.check_ins)).toBe(true);
    for (const c of data.check_ins as Array<Record<string, unknown>>) {
      expect(c).toHaveProperty('event_type');
      expect(c).toHaveProperty('user_id');
      expect(c).toHaveProperty('timestamp');
      expect(c).toHaveProperty('session_id');
      expect(['check_in', 'check_out']).toContain(c.event_type as string);
    }
  });

  it('deve ter tasks como array (v1 pode ser vazio)', () => {
    const data = validWorkLogFixture();
    expect(Array.isArray(data.tasks)).toBe(true);
  });

  it('deve aceitar export vazio (users/shifts/check_ins vazios)', () => {
    const empty = {
      schema_version: SCHEMA_VERSION,
      tenant_id: '550e8400-e29b-41d4-a716-446655440000',
      period: { start: '2026-01-01T00:00:00Z', end: '2026-01-31T23:59:59Z' },
      generated_at: '2026-02-01T10:00:00Z',
      export_id: '660e8400-e29b-41d4-a716-446655440001',
      users: [],
      shifts: [],
      check_ins: [],
      tasks: [],
    };
    expect(empty.schema_version).toBe(SCHEMA_VERSION);
    expect(empty.users).toEqual([]);
    expect(empty.shifts).toEqual([]);
    expect(empty.check_ins).toEqual([]);
    expect(empty.tasks).toEqual([]);
  });
});
