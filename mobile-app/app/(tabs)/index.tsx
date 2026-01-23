import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Alert,
  TextInput,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShiftGate } from '@/components/ShiftGate';
import { useOrder } from '@/context/OrderContext';
import { useAppStaff } from '@/context/AppStaffContext';

import { HapticFeedback } from '@/services/haptics';
import { BottomActionBar } from '@/components/BottomActionBar';
import { ThumbCard } from '@/components/ThumbCard';
import { BottomSheet } from '@/components/BottomSheet';
import { supabase } from '@/services/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useKitchenPressure } from '@/hooks/useKitchenPressure';
import { KitchenPressureIndicator } from '@/components/KitchenPressureIndicator';
import { PaymentModal, PaymentMethod } from '@/components/PaymentModal';

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

  const { } = useAppStaff();
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'cart'

  // SEMANA 3: KDS COMO REI - Detectar pressão da cozinha (fora do useMemo)
  const { shouldHideSlowItems } = useKitchenPressure();

  // Filtrar menu baseado na pressão (otimizado com useMemo)
  const filteredMenuItems = useMemo(() => {
    if (shouldHideSlowItems) {
      return menuItems.filter(item => item.category === 'drink' || item.category === 'other');
    }
    return menuItems;
  }, [menuItems, shouldHideSlowItems]);

  // CRM Modal
  const [isCustomerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');

  // Bug #7 Fix: Validação melhorada de telefone
  const handleIdentify = async () => {
    // Remover caracteres não numéricos
    const cleanPhone = customerPhone.replace(/\D/g, '');

    if (cleanPhone.length < 8) {
      Alert.alert("Erro", "Telefone deve ter pelo menos 8 dígitos");
      return;
    }

    if (cleanPhone.length > 15) {
      Alert.alert("Erro", "Telefone muito longo (máximo 15 dígitos)");
      return;
    }

    // Validar nome se fornecido
    if (customerName.trim() && customerName.trim().length < 2) {
      Alert.alert("Erro", "Nome deve ter pelo menos 2 caracteres");
      return;
    }

    setLoading(true);
    const customer = await identifyCustomer(cleanPhone, customerName.trim() || undefined);
    setLoading(false);

    if (customer) {
      HapticFeedback.success();
      setCustomerModalVisible(false);
      setCustomerPhone('');
      setCustomerName('');
    } else {
      Alert.alert("Erro", "Não foi possível identificar/criar cliente.");
    }
  };

  // Item Note Modal
  const [isNoteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedItemForNote, setSelectedItemForNote] = useState<MenuItem | null>(null);
  const [itemNote, setItemNote] = useState('');

  // Payment Modal State
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const handleOpenItemModal = (item: MenuItem) => {
    setSelectedItemForNote(item);
    setItemNote('');
    setNoteModalVisible(true);
    HapticFeedback.medium();
  }

  const handleConfirmItemWithNote = () => {
    if (selectedItemForNote) {
      handleAddItem(selectedItemForNote, itemNote);
      setNoteModalVisible(false);
      setSelectedItemForNote(null);
    }
  }

  // Handlers for Order Actions
  const handleDeliver = (orderId: string) => {
    updateOrderStatus(orderId, 'delivered');
    HapticFeedback.success();
  };

  const handlePay = (orderId: string, amount: number) => {
    setPaymentOrderId(orderId);
    setPaymentAmount(amount);
    setPaymentModalVisible(true);
    HapticFeedback.medium();
  };

  const handleConfirmPayment = (method: PaymentMethod, amount: number) => {
    if (paymentOrderId) {
      // Future: Save method to DB
      console.log(`Paying Order ${paymentOrderId} via ${method} (€${amount})`);
      updateOrderStatus(paymentOrderId, 'paid');
      HapticFeedback.success();
      setPaymentModalVisible(false);
      setPaymentOrderId(null);
    }
  };

  // Order Context
  const {
    orders,
    activeTableId,
    setActiveTable,
    updateOrderStatus,
    activeCustomer,
    identifyCustomer,
    orderDraft,
    addToDraft,
    submitOrder
  } = useOrder();

  const { activeRole, shiftId, canAccess } = useAppStaff();

  // Bug #11 Fix: Filtrar pedidos por role/shift
  const filteredOrders = useMemo(() => {
    // Manager, Owner, Admin, Cashier veem todos
    if (canAccess('order:view_all') || activeRole === 'cashier') {
      return orders;
    }

    // Outros roles veem apenas pedidos do turno atual
    return orders.filter(o => o.shiftId === shiftId);
  }, [orders, shiftId, canAccess, activeRole]);

  const activeOrders = filteredOrders.filter(o =>
    o.table === activeTableId &&
    o.status !== 'paid' &&
    o.status !== 'delivered' // Keep delivered visible? Actually yes, for payment.
  );
  // Re-filter: Show DELIVERED so we can pay. Show PAID? No, PAID is history.
  const tableOrders = filteredOrders.filter(o => o.table === activeTableId && o.status !== 'paid');

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const { data, error } = await supabase
        .from('gm_products')
        .select('*');

      if (error) {
        console.error('Error fetching menu:', error);
        return;
      }

      if (data && data.length > 0) {
        // Map gm_products (price_cents) to MenuItem (price float)
        const mappedItems: MenuItem[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category, // Assuming direct column 'category' based on Portal code
          price: (item.price_cents || 0) / 100
        }));
        setMenuItems(mappedItems);
      } else {
        // Empty DB
      }
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (item: MenuItem, note?: string) => {
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
      id: Math.random().toString(), // Unique ID for this specific line item
      productId: item.id, // Map Menu Item ID to Product ID
      name: item.name,
      price: item.price,
      quantity: 1, // Default to 1
      category: item.category as any,
      notes: note // Pass the note
    });
    HapticFeedback.success();
  };

  const handleSubmit = () => {
    submitOrder();
    Alert.alert("Pedido Enviado", `Pedido para a Mesa ${activeTableId} enviado para a cozinha!`);
  };

  const renderItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => handleAddItem(item)}
      onLongPress={() => handleOpenItemModal(item)} // Long press for note
      delayLongPress={500}
    >
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
        {/* CRM Badge - Identifying Customer */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
          <TouchableOpacity
            style={[
              styles.crmBadge,
              activeCustomer && styles.crmBadgeActive,
              activeCustomer?.loyalty_tier === 'gold' && styles.crmBadgeGold,
              activeCustomer?.loyalty_tier === 'platinum' && styles.crmBadgePlatinum,
              { alignSelf: 'flex-start' } // Start align instead of row
            ]}
            onPress={() => setCustomerModalVisible(true)}
          >
            <Ionicons
              name={activeCustomer ? "star" : "person-outline"}
              size={20}
              color={
                activeCustomer?.loyalty_tier === 'platinum' ? '#E5E4E2' :
                  activeCustomer?.loyalty_tier === 'gold' ? '#FFD700' :
                    activeCustomer?.loyalty_tier === 'silver' ? '#C0C0C0' :
                      activeCustomer ? '#CD7F32' : '#888'
              }
            />
            <Text style={[styles.crmText, activeCustomer && styles.crmTextActive]}>
              {activeCustomer
                ? `${activeCustomer.name.split(' ')[0]} • ${activeCustomer.loyalty_points}pts`
                : 'Identificar Cliente'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Context Banner */}
        <TouchableOpacity
          style={[styles.contextBanner, activeTableId ? styles.bannerActive : styles.bannerWarning]}
          onPress={() => setTableModalVisible(true)}
        >
          <Text style={styles.bannerText}>
            {activeTableId ? `🟢 Mesa ${activeTableId}` : `⚠️ Toque para Selecionar Mesa`}
          </Text>
        </TouchableOpacity>

        {/* SEMANA 3: KDS COMO REI - Indicador de pressão da cozinha */}
        <KitchenPressureIndicator />

        <FlatList
          ListHeaderComponent={
            <>
              {/* Active Orders Summary (Collapsed if too long?) */}
              {activeTableId && tableOrders.length > 0 && (
                <View style={styles.activeOrdersContainer}>
                  <Text style={styles.sectionTitle}>Pedidos em Andamento</Text>
                  {/* Just show count or quick status to save space? */}
                  <Text style={{ color: '#888' }}>{tableOrders.length} pedidos ativos. Ver em "Mesas".</Text>
                </View>
              )}
            </>
          }
          data={filteredMenuItems}
          renderItem={({ item }) => (
            <ThumbCard
              onPress={() => handleAddItem(item)}
              onLongPress={() => handleOpenItemModal(item)}
              style={{ marginBottom: 8 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={{ color: '#888', fontSize: 12 }}>{item.category}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.itemPrice}>€{item.price.toFixed(2)}</Text>
                  <Ionicons name="add-circle" size={28} color="#d4a574" style={{ marginLeft: 12 }} />
                </View>
              </View>
            </ThumbCard>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 160 }} // Space for Bottom Bars
        />

        {/* BOTTOM CONTROLS CONTAINER */}
        <View style={styles.bottomControls}>
          {/* CATEGORY TABS - Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            style={styles.categoryStrip}
          >
            <TouchableOpacity style={[styles.catTab, styles.catTabActive]}>
              <Text style={[styles.catText, styles.catTextActive]}>Tudo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.catTab}>
              <Text style={styles.catText}>Bebidas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.catTab}>
              <Text style={styles.catText}>Pratos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.catTab}>
              <Text style={styles.catText}>Sobremesas</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* MAIN ACTION BAR */}
          <BottomActionBar
            primary={{
              label: draftCount > 0 ? `Enviar Pedido (€${draftTotal.toFixed(2)})` : "Ver Carrinho",
              onPress: draftCount > 0 ? handleSubmit : () => { },
              disabled: draftCount === 0
            }}
            secondary={{
              label: activeTableId ? `Mesa ${activeTableId}` : "Selecionar Mesa",
              onPress: () => setTableModalVisible(true),
              variant: activeTableId ? 'secondary' : 'destructive' // Highlight if no table
            }}
          />
        </View>

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

        {/* CUSTOMER MODAL */}
        <Modal
          visible={isCustomerModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setCustomerModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Identificar Cliente 🧠</Text>

              <Text style={styles.label}>Telefone (ou CPF)</Text>
              <TextInput
                style={styles.input}
                placeholder="ex: 11999999999"
                keyboardType="phone-pad"
                value={customerPhone}
                onChangeText={(text) => {
                  // Bug #7 Fix: Sanitizar entrada (apenas números)
                  const sanitized = text.replace(/\D/g, '');
                  // Limitar a 15 dígitos (padrão internacional)
                  if (sanitized.length <= 15) {
                    setCustomerPhone(sanitized);
                  }
                }}
                onChangeText={setCustomerPhone}
                placeholderTextColor="#666"
              />

              <Text style={styles.label}>Nome (Opcional p/ Novo)</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome do Cliente"
                value={customerName}
                onChangeText={(text) => {
                  // Bug #7 Fix: Limitar nome a 100 caracteres
                  if (text.length <= 100) {
                    setCustomerName(text);
                  }
                }}
                placeholderTextColor="#666"
                maxLength={100}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#333' }]}
                  onPress={() => setCustomerModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#FFD700' }]}
                  onPress={handleIdentify}
                >
                  <Text style={[styles.modalButtonText, { color: '#000' }]}>Identificar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ITEM NOTE MODAL */}
        <Modal
          visible={isNoteModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setNoteModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Nota p/ {selectedItemForNote?.name}
              </Text>
              <Text style={{ color: '#888', marginBottom: 12 }}>Ex: "Sem cebola", "Bem passado"</Text>

              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Digite a observação..."
                value={itemNote}
                onChangeText={setItemNote}
                placeholderTextColor="#666"
                multiline
                maxLength={100}
                autoFocus
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#333' }]}
                  onPress={() => setNoteModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#32d74b' }]}
                  onPress={handleConfirmItemWithNote}
                >
                  <Text style={[styles.modalButtonText, { color: '#000' }]}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* PAYMENT MODAL */}
        <PaymentModal
          visible={isPaymentModalVisible}
          onClose={() => setPaymentModalVisible(false)}
          onConfirm={handleConfirmPayment}
          totalAmount={paymentAmount}
          tableId={activeTableId || '?'}
        />
      </View>
    </ShiftGate >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    marginHorizontal: 15,
  },
  crmBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 10,
  },
  crmBadgeActive: {
    backgroundColor: '#554400', // Dark Gold
    borderWidth: 1,
    borderColor: '#FFD700'
  },
  crmBadgeGold: {
    backgroundColor: '#553300',
    borderColor: '#FFD700',
    borderWidth: 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  crmBadgePlatinum: {
    backgroundColor: '#2a2a2a',
    borderColor: '#E5E4E2',
    borderWidth: 2,
    shadowColor: '#E5E4E2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  crmText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  crmTextActive: {
    color: '#FFD700'
  },
  xpBarContainer: {
    flex: 1,
    height: 12,
    justifyContent: 'center',
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
  activeOrderTitle: {
    color: '#ff9500',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  // GAMIFICATION STYLES
  xpHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  xpLevel: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpLevelText: {
    color: '#ffd700',
    fontWeight: '900',
    fontSize: 18,
  },
  xpLevelLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  xpBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#444',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpValue: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    width: 50,
    textAlign: 'right',
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
  label: {
    alignSelf: 'flex-start',
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    width: '100%',
    backgroundColor: '#333',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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

  // Active Orders
  activeOrdersContainer: {
    padding: 16,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    color: '#888',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  activeOrderCard: {
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderId: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  orderItems: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  bgGreen: { backgroundColor: '#32d74b' },
  bgBlue: { backgroundColor: '#0a84ff' },
  bgOrange: { backgroundColor: '#ff9f0a' },
  bgGray: { backgroundColor: '#636366' },
  bgMoney: { backgroundColor: '#30d158' },

  // Bottom Controls
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0a0a0a',
    paddingBottom: 0, // BottomActionBar handles PB
  },
  categoryStrip: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: '#111',
  },
  catTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  catTabActive: {
    backgroundColor: '#d4a574',
  },
  catText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  catTextActive: {
    color: '#000',
    fontWeight: 'bold',
  }
});
