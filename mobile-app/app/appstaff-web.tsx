/**
 * AppStaff Web — carrega o AppStaff do merchant-portal numa WebView.
 * iOS Simulator: localhost = Mac, funciona. Android Emulator: localhost = emulador → usar 10.0.2.2.
 * Dispositivo físico: usa o host do Metro (IP do Mac) para o mesmo URL.
 */
import Constants from 'expo-constants';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const PORT = 5175;
const PATH = '/app/staff/home';

/** No Android Emulator, localhost aponta para o emulador; 10.0.2.2 é o host (Mac). */
function getHostForWebView(): string {
  if (Platform.OS === 'android') {
    const hostUri = Constants.expoConfig?.hostUri ?? (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;
    if (hostUri) {
      const host = hostUri.replace(/^exp:\/\//, '').split(':')[0] ?? hostUri.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') return host;
    }
    return '10.0.2.2';
  }
  const envUrl = process.env.EXPO_PUBLIC_APPSTAFF_WEB_URL;
  if (envUrl) try { return new URL(envUrl).hostname; } catch { /* use default */ }
  const hostUri = Constants.expoConfig?.hostUri ?? (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost;
  if (hostUri) {
    const host = hostUri.replace(/^exp:\/\//, '').split(':')[0] ?? hostUri.split(':')[0];
    if (host) return host;
  }
  return 'localhost';
}

function getAppStaffWebUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_APPSTAFF_WEB_URL;
  if (envUrl) return envUrl;
  const host = getHostForWebView();
  return `http://${host}:${PORT}${PATH}`;
}

export default function AppStaffWebScreen() {
  const insets = useSafeAreaInsets();
  const url = getAppStaffWebUrl();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const onLoadEnd = useCallback(() => setLoading(false), []);
  const onError = useCallback((e: { nativeEvent: { description?: string } }) => {
    setLoading(false);
    setLoadError(e.nativeEvent?.description ?? 'Erro ao carregar a página');
  }, []);
  const onHttpError = useCallback((e: { nativeEvent: { statusCode?: number } }) => {
    setLoading(false);
    setLoadError(`HTTP ${e.nativeEvent?.statusCode ?? 'erro'}`);
  }, []);
  const retry = useCallback(() => {
    setLoadError(null);
    setLoading(true);
  }, []);

  if (loadError) {
    return (
      <View style={[styles.container, styles.fallback, { paddingTop: insets.top }]}>
        <Text style={styles.fallbackTitle}>AppStaff não carregou</Text>
        <Text style={styles.fallbackMessage}>{loadError}</Text>
        <Text style={styles.fallbackUrl} numberOfLines={2}>{url}</Text>
        <Text style={styles.fallbackHint}>
          Garante que o merchant-portal está a correr: pnpm --filter merchant-portal run dev
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={retry}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fafafa" />
          <Text style={styles.loadingText}>A carregar AppStaff…</Text>
        </View>
      )}
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState={false}
        scalesPageToFit
        originWhitelist={['*']}
        mixedContentMode="compatibility"
        onLoadEnd={onLoadEnd}
        onError={onError}
        onHttpError={onHttpError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    color: '#a3a3a3',
    marginTop: 12,
    fontSize: 16,
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fafafa',
    marginBottom: 12,
    textAlign: 'center',
  },
  fallbackMessage: {
    fontSize: 16,
    color: '#f87171',
    marginBottom: 8,
    textAlign: 'center',
  },
  fallbackUrl: {
    fontSize: 12,
    color: '#737373',
    marginBottom: 16,
    textAlign: 'center',
  },
  fallbackHint: {
    fontSize: 14,
    color: '#a3a3a3',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
