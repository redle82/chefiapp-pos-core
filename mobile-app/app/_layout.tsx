import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppStaffProvider } from '@/context/AppStaffContext';
import { AppStaffOperationalProvider } from '@/context/AppStaffOperationalContext';
import { RestaurantProvider } from '@/context/RestaurantContext';
import { OrderProvider } from '@/context/OrderContext';
import { CommandInterceptor } from '@/components/CommandInterceptor';
import { RoleSelectorDevPanel } from '@/components/RoleSelectorDevPanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';

// Initialize logging service early
import '@/services/logging';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// AuthGate removed (unused and contained insecure bypass)

// Duplicate import removed

// ...

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // CORE_APPSTAFF_CONTRACT: AppStaff runs ONLY on iOS/Android. Block web.
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webBlock}>
        <Text style={styles.webBlockTitle}>AppStaff</Text>
        <Text style={styles.webBlockMessage}>
          Disponível apenas no app mobile (iOS e Android).{'\n'}
          Use o simulador ou um dispositivo físico.
        </Text>
        <Text style={styles.webBlockHint}>npm run ios | npm run android</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <RestaurantProvider>
          <AppStaffProvider>
            <AppStaffOperationalProvider>
              <OrderProvider>
                <RootLayoutNav />
              </OrderProvider>
            </AppStaffOperationalProvider>
          </AppStaffProvider>
        </RestaurantProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* ERRO-006 Fix: Banner persistente de modo offline */}
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="onboarding/wizard" />
      </Stack>
      <CommandInterceptor />
      {/* FASE 5: RoleSelectorDevPanel apenas em DEV mode */}
      {__DEV__ && <RoleSelectorDevPanel />}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  webBlock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 32,
  },
  webBlockTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fafafa',
    marginBottom: 16,
  },
  webBlockMessage: {
    fontSize: 16,
    color: '#a3a3a3',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  webBlockHint: {
    fontSize: 14,
    color: '#525252',
    fontFamily: 'monospace',
  },
});
