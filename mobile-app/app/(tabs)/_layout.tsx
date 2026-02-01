import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { useAppStaff, StaffRole } from '@/context/AppStaffContext';
import { useQualityMonitor } from '@/hooks/useQualityMonitor';
import { SafetyProvider } from '@/context/SafetyContext';
import { colors } from '@/constants/designTokens';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

// Define available tabs (index = redirect only, not in bar; cardapio = Menu)
type ScreenName = 'staff' | 'index' | 'cardapio' | 'orders' | 'kitchen' | 'bar' | 'manager' | 'two' | 'tables' | 'leaderboard' | 'achievements';

// Map Role -> Visible Tabs (CORE_APPSTAFF_CONTRACT §9: tarefas primeiro, depois mini KDS, mini TPV)
const ROLE_TABS: Record<StaffRole, ScreenName[]> = {
  waiter: ['staff', 'orders', 'kitchen', 'tables', 'cardapio', 'two'],
  bartender: ['staff', 'bar', 'two'],
  cook: ['staff', 'kitchen', 'two'],
  chef: ['staff', 'kitchen', 'orders', 'two'],
  manager: ['staff', 'manager', 'orders', 'tables', 'two'],
  owner: ['staff', 'manager', 'orders', 'tables', 'two'],
  cleaning: ['staff', 'two'],
  ambulante: ['staff', 'orders', 'cardapio', 'two'],
  vendor: ['staff', 'orders', 'cardapio', 'two'],
  supervisor: ['staff', 'manager', 'orders', 'tables', 'two'],
  cashier: ['staff', 'orders', 'cardapio', 'two'],
  delivery: ['staff', 'orders', 'two'],
  admin: ['staff', 'manager', 'orders', 'tables', 'two'],
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
        initialRouteName="staff"
        screenOptions={{
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: isDark ? colors.textMuted : colors.textSecondary,
          tabBarStyle: {
            backgroundColor: isDark ? colors.background : colors.backgroundLight,
            borderTopColor: isDark ? colors.border : colors.borderLight,
          },
          headerStyle: {
            backgroundColor: isDark ? colors.background : colors.backgroundLight,
          },
          headerTintColor: isDark ? colors.textPrimary : colors.background,
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
            tabBarButton: () => null,
          }}
        />
        <Tabs.Screen
          name="cardapio"
          options={{
            title: 'Cardápio',
            tabBarIcon: ({ color }) => <TabBarIcon name="cutlery" color={color} />,
            tabBarButton: getTabBarButton('cardapio'),
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

