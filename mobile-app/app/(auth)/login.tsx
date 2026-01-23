import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { HapticFeedback } from '@/services/haptics';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
    const router = useRouter();
    const { signIn, signUp } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            HapticFeedback.error();
            Alert.alert("Erro", "Preencha email e senha.");
            return;
        }

        setLoading(true);
        try {
            await signIn(email, password);
            HapticFeedback.success();
            // AuthGate will redirect
        } catch (error: any) {
            HapticFeedback.error();
            Alert.alert("Erro de Login", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        if (!email || !password) {
            HapticFeedback.error();
            Alert.alert("Erro", "Preencha email e senha para cadastrar.");
            return;
        }
        setLoading(true);
        try {
            await signUp(email, password);
            HapticFeedback.success();
            Alert.alert("Sucesso", "Verifique seu email para confirmar.");
        } catch (error: any) {
            HapticFeedback.error();
            Alert.alert("Erro de Cadastro", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.form}>
                <Text style={styles.title}>ChefiApp POS</Text>
                <Text style={styles.subtitle}>Acesse sua operação</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="seu@email.com"
                        placeholderTextColor="#666"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Senha</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#666"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={styles.buttonText}>Entrar</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSignUp} style={styles.linkButton}>
                    <Text style={styles.linkText}>Criar nova conta</Text>
                </TouchableOpacity>

                {/* 
                <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.bypassBtn}>
                     <Text style={styles.bypassText}>[DEV] Pular Login (Offline)</Text>
                </TouchableOpacity>
                */}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        padding: 24,
    },
    form: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#d4a574',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        marginBottom: 48,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: '#ccc',
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#1c1c1e',
        borderRadius: 12,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    button: {
        backgroundColor: '#d4a574',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
    linkButton: {
        marginTop: 24,
        alignItems: 'center',
    },
    linkText: {
        color: '#d4a574',
        fontSize: 14,
    },
    bypassBtn: {
        marginTop: 40,
        alignSelf: 'center',
    },
    bypassText: {
        color: '#333',
        fontSize: 12,
    }
});
