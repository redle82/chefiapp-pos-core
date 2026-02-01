import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight } from '@/constants/designTokens';
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
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{roleConfig.emoji} {roleConfig.label}</Text>
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
    backgroundColor: colors.background,
    padding: spacing[6],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[12],
    marginTop: spacing[6],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  avatarText: {
    color: colors.textInverse,
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
  },
  email: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.lg,
  },
  roleBadgeText: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
  },
  roleButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[6],
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleButtonText: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing[1],
  },
  roleButtonSubtext: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  section: {
    marginBottom: spacing[8],
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  version: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing[1],
  },
  logoutButton: {
    backgroundColor: colors.error,
    borderRadius: radius.lg,
    padding: spacing[4],
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: spacing[8],
  },
  logoutText: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
