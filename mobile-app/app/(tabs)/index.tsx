import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function MenuScreen() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      // For now, use mock data - will connect to real DB later
      const mockItems: MenuItem[] = [
        { id: '1', name: 'Francesinha', price: 12.50, category: 'Pratos' },
        { id: '2', name: 'Bitoque', price: 9.90, category: 'Pratos' },
        { id: '3', name: 'Bacalhau à Brás', price: 14.00, category: 'Pratos' },
        { id: '4', name: 'Imperial', price: 2.50, category: 'Bebidas' },
        { id: '5', name: 'Refrigerante', price: 2.00, category: 'Bebidas' },
        { id: '6', name: 'Café', price: 0.80, category: 'Bebidas' },
        { id: '7', name: 'Pudim', price: 3.50, category: 'Sobremesas' },
        { id: '8', name: 'Mousse', price: 4.00, category: 'Sobremesas' },
      ];
      setMenuItems(mockItems);
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const renderItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity style={styles.menuItem} onPress={() => addToCart(item)}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemPrice}>€{item.price.toFixed(2)}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#32d74b" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={menuItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
      />

      {/* Cart Summary */}
      {cartCount > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartCount}>{cartCount} itens</Text>
            <Text style={styles.cartTotal}>€{cartTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.orderButton}>
            <Text style={styles.orderButtonText}>Enviar Pedido</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
});
