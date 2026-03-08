import { activateWithQrPin } from "@/services/mobileActivationApi";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ActivateScreen() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    const trimmedToken = token.trim();
    const trimmedPin = pin.trim();

    if (!trimmedToken) {
      Alert.alert("Ativação", "Token de ativação é obrigatório.");
      return;
    }

    if (!/^\d{6}$/.test(trimmedPin)) {
      Alert.alert("Ativação", "PIN deve ter 6 dígitos.");
      return;
    }

    setLoading(true);
    try {
      const result = await activateWithQrPin({
        activationToken: trimmedToken,
        pin: trimmedPin,
      });

      const hasDelivery =
        result.principal.modulesEnabled?.includes("delivery") ?? false;
      router.replace(hasDelivery ? "/(tabs)/staff" : "/(tabs)");
    } catch (error) {
      const code =
        error instanceof Error
          ? error.message || "ACTIVATION_FAILED"
          : "ACTIVATION_FAILED";

      if (code === "INVALID_PIN") {
        Alert.alert("Ativação", "PIN inválido.");
      } else if (code === "TOKEN_EXPIRED") {
        Alert.alert("Ativação", "Token expirado. Gere um novo QR no Admin.");
      } else if (code === "TOKEN_ALREADY_USED") {
        Alert.alert("Ativação", "Token já foi utilizado.");
      } else if (code === "TOKEN_REVOKED") {
        Alert.alert("Ativação", "Token revogado.");
      } else if (code === "RATE_LIMITED") {
        Alert.alert(
          "Ativação",
          "Muitas tentativas. Aguarde alguns instantes e tente novamente.",
        );
      } else {
        Alert.alert("Ativação", "Falha na ativação. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Ativar AppStaff</Text>
        <Text style={styles.subtitle}>
          Use o QR do Admin + PIN de 6 dígitos
        </Text>

        <Text style={styles.label}>Token (QR)</Text>
        <TextInput
          value={token}
          onChangeText={setToken}
          placeholder="atk_xxx"
          placeholderTextColor="#777"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <Text style={styles.label}>PIN</Text>
        <TextInput
          value={pin}
          onChangeText={setPin}
          placeholder="123456"
          placeholderTextColor="#777"
          keyboardType="number-pad"
          maxLength={6}
          style={styles.input}
        />

        <TouchableOpacity
          onPress={handleActivate}
          disabled={loading}
          style={[styles.button, loading && styles.buttonDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#101010" />
          ) : (
            <Text style={styles.buttonText}>Ativar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#171717",
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  title: {
    color: "#fafafa",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    color: "#a1a1aa",
    marginBottom: 18,
  },
  label: {
    color: "#e4e4e7",
    marginBottom: 6,
    marginTop: 10,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#3f3f46",
    backgroundColor: "#111",
    color: "#fff",
    borderRadius: 10,
    padding: 12,
  },
  button: {
    marginTop: 20,
    backgroundColor: "#d4a574",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#101010",
    fontWeight: "700",
    fontSize: 16,
  },
});
