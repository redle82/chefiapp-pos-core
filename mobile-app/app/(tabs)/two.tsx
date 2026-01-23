import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useAppStaff } from '@/context/AppStaffContext';
import { RoleSelector } from '@/components/RoleSelector';
import { HapticFeedback } from '@/services/haptics';

export default function AccountScreen() {
  const { session, signOut } = useAuth();
  const { roleConfig, shiftState } = useAppStaff();
  const user = session?.user;
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Erro', 'Falha ao sair');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.email?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.email}>{user?.email || 'Usuário'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#2c2c2e', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
          <Text style={{ fontSize: 16, color: '#fff' }}>{roleConfig.emoji} {roleConfig.label}</Text>
        </View>
      </View>

      {/* FASE 5: Botão para alterar papel */}
      <TouchableOpacity 
        style={styles.roleButton}
        onPress={() => {
          if (shiftState === 'active') {
            Alert.alert(
              'Turno Ativo',
              'Não é possível alterar o papel durante um turno ativo. Encerre o turno primeiro.',
              [{ text: 'OK' }]
            );
            return;
          }
          HapticFeedback.light();
          setShowRoleSelector(true);
        }}
      >
        <Text style={styles.roleButtonText}>Alterar Papel</Text>
        <Text style={styles.roleButtonSubtext}>
          {roleConfig.emoji} {roleConfig.label}
        </Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ChefIApp Mobile</Text>
        <Text style={styles.version}>Versão 1.0.0 (Beta)</Text>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={() => {
          HapticFeedback.medium();
          handleLogout();
        }}
      >
        <Text style={styles.logoutText}>Sair da Conta</Text>
      </TouchableOpacity>

      {/* FASE 5: Role Selector Modal */}
      <RoleSelector 
        visible={showRoleSelector}
        onClose={() => setShowRoleSelector(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    marginTop: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#32d74b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#000',
    fontSize: 32,
    fontWeight: 'bold',
  },
  email: {
    color: '#fff',
    fontSize: 16,
  },
  roleButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  roleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  roleButtonSubtext: {
    color: '#888',
    fontSize: 14,
  },
  section: {
    marginBottom: 32,
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#888',
    fontSize: 14,
  },
  version: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 32,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
