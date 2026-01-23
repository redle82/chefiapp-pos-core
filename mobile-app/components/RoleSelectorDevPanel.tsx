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
import { useAppStaff, ROLE_PERMISSIONS_MAP, type StaffRole, type OperationType, type Maturity } from '@/context/AppStaffContext';

/**
 * RoleSelectorDevPanel
 * 
 * DEV-ONLY component that allows switching between all roles dynamically.
 * Accessible via a floating button in __DEV__ mode.
 */

const OPERATION_TYPE_LABELS: Record<OperationType, { label: string; emoji: string }> = {
    street_vendor: { label: 'Ambulante', emoji: '🛒' },
    restaurant: { label: 'Restaurante', emoji: '🍽️' },
    hotel: { label: 'Hotel', emoji: '🏨' },
};

const MATURITY_LABELS: Record<Maturity, { label: string; emoji: string }> = {
    starter: { label: 'Iniciante', emoji: '🌱' },
    growing: { label: 'Crescendo', emoji: '🌿' },
    professional: { label: 'Profissional', emoji: '🌳' },
};

export function RoleSelectorDevPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    const {
        activeRole,
        setActiveRole,
        operationalContext,
        setOperationalContext,
        roleConfig,
        resetShift,
        startShift,
        endShift,
        shiftState,
        allRoles,
        allOperationTypes,
        allMaturities
    } = useAppStaff();

    // Only show in DEV mode
    if (!__DEV__) return null;

    const showFeedback = (msg: string) => {
        setFeedbackMessage(msg);
        setTimeout(() => setFeedbackMessage(null), 2500);
    };

    const handleRoleChange = (role: StaffRole) => {
        if (activeRole === role) return;

        // Try to change role - Context will log warning if Shift is Active
        if (shiftState === 'active') {
            showFeedback('⚠️ Impossível alterar Papel durante Turno Ativo!');
            // Ideally we would catch this if the setter threw error, but it just warns.
            // We can check shiftState here to give better UI feedback.
            return;
        }

        setActiveRole(role);
        // resetShift(); // Context handles this? setActiveRole usually resets shift to offline in AppStaffContext.
        setIsOpen(false);
        showFeedback(`App reconfigurado para: ${ROLE_PERMISSIONS_MAP[role].label}`);
    };

    const handleOperationTypeChange = (type: OperationType) => {
        if (shiftState === 'active') {
            showFeedback('⚠️ Bloqueado: Operação fixa durante Turno!');
            return;
        }
        setOperationalContext({ operationType: type });
        resetShift();
        showFeedback(`Operação alterada para: ${OPERATION_TYPE_LABELS[type].label}`);
    };

    const handleMaturityChange = (maturity: Maturity) => {
        if (shiftState === 'active') {
            showFeedback('⚠️ Bloqueado: Maturidade fixa durante Turno!');
            return;
        }
        setOperationalContext({ maturity });
        showFeedback(`Maturidade definida como: ${MATURITY_LABELS[maturity].label}`);
    };

    const toggleShift = () => {
        if (shiftState === 'active') {
            endShift(0);
            showFeedback('🏁 Turno ENCERRADO (Debug)');
        } else {
            startShift();
            showFeedback('🚀 Turno INICIADO (Debug)');
        }
    };

    return (
        <>
            {/* Floating Dev Button */}
            <TouchableOpacity
                style={styles.floatingButton}
                onPress={() => setIsOpen(true)}
            >
                <Text style={styles.floatingButtonText}>🛠️</Text>
            </TouchableOpacity>

            {/* Dev Panel Modal */}
            <Modal
                visible={isOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsOpen(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>🛠️ Dev Panel</Text>
                            <TouchableOpacity onPress={() => setIsOpen(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Feedback Toast Overlay */}
                        {feedbackMessage && (
                            <View style={styles.toastContainer}>
                                <Text style={styles.toastText}>{feedbackMessage}</Text>
                            </View>
                        )}

                        <ScrollView style={styles.scrollContent}>
                            {/* Current State */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Estado Atual</Text>
                                <View style={styles.currentState}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View>
                                            <Text style={styles.currentStateText}>
                                                {roleConfig.emoji} {roleConfig.label}
                                            </Text>
                                            <Text style={styles.currentStateSubtext}>
                                                {OPERATION_TYPE_LABELS[operationalContext.operationType].emoji} {operationalContext.businessName}
                                            </Text>
                                            <Text style={styles.currentStateSubtext}>
                                                Maturidade: {MATURITY_LABELS[operationalContext.maturity].label}
                                            </Text>
                                        </View>
                                        <View>
                                            <TouchableOpacity
                                                style={[
                                                    styles.statusBadge,
                                                    shiftState === 'active' ? styles.statusBadgeActive : styles.statusBadgeInactive
                                                ]}
                                                onPress={toggleShift}
                                            >
                                                <Text style={styles.statusBadgeText}>
                                                    {shiftState === 'active' ? 'SHIFT ON' : 'SHIFT OFF'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Debug Actions */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Ações de Debug</Text>
                                <View style={styles.optionsRow}>
                                    <View style={{ flex: 1 }}>
                                        <TouchableOpacity
                                            style={[styles.actionButton, shiftState === 'active' ? styles.actionButtonDanger : styles.actionButtonSuccess]}
                                            onPress={toggleShift}
                                        >
                                            <Text style={styles.actionButtonText}>
                                                {shiftState === 'active' ? '🛑 Encerrar Turno' : '🚀 Iniciar Turno'}
                                            </Text>
                                        </TouchableOpacity>
                                        <Text style={styles.helpText}>
                                            Use isto para testar o "Shift Lock". Com o turno ativo, você não deve conseguir mudar o Papel ou Contexto.
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Role Selector */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Papel (Role)</Text>
                                <View style={[styles.optionsGrid, shiftState === 'active' && styles.disabledSection]}>
                                    {allRoles.map(role => {
                                        const config = ROLE_PERMISSIONS_MAP[role];
                                        const isActive = role === activeRole;
                                        return (
                                            <Pressable
                                                key={role}
                                                style={[styles.optionCard, isActive && styles.optionCardActive]}
                                                onPress={() => handleRoleChange(role)}
                                                disabled={shiftState === 'active'}
                                            >
                                                <Text style={styles.optionEmoji}>{config.emoji}</Text>
                                                <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                                                    {config.label}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                                {shiftState === 'active' && (
                                    <Text style={styles.lockWarning}>🔒 Alteração bloqueada durante turno</Text>
                                )}
                            </View>

                            {/* Operation Type Selector */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Tipo de Operação</Text>
                                <View style={[styles.optionsRow, shiftState === 'active' && styles.disabledSection]}>
                                    {allOperationTypes.map(type => {
                                        const config = OPERATION_TYPE_LABELS[type];
                                        const isActive = type === operationalContext.operationType;
                                        return (
                                            <Pressable
                                                key={type}
                                                style={[styles.optionPill, isActive && styles.optionPillActive]}
                                                onPress={() => handleOperationTypeChange(type)}
                                                disabled={shiftState === 'active'}
                                            >
                                                <Text style={styles.optionEmoji}>{config.emoji}</Text>
                                                <Text style={[styles.optionPillLabel, isActive && styles.optionLabelActive]}>
                                                    {config.label}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Maturity Selector */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Maturidade</Text>
                                <View style={[styles.optionsRow, shiftState === 'active' && styles.disabledSection]}>
                                    {allMaturities.map(mat => {
                                        const config = MATURITY_LABELS[mat];
                                        const isActive = mat === operationalContext.maturity;
                                        return (
                                            <Pressable
                                                key={mat}
                                                style={[styles.optionPill, isActive && styles.optionPillActive]}
                                                onPress={() => handleMaturityChange(mat)}
                                                disabled={shiftState === 'active'}
                                            >
                                                <Text style={styles.optionEmoji}>{config.emoji}</Text>
                                                <Text style={[styles.optionPillLabel, isActive && styles.optionLabelActive]}>
                                                    {config.label}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Role Info */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Configuração</Text>
                                <View style={styles.infoGrid}>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>Default View</Text>
                                        <Text style={styles.infoValue}>{roleConfig.defaultView}</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>Gamificação</Text>
                                        <Text style={styles.infoValue}>{roleConfig.showGamification ? '✅' : '❌'}</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>Métricas</Text>
                                        <Text style={styles.infoValue}>{roleConfig.showMetrics ? '✅' : '❌'}</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>Categorias</Text>
                                        <Text style={styles.infoValue}>{roleConfig.taskCategories.join(', ') || 'Nenhuma'}</Text>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </SafeAreaView>
            </Modal>
        </>
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    floatingButton: {
        position: 'absolute',
        right: 16,
        bottom: 100,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#d4a574',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 1000,
    },
    floatingButtonText: {
        fontSize: 24,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
    },
    modalContent: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#d4a574',
    },
    closeButton: {
        fontSize: 24,
        color: '#888',
    },
    scrollContent: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#888',
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    currentState: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#d4a574',
    },
    currentStateText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
    },
    currentStateSubtext: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
    statusBadge: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    statusBadgeActive: {
        backgroundColor: '#1a3a1a',
        borderColor: '#4ade80',
    },
    statusBadgeInactive: {
        backgroundColor: '#333',
        borderColor: '#555',
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
        textTransform: 'uppercase',
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionCard: {
        width: '23%',
        aspectRatio: 1,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionCardActive: {
        borderColor: '#d4a574',
        backgroundColor: '#2a2010',
    },
    optionEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    optionLabel: {
        fontSize: 10,
        color: '#888',
        textAlign: 'center',
    },
    optionLabelActive: {
        color: '#d4a574',
        fontWeight: '600',
    },
    optionsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    optionPill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#1a1a1a',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionPillActive: {
        borderColor: '#d4a574',
        backgroundColor: '#2a2010',
    },
    optionPillLabel: {
        fontSize: 12,
        color: '#888',
    },
    permissionsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    permissionBadge: {
        backgroundColor: '#1a2f1a',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    permissionText: {
        fontSize: 10,
        color: '#4ade80',
    },
    infoGrid: {
        backgroundColor: '#1a1a1a',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoLabel: {
        fontSize: 12,
        color: '#888',
    },
    infoValue: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '500',
    },
    toastContainer: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        backgroundColor: '#d4a574',
        padding: 12,
        borderRadius: 8,
        zIndex: 2000,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    toastText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 14,
    },
    actionButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    actionButtonSuccess: {
        backgroundColor: '#1a3a1a',
        borderWidth: 1,
        borderColor: '#4ade80',
    },
    actionButtonDanger: {
        backgroundColor: '#3a1a1a',
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    helpText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    disabledSection: {
        opacity: 0.3,
        pointerEvents: 'none',
    },
    lockWarning: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 8,
        textAlign: 'center',
    }
});
