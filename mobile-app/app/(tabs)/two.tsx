import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function AccountScreen() {
  const { user, signOut } = useAuth();

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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ChefIApp Mobile</Text>
        <Text style={styles.version}>Versão 1.0.0 (Beta)</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sair da Conta</Text>
      </TouchableOpacity>
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
