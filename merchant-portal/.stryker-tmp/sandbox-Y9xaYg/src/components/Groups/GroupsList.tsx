/**
 * GroupsList - Lista de Grupos
 */

import React from 'react';
import type { RestaurantGroup } from '../../core/groups/GroupEngine';

interface Props {
  groups: RestaurantGroup[];
  selectedGroup: RestaurantGroup | null;
  onSelectGroup: (group: RestaurantGroup) => void;
}

export function GroupsList({ groups, selectedGroup, onSelectGroup }: Props) {
  if (groups.length === 0) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
        <p>Nenhum grupo criado</p>
      </div>
    );
  }

  const getGroupTypeIcon = (type: string) => {
    switch (type) {
      case 'franchise': return '🏪';
      case 'chain': return '🔗';
      case 'corporate': return '🏢';
      default: return '📋';
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
      {groups.map((group) => (
        <div
          key={group.id}
          onClick={() => onSelectGroup(group)}
          style={{
            border: selectedGroup?.id === group.id ? '2px solid #667eea' : '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>{getGroupTypeIcon(group.groupType)}</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
              {group.name}
            </h3>
          </div>
          {group.description && (
            <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
              {group.description}
            </p>
          )}
          <span
            style={{
              display: 'inline-block',
              padding: '4px 8px',
              backgroundColor: '#f0f0f0',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#666',
            }}
          >
            {group.groupType}
          </span>
        </div>
      ))}
    </div>
  );
}
