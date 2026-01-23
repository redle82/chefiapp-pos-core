import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { useAppStaff, StaffRole } from '@/context/AppStaffContext';
import { useQualityMonitor } from '@/hooks/useQualityMonitor';
import { SafetyProvider } from '@/context/SafetyContext';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

// Define available tabs
type ScreenName = 'staff' | 'index' | 'orders' | 'kitchen' | 'bar' | 'manager' | 'two' | 'tables' | 'leaderboard' | 'achievements';

// Map Role -> Visible Tabs (these appear in the tab bar)
// FASE 4: Adicionar leaderboard e achievements para roles que têm gamificação
const ROLE_TABS: Record<StaffRole, ScreenName[]> = {
  waiter: ['staff', 'tables', 'index', 'orders', 'leaderboard', 'two'],
  bartender: ['staff', 'bar', 'leaderboard', 'two'],
  cook: ['staff', 'kitchen', 'leaderboard', 'two'],
  chef: ['staff', 'kitchen', 'orders', 'leaderboard', 'two'],
  manager: ['staff', 'manager', 'tables', 'orders', 'leaderboard', 'two'],
  owner: ['staff', 'manager', 'tables', 'orders', 'leaderboard', 'two'],
  cleaning: ['staff', 'two'],
  ambulante: ['staff', 'index', 'orders', 'two'],
  // New Roles
  vendor: ['staff', 'index', 'orders', 'two'],
  supervisor: ['staff', 'manager', 'tables', 'orders', 'leaderboard', 'two'], // Partial manager access
  cashier: ['staff', 'index', 'orders', 'leaderboard', 'two'], // Focused on POS (Index=Menu)
  delivery: ['staff', 'orders', 'two'], // Focused on Orders
  admin: ['staff', 'manager', 'tables', 'orders', 'leaderboard', 'two'], // Full access
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { activeRole } = useAppStaff();

  // IQO: Silent Quality Monitoring
  useQualityMonitor();

  // Get visible tabs for current role, default to Waiter if unknown
  const visibleTabs = ROLE_TABS[activeRole] || ROLE_TABS['waiter'];

  // Helper: returns null if tab should be hidden (removes from tab bar but keeps route)
  const getTabBarButton = (screenName: ScreenName) => {
    return visibleTabs.includes(screenName) ? undefined : () => null;
  };

  return (
    <SafetyProvider>
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

        <Tabs.Screen
          name="staff"
          options={{
            title: 'Turno',
            tabBarIcon: ({ color }) => <TabBarIcon name="clock-o" color={color} />,
            tabBarButton: getTabBarButton('staff'),
          }}
        />

        <Tabs.Screen
          name="tables"
          options={{
            title: 'Mesas',
            tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
            tabBarButton: getTabBarButton('tables'),
          }}
        />

        <Tabs.Screen
          name="index"
          options={{
            title: 'Cardápio',
            tabBarIcon: ({ color }) => <TabBarIcon name="cutlery" color={color} />,
            tabBarButton: getTabBarButton('index'),
          }}
        />

        <Tabs.Screen
          name="orders"
          options={{
            title: 'Pedidos',
            tabBarIcon: ({ color }) => <TabBarIcon name="list-alt" color={color} />,
            tabBarButton: getTabBarButton('orders'),
          }}
        />

        <Tabs.Screen
          name="kitchen"
          options={{
            title: 'Cozinha',
            tabBarIcon: ({ color }) => <TabBarIcon name="fire" color={color} />,
            tabBarButton: getTabBarButton('kitchen'),
          }}
        />

        <Tabs.Screen
          name="bar"
          options={{
            title: 'Bar',
            tabBarIcon: ({ color }) => <TabBarIcon name="glass" color={color} />,
            tabBarButton: getTabBarButton('bar'),
          }}
        />

        <Tabs.Screen
          name="manager"
          options={{
            title: 'Gestão',
            tabBarIcon: ({ color }) => <TabBarIcon name="briefcase" color={color} />,
            tabBarButton: getTabBarButton('manager'),
          }}
        />

        <Tabs.Screen
          name="leaderboard"
          options={{
            title: 'Ranking',
            tabBarIcon: ({ color }) => <TabBarIcon name="trophy" color={color} />,
            tabBarButton: getTabBarButton('leaderboard'),
          }}
        />

        <Tabs.Screen
          name="achievements"
          options={{
            title: 'Conquistas',
            tabBarIcon: ({ color }) => <TabBarIcon name="star" color={color} />,
            tabBarButton: getTabBarButton('achievements'),
          }}
        />

        <Tabs.Screen
          name="two"
          options={{
            title: 'Conta',
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
            tabBarButton: getTabBarButton('two'),
          }}
        />

      </Tabs>
    </SafetyProvider>
  );
}

