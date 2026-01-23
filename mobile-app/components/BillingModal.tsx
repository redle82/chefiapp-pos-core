
import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

interface BillingModalProps {
    visible: boolean;
    onClose: () => void;
}

// TODO: Move to Env or Constants
const STRIPE_PRICE_ID_MONTHLY = 'price_1Q...'; // User needs to fill this
const STRIPE_PRICE_ID_YEARLY = 'price_1Q...';

export function BillingModal({ visible, onClose }: BillingModalProps) {
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async (priceId: string) => {
        setLoading(true);
        try {
            const tempUrl = 'https://chefiapp.com/success'; // Deep link scheme in prod
            const cancelUrl = 'https://chefiapp.com/cancel';

            const { data, error } = await supabase.functions.invoke('stripe-billing', {
                body: {
                    action: 'create-checkout-session',
                    priceId,
                    successUrl: tempUrl,
                    cancelUrl: cancelUrl,
                    returnUrl: tempUrl
                }
            });

            if (error) {
                console.error('Billing Error:', error);
                Alert.alert('Erro', 'Falha ao iniciar pagamento: ' + (error.message || 'Erro desconhecido'));
                return;
            }

            if (data?.url) {
                // Open Stripe Checkout in Browser
                await Linking.openURL(data.url);
                onClose();
            } else {
                Alert.alert('Erro', 'URL de pagamento não recebida.');
            }

        } catch (e: any) {
            Alert.alert('Erro', e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleManage = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('stripe-billing', {
                body: {
                    action: 'create-portal-session',
                    returnUrl: 'https://chefiapp.com/settings'
                }
            });

            if (error) throw error;

            if (data?.url) {
                await Linking.openURL(data.url);
            }
        } catch (e: any) {
            Alert.alert('Erro', 'Falha ao abrir portal: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Assinatura Premium</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.description}>
                            Obtenha acesso ilimitado ao KDS, Analytics e Multi-usuário.
                        </Text>

                        {/* Plans */}
                        <TouchableOpacity
                            style={styles.planCard}
                            onPress={() => handleSubscribe('price_monthly_placeholder')}
                            disabled={loading}
                        >
                            <View>
                                <Text style={styles.planTitle}>Mensal</Text>
                                <Text style={styles.planPrice}>€29,90 / mês</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#666" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.planCard, styles.recommended]}
                            onPress={() => handleSubscribe('price_yearly_placeholder')}
                            disabled={loading}
                        >
                            <View>
                                <Text style={styles.planTitle}>Anual (2 meses grátis)</Text>
                                <Text style={styles.planPrice}>€299,00 / ano</Text>
                            </View>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Melhor Valor</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity
                            style={styles.manageButton}
                            onPress={handleManage}
                            disabled={loading}
                        >
                            <Text style={styles.manageText}>Gerenciar Assinatura Existente</Text>
                        </TouchableOpacity>
                    </View>

                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#FFC107" />
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#1E1E1E',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '60%',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
    },
    content: {
        flex: 1,
    },
    description: {
        color: '#AAA',
        marginBottom: 30,
        fontSize: 16,
    },
    planCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#2C2C2C',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#333',
    },
    recommended: {
        borderColor: '#FFC107',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
    },
    planTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
    },
    planPrice: {
        color: '#CCC',
        marginTop: 4,
    },
    badge: {
        backgroundColor: '#FFC107',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: 20,
    },
    manageButton: {
        padding: 15,
        alignItems: 'center',
    },
    manageText: {
        color: '#666',
        textDecorationLine: 'underline',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
