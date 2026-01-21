import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { useAppStaff, StaffRole } from '@/context/AppStaffContext';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

// Define available tabs
type ScreenName = 'staff' | 'index' | 'orders' | 'kitchen' | 'bar' | 'manager' | 'two' | 'tables';

const ALL_TABS: Record<string, any> = {
  staff: { title: 'Turno', icon: 'clock-o' },
  index: { title: 'Cardápio', icon: 'cutlery' },
  orders: { title: 'Pedidos', icon: 'list-alt' },
  kitchen: { title: 'Cozinha', icon: 'fire' },
  bar: { title: 'Bar', icon: 'glass' },
  manager: { title: 'Gestão', icon: 'briefcase' },
  two: { title: 'Conta', icon: 'user' },
  tables: { title: 'Mesas', icon: 'map' },
};

// Map Role -> Visible Tabs
const ROLE_TABS: Record<StaffRole, ScreenName[]> = {
  waiter: ['staff', 'tables', 'orders', 'two'],
  bartender: ['staff', 'bar', 'two'],
  cook: ['staff', 'kitchen', 'two'],
  chef: ['staff', 'kitchen', 'orders', 'two'],
  manager: ['staff', 'manager', 'tables', 'orders', 'two'],
  owner: ['staff', 'manager', 'tables', 'orders', 'two'],
  cleaning: ['staff', 'two'],
  ambulante: ['staff', 'index', 'orders', 'two'], // Ambulante accesses Menu directly (no tables)
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { activeRole } = useAppStaff();

  // Get visible tabs for current role, default to Waiter if unknown
  const visibleTabs = ROLE_TABS[activeRole] || ROLE_TABS['waiter'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#d4a574',
        tabBarInactiveTintColor: isDark ? '#666' : '#999',
        tabBarStyle: {
          backgroundColor: isDark ? '#0a0a0a' : '#fff',
          borderTopColor: isDark ? '#1a1a1a' : '#e0e0e0',
        },
        headerStyle: {
          backgroundColor: isDark ? '#0a0a0a' : '#fff',
        },
        headerTintColor: isDark ? '#fff' : '#000',
      }}>

      {/* 
         We map over all possible tabs. 
         If a tab is NOT in visibleTabs, we use `href: null` to hide it.
      */}

      <Tabs.Screen
        name="staff"
        options={{
          title: 'Turno',
          tabBarIcon: ({ color }) => <TabBarIcon name="clock-o" color={color} />,
          href: visibleTabs.includes('staff') ? '/(tabs)/staff' : null as any,
        }}
      />

      <Tabs.Screen
        name="tables"
        options={{
          title: 'Mesas',
          tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
          href: visibleTabs.includes('tables') ? '/(tabs)/tables' : null as any,
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          title: 'Cardápio',
          tabBarIcon: ({ color }) => <TabBarIcon name="cutlery" color={color} />,
          href: visibleTabs.includes('index') ? '/(tabs)/index' : null as any,
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color }) => <TabBarIcon name="list-alt" color={color} />,
          href: visibleTabs.includes('orders') ? '/(tabs)/orders' : null as any,
        }}
      />

      <Tabs.Screen
        name="kitchen"
        options={{
          title: 'Cozinha',
          tabBarIcon: ({ color }) => <TabBarIcon name="fire" color={color} />,
          href: visibleTabs.includes('kitchen') ? '/(tabs)/kitchen' : null as any,
        }}
      />

      <Tabs.Screen
        name="bar"
        options={{
          title: 'Bar',
          tabBarIcon: ({ color }) => <TabBarIcon name="glass" color={color} />,
          href: visibleTabs.includes('bar') ? '/(tabs)/bar' : null as any,
        }}
      />

      <Tabs.Screen
        name="manager"
        options={{
          title: 'Gestão',
          tabBarIcon: ({ color }) => <TabBarIcon name="briefcase" color={color} />,
          href: visibleTabs.includes('manager') ? '/(tabs)/manager' : null as any,
        }}
      />

      <Tabs.Screen
        name="two"
        options={{
          title: 'Conta',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          href: visibleTabs.includes('two') ? '/(tabs)/two' : null as any,
        }}
      />

    </Tabs>
  );
}
