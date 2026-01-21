import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Alert
} from 'react-native';
import { ShiftGate } from '@/components/ShiftGate';
import { useOrder } from '@/context/OrderContext';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export default function MenuScreen() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTableModalVisible, setTableModalVisible] = useState(false);

  // Order Context
  const {
    activeTableId,
    setActiveTable,
    orderDraft,
    addToDraft,
    submitOrder
  } = useOrder();

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      // Mock Data
      const mockItems: MenuItem[] = [
        { id: '1', name: 'Francesinha', price: 12.50, category: 'food' },
        { id: '2', name: 'Bitoque', price: 9.90, category: 'food' },
        { id: '3', name: 'Bacalhau à Brás', price: 14.00, category: 'food' },
        { id: '4', name: 'Imperial', price: 2.50, category: 'drink' },
        { id: '5', name: 'Refrigerante', price: 2.00, category: 'drink' },
        { id: '6', name: 'Café', price: 0.80, category: 'drink' },
        { id: '7', name: 'Pudim', price: 3.50, category: 'other' },
        { id: '8', name: 'Mousse', price: 4.00, category: 'other' },
      ];
      setMenuItems(mockItems);
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (item: MenuItem) => {
    if (!activeTableId) {
      Alert.alert(
        "Nenhuma Mesa Selecionada",
        "Por favor, selecione uma mesa para iniciar o pedido.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Selecionar Mesa", onPress: () => setTableModalVisible(true) }
        ]
      );
      return;
    }
    // Add as flat item with unique ID for draft
    addToDraft({
      id: Math.random().toString(), // Unique ID for this instance
      name: item.name,
      price: item.price,
      category: item.category as any
    });
  };

  const handleSubmit = () => {
    submitOrder();
    Alert.alert("Pedido Enviado", `Pedido para a Mesa ${activeTableId} enviado para a cozinha!`);
  };

  const renderItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity style={styles.menuItem} onPress={() => handleAddItem(item)}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemPrice}>€{item.price.toFixed(2)}</Text>
    </TouchableOpacity>
  );

  const draftTotal = orderDraft.reduce((sum, item) => sum + item.price, 0);
  const draftCount = orderDraft.length;

  // Table Grid for Modal
  const tables = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#32d74b" />
      </View>
    );
  }

  return (
    <ShiftGate>
      <View style={styles.container}>
        {/* Context Banner */}
        <TouchableOpacity
          style={[styles.contextBanner, activeTableId ? styles.bannerActive : styles.bannerWarning]}
          onPress={() => setTableModalVisible(true)}
        >
          <Text style={styles.bannerText}>
            {activeTableId ? `🟢 Mesa ${activeTableId}` : `⚠️ Toque para Selecionar Mesa`}
          </Text>
        </TouchableOpacity>

        <FlatList
          data={menuItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
        />

        {/* Draft Summary */}
        {draftCount > 0 && (
          <View style={styles.cartBar}>
            <View>
              <Text style={styles.cartCount}>{draftCount} itens (Mesa {activeTableId})</Text>
              <Text style={styles.cartTotal}>€{draftTotal.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.orderButton} onPress={handleSubmit}>
              <Text style={styles.orderButtonText}>Enviar Pedido</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Table Selector Modal */}
        <Modal
          visible={isTableModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setTableModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Selecionar Mesa</Text>
              <View style={styles.tableGrid}>
                {tables.map(tableId => (
                  <TouchableOpacity
                    key={tableId}
                    style={[styles.tableButton, activeTableId === tableId && styles.tableButtonActive]}
                    onPress={() => {
                      setActiveTable(tableId);
                      setTableModalVisible(false);
                    }}
                  >
                    <Text style={[styles.tableButtonText, activeTableId === tableId && styles.tableButtonTextActive]}>
                      {tableId}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setTableModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ShiftGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  // Banner
  contextBanner: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  bannerWarning: {
    backgroundColor: '#3a3a0a', // Dark Yellow/Brown
  },
  bannerActive: {
    backgroundColor: '#0a3a0a', // Dark Green
  },
  bannerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  grid: {
    padding: 8,
  },
  menuItem: {
    flex: 1,
    margin: 8,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  itemPrice: {
    color: '#32d74b',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cartBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cartCount: {
    color: '#888',
    fontSize: 14,
  },
  cartTotal: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  orderButton: {
    backgroundColor: '#32d74b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  orderButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  tableButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableButtonActive: {
    backgroundColor: '#32d74b',
  },
  tableButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tableButtonTextActive: {
    color: '#000',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    color: '#888',
    fontSize: 16,
  },
});
