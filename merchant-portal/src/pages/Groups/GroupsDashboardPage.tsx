/**
 * GroupsDashboardPage - Dashboard de Grupos Multi-unidade
 * 
 * Mostra grupos, membros, benchmarks e comparações
 */

import React, { useState, useEffect } from 'react';
import { groupEngine, type RestaurantGroup, type GroupMember } from '../../core/groups/GroupEngine';
import { GroupsList } from '../../components/Groups/GroupsList';
import { GroupMembersList } from '../../components/Groups/GroupMembersList';
import { BenchmarkCard } from '../../components/Groups/BenchmarkCard';

export function GroupsDashboardPage() {
  const [groups, setGroups] = useState<RestaurantGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<RestaurantGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const groupsData = await groupEngine.listGroups();
        setGroups(groupsData);
        
        if (groupsData.length > 0 && !selectedGroup) {
          setSelectedGroup(groupsData[0]);
        }
      } catch (error) {
        console.error('Error loading groups data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadMembers = async () => {
      if (!selectedGroup) return;

      try {
        const membersData = await groupEngine.listGroupMembers(selectedGroup.id);
        setMembers(membersData);
      } catch (error) {
        console.error('Error loading members:', error);
      }
    };

    loadMembers();
  }, [selectedGroup]);

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p style={{ color: '#666' }}>Carregando grupos...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>
        Grupos Multi-unidade
      </h1>

      {/* Lista de Grupos */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Grupos</h2>
        <GroupsList groups={groups} selectedGroup={selectedGroup} onSelectGroup={setSelectedGroup} />
      </div>

      {/* Membros do Grupo Selecionado */}
      {selectedGroup && (
        <>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
              Membros: {selectedGroup.name}
            </h2>
            <GroupMembersList members={members} />
          </div>

          {/* Benchmark */}
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Benchmark</h2>
            <BenchmarkCard groupId={selectedGroup.id} />
          </div>
        </>
      )}
    </div>
  );
}
