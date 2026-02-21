/**
 * GroupMembersList - Lista de Membros do Grupo
 */
// @ts-nocheck


import React from 'react';
import type { GroupMember } from '../../core/groups/GroupEngine';

interface Props {
  members: GroupMember[];
}

export function GroupMembersList({ members }: Props) {
  if (members.length === 0) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
        <p>Nenhum membro no grupo</p>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'master': return '#9c27b0';
      case 'template': return '#667eea';
      case 'franchisee': return '#ff9800';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
      {members.map((member) => (
        <div
          key={member.id}
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
              {member.restaurantId.substring(0, 8)}...
            </h3>
            <span
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: getRoleColor(member.role),
                color: 'white',
              }}
            >
              {member.role.toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
            {member.inheritsConfig && <div>✅ Herda Config</div>}
            {member.inheritsMenu && <div>✅ Herda Menu</div>}
            {member.inheritsPricing && <div>✅ Herda Preços</div>}
            {member.inheritsSchedule && <div>✅ Herda Horários</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
