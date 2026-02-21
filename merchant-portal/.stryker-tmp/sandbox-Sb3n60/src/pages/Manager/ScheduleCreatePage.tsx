/**
 * Manager Schedule Create - Criar/Editar Turno
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/navigation/Header';

export function ManagerScheduleCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    user_id: '',
    role: 'WAITER' as 'WAITER' | 'KITCHEN' | 'BAR' | 'CLEANING',
    date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '16:00',
    station_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrar com gm_shifts
    // TODO: Validar conflitos de horário
    // TODO: Criar/atualizar turno
    console.log('Criar turno:', formData);
    navigate('/manager/schedule');
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Header
        title="Novo Turno"
        onBack={() => navigate('/manager/schedule')}
      />

      <div style={{ padding: '16px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
              Pessoa
            </label>
            <select
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              required
            >
              <option value="">Selecione uma pessoa</option>
              {/* TODO: Buscar lista de usuários */}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
              Função
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              required
            >
              <option value="WAITER">Garçom</option>
              <option value="KITCHEN">Cozinha</option>
              <option value="BAR">Bar</option>
              <option value="CLEANING">Limpeza</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
              Data
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                Início
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
                Fim
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => navigate('/manager/schedule')}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#667eea',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Salvar Turno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
