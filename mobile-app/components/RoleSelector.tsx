/**
 * RoleSelector - Seletor de Papel Amigável
 * 
 * FASE 5 - Polimento dos Apps
 * 
 * Substitui RoleSelectorDevPanel com UI mais amigável e menos técnica
 */

import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
    SafeAreaView,
    Pressable
} from 'react-native';
import { useAppStaff, ROLE_PERMISSIONS_MAP, type StaffRole } from '@/context/AppStaffContext';
import { HapticFeedback } from '@/services/haptics';

interface RoleSelectorProps {
    visible: boolean;
    onClose: () => void;
}

// Descrições amigáveis para cada role
const ROLE_DESCRIPTIONS: Record<StaffRole, { description: string; examples: string[] }> = {
    waiter: {
        description: 'Atende mesas, recebe pedidos e processa pagamentos',
        examples: ['Atender clientes', 'Receber pedidos', 'Processar pagamentos']
    },
    bartender: {
        description: 'Prepara bebidas e gerencia o bar',
        examples: ['Preparar drinks', 'Gerenciar estoque do bar', 'Atender pedidos de bebidas']
    },
    cook: {
        description: 'Prepara pratos na cozinha',
        examples: ['Cozinhar pratos', 'Gerenciar fila de pedidos', 'Manter qualidade']
    },
    chef: {
        description: 'Gerencia a cozinha e coordena a equipe',
        examples: ['Coordenar cozinha', 'Garantir qualidade', 'Gerenciar equipe']
    },
    manager: {
        description: 'Gerencia o restaurante e supervisiona operações',
        examples: ['Supervisionar equipe', 'Gerenciar operações', 'Tomar decisões']
    },
    owner: {
        description: 'Proprietário do restaurante',
        examples: ['Visão geral do negócio', 'Decisões estratégicas', 'Gestão completa']
    },
    cleaning: {
        description: 'Responsável pela limpeza e manutenção',
        examples: ['Limpar áreas', 'Manter organização', 'Manutenção básica']
    },
    supervisor: {
        description: 'Supervisiona operações e equipe',
        examples: ['Supervisionar turno', 'Resolver problemas', 'Apoiar equipe']
    },
    cashier: {
        description: 'Opera o caixa e processa pagamentos',
        examples: ['Processar pagamentos', 'Gerenciar caixa', 'Atender clientes']
    },
    delivery: {
        description: 'Entrega pedidos e gerencia entregas',
        examples: ['Entregar pedidos', 'Gerenciar rotas', 'Comunicar com clientes']
    },
    vendor: {
        description: 'Vendedor ambulante ou em ponto fixo',
        examples: ['Vender produtos', 'Gerenciar estoque', 'Atender clientes']
    },
    ambulante: {
        description: 'Vendedor ambulante',
        examples: ['Vender produtos', 'Gerenciar estoque', 'Atender clientes']
    },
    admin: {
        description: 'Administrador do sistema',
        examples: ['Configurar sistema', 'Gerenciar usuários', 'Manutenção técnica']
    },
};

export function RoleSelector({ visible, onClose }: RoleSelectorProps) {
    const {
        activeRole,
        setActiveRole,
        roleConfig,
        shiftState,
        allRoles
    } = useAppStaff();

    const handleRoleChange = (role: StaffRole) => {
        if (activeRole === role) {
            onClose();
            return;
        }

        // Bloquear mudança durante turno ativo
        if (shiftState === 'active') {
            HapticFeedback.error();
            // Feedback será mostrado via UI
            return;
        }

        HapticFeedback.success();
        setActiveRole(role);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Escolher Papel</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeButton}>✕</Text>
                    </TouchableOpacity>
                </View>

                {shiftState === 'active' && (
                    <View style={styles.warningBanner}>
                        <Text style={styles.warningText}>
                            ⚠️ Não é possível alterar o papel durante um turno ativo
                        </Text>
                    </View>
                )}

                <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
                    <Text style={styles.subtitle}>
                        Selecione seu papel para personalizar a experiência do app
                    </Text>

                    <View style={styles.rolesGrid}>
                        {allRoles.map(role => {
                            const config = ROLE_PERMISSIONS_MAP[role];
                            const description = ROLE_DESCRIPTIONS[role];
                            const isActive = role === activeRole;
                            const isDisabled = shiftState === 'active' && !isActive;

                            return (
                                <Pressable
                                    key={role}
                                    style={[
                                        styles.roleCard,
                                        isActive && styles.roleCardActive,
                                        isDisabled && styles.roleCardDisabled
                                    ]}
                                    onPress={() => handleRoleChange(role)}
                                    disabled={isDisabled}
                                >
                                    <View style={styles.roleHeader}>
                                        <Text style={styles.roleEmoji}>{config.emoji}</Text>
                                        <View style={styles.roleInfo}>
                                            <Text style={[
                                                styles.roleName,
                                                isActive && styles.roleNameActive
                                            ]}>
                                                {config.label}
                                            </Text>
                                            {isActive && (
                                                <Text style={styles.activeBadge}>Atual</Text>
                                            )}
                                        </View>
                                    </View>
                                    <Text style={styles.roleDescription}>
                                        {description.description}
                                    </Text>
                                    <View style={styles.examplesContainer}>
                                        {description.examples.slice(0, 2).map((example, idx) => (
                                            <View key={idx} style={styles.exampleTag}>
                                                <Text style={styles.exampleText}>{example}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeButton: {
        fontSize: 28,
        color: '#888',
        fontWeight: '300',
    },
    warningBanner: {
        backgroundColor: '#3a1a1a',
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444',
        padding: 12,
        marginHorizontal: 20,
        marginTop: 16,
        borderRadius: 8,
    },
    warningText: {
        color: '#ff8888',
        fontSize: 14,
        fontWeight: '600',
    },
    scrollContent: {
        flex: 1,
    },
    scrollContentContainer: {
        padding: 20,
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        marginBottom: 24,
        textAlign: 'center',
    },
    rolesGrid: {
        gap: 16,
    },
    roleCard: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    roleCardActive: {
        borderColor: '#d4a574',
        backgroundColor: '#2a2010',
    },
    roleCardDisabled: {
        opacity: 0.5,
    },
    roleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    roleEmoji: {
        fontSize: 32,
        marginRight: 12,
    },
    roleInfo: {
        flex: 1,
    },
    roleName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    roleNameActive: {
        color: '#d4a574',
    },
    activeBadge: {
        fontSize: 12,
        color: '#d4a574',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    roleDescription: {
        fontSize: 14,
        color: '#aaa',
        marginBottom: 12,
        lineHeight: 20,
    },
    examplesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    exampleTag: {
        backgroundColor: '#0a0a0a',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    exampleText: {
        fontSize: 12,
        color: '#888',
    },
});
