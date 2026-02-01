import { ShiftGate } from '@/components/ShiftGate';
import { useAppStaff } from '@/context/AppStaffContext';
import { useOrder } from '@/context/OrderContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { BottomActionBar } from '@/components/BottomActionBar';
import { KitchenPressureIndicator } from '@/components/KitchenPressureIndicator';
import { PaymentMethod, PaymentModal } from '@/components/PaymentModal';
import { ThumbCard } from '@/components/ThumbCard';
import { colors, radius, spacing, fontSize, fontWeight } from '@/constants/designTokens';
import { useKitchenPressure } from '@/hooks/useKitchenPressure';
import { HapticFeedback } from '@/services/haptics';
import { supabase } from '@/services/supabase';

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
        <ActivityIndicator size="large" color={colors.success} />
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
                activeCustomer?.loyalty_tier === 'platinum' ? colors.textSecondary :
                  activeCustomer?.loyalty_tier === 'gold' ? colors.warning :
                    activeCustomer?.loyalty_tier === 'silver' ? colors.textMuted :
                      activeCustomer ? colors.warning : colors.textMuted
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
                  <Text style={{ color: colors.textMuted }}>{tableOrders.length} pedidos ativos. Ver em "Mesas".</Text>
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
                  <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>{item.category}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.itemPrice}>€{item.price.toFixed(2)}</Text>
                  <Ionicons name="add-circle" size={28} color={colors.warning} style={{ marginLeft: spacing[3] }} />
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
                placeholderTextColor={colors.textMuted}
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
                placeholderTextColor={colors.textMuted}
                maxLength={100}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.surface }]}
                  onPress={() => setCustomerModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.warning }]}
                  onPress={handleIdentify}
                >
                  <Text style={[styles.modalButtonText, { color: colors.textInverse }]}>Identificar</Text>
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
              <Text style={{ color: colors.textMuted, marginBottom: spacing[3] }}>Ex: "Sem cebola", "Bem passado"</Text>

              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Digite a observação..."
                value={itemNote}
                onChangeText={setItemNote}
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={100}
                autoFocus
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.surface }]}
                  onPress={() => setNoteModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.success }]}
                  onPress={handleConfirmItemWithNote}
                >
                  <Text style={[styles.modalButtonText, { color: colors.textInverse }]}>Adicionar</Text>
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
    backgroundColor: colors.background,
    marginHorizontal: 15,
  },
  crmBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 10,
  },
  crmBadgeActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  crmBadgeGold: {
    backgroundColor: colors.surface,
    borderColor: colors.warning,
    borderWidth: 2,
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  crmBadgePlatinum: {
    backgroundColor: colors.surface,
    borderColor: colors.textSecondary,
    borderWidth: 2,
    shadowColor: colors.textSecondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  crmText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  crmTextActive: {
    color: colors.warning,
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
    backgroundColor: colors.background,
  },
  contextBanner: {
    padding: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  bannerWarning: {
    backgroundColor: `${colors.warning}20`,
  },
  bannerActive: {
    backgroundColor: `${colors.success}20`,
  },
  bannerText: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  grid: { padding: spacing[2] },
  menuItem: {
    flex: 1,
    margin: spacing[2],
    padding: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  itemName: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  itemPrice: {
    color: colors.success,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  activeOrderTitle: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    marginBottom: spacing[2],
  },
  xpHeader: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
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
    color: colors.warning,
    fontWeight: '900',
    fontSize: fontSize.lg,
  },
  xpLevelLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
  },
  xpBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceOverlay,
    borderRadius: radius.sm,
    marginHorizontal: spacing[3],
    overflow: 'hidden',
  },
  xpBarFill: { height: '100%', borderRadius: radius.sm },
  xpValue: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    width: 50,
    textAlign: 'right',
  },
  cartBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  cartCount: { color: colors.textMuted, fontSize: fontSize.sm },
  cartTotal: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  orderButton: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radius.md,
  },
  orderButtonText: {
    color: colors.textInverse,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlayDark,
    justifyContent: 'center',
    padding: spacing[5],
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing[5],
    alignItems: 'center',
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing[5],
  },
  label: {
    alignSelf: 'flex-start',
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing[2],
    marginTop: spacing[3],
  },
  input: {
    width: '100%',
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    padding: spacing[3],
    borderRadius: radius.md,
    fontSize: fontSize.base,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing[6],
    gap: spacing[3],
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: spacing[5],
  },
  tableButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableButtonActive: { backgroundColor: colors.success },
  tableButtonText: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  tableButtonTextActive: { color: colors.textInverse },
  closeButton: { padding: 10 },
  closeButtonText: { color: colors.textMuted, fontSize: fontSize.base },
  activeOrdersContainer: {
    padding: spacing[4],
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontWeight: fontWeight.bold,
    marginBottom: spacing[2],
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
  },
  activeOrderCard: {
    backgroundColor: colors.surface,
    padding: spacing[3],
    borderRadius: radius.md,
    marginBottom: spacing[2],
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderId: { color: colors.textPrimary, fontWeight: fontWeight.bold },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  statusText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
  },
  orderItems: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginBottom: spacing[2],
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[2],
  },
  actionBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 6,
  },
  actionBtnText: {
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.xs,
  },
  bgGreen: { backgroundColor: colors.success },
  bgBlue: { backgroundColor: colors.info },
  bgOrange: { backgroundColor: colors.warning },
  bgGray: { backgroundColor: colors.textMuted },
  bgMoney: { backgroundColor: colors.success },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingBottom: 0,
  },
  categoryStrip: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    backgroundColor: colors.background,
  },
  catTab: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  catTabActive: { backgroundColor: colors.warning },
  catText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  catTextActive: { color: colors.textInverse, fontWeight: fontWeight.bold },
});
