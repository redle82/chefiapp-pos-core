/**
 * MiniMap — Mini-Mapa Fixo no Topo
 * Princípio: Visão rápida de todas as mesas, um toque abre o comandeiro.
 */
// @ts-nocheck


import React from 'react';
import type { Table } from '../types';
import { TableStatus } from '../types';
import { colors } from '../../../ui/design-system/tokens/colors';
import { spacing } from '../../../ui/design-system/tokens/spacing';

interface MiniMapProps {
  tables: Table[];
  currentTableId?: string;
  onTableClick: (table: Table) => void;
  area?: string;
}

const getStatusColor = (status: TableStatus): string => {
  switch (status) {
    case TableStatus.FREE:
      return '#32d74b'; // Verde
    case TableStatus.OCCUPIED:
      return '#ff453a'; // Vermelho
    case TableStatus.CALLING:
      return '#ffd60a'; // Amarelo
    case TableStatus.BILL_REQUESTED:
      return '#ff9500'; // Laranja
    case TableStatus.KITCHEN_READY:
      return '#0a84ff'; // Azul
    case TableStatus.CLEANING:
      return '#8e8e93'; // Cinza
    default:
      return '#8e8e93';
  }
};

export function MiniMap({ tables, currentTableId, onTableClick, area }: MiniMapProps) {
  // Grid compacto: 4 colunas
  const gridColumns = 4;
  const tableSize = 40; // px (compacto)

  return (
    <div
      style={{
        padding: spacing[2],
        background: colors.surface.base,
        borderBottom: `1px solid ${colors.border.subtle}`,
      }}
    >
      {/* Header */}
      {area && (
        <div style={{ 
          marginBottom: spacing[2],
          textAlign: 'center',
        }}>
          <span style={{ 
            fontSize: 11, 
            color: colors.text.tertiary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            {area}
          </span>
        </div>
      )}

      {/* Grid Compacto */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
          gap: spacing[1],
          maxWidth: 400,
          margin: '0 auto',
        }}
      >
        {tables.map((table) => {
          const statusColor = getStatusColor(table.status);
          const isCurrent = currentTableId === table.id;
          const isCalling = table.status === TableStatus.CALLING;

          return (
            <button
              key={table.id}
              onClick={() => onTableClick(table)}
              style={{
                width: '100%',
                aspectRatio: '1',
                minHeight: tableSize,
                minWidth: tableSize,
                borderRadius: 6,
                border: `2px solid ${isCurrent ? colors.action.base : statusColor}`,
                background: isCalling 
                  ? `${statusColor}44`
                  : isCurrent
                  ? `${colors.action.base}22`
                  : `${statusColor}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                fontSize: 10,
                fontWeight: 'bold',
                color: isCurrent ? colors.action.base : statusColor,
                // Animação piscante para "chamando"
                animation: isCalling ? 'pulse 1.5s ease-in-out infinite' : 'none',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.9)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title={`Mesa ${table.number} - ${table.status}`}
            >
              {table.number}
              
              {/* Badge de chamados múltiplos */}
              {table.callCount && table.callCount >= 3 && (
                <div
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    background: '#ff453a',
                    color: 'white',
                    borderRadius: '50%',
                    width: 14,
                    height: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 8,
                    fontWeight: 'bold',
                    border: '1px solid white',
                  }}
                >
                  {table.callCount}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legenda Compacta */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: spacing[3],
          marginTop: spacing[2],
          fontSize: 9,
          color: colors.text.tertiary,
        }}
      >
        <span>🟢 Livre</span>
        <span>🔴 Ocupada</span>
        <span>🟡 Chamando</span>
        <span>🔵 Pronta</span>
      </div>

      {/* CSS para animação piscante */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

