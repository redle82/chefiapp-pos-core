/**
 * BenchmarkCard - Card de Benchmark do Grupo
 */
// @ts-nocheck


import React, { useState, useEffect } from 'react';
import { groupEngine, type UnitBenchmark } from '../../core/groups/GroupEngine';

interface Props {
  groupId: string;
}

export function BenchmarkCard({ groupId }: Props) {
  const [benchmark, setBenchmark] = useState<UnitBenchmark | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBenchmark = async () => {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);

        const data = await groupEngine.calculateBenchmark(groupId, startDate, endDate);
        setBenchmark(data);
      } catch (error) {
        console.error('Error loading benchmark:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBenchmark();
  }, [groupId]);

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>Carregando...</div>;
  }

  if (!benchmark) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
        <p>Nenhum benchmark disponível</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      <div style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Receita Total</div>
        <div style={{ fontSize: '32px', fontWeight: 600, color: '#28a745' }}>
          R$ {benchmark.totalRevenue.toFixed(2)}
        </div>
      </div>
      <div style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total de Pedidos</div>
        <div style={{ fontSize: '32px', fontWeight: 600, color: '#667eea' }}>
          {benchmark.totalOrders}
        </div>
      </div>
      <div style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Ticket Médio</div>
        <div style={{ fontSize: '32px', fontWeight: 600, color: '#ff9800' }}>
          R$ {benchmark.averageOrderValue.toFixed(2)}
        </div>
      </div>
      <div style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total de Clientes</div>
        <div style={{ fontSize: '32px', fontWeight: 600, color: '#9c27b0' }}>
          {benchmark.totalCustomers}
        </div>
      </div>
    </div>
  );
}
