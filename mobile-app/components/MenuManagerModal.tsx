import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, Switch } from 'react-native';
import { supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '@/services/haptics';

interface Product {
    id: string;
    name: string;
    price_cents: number;
    category: string;
    available: boolean;
    track_stock: boolean;
    stock_quantity: number;
}

interface MenuManagerModalProps {
    visible: boolean;
    onClose: () => void;
}

export const MenuManagerModal: React.FC<MenuManagerModalProps> = ({ visible, onClose }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Filter Logic
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (visible) fetchProducts();
    }, [visible]);

    const fetchProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('gm_products')
            .select('*')
            .order('name');

        if (data) {
            setProducts(data);
        }
        setLoading(false);
    };

    const handleUpdate = async (updated: Product) => {
        const { error } = await supabase
            .from('gm_products')
            .update({
                name: updated.name,
                price_cents: updated.price_cents,
                available: updated.available,
                track_stock: updated.track_stock,
                stock_quantity: updated.stock_quantity
            })
            .eq('id', updated.id);

        if (!error) {
            HapticFeedback.success();
            setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
            setEditingProduct(null); // Close Edit Mode
        } else {
            HapticFeedback.error();
            Alert.alert("Erro", "Falha ao atualizar produto.");
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            "Excluir Produto",
            "Tem certeza? Isso pode afetar o histórico de pedidos antigos se não houver constraints.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir", style: "destructive", onPress: async () => {
                        const { error } = await supabase.from('gm_products').delete().eq('id', id);
                        if (!error) {
                            HapticFeedback.success();
                            setProducts(prev => prev.filter(p => p.id !== id));
                        } else {
                            Alert.alert("Erro", "Não foi possível excluir (pode estar em uso). Tente desativar a disponibilidade.");
                        }
                    }
                }
            ]
        );
    };

    const toggleAvailability = async (product: Product) => {
        const newItem = { ...product, available: !product.available };
        handleUpdate(newItem);
    };

    // --- Render Item ---
    const renderItem = ({ item }: { item: Product }) => {
        const isEditing = editingProduct?.id === item.id;

        if (isEditing) {
            return (
                <View style={styles.editCard}>
                    <Text style={styles.label}>Nome</Text>
                    <TextInput
                        style={styles.input}
                        value={editingProduct.name}
                        onChangeText={t => setEditingProduct({ ...editingProduct, name: t })}
                    />

                    <Text style={styles.label}>Preço (Cents)</Text>
                    <TextInput
                        style={styles.input}
                        value={String(editingProduct.price_cents)}
                        keyboardType="numeric"
                        onChangeText={t => setEditingProduct({ ...editingProduct, price_cents: parseInt(t) || 0 })}
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Controlar Estoque?</Text>
                            <Switch
                                value={editingProduct.track_stock}
                                onValueChange={v => setEditingProduct({ ...editingProduct, track_stock: v })}
                            />
                        </View>
                        {editingProduct.track_stock && (
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Qtd</Text>
                                <TextInput
                                    style={styles.input}
                                    value={String(editingProduct.stock_quantity)}
                                    keyboardType="numeric"
                                    onChangeText={t => setEditingProduct({ ...editingProduct, stock_quantity: parseInt(t) || 0 })}
                                />
                            </View>
                        )}
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingProduct(null)}>
                            <Text style={styles.btnText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveBtn} onPress={() => handleUpdate(editingProduct)}>
                            <Text style={[styles.btnText, { color: '#000' }]}>Salvar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return (
            <View style={[styles.card, !item.available && styles.cardDisabled]}>
                <View style={styles.cardInfo}>
                    <Text style={[styles.prodName, !item.available && styles.textDisabled]}>{item.name}</Text>
                    <Text style={styles.prodPrice}>€{(item.price_cents / 100).toFixed(2)}</Text>
                    {item.track_stock && (
                        <Text style={[styles.prodStock, item.stock_quantity < 5 ? styles.stockLow : styles.stockOk]}>
                            📦 {item.stock_quantity}
                        </Text>
                    )}
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => toggleAvailability(item)} style={styles.iconBtn}>
                        <Ionicons name={item.available ? "eye" : "eye-off"} size={22} color={item.available ? "#32d74b" : "#666"} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setEditingProduct(item)} style={styles.iconBtn}>
                        <Ionicons name="pencil" size={22} color="#0a84ff" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
                        <Ionicons name="trash" size={22} color="#ff453a" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>📦 Estoque & Cardápio</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Text style={styles.closeText}>Fechar</Text>
                    </TouchableOpacity>
                </View>

                <TextInput
                    style={styles.searchBar}
                    placeholder="Buscar produto..."
                    placeholderTextColor="#666"
                    value={search}
                    onChangeText={setSearch}
                />

                {loading ? (
                    <ActivityIndicator size="large" color="#fff" style={{ marginTop: 50 }} />
                ) : (
                    <FlatList
                        data={filtered}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                    />
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1c1c1e',
        paddingTop: 20
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeBtn: {
        padding: 8,
    },
    closeText: {
        color: '#0a84ff',
        fontSize: 18,
    },
    searchBar: {
        backgroundColor: '#2c2c2e',
        margin: 16,
        padding: 12,
        borderRadius: 10,
        color: '#fff',
        fontSize: 16,
    },
    list: {
        paddingBottom: 50,
    },
    card: {
        backgroundColor: '#2c2c2e',
        marginHorizontal: 16,
        marginBottom: 10,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardDisabled: {
        opacity: 0.5,
        backgroundColor: '#222',
        borderWidth: 1,
        borderColor: '#333'
    },
    cardInfo: {
        flex: 1,
    },
    prodName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    textDisabled: {
        textDecorationLine: 'line-through',
        color: '#888'
    },
    prodPrice: {
        color: '#888',
        marginTop: 4,
    },
    prodStock: {
        marginTop: 4,
        fontSize: 12,
        fontWeight: 'bold',
    },
    stockLow: { color: '#ff453a' },
    stockOk: { color: '#32d74b' },

    cardActions: {
        flexDirection: 'row',
        gap: 15,
    },
    iconBtn: {
        padding: 5,
    },

    // Edit Mode
    editCard: {
        backgroundColor: '#3a3a3c',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#0a84ff'
    },
    label: {
        color: '#888',
        fontSize: 12,
        marginBottom: 4,
        marginTop: 10,
    },
    input: {
        backgroundColor: '#222',
        color: '#fff',
        padding: 10,
        borderRadius: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 20
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 10,
    },
    cancelBtn: {
        flex: 1,
        padding: 12,
        backgroundColor: '#444',
        borderRadius: 8,
        alignItems: 'center'
    },
    saveBtn: {
        flex: 1,
        padding: 12,
        backgroundColor: '#0a84ff',
        borderRadius: 8,
        alignItems: 'center'
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold'
    }

});
